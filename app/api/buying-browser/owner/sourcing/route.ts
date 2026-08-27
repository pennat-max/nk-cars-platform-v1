import { getChatGPTUser, isOwnerUser } from "../../../../chatgpt-auth";
import { readQnapSourcingAutomation, saveQnapSourcingRule, sendQnapHermesCommand } from "../../../../buying-browser/qnap-sourcing";

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

function sourcingError(error: unknown) {
  const message = error instanceof Error ? error.message : "sourcing_request_failed";
  if (message === "sourcing_unavailable") return json({ error: "sourcing_control_unavailable" }, 503);
  if (message === "sourcing_revision_conflict") return json({ error: message }, 409);
  if (/^(invalid_|conflicting_)/.test(message)) return json({ error: message }, 400);
  return json({ error: "sourcing_request_failed" }, 500);
}

export async function GET() {
  const identity = await ownerIdentity();
  if ("error" in identity) return identity.error;
  try {
    return json(await readQnapSourcingAutomation(identity.user));
  } catch (error) {
    return sourcingError(error);
  }
}

export async function PUT(request: Request) {
  const identity = await ownerIdentity();
  if ("error" in identity) return identity.error;
  try {
    return json(await saveQnapSourcingRule(identity.user, await request.json()));
  } catch (error) {
    return sourcingError(error);
  }
}

export async function POST(request: Request) {
  const identity = await ownerIdentity();
  if ("error" in identity) return identity.error;
  try {
    return json(await sendQnapHermesCommand(identity.user, await request.json()));
  } catch (error) {
    return sourcingError(error);
  }
}
