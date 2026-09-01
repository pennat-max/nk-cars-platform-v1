import crypto from "node:crypto";
import { candidateMatchesRule } from "./candidate-domain.mjs";
import { deriveJaklaenOverallStatus } from "./jaklaen-search-domain.mjs";

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

function mapJaklaenSearchRequest(row) {
  return {
    id: row.id,
    requestType: row.request_type,
    status: row.status,
    criteria: row.criteria_json,
    schedule: row.schedule_json,
    priority: row.priority,
    requestedBy: row.requested_by_json,
    customerCaseReference: row.customer_case_reference,
    active: row.active,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapJaklaenJob(row) {
  return {
    id: row.id,
    requestId: row.request_id,
    jobType: row.job_type,
    status: row.status,
    workerId: row.worker_id,
    request: row.request_snapshot_json,
    safeDetail: row.safe_detail_json || {},
    createdAt: new Date(row.created_at).toISOString(),
    claimedAt: row.claimed_at ? new Date(row.claimed_at).toISOString() : null,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
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

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
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
          const activeRules = await client.query("SELECT id, rule_json FROM sourcing_rules WHERE (rule_json->>'active')::boolean = true ORDER BY created_at, id");
          ruleSnapshot = activeRules.rows.map((row) => ({ id: row.id, rule: row.rule_json }));
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

  async listJaklaenSearchRequests() {
    const [requests, jobs] = await Promise.all([
      this.pool.query(
        `SELECT id, request_type, status, criteria_json, schedule_json, priority, requested_by_json, customer_case_reference, active, created_at, updated_at
         FROM jaklaen_search_requests
         ORDER BY created_at DESC, id
         LIMIT 100`,
      ),
      this.pool.query(
        `SELECT id, request_id, job_type, status, worker_id, request_snapshot_json, safe_detail_json, created_at, claimed_at, completed_at
         FROM jaklaen_search_jobs
         ORDER BY created_at DESC, id
         LIMIT 100`,
      ),
    ]);
    return {
      observedAt: this.now().toISOString(),
      requests: requests.rows.map(mapJaklaenSearchRequest),
      jobs: jobs.rows.map(mapJaklaenJob),
    };
  }

  async jaklaenReadinessSnapshot() {
    const [runtime, lastJob, lastCandidate] = await Promise.all([
      this.pool.query("SELECT hermes_state, browser_profile_state, last_heartbeat_at, last_run_at, message FROM sourcing_runtime_state WHERE singleton = true").catch(() => ({ rows: [] })),
      this.pool.query(
        `SELECT id, request_id, job_type, status, worker_id, safe_detail_json, created_at, claimed_at, completed_at
         FROM jaklaen_search_jobs
         ORDER BY created_at DESC, id
         LIMIT 1`,
      ).catch(() => ({ rows: [] })),
      this.pool.query(
        `SELECT vehicle_id, internal_record, observed_at
         FROM inventory_vehicles
         WHERE publication_status = 'NEEDS_REVIEW'
           AND source_adapter IN ('facebook_marketplace_worker', 'jaklaen_vehicle_sourcing_agent')
         ORDER BY observed_at DESC NULLS LAST, vehicle_id
         LIMIT 1`,
      ).catch(() => ({ rows: [] })),
    ]);
    const state = runtime.rows[0] || {};
    const job = lastJob.rows[0] || null;
    const candidate = lastCandidate.rows[0] || null;
    const profileState = state.browser_profile_state || "not_configured";
    const hermesState = state.hermes_state || "not_configured";
    const hasSuccessfulEndToEnd = Boolean(candidate?.internal_record?.sourceUrl && candidate?.internal_record?.screenshotCount > 0 && candidate?.internal_record?.candidateStatus === "NEEDS_REVIEW");
    const checks = [
      { key: "hermes_connection", label: "Hermes Connection", status: hermesState === "running" || hermesState === "ready" ? "PASS" : "FAIL", detail: state.message || "No Hermes/Jaklaen runtime state is configured.", observedAt: state.last_heartbeat_at ? new Date(state.last_heartbeat_at).toISOString() : null },
      { key: "last_heartbeat", label: "Last Heartbeat", status: state.last_heartbeat_at ? "PASS" : "NOT_TESTED", detail: state.last_heartbeat_at ? "Worker heartbeat received." : "No worker heartbeat recorded.", observedAt: state.last_heartbeat_at ? new Date(state.last_heartbeat_at).toISOString() : null },
      { key: "last_job_received", label: "Last Job Received", status: job ? "PASS" : "NOT_TESTED", detail: job ? `Latest job ${job.status}.` : "No Jaklaen queue job recorded.", observedAt: job?.created_at ? new Date(job.created_at).toISOString() : null },
      { key: "browser_control", label: "Browser Control", status: profileState === "ready" ? "PASS" : profileState === "login_required" ? "FAIL" : "NOT_TESTED", detail: `Browser profile state: ${profileState}.`, observedAt: state.last_heartbeat_at ? new Date(state.last_heartbeat_at).toISOString() : null },
      { key: "facebook_login", label: "Facebook Login", status: profileState === "ready" ? "PASS" : profileState === "login_required" ? "FAIL" : "NOT_TESTED", detail: profileState === "ready" ? "Profile reports ready." : "Facebook login has not been verified.", observedAt: state.last_heartbeat_at ? new Date(state.last_heartbeat_at).toISOString() : null },
      { key: "session_persistence", label: "Session Persistence", status: "NOT_TESTED", detail: "Restart/session persistence proof is required before READY.", observedAt: null },
      { key: "marketplace_access", label: "Marketplace Access", status: hasSuccessfulEndToEnd ? "PASS" : "NOT_TESTED", detail: "Requires a real Marketplace listing search proof.", observedAt: candidate?.observed_at ? new Date(candidate.observed_at).toISOString() : null },
      { key: "search_box_access", label: "Search Box Access", status: hasSuccessfulEndToEnd ? "PASS" : "NOT_TESTED", detail: "Requires real Marketplace search-box interaction proof.", observedAt: candidate?.observed_at ? new Date(candidate.observed_at).toISOString() : null },
      { key: "image_capture", label: "Image Capture", status: candidate?.internal_record?.screenshotCount > 0 ? "PASS" : "NOT_TESTED", detail: candidate ? "Candidate screenshot/image evidence exists internally." : "No real candidate image/screenshot proof.", observedAt: candidate?.observed_at ? new Date(candidate.observed_at).toISOString() : null },
      { key: "nk_api_connection", label: "NK API Connection", status: "PASS", detail: "Data API responded and readiness snapshot was generated.", observedAt: this.now().toISOString() },
      { key: "last_successful_search", label: "Last Successful Search", status: hasSuccessfulEndToEnd ? "PASS" : "FAIL", detail: hasSuccessfulEndToEnd ? "Latest NEEDS_REVIEW candidate has source URL and screenshot evidence." : "No successful real E2E candidate proof yet.", observedAt: candidate?.observed_at ? new Date(candidate.observed_at).toISOString() : null },
    ];
    return {
      observedAt: this.now().toISOString(),
      overallStatus: deriveJaklaenOverallStatus(checks, hasSuccessfulEndToEnd),
      currentBlocker: hasSuccessfulEndToEnd ? null : "Real end-to-end Toyota Hilux Revo proof has not passed yet.",
      lastHeartbeat: state.last_heartbeat_at ? new Date(state.last_heartbeat_at).toISOString() : null,
      lastJobReceived: job?.created_at ? new Date(job.created_at).toISOString() : null,
      lastSuccessfulSearch: hasSuccessfulEndToEnd && candidate?.observed_at ? new Date(candidate.observed_at).toISOString() : null,
      checks,
      proof: {
        requestId: job?.request_id || "PENDING_REAL_TEST",
        candidateId: candidate?.internal_record?.candidateId || "PENDING_REAL_TEST",
        sourceUrl: candidate?.internal_record?.sourceUrl || "PENDING_REAL_SOURCE_URL",
        screenshot: candidate?.internal_record?.screenshotCount > 0 ? `${candidate.internal_record.screenshotCount} internal screenshot(s)` : "PENDING_REAL_SCREENSHOT",
        foundAt: candidate?.observed_at ? new Date(candidate.observed_at).toISOString() : "PENDING",
        durationSeconds: null,
        testResult: hasSuccessfulEndToEnd ? "PASS" : "NOT_RUN",
      },
    };
  }

  async runJaklaenReadinessAction(action, actor) {
    const now = this.now();
    await this.pool.query(
      `INSERT INTO jaklaen_search_audit_events
       (id, request_id, job_id, actor_id, actor_email, action, safe_detail_json, created_at)
       VALUES ($1, NULL, NULL, $2, $3, $4, $5::jsonb, $6)`,
      [crypto.randomUUID(), actor.id, actor.email, "READINESS_ACTION", JSON.stringify({ action: action.action, note: action.note, published: false, sellerContact: false }), now],
    ).catch(() => null);
    return {
      accepted: true,
      action: action.action,
      published: false,
      sellerContact: false,
      message: action.action === "run_test_search"
        ? "Readiness test search command recorded. Jaklaen remains not READY until a real candidate reaches NEEDS_REVIEW with real source URL and screenshot."
        : "Readiness action recorded.",
      readiness: await this.jaklaenReadinessSnapshot(),
    };
  }

  async createJaklaenSearchRequest(request, actor) {
    return this.transaction(async (client) => {
      const duplicate = await client.query("SELECT id FROM jaklaen_search_requests WHERE idempotency_key = $1", [request.idempotencyKey]);
      if (duplicate.rows[0]) return { accepted: true, idempotent: true, requestId: duplicate.rows[0].id, published: false };
      const todayCount = await client.query(
        `SELECT count(*)::int AS count
         FROM jaklaen_search_requests
         WHERE requested_by_json->>'id' = $1
           AND request_type = 'SEARCH_NOW'
           AND (timezone('Asia/Bangkok', created_at))::date = (timezone('Asia/Bangkok', $2::timestamptz))::date`,
        [request.requestedBy.id, this.now()],
      );
      const dailyLimit = request.requestedBy.role === "CUSTOMER" ? 5 : 50;
      if ((todayCount.rows[0]?.count || 0) >= dailyLimit) throw new Error("daily_limit_reached");
      const id = crypto.randomUUID();
      const now = this.now();
      const status = request.requestType === "SEARCH_NOW" ? "QUEUED" : "ACTIVE";
      await client.query(
        `INSERT INTO jaklaen_search_requests
         (id, idempotency_key, request_type, status, criteria_json, schedule_json, priority, requested_by_json, customer_case_reference, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8::jsonb, $9, $10, $11, $11)`,
        [id, request.idempotencyKey, request.requestType, status, JSON.stringify(request.criteria), request.schedule ? JSON.stringify(request.schedule) : null, request.priority, JSON.stringify(request.requestedBy), request.customerCaseReference, request.active, now],
      );
      await client.query(
        `INSERT INTO jaklaen_search_audit_events
         (id, request_id, job_id, actor_id, actor_email, action, safe_detail_json, created_at)
         VALUES ($1, $2, NULL, $3, $4, 'SEARCH_REQUEST_CREATED', $5::jsonb, $6)`,
        [crypto.randomUUID(), id, actor.id, actor.email, JSON.stringify({ requestType: request.requestType, priority: request.priority, requestedByRole: request.requestedBy.role }), now],
      );
      if (request.requestType === "SEARCH_NOW") {
        const jobId = crypto.randomUUID();
        await client.query(
          `INSERT INTO jaklaen_search_jobs
           (id, request_id, job_type, status, request_snapshot_json, safe_detail_json, created_at)
           VALUES ($1, $2, 'SEARCH_NOW', 'QUEUED', $3::jsonb, $4::jsonb, $5)`,
          [jobId, id, JSON.stringify(request), JSON.stringify({ source: "app_search_now", publish: false }), now],
        );
        await client.query(
          `INSERT INTO jaklaen_search_audit_events
           (id, request_id, job_id, actor_id, actor_email, action, safe_detail_json, created_at)
           VALUES ($1, $2, $3, $4, $5, 'JOB_QUEUED', $6::jsonb, $7)`,
          [crypto.randomUUID(), id, jobId, actor.id, actor.email, JSON.stringify({ jobType: "SEARCH_NOW" }), now],
        );
        return { accepted: true, requestId: id, status, queuedJobId: jobId, published: false };
      }
      return { accepted: true, requestId: id, status, queuedJobId: null, published: false };
    });
  }

  async claimNextJaklaenJob(workerId) {
    return this.transaction(async (client) => {
      const selected = await client.query(
        `SELECT id, request_id, job_type, status, worker_id, request_snapshot_json, safe_detail_json, created_at, claimed_at, completed_at
         FROM jaklaen_search_jobs
         WHERE status = 'QUEUED'
         ORDER BY CASE WHEN job_type = 'SEARCH_NOW' THEN 0 ELSE 1 END, created_at, id
         FOR UPDATE SKIP LOCKED
         LIMIT 1`,
      );
      if (!selected.rows[0]) return null;
      const now = this.now();
      await client.query("UPDATE jaklaen_search_jobs SET status = 'CLAIMED', worker_id = $2, claimed_at = $3 WHERE id = $1", [selected.rows[0].id, workerId, now]);
      await client.query(
        `INSERT INTO jaklaen_search_audit_events
         (id, request_id, job_id, actor_id, actor_email, action, safe_detail_json, created_at)
         VALUES ($1, $2, $3, $4, $4, 'JOB_CLAIMED', '{}'::jsonb, $5)`,
        [crypto.randomUUID(), selected.rows[0].request_id, selected.rows[0].id, workerId, now],
      );
      return mapJaklaenJob({ ...selected.rows[0], status: "CLAIMED", worker_id: workerId, claimed_at: now });
    });
  }

  async completeJaklaenJob(jobId, workerId, completion) {
    return this.transaction(async (client) => {
      const selected = await client.query(
        "SELECT id, request_id FROM jaklaen_search_jobs WHERE id = $1 AND worker_id = $2 AND status = 'CLAIMED' FOR UPDATE",
        [jobId, workerId],
      );
      if (!selected.rows[0]) throw new Error("command_not_found");
      const now = this.now();
      await client.query("UPDATE jaklaen_search_jobs SET status = $2, safe_detail_json = $3::jsonb, completed_at = $4 WHERE id = $1", [jobId, completion.status, JSON.stringify(completion), now]);
      await client.query(
        `INSERT INTO jaklaen_search_audit_events
         (id, request_id, job_id, actor_id, actor_email, action, safe_detail_json, created_at)
         VALUES ($1, $2, $3, $4, $4, $5, $6::jsonb, $7)`,
        [crypto.randomUUID(), selected.rows[0].request_id, jobId, workerId, completion.status === "BLOCKED" ? "JOB_BLOCKED" : "JOB_COMPLETED", JSON.stringify(completion), now],
      );
      return { accepted: true, published: false };
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
      let ruleSnapshot = selected.rows[0].rule_snapshot_json;
      if (!selected.rows[0].rule_id && Array.isArray(ruleSnapshot) && ruleSnapshot.some((entry) => !entry?.id || !entry?.rule)) {
        const rules = await client.query("SELECT id, rule_json FROM sourcing_rules ORDER BY created_at, id");
        ruleSnapshot = ruleSnapshot.map((snapshot) => {
          if (snapshot?.id && snapshot?.rule) return snapshot;
          const match = rules.rows.find((rule) => canonicalJson(rule.rule_json) === canonicalJson(snapshot));
          return match ? { id: match.id, rule: snapshot } : null;
        }).filter(Boolean);
      }
      return mapCommand({ ...selected.rows[0], rule_snapshot_json: ruleSnapshot, status: "CLAIMED", claimed_at: now });
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

  async ingestCandidate(commandId, workerId, candidate) {
    return this.transaction(async (client) => {
      const commandResult = await client.query(
        "SELECT id, rule_id, rule_snapshot_json FROM sourcing_commands WHERE id = $1 AND worker_id = $2 AND status = 'CLAIMED' FOR UPDATE",
        [commandId, workerId],
      );
      const command = commandResult.rows[0];
      if (!command) throw new Error("command_not_found");
      if (command.rule_id && command.rule_id !== candidate.ruleId) throw new Error("candidate_rule_mismatch");

      const ruleResult = await client.query("SELECT id, rule_json FROM sourcing_rules WHERE id = $1", [candidate.ruleId]);
      const ruleRow = ruleResult.rows[0];
      if (!ruleRow) throw new Error("rule_not_found");
      if (!command.rule_id) {
        const snapshots = Array.isArray(command.rule_snapshot_json) ? command.rule_snapshot_json : [];
        const snapshotted = snapshots.some((snapshot) => canonicalJson(snapshot?.rule || snapshot) === canonicalJson(ruleRow.rule_json));
        if (!snapshotted) throw new Error("candidate_rule_mismatch");
      }
      const match = candidateMatchesRule(candidate, ruleRow.rule_json);
      if (!match.matches) throw new Error("candidate_rule_mismatch");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`candidate-rule:${candidate.ruleId}`]);
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`candidate-source:${candidate.sourceReference}`]);

      const existingCandidate = await client.query(
        "SELECT vehicle_id, outcome FROM sourcing_candidate_ingestions WHERE candidate_id = $1",
        [candidate.candidateId],
      );
      if (existingCandidate.rows[0]) {
        return { status: existingCandidate.rows[0].outcome.toLowerCase(), vehicleId: existingCandidate.rows[0].vehicle_id, idempotent: true };
      }

      const now = this.now();
      const existingVehicle = await client.query("SELECT vehicle_id FROM inventory_vehicles WHERE source_reference = $1", [candidate.sourceReference]);
      if (existingVehicle.rows[0]) {
        await client.query(
          "INSERT INTO sourcing_candidate_ingestions (candidate_id, command_id, rule_id, vehicle_id, source_reference, outcome, worker_id, safe_detail_json, created_at) VALUES ($1, $2, $3, $4, $5, 'DUPLICATE', $6, $7::jsonb, $8)",
          [candidate.candidateId, commandId, candidate.ruleId, existingVehicle.rows[0].vehicle_id, candidate.sourceReference, workerId, JSON.stringify({ reason: "source_reference_exists" }), now],
        );
        return { status: "duplicate", vehicleId: existingVehicle.rows[0].vehicle_id, idempotent: false };
      }

      const retainedToday = await client.query(
        "SELECT count(*)::int AS count FROM sourcing_candidate_ingestions WHERE rule_id = $1 AND outcome = 'RETAINED' AND (timezone('Asia/Bangkok', created_at))::date = (timezone('Asia/Bangkok', $2::timestamptz))::date",
        [candidate.ruleId, now],
      );
      if ((retainedToday.rows[0]?.count || 0) >= ruleRow.rule_json.dailyLimit) throw new Error("daily_limit_reached");

      await client.query(
        `INSERT INTO inventory_vehicles
         (vehicle_id, source_reference, publication_status, customer_record, internal_record, source_adapter, observed_at, imported_at, updated_at)
         VALUES ($1, $2, 'NEEDS_REVIEW', NULL, $3::jsonb, 'facebook_marketplace_worker', $4, $5, $5)`,
        [candidate.vehicleId, candidate.sourceReference, JSON.stringify(candidate.internalRecord), candidate.observedAt, now],
      );
      await client.query(
        "INSERT INTO sourcing_candidate_ingestions (candidate_id, command_id, rule_id, vehicle_id, source_reference, outcome, worker_id, safe_detail_json, created_at) VALUES ($1, $2, $3, $4, $5, 'RETAINED', $6, $7::jsonb, $8)",
        [candidate.candidateId, commandId, candidate.ruleId, candidate.vehicleId, candidate.sourceReference, workerId, JSON.stringify({ imageUrlCount: candidate.images.length, publicationStatus: "NEEDS_REVIEW" }), now],
      );
      await client.query(
        "UPDATE sourcing_runtime_state SET processed_today = CASE WHEN processed_date = (timezone('Asia/Bangkok', $1::timestamptz))::date THEN processed_today + 1 ELSE 1 END, processed_date = (timezone('Asia/Bangkok', $1::timestamptz))::date, last_heartbeat_at = $1, message = 'A candidate was retained for Owner review.', updated_at = $1 WHERE singleton = true",
        [now],
      );
      return { status: "retained", vehicleId: candidate.vehicleId, idempotent: false };
    });
  }

  async attachCandidateMedia(vehicleId, media) {
    if (!media.length) return { stored: 0 };
    return this.transaction(async (client) => {
      const vehicle = await client.query("SELECT vehicle_id FROM inventory_vehicles WHERE vehicle_id = $1 AND publication_status = 'NEEDS_REVIEW' FOR UPDATE", [vehicleId]);
      if (!vehicle.rows[0]) throw new Error("candidate_not_found");
      for (const item of media) {
        await client.query(
          `INSERT INTO vehicle_media (media_id, vehicle_id, relative_path, visibility, lifecycle_stage, sha256, size_bytes)
           VALUES ($1, $2, $3, 'INTERNAL_ONLY', 'Source', $4, $5)
           ON CONFLICT (media_id) DO NOTHING`,
          [item.mediaId, vehicleId, item.relativePath, item.sha256, item.sizeBytes],
        );
      }
      return { stored: media.length };
    });
  }

  async listJaklaenCandidates() {
    const [vehicles, vehicleMedia, events] = await Promise.all([
      this.pool.query(
        `SELECT vehicle_id, source_reference, publication_status, customer_record, internal_record, source_adapter, observed_at
         FROM inventory_vehicles
         WHERE publication_status = 'NEEDS_REVIEW'
           AND source_adapter IN ('facebook_marketplace_worker', 'jaklaen_vehicle_sourcing_agent')
         ORDER BY observed_at DESC NULLS LAST, vehicle_id`,
      ),
      this.pool.query(
        `SELECT media_id, vehicle_id, visibility
         FROM vehicle_media
         WHERE vehicle_id IS NOT NULL AND visibility = 'INTERNAL_ONLY'
         ORDER BY imported_at, media_id`,
      ),
      this.pool.query(
        `SELECT vehicle_id, candidate_id, actor_id, actor_email, action, old_value_json, new_value_json, note, created_at
         FROM jaklaen_candidate_review_events
         ORDER BY created_at DESC
         LIMIT 200`,
      ).catch(() => ({ rows: [] })),
    ]);
    const byVehicle = new Map();
    for (const item of vehicleMedia.rows) {
      const items = byVehicle.get(item.vehicle_id) || [];
      items.push({ mediaId: item.media_id, visibility: item.visibility });
      byVehicle.set(item.vehicle_id, items);
    }
    const eventsByVehicle = new Map();
    for (const item of events.rows) {
      const items = eventsByVehicle.get(item.vehicle_id) || [];
      items.push({
        candidateId: item.candidate_id,
        actorId: item.actor_id,
        actorEmail: item.actor_email,
        action: item.action,
        oldValue: item.old_value_json,
        newValue: item.new_value_json,
        note: item.note,
        createdAt: new Date(item.created_at).toISOString(),
      });
      eventsByVehicle.set(item.vehicle_id, items);
    }
    return {
      observedAt: this.now().toISOString(),
      records: vehicles.rows.map((row) => ({
        vehicleId: row.vehicle_id,
        sourceReference: row.source_reference,
        publicationStatus: row.publication_status,
        customerRecord: row.customer_record,
        internalRecord: row.internal_record,
        sourceAdapter: row.source_adapter,
        observedAt: row.observed_at ? new Date(row.observed_at).toISOString() : null,
        media: byVehicle.get(row.vehicle_id) || [],
        auditEvents: eventsByVehicle.get(row.vehicle_id) || [],
      })),
    };
  }

  async reviewJaklaenCandidate(vehicleId, mutation, actor) {
    return this.transaction(async (client) => {
      const selected = await client.query(
        `SELECT vehicle_id, internal_record, publication_status
         FROM inventory_vehicles
         WHERE vehicle_id = $1 AND publication_status = 'NEEDS_REVIEW'
         FOR UPDATE`,
        [vehicleId],
      );
      const vehicle = selected.rows[0];
      if (!vehicle) throw new Error("candidate_not_found");
      const currentRecord = vehicle.internal_record || {};
      const oldValue = {
        candidateStatus: currentRecord.candidateStatus || "NEEDS_REVIEW",
        fields: mutation.fields ? Object.fromEntries(mutation.fields.map((item) => [item.field, currentRecord[item.field] ?? null])) : {},
      };
      const nextRecord = { ...currentRecord };
      for (const item of mutation.fields || []) nextRecord[item.field] = item.value;
      nextRecord.candidateStatus = mutation.action === "FIELD_EDITED" ? oldValue.candidateStatus : mutation.action;
      nextRecord.reviewedAt = this.now().toISOString();
      nextRecord.reviewedBy = actor.email;
      nextRecord.reviewNote = mutation.note;
      const now = this.now();
      await client.query("UPDATE inventory_vehicles SET internal_record = $2::jsonb, updated_at = $3 WHERE vehicle_id = $1", [vehicleId, JSON.stringify(nextRecord), now]);
      await client.query(
        `INSERT INTO jaklaen_candidate_review_events
         (id, vehicle_id, candidate_id, actor_id, actor_email, action, old_value_json, new_value_json, note, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)`,
        [crypto.randomUUID(), vehicleId, currentRecord.candidateId || currentRecord.sourceReference || vehicleId, actor.id, actor.email, mutation.action, JSON.stringify(oldValue), JSON.stringify({ candidateStatus: nextRecord.candidateStatus, fields: mutation.fields || [] }), mutation.note, now],
      );
      return {
        vehicleId,
        publicationStatus: "NEEDS_REVIEW",
        candidateStatus: nextRecord.candidateStatus,
        published: false,
      };
    });
  }
}
