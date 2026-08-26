import type { ChatGPTUser } from "../chatgpt-auth";
import type { BuyingBrowserState } from "./types";
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
