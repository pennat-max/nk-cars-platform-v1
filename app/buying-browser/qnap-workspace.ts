import type { ChatGPTUser } from "../chatgpt-auth";
import { assessQuotationReadiness } from "./domain.mjs";
import type { BuyingBrowserState, OwnerCaseAuditEvent, OwnerCaseQueueItem, OwnerCaseVerificationInput, QuotationReadiness } from "./types";
import { enforceServerControlledWorkspaceState, validateAndOwnBuyingBrowserState } from "./workspace-state.mjs";

export type QnapWorkspaceRecord = {
  state: BuyingBrowserState | null;
  revision: number;
  updatedAt: string | null;
};

const MAX_RESPONSE_BYTES = 1_500_000;
const ALLOWED_AUDIT_ACTIONS = new Set(["owner_case_verification_updated", "quotation_issued", "quotation_accepted", "pi_issued"]);

export function qnapWorkspaceBackendEnabled() {
  return String(process.env.NK_WORKSPACE_BACKEND || "").trim().toLowerCase() === "qnap";
}

function configuration() {
  const rawUrl = String(process.env.NK_QNAP_DATA_API_URL || "").trim();
  const token = String(process.env.NK_INTERNAL_API_TOKEN || "").trim();
  try {
    const origin = new URL(rawUrl);
    if (origin.protocol !== "https:" || origin.username || origin.password || token.length < 20) return null;
    return { origin, token };
  } catch {
    return null;
  }
}

function boundedText(value: unknown, label: string, max = 320) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`invalid_${label}`);
  return value;
}

function optionalTimestamp(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new Error("invalid_workspace_timestamp");
  return value;
}

function parseWorkspaceRecord(value: unknown, userId: string): QnapWorkspaceRecord {
  if (!value || typeof value !== "object") throw new Error("invalid_workspace_response");
  const record = value as { state?: unknown; revision?: unknown; updatedAt?: unknown };
  if (!Number.isSafeInteger(record.revision) || Number(record.revision) < 0) throw new Error("invalid_workspace_revision");
  const state = record.state === null || record.state === undefined
    ? null
    : validateAndOwnBuyingBrowserState(record.state, userId) as BuyingBrowserState;
  return {
    state: state ? enforceServerControlledWorkspaceState(state, state) as BuyingBrowserState : null,
    revision: Number(record.revision),
    updatedAt: optionalTimestamp(record.updatedAt),
  };
}

function parseAuditEvent(value: unknown, workspaceUserId: string, caseId: string): OwnerCaseAuditEvent {
  if (!value || typeof value !== "object") throw new Error("invalid_case_audit_event");
  const event = value as Record<string, unknown>;
  const action = boundedText(event.action, "audit_action", 80);
  if (!ALLOWED_AUDIT_ACTIONS.has(action)) throw new Error("invalid_audit_action");
  if (event.workspaceUserId !== workspaceUserId || event.caseId !== caseId) throw new Error("invalid_audit_identity");
  return {
    id: boundedText(event.id, "audit_id", 200),
    workspaceUserId,
    caseId,
    actorUserId: boundedText(event.actorUserId, "audit_actor", 200),
    action: action as OwnerCaseAuditEvent["action"],
    oldValue: event.oldValue && typeof event.oldValue === "object" ? event.oldValue as Record<string, unknown> : {},
    newValue: event.newValue && typeof event.newValue === "object" ? event.newValue as Record<string, unknown> : {},
    evidenceNote: boundedText(event.evidenceNote, "audit_evidence", 2_000),
    createdAt: optionalTimestamp(event.createdAt) || (() => { throw new Error("invalid_audit_timestamp"); })(),
  };
}

function parseOwnerCase(value: unknown): OwnerCaseQueueItem {
  if (!value || typeof value !== "object") throw new Error("invalid_owner_case_response");
  const item = value as Record<string, unknown>;
  const workspaceUserId = boundedText(item.workspaceUserId, "workspace_user_id", 200);
  if (!Number.isSafeInteger(item.workspaceRevision) || Number(item.workspaceRevision) < 1) throw new Error("invalid_workspace_revision");
  const state = validateAndOwnBuyingBrowserState({
    version: 1,
    savedListingIds: [],
    cases: [item.vehicleCase],
    importedListings: [],
    sourceCaptures: [],
    generalMessages: [],
  }, workspaceUserId) as BuyingBrowserState;
  const vehicleCase = state.cases[0];
  if (!vehicleCase) throw new Error("invalid_owner_case");
  return {
    workspaceUserId,
    customerEmail: boundedText(item.customerEmail, "customer_email", 320),
    customerDisplayName: boundedText(item.customerDisplayName, "customer_display_name", 200),
    workspaceRevision: Number(item.workspaceRevision),
    workspaceUpdatedAt: optionalTimestamp(item.workspaceUpdatedAt) || (() => { throw new Error("invalid_workspace_timestamp"); })(),
    vehicleCase,
    quotationReadiness: assessQuotationReadiness(vehicleCase) as QuotationReadiness,
    auditEvents: Array.isArray(item.auditEvents) && item.auditEvents.length <= 500
      ? item.auditEvents.map((event) => parseAuditEvent(event, workspaceUserId, vehicleCase.id))
      : [],
  };
}

async function responseJson(response: Response) {
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_RESPONSE_BYTES) throw new Error("workspace_response_too_large");
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("workspace_response_too_large");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("invalid_workspace_response");
  }
}

async function requestQnap(path: string, actor: ChatGPTUser, init: RequestInit = {}) {
  const config = configuration();
  if (!config) throw new Error("database_unavailable");
  const endpoint = new URL(path, `${config.origin.href.replace(/\/$/, "")}/`);
  if (endpoint.origin !== config.origin.origin || !endpoint.pathname.startsWith("/v1/")) throw new Error("invalid_workspace_endpoint");
  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...init,
      headers: {
        authorization: `Bearer ${config.token}`,
        accept: "application/json",
        "content-type": "application/json",
        "x-nk-actor-id": actor.id,
        "x-nk-actor-email": actor.email,
        "x-nk-actor-roles": (actor.roles || []).join(","),
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });
  } catch {
    throw new Error("database_unavailable");
  }
  const payload = await responseJson(response);
  if (response.status === 409) {
    const conflict = new Error("workspace_revision_conflict");
    if (payload?.current) Object.assign(conflict, { current: parseWorkspaceRecord(payload.current, actor.id) });
    throw conflict;
  }
  if (!response.ok) {
    const error = typeof payload?.error === "string" ? payload.error : "workspace_request_failed";
    if (response.status >= 500) throw new Error("database_unavailable");
    throw new Error(error);
  }
  return payload;
}

function workspacePath(userId: string) {
  return `/v1/workspaces/${encodeURIComponent(userId)}`;
}

function ownerCasePath(workspaceUserId: string, caseId: string, operation: string) {
  return `/v1/admin/cases/${encodeURIComponent(workspaceUserId)}/${encodeURIComponent(caseId)}/${operation}`;
}

export async function readQnapWorkspace(user: ChatGPTUser): Promise<QnapWorkspaceRecord> {
  return parseWorkspaceRecord(await requestQnap(workspacePath(user.id), user), user.id);
}

export async function writeQnapWorkspace(user: ChatGPTUser, value: unknown, expectedRevision: number): Promise<QnapWorkspaceRecord> {
  const current = await readQnapWorkspace(user);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || expectedRevision !== current.revision) {
    const conflict = new Error("workspace_revision_conflict");
    Object.assign(conflict, { current });
    throw conflict;
  }
  const validated = validateAndOwnBuyingBrowserState(value, user.id) as BuyingBrowserState;
  const state = enforceServerControlledWorkspaceState(validated, current.state) as BuyingBrowserState;
  const payload = await requestQnap(workspacePath(user.id), user, {
    method: "PUT",
    body: JSON.stringify({ state, expectedRevision, profile: { email: user.email, displayName: user.displayName } }),
  });
  return parseWorkspaceRecord(payload, user.id);
}

export async function listQnapOwnerCases(owner: ChatGPTUser): Promise<OwnerCaseQueueItem[]> {
  const payload = await requestQnap("/v1/admin/cases", owner);
  if (!Array.isArray(payload?.cases) || payload.cases.length > 500) throw new Error("invalid_owner_case_response");
  return payload.cases.map(parseOwnerCase);
}

async function qnapOwnerMutation(owner: ChatGPTUser, workspaceUserId: string, caseId: string, operation: string, body: unknown) {
  const payload = await requestQnap(ownerCasePath(workspaceUserId, caseId, operation), owner, { method: "POST", body: JSON.stringify(body) });
  return parseOwnerCase(payload?.case);
}

export function writeQnapOwnerCaseVerification(owner: ChatGPTUser, workspaceUserId: string, caseId: string, verification: OwnerCaseVerificationInput, expectedRevision: number) {
  return qnapOwnerMutation(owner, workspaceUserId, caseId, "verification", { verification, expectedRevision });
}

export function issueQnapOwnerCaseQuotation(owner: ChatGPTUser, workspaceUserId: string, caseId: string, expectedRevision: number) {
  return qnapOwnerMutation(owner, workspaceUserId, caseId, "quotation", { expectedRevision });
}

export function issueQnapOwnerCaseProformaInvoice(owner: ChatGPTUser, workspaceUserId: string, caseId: string, expectedRevision: number) {
  return qnapOwnerMutation(owner, workspaceUserId, caseId, "pi", { expectedRevision });
}

export async function acceptQnapCustomerCaseQuotation(user: ChatGPTUser, caseId: string, quotationNumber: string): Promise<QnapWorkspaceRecord> {
  const payload = await requestQnap(`${workspacePath(user.id)}/cases/${encodeURIComponent(caseId)}/quotation-acceptance`, user, {
    method: "POST",
    body: JSON.stringify({ quotationNumber }),
  });
  return parseWorkspaceRecord(payload, user.id);
}

export const qnapWorkspaceTestHelpers = { parseWorkspaceRecord, parseOwnerCase };
