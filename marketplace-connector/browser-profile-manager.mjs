import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const PROFILE_STATES = new Set(["ready", "login_required", "paused", "error"]);

function profileId(value) {
  const id = typeof value === "string" ? value.trim() : "";
  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/i.test(id)) throw new Error("invalid_profile_id");
  return id;
}

function safeMessage(error) {
  const message = error instanceof Error ? error.message : String(error || "browser_error");
  return /^[a-z0-9_:-]{1,100}$/i.test(message) ? message : "browser_error";
}

export class BrowserProfileManager {
  constructor({ profiles, browserType = chromium, logger = console } = {}) {
    if (!Array.isArray(profiles) || profiles.length === 0) throw new Error("browser_profile_required");
    this.browserType = browserType;
    this.logger = logger;
    this.profiles = new Map();

    for (const profile of profiles) {
      const id = profileId(profile.id);
      if (this.profiles.has(id)) throw new Error("duplicate_profile_id");
      this.profiles.set(id, {
        id,
        label: typeof profile.label === "string" ? profile.label.trim().slice(0, 100) : id,
        directory: path.resolve(profile.directory),
        channel: profile.channel || "chrome",
        headless: profile.headless !== false,
        navigationTimeoutMs: profile.navigationTimeoutMs || 45_000,
        state: PROFILE_STATES.has(profile.initialState) ? profile.initialState : "login_required",
        stateReason: "session_not_checked",
        checkedAt: undefined,
        contextPromise: null,
        operationTail: Promise.resolve(),
      });
    }
  }

  listProfiles() {
    return [...this.profiles.values()].map((profile) => this.#publicStatus(profile));
  }

  getStatus(id) {
    const profile = this.#get(id);
    return this.#publicStatus(profile);
  }

  setState(id, state, reason = "operator_update") {
    if (!PROFILE_STATES.has(state)) throw new Error("invalid_profile_state");
    const profile = this.#get(id);
    profile.state = state;
    profile.stateReason = safeMessage(reason);
    profile.checkedAt = Date.now();
    return this.#publicStatus(profile);
  }

  async checkSession(id) {
    const profile = this.#get(id);
    if (profile.state === "paused") return this.#publicStatus(profile);
    try {
      const context = await this.#context(profile);
      const authenticated = await this.#hasFacebookSession(context);
      this.#mark(profile, authenticated ? "ready" : "login_required", authenticated ? "session_ready" : "facebook_session_missing");
    } catch (error) {
      this.#mark(profile, "error", safeMessage(error));
    }
    return this.#publicStatus(profile);
  }

  async withPage(id, operation, options = {}) {
    const profile = this.#get(id);
    if (profile.state === "paused") throw new Error("profile_paused");
    const run = profile.operationTail.then(
      () => this.#withPageUnlocked(profile, operation, options),
      () => this.#withPageUnlocked(profile, operation, options),
    );
    profile.operationTail = run.then(() => undefined, () => undefined);
    return run;
  }

  async closeProfile(id) {
    const profile = this.#get(id);
    const context = profile.contextPromise ? await profile.contextPromise.catch(() => null) : null;
    profile.contextPromise = null;
    if (context) await context.close().catch(() => undefined);
  }

  async closeAll() {
    await Promise.all([...this.profiles.keys()].map((id) => this.closeProfile(id)));
  }

  async openInteractiveLogin(id) {
    const profile = this.#get(id);
    await this.closeProfile(id);
    await fs.mkdir(profile.directory, { recursive: true });
    const context = await this.browserType.launchPersistentContext(profile.directory, {
      channel: profile.channel,
      headless: false,
      viewport: { width: 1280, height: 900 },
      locale: "th-TH",
      timezoneId: "Asia/Bangkok",
      acceptDownloads: false,
    });
    context.setDefaultNavigationTimeout(profile.navigationTimeoutMs);
    context.setDefaultTimeout(15_000);
    const page = context.pages()[0] || await context.newPage();
    await page.goto("https://www.facebook.com/marketplace/", {
      waitUntil: "domcontentloaded",
      timeout: profile.navigationTimeoutMs,
    });
    return {
      context,
      waitForSession: async (timeoutMs = 10 * 60_000) => {
        const started = Date.now();
        while (Date.now() - started < timeoutMs) {
          if (await this.#hasFacebookSession(context)) {
            this.#mark(profile, "ready", "manual_login_completed");
            return this.#publicStatus(profile);
          }
          await page.waitForTimeout(1_000);
        }
        this.#mark(profile, "login_required", "manual_login_timeout");
        throw new Error("manual_login_timeout");
      },
    };
  }

  #get(id) {
    const profile = this.profiles.get(profileId(id));
    if (!profile) throw new Error("profile_not_found");
    return profile;
  }

  async #context(profile) {
    if (!profile.contextPromise) {
      profile.contextPromise = (async () => {
        await fs.mkdir(profile.directory, { recursive: true });
        const context = await this.browserType.launchPersistentContext(profile.directory, {
          channel: profile.channel,
          headless: profile.headless,
          viewport: { width: 1365, height: 1000 },
          locale: "th-TH",
          timezoneId: "Asia/Bangkok",
          acceptDownloads: false,
        });
        context.setDefaultNavigationTimeout(profile.navigationTimeoutMs);
        context.setDefaultTimeout(15_000);
        context.on("close", () => {
          profile.contextPromise = null;
        });
        return context;
      })().catch((error) => {
        profile.contextPromise = null;
        throw new Error(safeMessage(error) === "browser_error" ? "browser_launch_failed" : safeMessage(error));
      });
    }
    return profile.contextPromise;
  }

  async #withPageUnlocked(profile, operation, options) {
    const context = await this.#context(profile);
    if (options.requireAuthenticated !== false && !(await this.#hasFacebookSession(context))) {
      this.#mark(profile, "login_required", "facebook_session_missing");
      throw new Error("facebook_login_required");
    }

    const page = await context.newPage();
    try {
      const result = await operation(page, { signal: options.signal });
      if (result?.state === "login_required") {
        this.#mark(profile, "login_required", "facebook_verification_required");
        throw new Error("facebook_login_required");
      }
      this.#mark(profile, "ready", "session_ready");
      return result;
    } catch (error) {
      if (safeMessage(error) === "facebook_login_required") {
        this.#mark(profile, "login_required", "facebook_verification_required");
      }
      throw error;
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  async #hasFacebookSession(context) {
    const cookies = await context.cookies(["https://www.facebook.com/"]);
    const names = new Set(cookies.map((cookie) => cookie.name));
    return names.has("c_user") && names.has("xs");
  }

  #mark(profile, state, reason) {
    profile.state = state;
    profile.stateReason = safeMessage(reason);
    profile.checkedAt = Date.now();
  }

  #publicStatus(profile) {
    return {
      profile_id: profile.id,
      label: profile.label,
      state: profile.state,
      reason: profile.stateReason,
      checked_at: iso(profile.checkedAt),
    };
  }
}

function iso(value) {
  return value ? new Date(value).toISOString() : undefined;
}
