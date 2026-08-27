const SIGN_IN_PATH = "/signin-with-chatgpt";
const SIGN_OUT_PATH = "/signout-with-chatgpt";
const CALLBACK_PATH = "/callback";
const QNAP_ID_PREFIX = "qnap:";
const ALLOWED_SOCIAL_PROVIDERS = new Set(["google", "apple"]);

export function identityProviderMode(env = process.env) {
  const configured = String(env.NK_IDENTITY_PROVIDER || "").trim().toLowerCase();
  if (["chatgpt", "qnap", "disabled"].includes(configured)) return configured;
  return env.VERCEL === "1" ? "disabled" : "chatgpt";
}

export function safeIdentityReturnPath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  let url;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local" || [SIGN_IN_PATH, SIGN_OUT_PATH, CALLBACK_PATH].includes(url.pathname)) return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}

export function configuredHttpsUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

export function identitySocialProviders(env = process.env) {
  const configured = String(env.NK_IDENTITY_SOCIAL_PROVIDERS || "");
  return [...new Set(configured.split(",").map((value) => value.trim().toLowerCase()).filter((value) => ALLOWED_SOCIAL_PROVIDERS.has(value)))];
}

/**
 * @param {"sign-in" | "sign-out"} kind
 * @param {string} returnTo
 * @param {Record<string, string | undefined>} env
 * @param {"google" | "apple" | null} provider
 */
export function identityGatewayRedirect(kind, returnTo, env = process.env, provider = null) {
  const configured = kind === "sign-in" ? env.NK_IDENTITY_SIGN_IN_URL : env.NK_IDENTITY_SIGN_OUT_URL;
  const gateway = configuredHttpsUrl(configured);
  const site = configuredHttpsUrl(env.NEXT_PUBLIC_SITE_URL);
  if (!gateway || !site || identityProviderMode(env) !== "qnap") return null;
  if (kind === "sign-in" && provider !== null) {
    if (!identitySocialProviders(env).includes(provider)) return null;
    gateway.searchParams.set("provider", provider);
  }
  gateway.searchParams.set("return_to", new URL(safeIdentityReturnPath(returnTo), site).href);
  return gateway;
}

export function cookieValue(cookieHeader, name) {
  if (!cookieHeader || !/^[A-Za-z0-9_-]{1,64}$/.test(name)) return null;
  for (const item of cookieHeader.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0 || item.slice(0, separator).trim() !== name) continue;
    const value = item.slice(separator + 1).trim();
    return value && value.length <= 4096 ? value : null;
  }
  return null;
}

export function parseQnapIdentity(value) {
  if (!value || typeof value !== "object" || value.authenticated !== true || !value.user || typeof value.user !== "object") return null;
  const user = value.user;
  const id = typeof user.id === "string" ? user.id.trim() : "";
  const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
  const displayName = typeof user.displayName === "string" ? user.displayName.trim() : "";
  if (!id || id.length > 200 || !/^[A-Za-z0-9._:@-]+$/.test(id)) return null;
  if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!displayName || displayName.length > 200) return null;
  const allowedRoles = new Set(["CUSTOMER", "STAFF", "OWNER"]);
  const roles = Array.isArray(user.roles) ? [...new Set(user.roles.filter((role) => typeof role === "string" && allowedRoles.has(role)))] : [];
  if (!roles.length) return null;
  return {
    id: `${QNAP_ID_PREFIX}${id}`,
    email,
    displayName,
    fullName: typeof user.fullName === "string" && user.fullName.trim() ? user.fullName.trim().slice(0, 200) : null,
    provider: "qnap",
    roles,
  };
}
