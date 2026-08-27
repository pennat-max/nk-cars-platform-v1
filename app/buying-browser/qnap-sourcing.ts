import type { ChatGPTUser } from "../chatgpt-auth";
import {
  normalizeHermesCommand,
  normalizeSourcingRuleInput,
  parseSourcingAutomationSnapshot,
  type SourcingAutomationSnapshot,
} from "./sourcing-automation.ts";

const MAX_RESPONSE_BYTES = 750_000;

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

async function responseJson(response: Response) {
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_RESPONSE_BYTES) throw new Error("sourcing_response_too_large");
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("sourcing_response_too_large");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("invalid_sourcing_response");
  }
}

async function requestQnap(path: string, owner: ChatGPTUser, init: RequestInit = {}) {
  const config = configuration();
  if (!config) throw new Error("sourcing_unavailable");
  const endpoint = new URL(path, `${config.origin.href.replace(/\/$/, "")}/`);
  if (endpoint.origin !== config.origin.origin || !endpoint.pathname.startsWith("/v1/admin/sourcing")) throw new Error("invalid_sourcing_endpoint");
  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...init,
      headers: {
        authorization: `Bearer ${config.token}`,
        accept: "application/json",
        "content-type": "application/json",
        "x-nk-actor-id": owner.id,
        "x-nk-actor-email": owner.email,
        "x-nk-actor-roles": (owner.roles || []).join(","),
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(7_000),
    });
  } catch {
    throw new Error("sourcing_unavailable");
  }
  const payload = await responseJson(response);
  if (response.status === 409) throw new Error("sourcing_revision_conflict");
  if (!response.ok) {
    if (response.status >= 500) throw new Error("sourcing_unavailable");
    throw new Error(typeof payload?.error === "string" ? payload.error : "sourcing_request_failed");
  }
  return payload;
}

export async function readQnapSourcingAutomation(owner: ChatGPTUser): Promise<SourcingAutomationSnapshot> {
  return parseSourcingAutomationSnapshot(await requestQnap("/v1/admin/sourcing", owner));
}

export async function saveQnapSourcingRule(owner: ChatGPTUser, value: unknown): Promise<SourcingAutomationSnapshot> {
  const rule = normalizeSourcingRuleInput(value);
  const { id, expectedRevision, ...ruleValues } = rule;
  const path = id ? `/v1/admin/sourcing/rules/${encodeURIComponent(id)}` : "/v1/admin/sourcing/rules";
  const payload = await requestQnap(path, owner, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify({ rule: ruleValues, expectedRevision: expectedRevision ?? 0 }),
  });
  return parseSourcingAutomationSnapshot(payload);
}

export async function sendQnapHermesCommand(owner: ChatGPTUser, value: unknown): Promise<SourcingAutomationSnapshot> {
  const command = normalizeHermesCommand(value);
  const payload = await requestQnap("/v1/admin/sourcing/commands", owner, {
    method: "POST",
    body: JSON.stringify({ ...command, idempotencyKey: crypto.randomUUID() }),
  });
  return parseSourcingAutomationSnapshot(payload);
}

export const qnapSourcingTestHelpers = { responseJson };
