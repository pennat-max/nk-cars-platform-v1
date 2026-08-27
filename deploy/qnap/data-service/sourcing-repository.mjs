import crypto from "node:crypto";

function mapRule(row) {
  return {
    ...row.rule_json,
    id: row.id,
    revision: row.revision,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapCommand(row) {
  return {
    id: row.id,
    action: row.action,
    ruleId: row.rule_id,
    rule: row.rule_snapshot_json,
    status: row.status.toLowerCase(),
    createdAt: new Date(row.created_at).toISOString(),
    claimedAt: row.claimed_at ? new Date(row.claimed_at).toISOString() : null,
  };
}

function bangkokDate(value) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export class PostgresSourcingRepository {
  constructor(pool, now = () => new Date()) {
    this.pool = pool;
    this.now = now;
  }

  async transaction(work) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async snapshot(client = this.pool) {
    const [rules, runtime, queue] = await Promise.all([
      client.query("SELECT id, revision, rule_json, created_at, updated_at FROM sourcing_rules ORDER BY created_at DESC, id"),
      client.query("SELECT hermes_state, browser_profile_state, processed_today, processed_date, last_run_at, last_heartbeat_at, message FROM sourcing_runtime_state WHERE singleton = true"),
      client.query("SELECT count(*)::int AS count FROM sourcing_commands WHERE status = 'QUEUED'"),
    ]);
    const state = runtime.rows[0] || {};
    const todayBangkok = bangkokDate(this.now());
    const runtimeDate = state.processed_date ? new Date(state.processed_date).toISOString().slice(0, 10) : null;
    return {
      connected: true,
      hermesState: state.hermes_state || "not_configured",
      browserProfileState: state.browser_profile_state || "not_configured",
      queueDepth: queue.rows[0]?.count || 0,
      processedToday: runtimeDate === todayBangkok ? state.processed_today || 0 : 0,
      lastRunAt: state.last_run_at ? new Date(state.last_run_at).toISOString() : null,
      lastHeartbeatAt: state.last_heartbeat_at ? new Date(state.last_heartbeat_at).toISOString() : null,
      message: state.message || "Hermes worker has not connected yet.",
      rules: rules.rows.map(mapRule),
    };
  }

  async createRule(rule, actor) {
    return this.transaction(async (client) => {
      const id = crypto.randomUUID();
      const now = this.now();
      await client.query(
        "INSERT INTO sourcing_rules (id, revision, rule_json, created_by, updated_by, created_at, updated_at) VALUES ($1, 1, $2::jsonb, $3, $3, $4, $4)",
        [id, JSON.stringify(rule), actor.id, now],
      );
      await client.query(
        "INSERT INTO sourcing_rule_audit_events (id, rule_id, revision, actor_id, actor_email, action, old_value_json, new_value_json, created_at) VALUES ($1, $2, 1, $3, $4, 'CREATED', '{}'::jsonb, $5::jsonb, $6)",
        [crypto.randomUUID(), id, actor.id, actor.email, JSON.stringify(rule), now],
      );
      return this.snapshot(client);
    });
  }

  async updateRule(id, rule, expectedRevision, actor) {
    return this.transaction(async (client) => {
      const current = await client.query("SELECT revision, rule_json FROM sourcing_rules WHERE id = $1 FOR UPDATE", [id]);
      if (!current.rows[0]) throw new Error("rule_not_found");
      if (current.rows[0].revision !== expectedRevision) throw new Error("sourcing_revision_conflict");
      const revision = expectedRevision + 1;
      const now = this.now();
      await client.query("UPDATE sourcing_rules SET revision = $2, rule_json = $3::jsonb, updated_by = $4, updated_at = $5 WHERE id = $1", [id, revision, JSON.stringify(rule), actor.id, now]);
      await client.query(
        "INSERT INTO sourcing_rule_audit_events (id, rule_id, revision, actor_id, actor_email, action, old_value_json, new_value_json, created_at) VALUES ($1, $2, $3, $4, $5, 'UPDATED', $6::jsonb, $7::jsonb, $8)",
        [crypto.randomUUID(), id, revision, actor.id, actor.email, JSON.stringify(current.rows[0].rule_json), JSON.stringify(rule), now],
      );
      return this.snapshot(client);
    });
  }

  async enqueueCommand(command, actor) {
    return this.transaction(async (client) => {
      const duplicate = await client.query("SELECT id FROM sourcing_commands WHERE idempotency_key = $1", [command.idempotencyKey]);
      if (!duplicate.rows[0]) {
        let ruleSnapshot = null;
        if (command.ruleId) {
          const selected = await client.query("SELECT rule_json FROM sourcing_rules WHERE id = $1", [command.ruleId]);
          if (!selected.rows[0]) throw new Error("rule_not_found");
          ruleSnapshot = selected.rows[0].rule_json;
        } else if (command.action === "run_now") {
          const activeRules = await client.query("SELECT rule_json FROM sourcing_rules WHERE (rule_json->>'active')::boolean = true ORDER BY created_at, id");
          ruleSnapshot = activeRules.rows.map((row) => row.rule_json);
        }
        const commandId = crypto.randomUUID();
        const now = this.now();
        await client.query(
          "INSERT INTO sourcing_commands (id, idempotency_key, action, rule_id, rule_snapshot_json, status, actor_id, actor_email, created_at) VALUES ($1, $2, $3, $4, $5::jsonb, 'QUEUED', $6, $7, $8)",
          [commandId, command.idempotencyKey, command.action, command.ruleId, ruleSnapshot ? JSON.stringify(ruleSnapshot) : null, actor.id, actor.email, now],
        );
        await client.query(
          "INSERT INTO sourcing_command_events (id, command_id, event_type, actor_id, safe_detail_json, created_at) VALUES ($1, $2, 'QUEUED', $3, $4::jsonb, $5)",
          [crypto.randomUUID(), commandId, actor.id, JSON.stringify({ action: command.action, ruleId: command.ruleId }), now],
        );
      }
      return this.snapshot(client);
    });
  }

  async claimNext(workerId) {
    return this.transaction(async (client) => {
      const selected = await client.query(
        "SELECT id, action, rule_id, rule_snapshot_json, status, created_at, claimed_at FROM sourcing_commands WHERE status = 'QUEUED' ORDER BY created_at, id FOR UPDATE SKIP LOCKED LIMIT 1",
      );
      if (!selected.rows[0]) return null;
      const now = this.now();
      await client.query("UPDATE sourcing_commands SET status = 'CLAIMED', worker_id = $2, claimed_at = $3 WHERE id = $1", [selected.rows[0].id, workerId, now]);
      await client.query(
        "INSERT INTO sourcing_command_events (id, command_id, event_type, actor_id, safe_detail_json, created_at) VALUES ($1, $2, 'CLAIMED', $3, '{}'::jsonb, $4)",
        [crypto.randomUUID(), selected.rows[0].id, workerId, now],
      );
      await client.query("UPDATE sourcing_runtime_state SET hermes_state = 'running', last_run_at = $1, last_heartbeat_at = $1, message = 'Hermes accepted a sourcing command.', updated_at = $1 WHERE singleton = true", [now]);
      return mapCommand({ ...selected.rows[0], status: "CLAIMED", claimed_at: now });
    });
  }

  async heartbeat(commandId, workerId, heartbeat) {
    return this.transaction(async (client) => {
      const result = await client.query("SELECT id FROM sourcing_commands WHERE id = $1 AND worker_id = $2 AND status = 'CLAIMED' FOR UPDATE", [commandId, workerId]);
      if (!result.rows[0]) throw new Error("command_not_found");
      const now = this.now();
      await client.query(
        "UPDATE sourcing_runtime_state SET hermes_state = 'running', browser_profile_state = $1, processed_today = CASE WHEN processed_date = (timezone('Asia/Bangkok', $2::timestamptz))::date THEN processed_today + $3 ELSE $3 END, processed_date = (timezone('Asia/Bangkok', $2::timestamptz))::date, last_heartbeat_at = $2, message = $4, updated_at = $2 WHERE singleton = true",
        [heartbeat.browserProfileState, now, heartbeat.processedIncrement, heartbeat.message],
      );
      await client.query(
        "INSERT INTO sourcing_command_events (id, command_id, event_type, actor_id, safe_detail_json, created_at) VALUES ($1, $2, 'HEARTBEAT', $3, $4::jsonb, $5)",
        [crypto.randomUUID(), commandId, workerId, JSON.stringify({ browserProfileState: heartbeat.browserProfileState, processedIncrement: heartbeat.processedIncrement }), now],
      );
      return { accepted: true };
    });
  }

  async complete(commandId, workerId, completion) {
    return this.transaction(async (client) => {
      const result = await client.query("SELECT id FROM sourcing_commands WHERE id = $1 AND worker_id = $2 AND status = 'CLAIMED' FOR UPDATE", [commandId, workerId]);
      if (!result.rows[0]) throw new Error("command_not_found");
      const now = this.now();
      const status = completion.state === "error" ? "FAILED" : "COMPLETED";
      await client.query("UPDATE sourcing_commands SET status = $2, completed_at = $3, safe_error_code = $4 WHERE id = $1", [commandId, status, now, completion.safeErrorCode]);
      await client.query(
        "INSERT INTO sourcing_command_events (id, command_id, event_type, actor_id, safe_detail_json, created_at) VALUES ($1, $2, $3, $4, $5::jsonb, $6)",
        [crypto.randomUUID(), commandId, status, workerId, JSON.stringify({ state: completion.state, browserProfileState: completion.browserProfileState, processedIncrement: completion.processedIncrement, safeErrorCode: completion.safeErrorCode }), now],
      );
      await client.query(
        "UPDATE sourcing_runtime_state SET hermes_state = $1, browser_profile_state = $2, processed_today = CASE WHEN processed_date = (timezone('Asia/Bangkok', $3::timestamptz))::date THEN processed_today + $4 ELSE $4 END, processed_date = (timezone('Asia/Bangkok', $3::timestamptz))::date, last_heartbeat_at = $3, message = $5, updated_at = $3 WHERE singleton = true",
        [completion.state, completion.browserProfileState, now, completion.processedIncrement, completion.message],
      );
      return { accepted: true };
    });
  }
}
