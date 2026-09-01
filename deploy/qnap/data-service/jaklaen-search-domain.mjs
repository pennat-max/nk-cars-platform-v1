import crypto from "node:crypto";

const REQUEST_TYPES = new Set(["SEARCH_NOW", "STANDING_SEARCH"]);
const PRIORITIES = new Set(["normal", "high", "urgent"]);
const SOURCES = new Set(["facebook_marketplace", "facebook_group", "authorized_source"]);
const WEEKDAYS = new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
const BLOCKED_REASONS = new Set(["LOGIN_REQUIRED", "MFA_REQUIRED", "CAPTCHA", "CHECKPOINT", "RATE_LIMIT", "ACCOUNT_RISK"]);

function text(value, label, max, optional = false) {
  const normalized = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if ((!normalized && !optional) || normalized.length > max) throw new Error(`invalid_${label}`);
  return normalized;
}

function integer(value, label, min, max, optional = false) {
  if ((value === null || value === undefined || value === "") && optional) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error(`invalid_${label}`);
  return parsed;
}

function list(value, label, allowed, maxItems, fallback = []) {
  const raw = value === undefined || value === null ? fallback : value;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > maxItems) throw new Error(`invalid_${label}`);
  const normalized = [...new Set(raw.map((item) => text(item, label, 80)))];
  if (normalized.some((item) => !allowed.has(item))) throw new Error(`invalid_${label}`);
  return normalized;
}

function idempotency(value) {
  const normalized = text(value, "idempotency_key", 80);
  if (!/^[a-zA-Z0-9:_-]{12,80}$/.test(normalized)) throw new Error("invalid_idempotency_key");
  return normalized;
}

function roleFromActor(actor) {
  const roles = new Set(actor?.roles || []);
  if (roles.has("OWNER")) return "OWNER";
  if (roles.has("STAFF")) return "STAFF";
  if (roles.has("CUSTOMER")) return "CUSTOMER";
  throw new Error("jaklaen_role_required");
}

function normalizeSchedule(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_jaklaen_schedule");
  const frequency = text(value.frequency, "jaklaen_frequency", 20);
  if (!new Set(["daily", "weekly"]).has(frequency)) throw new Error("invalid_jaklaen_frequency");
  const startHour = integer(value.startHour, "jaklaen_start_hour", 0, 23);
  const endHour = integer(value.endHour, "jaklaen_end_hour", 1, 24);
  if (startHour >= endHour) throw new Error("invalid_jaklaen_active_hours");
  if (value.timezone !== "Asia/Bangkok") throw new Error("invalid_jaklaen_timezone");
  return {
    frequency,
    timezone: "Asia/Bangkok",
    weekdays: list(value.weekdays, "jaklaen_weekdays", WEEKDAYS, 7),
    startHour,
    endHour,
  };
}

export function normalizeJaklaenSearchRequest(value, actor) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_jaklaen_search_request");
  const requestedByRole = roleFromActor(actor);
  const requestType = text(value.requestType || value.mode, "jaklaen_request_type", 20);
  if (!REQUEST_TYPES.has(requestType)) throw new Error("invalid_jaklaen_request_type");
  if (requestedByRole === "CUSTOMER" && requestType !== "SEARCH_NOW") throw new Error("customer_standing_search_forbidden");
  const criteria = value.criteria && typeof value.criteria === "object" && !Array.isArray(value.criteria) ? value.criteria : value;
  const customerCaseReference = text(value.customerCaseReference, "customer_case_reference", 120, requestedByRole !== "CUSTOMER");
  if (requestedByRole === "CUSTOMER" && !customerCaseReference) throw new Error("customer_case_reference_required");
  const schedule = requestType === "STANDING_SEARCH" ? normalizeSchedule(value.schedule) : null;
  return {
    requestType,
    idempotencyKey: idempotency(value.idempotencyKey || crypto.randomUUID()),
    active: value.active !== false,
    priority: (() => {
      const priority = text(value.priority || "normal", "jaklaen_priority", 10);
      if (!PRIORITIES.has(priority)) throw new Error("invalid_jaklaen_priority");
      return priority;
    })(),
    requestedBy: {
      role: requestedByRole,
      id: text(actor?.id, "actor_id", 200),
      email: text(actor?.email, "actor_email", 320),
    },
    customerCaseReference: customerCaseReference || null,
    criteria: {
      make: text(criteria.make, "make", 80),
      model: text(criteria.model, "model", 120, true) || "UNKNOWN",
      grade: text(criteria.grade, "grade", 120, true) || "UNKNOWN",
      yearFrom: integer(criteria.yearFrom, "year_from", 1990, 2100),
      yearTo: integer(criteria.yearTo, "year_to", 1990, 2100),
      transmission: text(criteria.transmission, "transmission", 40, true) || "UNKNOWN",
      engineFuel: text(criteria.engineFuel, "engine_fuel", 80, true) || "PENDING",
      driveType: text(criteria.driveType, "drive_type", 40, true) || "UNKNOWN",
      color: text(criteria.color, "color", 40, true) || "UNKNOWN",
      maxPriceThb: integer(criteria.maxPriceThb, "max_price_thb", 1, 100_000_000, true),
      maxMileageKm: integer(criteria.maxMileageKm, "max_mileage_km", 0, 5_000_000, true),
      location: text(criteria.location, "location", 120, true) || "UNKNOWN",
      radiusKm: integer(criteria.radiusKm, "radius_km", 0, 2000, true),
      quantityRequired: integer(criteria.quantityRequired, "quantity_required", 1, 20),
      sources: list(criteria.sources, "sources", SOURCES, 3, ["facebook_marketplace"]),
    },
    schedule,
  };
}

export function normalizeJaklaenJobCompletion(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_jaklaen_job_completion");
  const status = text(value.status, "jaklaen_job_status", 30);
  if (!new Set(["COMPLETED", "BLOCKED"]).has(status)) throw new Error("invalid_jaklaen_job_status");
  const blockedReason = value.blockedReason ? text(value.blockedReason, "jaklaen_blocked_reason", 40) : null;
  if (blockedReason && !BLOCKED_REASONS.has(blockedReason)) throw new Error("invalid_jaklaen_blocked_reason");
  return {
    status,
    blockedReason,
    listingsFound: integer(value.listingsFound ?? 0, "listings_found", 0, 500),
    candidatesReturned: integer(value.candidatesReturned ?? 0, "candidates_returned", 0, 100),
    message: text(value.message || "Jaklaen job completed.", "jaklaen_completion_message", 500),
  };
}
