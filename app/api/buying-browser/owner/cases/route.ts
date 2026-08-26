import { getChatGPTUser, isOwnerUser } from "../../../../chatgpt-auth";
import { issueOwnerCaseQuotation, listOwnerCases, writeOwnerCaseVerification, type WorkspaceRecord } from "../../../../buying-browser/workspace-store";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

async function ownerIdentity() {
  const user = await getChatGPTUser();
  if (!user) return { error: json({ error: "authentication_required" }, 401) } as const;
  if (!isOwnerUser(user)) return { error: json({ error: "owner_authorization_required" }, 403) } as const;
  return { user } as const;
}

export async function GET() {
  const identity = await ownerIdentity();
  if ("error" in identity) return identity.error;
  try {
    return json({ cases: await listOwnerCases(identity.user) });
  } catch (error) {
    if (error instanceof Error && error.message === "database_unavailable") return json({ error: "workspace_temporarily_unavailable" }, 503);
    return json({ error: "owner_case_queue_failed" }, 500);
  }
}

export async function PATCH(request: Request) {
  const identity = await ownerIdentity();
  if ("error" in identity) return identity.error;
  let payload: { workspaceUserId?: unknown; caseId?: unknown; expectedRevision?: unknown; verification?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  try {
    const updated = await writeOwnerCaseVerification(
      identity.user,
      String(payload.workspaceUserId || ""),
      String(payload.caseId || ""),
      payload.verification as Parameters<typeof writeOwnerCaseVerification>[3],
      Number(payload.expectedRevision),
    );
    return json({ case: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "workspace_revision_conflict") {
      const current = (error as Error & { current?: WorkspaceRecord }).current;
      return json({ error: "workspace_revision_conflict", revision: current?.revision ?? null }, 409);
    }
    if (error instanceof Error && error.message === "database_unavailable") return json({ error: "workspace_temporarily_unavailable" }, 503);
    if (error instanceof Error && error.message === "workspace_not_found") return json({ error: error.message }, 404);
    if (error instanceof Error && error.message === "case_not_found") return json({ error: error.message }, 404);
    if (error instanceof Error && /^(invalid_|owner_authorization_required)/.test(error.message)) return json({ error: error.message }, 400);
    return json({ error: "owner_case_update_failed" }, 500);
  }
}

export async function POST(request: Request) {
  const identity = await ownerIdentity();
  if ("error" in identity) return identity.error;
  let payload: { workspaceUserId?: unknown; caseId?: unknown; expectedRevision?: unknown; action?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (payload.action !== "issue_quotation") return json({ error: "invalid_owner_case_action" }, 400);
  try {
    const updated = await issueOwnerCaseQuotation(identity.user, String(payload.workspaceUserId || ""), String(payload.caseId || ""), Number(payload.expectedRevision));
    return json({ case: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "workspace_revision_conflict") {
      const current = (error as Error & { current?: WorkspaceRecord }).current;
      return json({ error: error.message, revision: current?.revision ?? null }, 409);
    }
    if (error instanceof Error && ["workspace_not_found", "case_not_found"].includes(error.message)) return json({ error: error.message }, 404);
    if (error instanceof Error && /^(invalid_|quotation_not_ready|quotation_request_required|owner_verification_required)/.test(error.message)) return json({ error: error.message }, 400);
    return json({ error: "quotation_issue_failed" }, 500);
  }
}
