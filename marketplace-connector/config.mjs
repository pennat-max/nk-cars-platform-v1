import os from "node:os";
import path from "node:path";

const SUPPORTED_CHANNELS = new Set([
  "chrome",
  "chrome-beta",
  "chrome-dev",
  "chrome-canary",
  "msedge",
  "msedge-beta",
  "msedge-dev",
  "msedge-canary",
]);

function parseBoolean(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return /^(1|true|yes|on)$/i.test(value);
}

function parseInteger(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

function parseCdpEndpoint(value) {
  if (!value?.trim()) return null;
  const url = new URL(value.trim());
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || url.username || url.password) {
    throw new Error("invalid_connector_cdp_endpoint");
  }
  return url.toString().replace(/\/$/, "");
}

export function defaultProfileDirectory(platform = process.platform, env = process.env) {
  if (platform === "win32") {
    return path.join(env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "NKCars", "MarketplaceConnector", "chrome-profile");
  }
  if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "NKCars", "MarketplaceConnector", "chrome-profile");
  }
  return path.join(env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share"), "nk-cars", "marketplace-connector", "chrome-profile");
}

export function loadBrowserConfig(env = process.env) {
  const channel = env.NK_CONNECTOR_BROWSER_CHANNEL?.trim() || "chrome";
  if (!SUPPORTED_CHANNELS.has(channel)) throw new Error("unsupported_browser_channel");

  return {
    channel,
    cdpEndpoint: parseCdpEndpoint(env.NK_CONNECTOR_CDP_ENDPOINT),
    profileDirectory: path.resolve(env.NK_CONNECTOR_PROFILE_DIR?.trim() || defaultProfileDirectory(process.platform, env)),
    headless: parseBoolean(env.NK_CONNECTOR_HEADLESS, true),
    navigationTimeoutMs: parseInteger(env.NK_CONNECTOR_NAVIGATION_TIMEOUT_MS, 45_000, 5_000, 90_000),
    operationTimeoutMs: parseInteger(env.NK_CONNECTOR_OPERATION_TIMEOUT_MS, 65_000, 10_000, 120_000),
  };
}

export function loadServerConfig(env = process.env) {
  const token = env.NK_CONNECTOR_TOKEN?.trim() || "";
  if (token.length < 32) throw new Error("connector_token_required");

  return {
    ...loadBrowserConfig(env),
    host: "127.0.0.1",
    port: parseInteger(env.NK_CONNECTOR_PORT, 4317, 1024, 65_535),
    token,
    requestsPerMinute: parseInteger(env.NK_CONNECTOR_REQUESTS_PER_MINUTE, 10, 1, 60),
  };
}
