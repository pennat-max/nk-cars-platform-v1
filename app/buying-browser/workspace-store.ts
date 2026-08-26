import { isOwnerUser, type ChatGPTUser } from "../chatgpt-auth";
import { assessQuotationReadiness } from "./domain.mjs";
import { applyOwnerCaseVerification } from "./owner-case-verification.mjs";
import type { BuyingBrowserState, OwnerCaseAuditEvent, OwnerCaseQueueItem, OwnerCaseVerificationInput, QuotationReadiness } from "./types";
import { validateAndOwnBuyingBrowserState, workspaceSummary } from "./workspace-state.mjs";

export type WorkspaceRecord = {
  state: BuyingBrowserState | null;
  revision: number;
  updatedAt: string | null;
};

type WorkspaceRow = {
  state_json: string;
  revision: number;
  updated_at: string;
};

type OwnerWorkspaceRow = WorkspaceRow & {
  user_id: string;
  email: string;
  display_name: string;
};

type CaseAuditRow = {
  id: string;
  workspace_user_id: string;
  case_id: string;
  actor_user_id: string;
  action: "owner_case_verification_updated";
  old_value_json: string;
  new_value_json: string;
  evidence_note: string;
  created_at: string;
};

async function database() {
  const injected = (globalThis as typeof globalThis & { __NK_WORKSPACE_TEST_DB__?: D1Database }).__NK_WORKSPACE_TEST_DB__;
  if (injected) return injected;
  const { env } = await import("cloudflare:workers");
  if (!env.DB) throw new Error("database_unavailable");
  return env.DB;
}

export async function readWorkspace(user: ChatGPTUser): Promise<WorkspaceRecord> {
  const d1 = await database();
  const row = await d1
    .prepare("SELECT state_json, revision, updated_at FROM buying_browser_workspaces WHERE user_id = ? LIMIT 1")
    .bind(user.id)
    .first<WorkspaceRow>();
  if (!row) return { state: null, revision: 0, updatedAt: null };
  const parsed: unknown = JSON.parse(row.state_json);
  return {
    state: validateAndOwnBuyingBrowserState(parsed, user.id) as BuyingBrowserState,
    revision: row.revision,
    updatedAt: row.updated_at,
  };
}

export async function writeWorkspace(user: ChatGPTUser, value: unknown, expectedRevision: number): Promise<WorkspaceRecord> {
  const d1 = await database();
  const current = await readWorkspace(user);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || expectedRevision !== current.revision) {
    const conflict = new Error("workspace_revision_conflict");
    Object.assign(conflict, { current });
    throw conflict;
  }

  const state = validateAndOwnBuyingBrowserState(value, user.id) as BuyingBrowserState;
  const stateJson = JSON.stringify(state);
  const nextRevision = current.revision + 1;
  const now = new Date().toISOString();
  const eventId = crypto.randomUUID();
  const summaryJson = JSON.stringify(workspaceSummary(state));

  if (current.revision === 0) {
    await d1.batch([
      d1.prepare("INSERT INTO buying_browser_workspaces (user_id, email, display_name, state_json, revision, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(user.id, user.email, user.displayName, stateJson, nextRevision, now, now),
      d1.prepare("INSERT INTO buying_browser_workspace_events (id, user_id, revision, event_type, summary_json, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(eventId, user.id, nextRevision, "workspace_saved", summaryJson, now),
    ]);
  } else {
    await d1.batch([
      d1.prepare("UPDATE buying_browser_workspaces SET email = ?, display_name = ?, state_json = ?, revision = ?, updated_at = ? WHERE user_id = ? AND revision = ?")
        .bind(user.email, user.displayName, stateJson, nextRevision, now, user.id, current.revision),
      d1.prepare("INSERT INTO buying_browser_workspace_events (id, user_id, revision, event_type, summary_json, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(eventId, user.id, nextRevision, "workspace_saved", summaryJson, now),
    ]);
  }

  return { state, revision: nextRevision, updatedAt: now };
}

function workspaceConflict(current: WorkspaceRecord) {
  const conflict = new Error("workspace_revision_conflict");
  Object.assign(conflict, { current });
  return conflict;
}

function parseAuditRow(row: CaseAuditRow): OwnerCaseAuditEvent {
  return {
    id: row.id,
    workspaceUserId: row.workspace_user_id,
    caseId: row.case_id,
    actorUserId: row.actor_user_id,
    action: row.action,
    oldValue: JSON.parse(row.old_value_json),
    newValue: JSON.parse(row.new_value_json),
    evidenceNote: row.evidence_note,
    createdAt: row.created_at,
  };
}

export async function listOwnerCases(owner: ChatGPTUser): Promise<OwnerCaseQueueItem[]> {
  if (!isOwnerUser(owner)) throw new Error("owner_authorization_required");
  const d1 = await database();
  const [workspaceResult, auditResult] = await Promise.all([
    d1.prepare("SELECT user_id, email, display_name, state_json, revision, updated_at FROM buying_browser_workspaces ORDER BY updated_at DESC").all<OwnerWorkspaceRow>(),
    d1.prepare("SELECT id, workspace_user_id, case_id, actor_user_id, action, old_value_json, new_value_json, evidence_note, created_at FROM buying_browser_case_audit_events ORDER BY created_at DESC LIMIT 100").all<CaseAuditRow>(),
  ]);
  const auditsByCase = new Map<string, OwnerCaseAuditEvent[]>();
  for (const row of auditResult.results ?? []) {
    const key = `${row.workspace_user_id}:${row.case_id}`;
    const events = auditsByCase.get(key) ?? [];
    events.push(parseAuditRow(row));
    auditsByCase.set(key, events);
  }
  const items: OwnerCaseQueueItem[] = [];
  for (const row of workspaceResult.results ?? []) {
    try {
      const state = validateAndOwnBuyingBrowserState(JSON.parse(row.state_json), row.user_id) as BuyingBrowserState;
      for (const vehicleCase of state.cases) {
        items.push({
          workspaceUserId: row.user_id,
          customerEmail: row.email,
          customerDisplayName: row.display_name,
          workspaceRevision: row.revision,
          workspaceUpdatedAt: row.updated_at,
          vehicleCase,
          quotationReadiness: assessQuotationReadiness(vehicleCase) as QuotationReadiness,
          auditEvents: auditsByCase.get(`${row.user_id}:${vehicleCase.id}`) ?? [],
        });
      }
    } catch {
      // A corrupt workspace is skipped and remains available for recovery from its raw record.
    }
  }
  return items.sort((a, b) => {
    const requestPriority = Number(Boolean(b.vehicleCase.quotationRequest)) - Number(Boolean(a.vehicleCase.quotationRequest));
    return requestPriority || b.vehicleCase.updatedAt.localeCompare(a.vehicleCase.updatedAt);
  });
}

export async function writeOwnerCaseVerification(
  owner: ChatGPTUser,
  workspaceUserId: string,
  caseId: string,
  value: OwnerCaseVerificationInput,
  expectedRevision: number,
): Promise<OwnerCaseQueueItem> {
  if (!isOwnerUser(owner)) throw new Error("owner_authorization_required");
  if (!workspaceUserId || workspaceUserId.length > 200 || !caseId || caseId.length > 200) throw new Error("invalid_case_reference");
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new Error("invalid_revision");
  const d1 = await database();
  const row = await d1.prepare("SELECT user_id, email, display_name, state_json, revision, updated_at FROM buying_browser_workspaces WHERE user_id = ? LIMIT 1")
    .bind(workspaceUserId)
    .first<OwnerWorkspaceRow>();
  if (!row) throw new Error("workspace_not_found");
  const currentState = validateAndOwnBuyingBrowserState(JSON.parse(row.state_json), row.user_id) as BuyingBrowserState;
  if (row.revision !== expectedRevision) throw workspaceConflict({ state: currentState, revision: row.revision, updatedAt: row.updated_at });
  const currentCase = currentState.cases.find((item) => item.id === caseId);
  if (!currentCase) throw new Error("case_not_found");

  const now = new Date().toISOString();
  const applied = applyOwnerCaseVerification(currentCase, value, new Date(now));
  const nextState = validateAndOwnBuyingBrowserState({
    ...currentState,
    cases: currentState.cases.map((item) => item.id === caseId ? applied.caseRecord : item),
  }, row.user_id) as BuyingBrowserState;
  const nextRevision = row.revision + 1;
  const auditId = crypto.randomUUID();
  const workspaceEventId = crypto.randomUUID();
  const summaryJson = JSON.stringify({
    ...workspaceSummary(nextState),
    caseId,
    action: "owner_case_verification_updated",
    quotationReadiness: applied.quotationReadiness.status,
  });

  try {
    await d1.batch([
      d1.prepare("UPDATE buying_browser_workspaces SET state_json = ?, revision = ?, updated_at = ? WHERE user_id = ? AND revision = ?")
        .bind(JSON.stringify(nextState), nextRevision, now, row.user_id, row.revision),
      d1.prepare("INSERT INTO buying_browser_workspace_events (id, user_id, revision, event_type, summary_json, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(workspaceEventId, row.user_id, nextRevision, "owner_case_verification_updated", summaryJson, now),
      d1.prepare("INSERT INTO buying_browser_case_audit_events (id, workspace_user_id, case_id, actor_user_id, action, old_value_json, new_value_json, evidence_note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(auditId, row.user_id, caseId, owner.id, "owner_case_verification_updated", JSON.stringify(applied.oldValue), JSON.stringify(applied.newValue), applied.evidenceNote, now),
    ]);
  } catch (error) {
    const latest = await d1.prepare("SELECT state_json, revision, updated_at FROM buying_browser_workspaces WHERE user_id = ? LIMIT 1")
      .bind(row.user_id)
      .first<WorkspaceRow>();
    if (latest && latest.revision !== row.revision) {
      throw workspaceConflict({ state: validateAndOwnBuyingBrowserState(JSON.parse(latest.state_json), row.user_id) as BuyingBrowserState, revision: latest.revision, updatedAt: latest.updated_at });
    }
    throw error;
  }

  const auditEvent: OwnerCaseAuditEvent = {
    id: auditId,
    workspaceUserId: row.user_id,
    caseId,
    actorUserId: owner.id,
    action: "owner_case_verification_updated",
    oldValue: applied.oldValue,
    newValue: applied.newValue,
    evidenceNote: applied.evidenceNote,
    createdAt: now,
  };
  return {
    workspaceUserId: row.user_id,
    customerEmail: row.email,
    customerDisplayName: row.display_name,
    workspaceRevision: nextRevision,
    workspaceUpdatedAt: now,
    vehicleCase: applied.caseRecord,
    quotationReadiness: applied.quotationReadiness as QuotationReadiness,
    auditEvents: [auditEvent],
  };
}
