import { getChatGPTUser, isOwnerUser } from "../../../../chatgpt-auth";
import {
  controlConnectorProfile,
  createConnectorProfile,
  readConnectorProfiles,
  unavailableConnectorProfiles,
} from "../../../../buying-browser/connector-profiles";

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

function connectorError(error: unknown) {
  const message = error instanceof Error ? error.message : "connector_profiles_request_failed";
  if (message === "connector_profiles_unavailable") return json(unavailableConnectorProfiles(), 503);
  if (/^(invalid_|duplicate_|credential_)/.test(message)) return json({ error: message }, 400);
  return json({ error: "connector_profiles_request_failed" }, 500);
}

export async function GET() {
  const identity = await ownerIdentity();
  if ("error" in identity) return identity.error;
  try {
    return json(await readConnectorProfiles());
  } catch (error) {
    return connectorError(error);
  }
}

export async function PUT(request: Request) {
  const identity = await ownerIdentity();
  if ("error" in identity) return identity.error;
  try {
    return json(await createConnectorProfile(await request.json()), 201);
  } catch (error) {
    return connectorError(error);
  }
}

export async function POST(request: Request) {
  const identity = await ownerIdentity();
  if ("error" in identity) return identity.error;
  try {
    return json(await controlConnectorProfile(await request.json()));
  } catch (error) {
    return connectorError(error);
  }
}
