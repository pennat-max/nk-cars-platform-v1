import crypto from "node:crypto";

const EXACT_PATHS = new Set([
  "/v1/public/listings",
  "/v1/admin/sourcing",
  "/v1/admin/sourcing/rules",
  "/v1/admin/sourcing/commands",
]);

const RULE_PATH = /^\/v1\/admin\/sourcing\/rules\/[0-9a-f-]{36}$/i;

export function allowedQnapIngressPath(pathname: string) {
  return EXACT_PATHS.has(pathname) || RULE_PATH.test(pathname);
}

export function qnapIngressAuthorized(authorization: string | null, configuredToken: string) {
  const supplied = authorization?.replace(/^Bearer\s+/i, "") || "";
  if (configuredToken.length < 32 || supplied.length !== configuredToken.length) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(configuredToken));
}

export function qnapPrivateDataOrigin() {
  const raw = String(process.env.NK_QNAP_DATA_API_URL || "").trim();
  try {
    const origin = new URL(raw);
    if (origin.protocol !== "http:" || origin.username || origin.password) return null;
    if (!new Set(["nk-cars-data", "127.0.0.1", "localhost"]).has(origin.hostname)) return null;
    return origin;
  } catch {
    return null;
  }
}
