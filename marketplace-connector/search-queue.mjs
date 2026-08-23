import { randomUUID } from "node:crypto";

const TERMINAL_STATES = new Set(["completed", "failed", "login_required", "cancelled", "timed_out"]);

function iso(value) {
  return value ? new Date(value).toISOString() : undefined;
}

function safeErrorCode(error) {
  const code = error instanceof Error ? error.message : String(error || "search_failed");
  return /^[a-z0-9_:-]{1,100}$/i.test(code) ? code : "search_failed";
}

export class SearchQueue {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 1;
    if (this.concurrency !== 1) throw new Error("v1_queue_requires_single_concurrency");
    this.requestsPerMinute = options.requestsPerMinute || 6;
    this.minimumIntervalMs = options.minimumIntervalMs ?? 5_000;
    this.runTimeoutMs = options.runTimeoutMs || 90_000;
    this.maxRuns = options.maxRuns || 200;
    this.now = options.now || (() => Date.now());
    this.setTimer = options.setTimer || setTimeout;
    this.pending = [];
    this.runs = new Map();
    this.active = 0;
    this.startTimes = [];
    this.timer = null;
  }

  enqueue({ request, profileId, execute }) {
    if (typeof execute !== "function") throw new Error("queue_execute_required");
    this.#pruneRuns();
    const runId = `run_${randomUUID()}`;
    const createdAt = this.now();
    const run = {
      run_id: runId,
      request_id: request.request_id,
      profile_id: profileId,
      status: "queued",
      created_at: createdAt,
      started_at: undefined,
      completed_at: undefined,
      listings_found: 0,
      duplicates: 0,
      rejected: 0,
      candidate_count: 0,
      candidates: [],
      output: undefined,
      error_code: undefined,
      execute,
      controller: new AbortController(),
    };
    this.runs.set(runId, run);
    this.pending.push(runId);
    this.#drain();
    return this.getRun(runId);
  }

  getRun(runId) {
    const run = this.runs.get(runId);
    if (!run) return null;
    return {
      run_id: run.run_id,
      request_id: run.request_id,
      profile_id: run.profile_id,
      status: run.status,
      created_at: iso(run.created_at),
      started_at: iso(run.started_at),
      completed_at: iso(run.completed_at),
      listings_found: run.listings_found,
      duplicates: run.duplicates,
      rejected: run.rejected,
      candidate_count: run.candidate_count,
      candidates: run.candidates,
      error_code: run.error_code,
    };
  }

  cancel(runId) {
    const run = this.runs.get(runId);
    if (!run || TERMINAL_STATES.has(run.status)) return false;
    run.controller.abort(new Error("cancelled"));
    if (run.status === "queued") {
      this.pending = this.pending.filter((id) => id !== runId);
      run.status = "cancelled";
      run.completed_at = this.now();
    }
    return true;
  }

  getOutput(runId) {
    const run = this.runs.get(runId);
    return run && run.status === "completed" ? run.output : undefined;
  }

  async waitForIdle(timeoutMs = 5_000) {
    const started = this.now();
    while (this.active || this.pending.length || this.timer) {
      if (this.now() - started > timeoutMs) throw new Error("queue_idle_timeout");
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  #nextDelay() {
    const now = this.now();
    this.startTimes = this.startTimes.filter((time) => now - time < 60_000);
    const intervalDelay = this.startTimes.length
      ? Math.max(0, this.minimumIntervalMs - (now - this.startTimes.at(-1)))
      : 0;
    const rateDelay = this.startTimes.length >= this.requestsPerMinute
      ? Math.max(0, 60_000 - (now - this.startTimes[0]))
      : 0;
    return Math.max(intervalDelay, rateDelay);
  }

  #drain() {
    if (this.active >= this.concurrency || !this.pending.length || this.timer) return;
    const delay = this.#nextDelay();
    if (delay > 0) {
      this.timer = this.setTimer(() => {
        this.timer = null;
        this.#drain();
      }, delay);
      return;
    }

    const runId = this.pending.shift();
    const run = this.runs.get(runId);
    if (!run || run.status !== "queued") {
      this.#drain();
      return;
    }

    this.active += 1;
    run.status = "running";
    run.started_at = this.now();
    this.startTimes.push(run.started_at);
    this.#execute(run).finally(() => {
      this.active -= 1;
      this.#drain();
    });
  }

  async #execute(run) {
    let timeout;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeout = this.setTimer(() => {
          run.controller.abort(new Error("search_timed_out"));
          reject(new Error("search_timed_out"));
        }, this.runTimeoutMs);
      });
      const result = await Promise.race([
        run.execute({ signal: run.controller.signal, runId: run.run_id }),
        timeoutPromise,
      ]);
      const candidates = Array.isArray(result?.candidates) ? result.candidates : [];
      const uniqueCandidates = [...new Map(candidates.map((candidate) => [candidate.candidate_id, candidate])).values()];
      run.candidates = uniqueCandidates;
      run.listings_found = Number(result?.listings_found) || candidates.length;
      run.duplicates = Number(result?.duplicates) || Math.max(0, candidates.length - uniqueCandidates.length);
      run.rejected = Number(result?.rejected) || 0;
      run.candidate_count = uniqueCandidates.length;
      run.output = result?.output;
      run.status = "completed";
    } catch (error) {
      const code = safeErrorCode(error);
      run.error_code = code;
      run.status = code === "facebook_login_required" || code === "login_required"
        ? "login_required"
        : code === "cancelled" || run.controller.signal.reason?.message === "cancelled"
          ? "cancelled"
          : code === "search_timed_out" ? "timed_out" : "failed";
    } finally {
      clearTimeout(timeout);
      run.completed_at = this.now();
    }
  }

  #pruneRuns() {
    if (this.runs.size < this.maxRuns) return;
    const removable = [...this.runs.values()]
      .filter((run) => TERMINAL_STATES.has(run.status))
      .sort((a, b) => a.created_at - b.created_at);
    while (this.runs.size >= this.maxRuns && removable.length) {
      this.runs.delete(removable.shift().run_id);
    }
    if (this.runs.size >= this.maxRuns) throw new Error("search_queue_full");
  }
}
