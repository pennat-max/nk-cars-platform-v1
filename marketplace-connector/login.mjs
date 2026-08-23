import { pathToFileURL } from "node:url";
import { BrowserProfileManager } from "./browser-profile-manager.mjs";
import { loadBrowserConfig } from "./config.mjs";

export async function runInteractiveLogin(env = process.env) {
  const config = loadBrowserConfig(env);
  const profileId = env.NK_CONNECTOR_PROFILE_ID?.trim() || "fb-buyer-01";
  const manager = new BrowserProfileManager({
    profiles: [{
      id: profileId,
      label: env.NK_CONNECTOR_PROFILE_LABEL?.trim() || "Facebook Buyer 01",
      directory: config.profileDirectory,
      channel: config.channel,
      headless: false,
      navigationTimeoutMs: config.navigationTimeoutMs,
    }],
  });

  console.log("Opening the dedicated NK Cars browser profile.");
  console.log("Sign in to Facebook manually, including any MFA or verification requested by Facebook.");
  console.log("NK Cars does not read or store your Facebook password.");
  const login = await manager.openInteractiveLogin(profileId);
  try {
    const status = await login.waitForSession();
    console.log(`Facebook session ready for profile ${status.profile_id}.`);
  } finally {
    await login.context.close().catch(() => undefined);
    await manager.closeAll();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runInteractiveLogin().catch((error) => {
    const code = error instanceof Error ? error.message : "manual_login_failed";
    console.error(`Facebook login setup did not complete: ${code}`);
    process.exitCode = 1;
  });
}
