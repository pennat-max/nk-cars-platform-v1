import crypto from "node:crypto";

export const BANGKOK_METRO_LOCATIONS = new Set([
  "Bangkok",
  "Nonthaburi",
  "Pathum Thani",
  "Samut Prakan",
  "Samut Sakhon",
  "Nakhon Pathom",
]);

export const SOURCING_WEEKDAYS = new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
export const HERMES_COMMANDS = new Set(["run_now", "pause", "resume"]);
export const HERMES_COMPLETION_STATES = new Set(["ready", "paused", "login_required", "error"]);
export const BROWSER_PROFILE_STATES = new Set(["ready", "paused", "login_required", "error"]);

function text(value, label, max, optional = false) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if ((!normalized && !optional) || normalized.length > max) throw new Error(`invalid_${label}`);
  return normalized;
}

function integer(value, label, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`invalid_${label}`);
  return value;
}

function list(value, label, allowed, maxItems, maxLength) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maxItems) throw new Error(`invalid_${label}`);
  const normalized = [...new Set(value.map((item) => text(item, label, maxLength)))];
  if (allowed && normalized.some((item) => !allowed.has(item))) throw new Error(`invalid_${label}`);
  return normalized;
}

function keywords(value, label) {
  if (!Array.isArray(value) || value.length > 20) throw new Error(`invalid_${label}`);
  return [...new Set(value.map((item) => text(item, label, 40).toLowerCase()))];
}

export function normalizeActor(headers) {
  const id = text(headers["x-nk-actor-id"], "actor_id", 200);
  const email = text(headers["x-nk-actor-email"], "actor_email", 320);
  const roles = new Set(String(headers["x-nk-actor-roles"] || "").split(",").map((role) => role.trim()).filter(Boolean));
  if (!roles.has("OWNER")) throw new Error("owner_role_required");
  return { id, email, roles: [...roles].sort() };
}

export function normalizeSourcingRule(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_sourcing_rule");
  const currentMaxYear = new Date().getUTCFullYear() + 1;
  const yearFrom = integer(value.yearFrom, "year_from", 1990, currentMaxYear);
  const yearTo = integer(value.yearTo, "year_to", yearFrom, currentMaxYear);
  const priority = text(value.priority, "priority", 10);
  if (!new Set(["normal", "high", "urgent"]).has(priority)) throw new Error("invalid_priority");
  if (value.bodyType !== "pickup" || value.sourceAdapter !== "facebook_marketplace") throw new Error("invalid_source_rule_scope");
  const locations = list(value.locations, "locations", BANGKOK_METRO_LOCATIONS, BANGKOK_METRO_LOCATIONS.size, 40);
  const requiredKeywords = keywords(value.requiredKeywords, "required_keywords");
  const excludedKeywords = keywords(value.excludedKeywords, "excluded_keywords");
  if (requiredKeywords.some((keyword) => excludedKeywords.includes(keyword))) throw new Error("conflicting_keywords");
  if (!value.schedule || typeof value.schedule !== "object" || Array.isArray(value.schedule)) throw new Error("invalid_schedule");
  if (value.schedule.timezone !== "Asia/Bangkok") throw new Error("invalid_schedule");
  const weekdays = list(value.schedule.weekdays, "weekdays", SOURCING_WEEKDAYS, SOURCING_WEEKDAYS.size, 3);
  const startHour = integer(value.schedule.startHour, "start_hour", 0, 23);
  const endHour = integer(value.schedule.endHour, "end_hour", 1, 24);
  if (startHour >= endHour) throw new Error("invalid_schedule_window");
  const maxSourcePriceThb = value.maxSourcePriceThb === null || value.maxSourcePriceThb === undefined
    ? null
    : integer(value.maxSourcePriceThb, "max_source_price", 1, 100_000_000);
  return {
    name: text(value.name, "rule_name", 100),
    active: value.active === true,
    brand: text(value.brand, "brand", 50),
    model: text(value.model, "model", 80, true),
    bodyType: "pickup",
    yearFrom,
    yearTo,
    maxSourcePriceThb,
    dailyLimit: integer(value.dailyLimit, "daily_limit", 1, 50),
    priority,
    locations,
    requiredKeywords,
    excludedKeywords,
    sourceAdapter: "facebook_marketplace",
    schedule: { timezone: "Asia/Bangkok", weekdays, startHour, endHour },
  };
}

export function normalizeRuleMutation(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_sourcing_request");
  return {
    rule: normalizeSourcingRule(value.rule),
    expectedRevision: integer(value.expectedRevision, "expected_revision", 0, Number.MAX_SAFE_INTEGER),
  };
}

export function normalizeCommand(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_hermes_command");
  const action = text(value.action, "hermes_action", 20);
  if (!HERMES_COMMANDS.has(action)) throw new Error("invalid_hermes_action");
  const idempotencyKey = text(value.idempotencyKey, "idempotency_key", 36);
  if (!crypto.randomUUID || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    throw new Error("invalid_idempotency_key");
  }
  const ruleId = value.ruleId === null || value.ruleId === undefined || value.ruleId === ""
    ? null
    : text(value.ruleId, "rule_id", 100);
  return { action, ruleId, idempotencyKey };
}

export function normalizeWorkerIdentity(value) {
  return text(value, "worker_id", 100);
}

export function normalizeHeartbeat(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_worker_heartbeat");
  const browserProfileState = text(value.browserProfileState, "browser_profile_state", 30);
  if (!BROWSER_PROFILE_STATES.has(browserProfileState)) throw new Error("invalid_browser_profile_state");
  return {
    browserProfileState,
    processedIncrement: integer(value.processedIncrement ?? 0, "processed_increment", 0, 50),
    message: text(value.message, "worker_message", 500),
  };
}

export function normalizeCompletion(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_worker_completion");
  const state = text(value.state, "hermes_state", 30);
  if (!HERMES_COMPLETION_STATES.has(state)) throw new Error("invalid_hermes_state");
  const browserProfileState = text(value.browserProfileState, "browser_profile_state", 30);
  if (!BROWSER_PROFILE_STATES.has(browserProfileState)) throw new Error("invalid_browser_profile_state");
  return {
    state,
    browserProfileState,
    processedIncrement: integer(value.processedIncrement ?? 0, "processed_increment", 0, 50),
    message: text(value.message, "worker_message", 500),
    safeErrorCode: value.safeErrorCode === null || value.safeErrorCode === undefined || value.safeErrorCode === ""
      ? null
      : text(value.safeErrorCode, "safe_error_code", 100),
  };
}

export function publicError(error) {
  const code = error instanceof Error ? error.message : "internal_error";
  if (code === "owner_role_required") return { status: 403, code };
  if (code === "rule_not_found" || code === "command_not_found") return { status: 404, code };
  if (code === "sourcing_revision_conflict" || code === "command_already_claimed") return { status: 409, code };
  if (code === "worker_not_configured") return { status: 503, code };
  if (code.startsWith("invalid_" ) || code === "conflicting_keywords") return { status: 400, code };
  return { status: 500, code: "internal_error" };
}
