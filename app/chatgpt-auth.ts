import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { configuredHttpsUrl, cookieValue, identityGatewayRedirect as buildIdentityGatewayRedirect, identityProviderMode as resolveIdentityProviderMode, parseQnapIdentity, safeIdentityReturnPath as normalizeIdentityReturnPath } from "./identity-domain.mjs";

export type ChatGPTUser = {
  id: string;
  displayName: string;
  email: string;
  fullName: string | null;
  provider?: "chatgpt" | "qnap";
  roles?: Array<"CUSTOMER" | "STAFF" | "OWNER">;
};

const USER_ID_HEADER = "oai-authenticated-user-id";
const USER_EMAIL_HEADER = "oai-authenticated-user-email";
const USER_FULL_NAME_HEADER = "oai-authenticated-user-full-name";
const USER_FULL_NAME_ENCODING_HEADER = "oai-authenticated-user-full-name-encoding";
const PERCENT_ENCODED_UTF8 = "percent-encoded-utf-8";
const SIGN_IN_PATH = "/signin-with-chatgpt";
const SIGN_OUT_PATH = "/signout-with-chatgpt";
const QNAP_SESSION_PATH = "/v1/auth/session";

export function identityProviderMode(): "chatgpt" | "qnap" | "disabled" {
  return resolveIdentityProviderMode() as "chatgpt" | "qnap" | "disabled";
}

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  const mode = identityProviderMode();
  if (mode === "disabled") return null;
  if (mode === "qnap") return getQnapIdentity(requestHeaders);

  const id = requestHeaders.get(USER_ID_HEADER);
  const email = requestHeaders.get(USER_EMAIL_HEADER);
  if (!id || !email) return null;
  const encodedFullName = requestHeaders.get(USER_FULL_NAME_HEADER);
  const fullName = encodedFullName && requestHeaders.get(USER_FULL_NAME_ENCODING_HEADER) === PERCENT_ENCODED_UTF8 ? safeDecodeURIComponent(encodedFullName) : null;
  return { id, displayName: fullName ?? email, email, fullName, provider: "chatgpt", roles: [] };
}

export async function requireOwnerUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await requireChatGPTUser(returnTo);
  if (!isOwnerUser(user)) notFound();
  return user;
}

export function isOwnerUser(user: ChatGPTUser | null): user is ChatGPTUser {
  if (!user) return false;
  if (user.roles?.includes("OWNER")) return true;
  const ownerIds = new Set((process.env.NK_OWNER_ACCOUNT_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  return ownerIds.has(user.id);
}

export async function requireChatGPTUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect(identitySignInPath(returnTo) || "/buy/account");
}

export function chatGPTSignInPath(returnTo: string): string {
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(normalizeIdentityReturnPath(returnTo))}`;
}

export function chatGPTSignOutPath(returnTo = "/"): string {
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(normalizeIdentityReturnPath(returnTo))}`;
}

export function identitySignInPath(returnTo: string): string | null {
  const mode = identityProviderMode();
  if (mode === "chatgpt") return chatGPTSignInPath(returnTo);
  if (mode === "qnap" && configuredHttpsUrl(process.env.NK_IDENTITY_SIGN_IN_URL)) return `/api/buying-browser/auth/sign-in?return_to=${encodeURIComponent(normalizeIdentityReturnPath(returnTo))}`;
  return null;
}

export function identitySignOutPath(returnTo = "/"): string | null {
  const mode = identityProviderMode();
  if (mode === "chatgpt") return chatGPTSignOutPath(returnTo);
  if (mode === "qnap" && configuredHttpsUrl(process.env.NK_IDENTITY_SIGN_OUT_URL)) return `/api/buying-browser/auth/sign-out?return_to=${encodeURIComponent(normalizeIdentityReturnPath(returnTo))}`;
  return null;
}

export function identityGatewayRedirect(kind: "sign-in" | "sign-out", returnTo: string): URL | null {
  return buildIdentityGatewayRedirect(kind, returnTo);
}

export function safeIdentityReturnPath(value: string): string {
  return normalizeIdentityReturnPath(value);
}

function safeDecodeURIComponent(value: string): string | null {
  try { return decodeURIComponent(value); } catch { return null; }
}

async function getQnapIdentity(requestHeaders: Headers): Promise<ChatGPTUser | null> {
  const apiUrl = configuredHttpsUrl(process.env.NK_QNAP_DATA_API_URL);
  const internalToken = String(process.env.NK_INTERNAL_API_TOKEN || "").trim();
  const cookieName = String(process.env.NK_IDENTITY_SESSION_COOKIE || "nk_session").trim();
  const sessionToken = cookieValue(requestHeaders.get("cookie"), cookieName);
  if (!apiUrl || internalToken.length < 20 || !sessionToken) return null;
  try {
    const endpoint = new URL(QNAP_SESSION_PATH, `${apiUrl.href.replace(/\/$/, "")}/`);
    const response = await fetch(endpoint, {
      headers: { authorization: `Bearer ${internalToken}`, "x-nk-session-token": sessionToken, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return parseQnapIdentity(await response.json()) as ChatGPTUser | null;
  } catch {
    return null;
  }
}
