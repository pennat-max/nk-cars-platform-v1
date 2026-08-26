import { getChatGPTUser } from "../../../chatgpt-auth";
import { readWorkspace, writeWorkspace, type WorkspaceRecord } from "../../../buying-browser/workspace-store";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function safeConflict(error: unknown): WorkspaceRecord | null {
  if (!(error instanceof Error) || error.message !== "workspace_revision_conflict") return null;
  const current = (error as Error & { current?: WorkspaceRecord }).current;
  return current ?? null;
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "authentication_required" }, 401);
  try {
    return json(await readWorkspace(user));
  } catch (error) {
    if (error instanceof Error && error.message === "database_unavailable") return json({ error: "workspace_temporarily_unavailable" }, 503);
    return json({ error: "workspace_read_failed" }, 500);
  }
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "authentication_required" }, 401);
  let payload: { state?: unknown; expectedRevision?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!Number.isSafeInteger(payload.expectedRevision) || Number(payload.expectedRevision) < 0) return json({ error: "invalid_revision" }, 400);
  try {
    return json(await writeWorkspace(user, payload.state, Number(payload.expectedRevision)));
  } catch (error) {
    const current = safeConflict(error);
    if (current) return json({ error: "workspace_revision_conflict", ...current }, 409);
    if (error instanceof Error && error.message === "database_unavailable") return json({ error: "workspace_temporarily_unavailable" }, 503);
    if (error instanceof Error && /^(invalid_|internal_field_not_allowed|text_too_long|workspace_state_too_large)/.test(error.message)) return json({ error: error.message }, 400);
    return json({ error: "workspace_write_failed" }, 500);
  }
}
