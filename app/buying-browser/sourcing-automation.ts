export const BANGKOK_METRO_LOCATIONS = [
  "Bangkok",
  "Nonthaburi",
  "Pathum Thani",
  "Samut Prakan",
  "Samut Sakhon",
  "Nakhon Pathom",
  "Phetchaburi",
] as const;

export const SOURCING_WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export type SourcingWeekday = typeof SOURCING_WEEKDAYS[number];
export type SourcingPriority = "normal" | "high" | "urgent";
export type HermesState = "not_configured" | "ready" | "running" | "paused" | "login_required" | "error";
export type BrowserProfileState = "not_configured" | "ready" | "paused" | "login_required" | "error";
export type HermesCommand = "run_now" | "pause" | "resume";

export type SourcingRuleInput = {
  id?: string;
  expectedRevision?: number;
  name: string;
  active: boolean;
  brand: string;
  model: string;
  bodyType: "pickup";
  yearFrom: number;
  yearTo: number;
  maxSourcePriceThb: number | null;
  dailyLimit: number;
  priority: SourcingPriority;
  locations: string[];
  requiredKeywords: string[];
  excludedKeywords: string[];
  sourceAdapter: "facebook_marketplace";
  schedule: {
    timezone: "Asia/Bangkok";
    weekdays: SourcingWeekday[];
    startHour: number;
    endHour: number;
  };
};

export type SourcingRuleRecord = SourcingRuleInput & {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type SourcingAutomationSnapshot = {
  connected: boolean;
  hermesState: HermesState;
  browserProfileState: BrowserProfileState;
  queueDepth: number;
  processedToday: number;
  lastRunAt: string | null;
  lastHeartbeatAt: string | null;
  message: string;
  rules: SourcingRuleRecord[];
};

const PRIORITIES = new Set<SourcingPriority>(["normal", "high", "urgent"]);
const HERMES_STATES = new Set<HermesState>(["not_configured", "ready", "running", "paused", "login_required", "error"]);
const PROFILE_STATES = new Set<BrowserProfileState>(["not_configured", "ready", "paused", "login_required", "error"]);
const COMMANDS = new Set<HermesCommand>(["run_now", "pause", "resume"]);

function text(value: unknown, label: string, max: number, optional = false) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if ((!normalized && !optional) || normalized.length > max) throw new Error(`invalid_${label}`);
  return normalized;
}

function integer(value: unknown, label: string, min: number, max: number) {
  if (!Number.isSafeInteger(value) || Number(value) < min || Number(value) > max) throw new Error(`invalid_${label}`);
  return Number(value);
}

function timestamp(value: unknown, label: string) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new Error(`invalid_${label}`);
  return value;
}

function keywords(value: unknown, label: string) {
  if (!Array.isArray(value) || value.length > 20) throw new Error(`invalid_${label}`);
  const normalized = [...new Set(value.map((item) => text(item, label, 40).toLowerCase()))];
  return normalized;
}

export function defaultSourcingRuleInput(): SourcingRuleInput {
  return {
    name: "Toyota pickup 2020+ - Bangkok Metro",
    active: true,
    brand: "Toyota",
    model: "",
    bodyType: "pickup",
    yearFrom: 2020,
    yearTo: new Date().getUTCFullYear() + 1,
    maxSourcePriceThb: null,
    dailyLimit: 10,
    priority: "normal",
    locations: [...BANGKOK_METRO_LOCATIONS],
    requiredKeywords: ["pickup"],
    excludedKeywords: [],
    sourceAdapter: "facebook_marketplace",
    schedule: {
      timezone: "Asia/Bangkok",
      weekdays: [...SOURCING_WEEKDAYS],
      startHour: 8,
      endHour: 20,
    },
  };
}

export function normalizeSourcingRuleInput(value: unknown): SourcingRuleInput {
  if (!value || typeof value !== "object") throw new Error("invalid_sourcing_rule");
  const rule = value as Record<string, unknown>;
  const currentMaxYear = new Date().getUTCFullYear() + 1;
  const yearFrom = integer(rule.yearFrom, "year_from", 1990, currentMaxYear);
  const yearTo = integer(rule.yearTo, "year_to", yearFrom, currentMaxYear);
  const dailyLimit = integer(rule.dailyLimit, "daily_limit", 1, 50);
  const maxSourcePriceThb = rule.maxSourcePriceThb === null || rule.maxSourcePriceThb === undefined || rule.maxSourcePriceThb === ""
    ? null
    : integer(rule.maxSourcePriceThb, "max_source_price", 1, 100_000_000);
  const priority = text(rule.priority, "priority", 10) as SourcingPriority;
  if (!PRIORITIES.has(priority)) throw new Error("invalid_priority");
  if (rule.bodyType !== "pickup" || rule.sourceAdapter !== "facebook_marketplace") throw new Error("invalid_source_rule_scope");
  if (!Array.isArray(rule.locations) || !rule.locations.length || rule.locations.length > BANGKOK_METRO_LOCATIONS.length) throw new Error("invalid_locations");
  const locations = [...new Set(rule.locations.map((item) => text(item, "location", 40)))];
  if (locations.some((location) => !BANGKOK_METRO_LOCATIONS.includes(location as typeof BANGKOK_METRO_LOCATIONS[number]))) throw new Error("invalid_location");
  const requiredKeywords = keywords(rule.requiredKeywords, "required_keywords");
  const excludedKeywords = keywords(rule.excludedKeywords, "excluded_keywords");
  if (requiredKeywords.some((keyword) => excludedKeywords.includes(keyword))) throw new Error("conflicting_keywords");
  if (!rule.schedule || typeof rule.schedule !== "object") throw new Error("invalid_schedule");
  const schedule = rule.schedule as Record<string, unknown>;
  if (schedule.timezone !== "Asia/Bangkok" || !Array.isArray(schedule.weekdays) || !schedule.weekdays.length) throw new Error("invalid_schedule");
  const weekdays = [...new Set(schedule.weekdays.map((item) => text(item, "weekday", 3) as SourcingWeekday))];
  if (weekdays.some((day) => !SOURCING_WEEKDAYS.includes(day))) throw new Error("invalid_weekday");
  const startHour = integer(schedule.startHour, "start_hour", 0, 23);
  const endHour = integer(schedule.endHour, "end_hour", 1, 24);
  if (startHour >= endHour) throw new Error("invalid_schedule_window");
  const id = rule.id === undefined ? undefined : text(rule.id, "rule_id", 100);
  const expectedRevision = rule.expectedRevision === undefined ? undefined : integer(rule.expectedRevision, "expected_revision", 0, Number.MAX_SAFE_INTEGER);
  return {
    ...(id ? { id } : {}),
    ...(expectedRevision !== undefined ? { expectedRevision } : {}),
    name: text(rule.name, "rule_name", 100),
    active: rule.active === true,
    brand: text(rule.brand, "brand", 50),
    model: text(rule.model, "model", 80, true),
    bodyType: "pickup",
    yearFrom,
    yearTo,
    maxSourcePriceThb,
    dailyLimit,
    priority,
    locations,
    requiredKeywords,
    excludedKeywords,
    sourceAdapter: "facebook_marketplace",
    schedule: { timezone: "Asia/Bangkok", weekdays, startHour, endHour },
  };
}

export function parseSourcingRuleRecord(value: unknown): SourcingRuleRecord {
  const rule = normalizeSourcingRuleInput(value);
  if (!rule.id || !Number.isSafeInteger((value as Record<string, unknown>).revision)) throw new Error("invalid_sourcing_rule_record");
  const record = value as Record<string, unknown>;
  return {
    ...rule,
    id: rule.id,
    revision: integer(record.revision, "revision", 0, Number.MAX_SAFE_INTEGER),
    createdAt: timestamp(record.createdAt, "created_at"),
    updatedAt: timestamp(record.updatedAt, "updated_at"),
  };
}

export function parseSourcingAutomationSnapshot(value: unknown): SourcingAutomationSnapshot {
  if (!value || typeof value !== "object") throw new Error("invalid_sourcing_snapshot");
  const snapshot = value as Record<string, unknown>;
  if (!Array.isArray(snapshot.rules) || snapshot.rules.length > 100) throw new Error("invalid_sourcing_rules");
  const hermesState = text(snapshot.hermesState, "hermes_state", 30) as HermesState;
  const browserProfileState = text(snapshot.browserProfileState, "profile_state", 30) as BrowserProfileState;
  if (!HERMES_STATES.has(hermesState) || !PROFILE_STATES.has(browserProfileState)) throw new Error("invalid_sourcing_status");
  const optionalTime = (field: unknown, label: string) => field === null || field === undefined ? null : timestamp(field, label);
  return {
    connected: snapshot.connected === true,
    hermesState,
    browserProfileState,
    queueDepth: integer(snapshot.queueDepth, "queue_depth", 0, 10_000),
    processedToday: integer(snapshot.processedToday, "processed_today", 0, 100_000),
    lastRunAt: optionalTime(snapshot.lastRunAt, "last_run_at"),
    lastHeartbeatAt: optionalTime(snapshot.lastHeartbeatAt, "last_heartbeat_at"),
    message: text(snapshot.message, "sourcing_message", 500),
    rules: snapshot.rules.map(parseSourcingRuleRecord),
  };
}

export function normalizeHermesCommand(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("invalid_hermes_command");
  const input = value as Record<string, unknown>;
  const action = text(input.action, "hermes_action", 20) as HermesCommand;
  if (!COMMANDS.has(action)) throw new Error("invalid_hermes_action");
  const ruleId = input.ruleId === null || input.ruleId === undefined || input.ruleId === "" ? null : text(input.ruleId, "rule_id", 100);
  return { action, ruleId };
}

export function unavailableSourcingAutomationSnapshot(): SourcingAutomationSnapshot {
  return {
    connected: false,
    hermesState: "not_configured",
    browserProfileState: "not_configured",
    queueDepth: 0,
    processedToday: 0,
    lastRunAt: null,
    lastHeartbeatAt: null,
    message: "QNAP/Hermes sourcing control is not connected. No search command has been sent.",
    rules: [],
  };
}
