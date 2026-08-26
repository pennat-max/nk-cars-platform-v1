import { getChatGPTUser } from "../../../../chatgpt-auth";
import { acceptCustomerCaseQuotation, type WorkspaceRecord } from "../../../../buying-browser/workspace-store";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "authentication_required" }, 401);
  let payload: { caseId?: unknown; quotationNumber?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  try {
    return json(await acceptCustomerCaseQuotation(user, String(payload.caseId || ""), String(payload.quotationNumber || "")));
  } catch (error) {
    if (error instanceof Error && error.message === "workspace_revision_conflict") {
      const current = (error as Error & { current?: WorkspaceRecord }).current;
      return json({ error: error.message, revision: current?.revision ?? null }, 409);
    }
    if (error instanceof Error && ["workspace_not_found", "case_not_found", "quotation_not_found"].includes(error.message)) return json({ error: error.message }, 404);
    if (error instanceof Error && /^(invalid_|quotation_expired|quotation_superseded|quotation_material_changed|quotation_not_accepting)/.test(error.message)) return json({ error: error.message }, 400);
    return json({ error: "quotation_acceptance_failed" }, 500);
  }
}
