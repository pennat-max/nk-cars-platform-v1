const MAX_RESPONSE_BYTES = 200_000;

export type ConnectorProfileStatus = {
  profile_id: string;
  label?: string;
  state: "ready" | "login_required" | "paused" | "error";
  reason?: string;
  checked_at?: string;
  action?: string;
};

export type ConnectorProfilesSnapshot = {
  connected: boolean;
  message: string;
  profiles: ConnectorProfileStatus[];
};

function configuration() {
  const rawUrl = String(process.env.NK_CONNECTOR_ADMIN_URL || "").trim();
  const token = String(process.env.NK_CONNECTOR_ADMIN_TOKEN || process.env.NK_CONNECTOR_TOKEN || "").trim();
  try {
    const origin = new URL(rawUrl);
    const isLocalHttp = origin.protocol === "http:" && ["127.0.0.1", "localhost"].includes(origin.hostname);
    if ((!isLocalHttp && origin.protocol !== "https:") || origin.username || origin.password || token.length < 32) return null;
    return { origin, token };
  } catch {
    return null;
  }
}

async function responseJson(response: Response) {
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_RESPONSE_BYTES) throw new Error("connector_response_too_large");
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("connector_response_too_large");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("invalid_connector_response");
  }
}

async function requestConnector(path: string, init: RequestInit = {}) {
  const config = configuration();
  if (!config) throw new Error("connector_profiles_unavailable");
  const endpoint = new URL(path, `${config.origin.href.replace(/\/$/, "")}/`);
  if (endpoint.origin !== config.origin.origin || !endpoint.pathname.startsWith("/v1/")) throw new Error("invalid_connector_endpoint");
  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...init,
      headers: {
        authorization: `Bearer ${config.token}`,
        accept: "application/json",
        "content-type": "application/json",
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(7_000),
    });
  } catch {
    throw new Error("connector_profiles_unavailable");
  }
  const payload = await responseJson(response);
  if (!response.ok) throw new Error(typeof payload?.safe_reason_code === "string" ? payload.safe_reason_code : "connector_request_failed");
  return payload;
}

function parseProfile(value: unknown): ConnectorProfileStatus {
  if (!value || typeof value !== "object") throw new Error("invalid_connector_profile");
  const profile = value as Record<string, unknown>;
  const id = typeof profile.profile_id === "string" ? profile.profile_id : "";
  const state = typeof profile.state === "string" ? profile.state : "";
  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/i.test(id)) throw new Error("invalid_connector_profile");
  if (!["ready", "login_required", "paused", "error"].includes(state)) throw new Error("invalid_connector_profile");
  return {
    profile_id: id,
    label: typeof profile.label === "string" ? profile.label : id,
    state: state as ConnectorProfileStatus["state"],
    reason: typeof profile.reason === "string" ? profile.reason : undefined,
    checked_at: typeof profile.checked_at === "string" ? profile.checked_at : undefined,
    action: typeof profile.action === "string" ? profile.action : undefined,
  };
}

export async function readConnectorProfiles(): Promise<ConnectorProfilesSnapshot> {
  const payload = await requestConnector("/v1/profiles");
  const profiles = Array.isArray(payload.profiles) ? payload.profiles.map(parseProfile) : [];
  return { connected: true, message: "Connector is reachable.", profiles };
}

export async function createConnectorProfile(value: unknown): Promise<ConnectorProfileStatus> {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const profileId = typeof input.profileId === "string" ? input.profileId.trim() : "";
  const label = typeof input.label === "string" ? input.label.trim() : profileId;
  return parseProfile(await requestConnector("/v1/profiles", {
    method: "POST",
    body: JSON.stringify({ profile_id: profileId, label }),
  }));
}

export async function controlConnectorProfile(value: unknown): Promise<ConnectorProfileStatus> {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const profileId = typeof input.profileId === "string" ? input.profileId.trim() : "";
  const action = typeof input.action === "string" ? input.action : "";
  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/i.test(profileId)) throw new Error("invalid_connector_profile");
  if (action === "check") {
    return parseProfile(await requestConnector(`/v1/profiles/${encodeURIComponent(profileId)}/check`, { method: "POST", body: "{}" }));
  }
  if (action === "open_login") {
    return parseProfile(await requestConnector(`/v1/profiles/${encodeURIComponent(profileId)}/login`, { method: "POST", body: JSON.stringify({ timeout_ms: 30 * 60_000 }) }));
  }
  if (action === "pause" || action === "login_required") {
    return parseProfile(await requestConnector(`/v1/profiles/${encodeURIComponent(profileId)}/state`, { method: "POST", body: JSON.stringify({ state: action }) }));
  }
  throw new Error("invalid_connector_profile_action");
}

export function unavailableConnectorProfiles(): ConnectorProfilesSnapshot {
  return { connected: false, message: "Local connector profile control is not configured.", profiles: [] };
}
