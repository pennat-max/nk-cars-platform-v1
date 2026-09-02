import { execFileSync } from "node:child_process";

const root = process.cwd();
const expected = [
  { file: "product-ai.json", id: "nk-product-ai", toolsets: ["safe"], credentialAccess: "none", forbidden: ["modify product code", "merge or deploy", "access production or secrets"] },
  { file: "frontend-ai.json", id: "nk-frontend-ai", toolsets: ["file", "coding", "terminal"], credentialAccess: "none", forbidden: ["push or merge main", "deploy production", "change environment variables or secrets"] },
  { file: "backend-ai.json", id: "nk-backend-ai", toolsets: ["file", "coding", "terminal"], credentialAccess: "none_until_owner_approved_test_bootstrap", forbidden: ["access production credentials", "apply production migrations or modify real data", "merge main or deploy production"] },
  { file: "qa-ai.json", id: "nk-qa-ai", toolsets: ["file", "terminal"], credentialAccess: "none", forbidden: ["merge or deploy", "weaken requirements to make tests pass", "use real customer data or secrets"] },
  { file: "security-ai.json", id: "nk-security-ai", toolsets: ["file", "terminal"], credentialAccess: "redacted_config_only", forbidden: ["create change reveal or revoke credentials", "modify firewall billing production access deployments or main"] },
];
const profileKeys = ["id", "display_name", "role", "hermes_profile", "status", "scope", "runtime_toolsets", "runtime_enforcement", "gateway", "credential_access", "external_git_policy", "filesystem_policy", "allowed_operations", "prohibited_operations", "required_output", "approval_gate"];
const registryKeys = ["schema_version", "project", "coordinator", "owner", "phase", "default_policy", "agents", "reserved_for_owner"];
const registryAgentKeys = ["id", "display_name", "profile", "status", "credential_access", "write_boundary"];
const auditKeys = ["event_id", "timestamp", "task_id", "actor", "action", "result", "approval"];
const evidenceKeys = ["schema_version", "generated_at", "attestation_type", "branch", "base", "source_commits", "draft_pr_2", "profile_ready_checks", "commands", "baseline_defect", "security"];

function fail(message) {
  console.error(`AI_OFFICE_VALIDATION_FAIL: ${message}`);
  process.exit(1);
}
function git(args, options = {}) {
  return execFileSync("git", args, { cwd: root, ...options });
}
function readIndex(rel) {
  try {
    return git(["show", `:${rel.replaceAll("\\", "/")}`], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  } catch {
    fail(`unable to read staged artifact ${rel}`);
  }
}
function readCommit(rel, ref = "HEAD") {
  try {
    return git(["show", `${ref}:${rel.replaceAll("\\", "/")}`], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  } catch {
    fail(`unable to read committed artifact ${ref}:${rel}`);
  }
}
function parseIndexJson(rel) {
  try {
    return JSON.parse(readIndex(rel));
  } catch {
    fail(`invalid staged JSON ${rel}`);
  }
}
function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function exactKeys(value, keys, label) {
  if (!isPlainObject(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) fail(`${label} keys mismatch`);
}
function nonEmptyString(value, label) {
  if (typeof value !== "string" || !value.trim()) fail(`${label} must be a non-empty string`);
}
function stringArray(value, label) {
  if (!Array.isArray(value) || !value.length || value.some((item) => typeof item !== "string" || !item.trim())) fail(`${label} must be a non-empty string array`);
}
function sameArray(a, b) {
  return Array.isArray(a) && a.length === b.length && a.every((value, index) => value === b[index]);
}
function assertCommit(ref, label) {
  try { git(["cat-file", "-e", `${ref}^{commit}`]); } catch { fail(`${label} does not resolve to a commit`); }
}

let staged;
try {
  staged = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
} catch {
  fail("unable to enumerate staged files");
}
if (!staged.length) fail("no staged files available for validation");

const profiles = new Map();
for (const spec of expected) {
  const rel = `ai-office/profiles/${spec.file}`;
  const profile = parseIndexJson(rel);
  exactKeys(profile, profileKeys, spec.file);
  for (const key of ["id", "display_name", "role", "hermes_profile", "status", "scope", "runtime_enforcement", "gateway", "credential_access", "external_git_policy", "filesystem_policy", "approval_gate"]) nonEmptyString(profile[key], `${spec.file}.${key}`);
  for (const key of ["runtime_toolsets", "allowed_operations", "prohibited_operations", "required_output"]) stringArray(profile[key], `${spec.file}.${key}`);
  if (profile.id !== spec.id || profile.hermes_profile !== spec.id) fail(`${spec.file} identity mismatch`);
  if (profile.status !== "disabled_pending_runtime_isolation") fail(`${spec.file} must remain operationally disabled`);
  if (profile.gateway !== "disabled") fail(`${spec.file} gateway must be disabled`);
  if (profile.external_git_policy !== "coordinator_only") fail(`${spec.file} external Git must be coordinator-only`);
  if (profile.credential_access !== spec.credentialAccess) fail(`${spec.file} credential_access is not least privilege`);
  if (!sameArray(profile.runtime_toolsets, spec.toolsets)) fail(`${spec.file} toolset mismatch`);
  const prohibitedText = profile.prohibited_operations.join(" ").toLowerCase();
  for (const marker of spec.forbidden) if (!prohibitedText.includes(marker)) fail(`${spec.file} missing boundary: ${marker}`);
  profiles.set(profile.id, { file: spec.file, profile });
}

const registry = parseIndexJson("ai-office/agent-registry.json");
exactKeys(registry, registryKeys, "registry");
for (const key of ["schema_version", "project", "coordinator", "owner", "phase", "default_policy"]) nonEmptyString(registry[key], `registry.${key}`);
if (!Array.isArray(registry.agents) || registry.agents.length !== 5) fail("registry must contain exactly five agents");
stringArray(registry.reserved_for_owner, "registry.reserved_for_owner");
const registryIds = new Set();
for (const agent of registry.agents) {
  exactKeys(agent, registryAgentKeys, `registry agent ${agent.id}`);
  for (const key of registryAgentKeys) nonEmptyString(agent[key], `registry agent.${key}`);
  if (registryIds.has(agent.id)) fail(`duplicate registry id ${agent.id}`);
  registryIds.add(agent.id);
  const entry = profiles.get(agent.id);
  if (!entry) fail(`registry references unknown agent ${agent.id}`);
  if (agent.profile !== `profiles/${entry.file}`) fail(`${agent.id} profile path mismatch`);
  if (agent.status !== entry.profile.status) fail(`${agent.id} status mismatch`);
  if (agent.credential_access !== entry.profile.credential_access) fail(`${agent.id} credential_access mismatch`);
}
for (const reserved of ["merge_main", "deploy_production", "apply_real_migration", "modify_real_data", "change_credentials_or_permissions", "external_contact"]) if (!registry.reserved_for_owner.includes(reserved)) fail(`registry missing Owner gate ${reserved}`);

const auditText = readIndex("ai-office/AUDIT_LOG.jsonl").trim();
const auditLines = auditText.split(/\r?\n/);
if (auditLines.length < 10) fail("audit log must cover intake through owner gate");
const eventIds = new Set();
let previousTime = 0;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/;
const allowedActors = new Set(["jaklaen-hermes", "nk-product-ai", "nk-frontend-ai", "nk-backend-ai", "nk-qa-ai", "nk-security-ai"]);
const allowedActions = new Set(["INTAKE", "REQUIREMENT", "DEVELOPMENT_REVIEW", "PROFILE_READY_CHECK", "ALL_PROFILE_READY_CHECKS", "QA_PASS_WITH_BASELINE_DEFECT", "SECURITY_PASS_WITH_LIMITATIONS", "READY_FOR_DRAFT_PR", "OWNER_GATE", "PROFILE_RUNTIME_LOCKDOWN"]);
const allowedApprovals = new Set(["owner_provided", "coordinator_review", "qa_security_required", "coordinator_verified", "pending_owner"]);
for (const [index, line] of auditLines.entries()) {
  let event;
  try { event = JSON.parse(line); } catch { fail("invalid audit JSONL"); }
  exactKeys(event, auditKeys, `audit event ${event.event_id}`);
  for (const key of auditKeys) nonEmptyString(event[key], `audit event.${key}`);
  const expectedEventId = `AUD-${String(index + 1).padStart(4, "0")}`;
  if (event.event_id !== expectedEventId) fail(`audit event sequence mismatch: expected ${expectedEventId}`);
  if (event.task_id !== "NK-AI-001") fail(`unexpected audit task ID ${event.task_id}`);
  if (!allowedActors.has(event.actor)) fail(`unexpected audit actor ${event.actor}`);
  if (!allowedActions.has(event.action)) fail(`unexpected audit action ${event.action}`);
  if (!allowedApprovals.has(event.approval)) fail(`unexpected audit approval ${event.approval}`);
  if (!timestampPattern.test(event.timestamp)) fail(`audit timestamp lacks explicit ISO offset ${event.event_id}`);
  const currentTime = Date.parse(event.timestamp);
  if (!Number.isFinite(currentTime) || currentTime <= previousTime) fail(`audit timestamps must be strictly increasing at ${event.event_id}`);
  previousTime = currentTime;
  if (eventIds.has(event.event_id)) fail(`duplicate audit event ${event.event_id}`);
  eventIds.add(event.event_id);
}

for (const rel of ["ai-office/WORKFLOW.md", "ai-office/task-cards/NK-AI-001.md", "ai-office/templates/TASK_CARD_TEMPLATE.md", "ai-office/evidence/phase1-verification.json", "ai-office/evidence/local-profile-lockdown.json"]) readIndex(rel);
for (const rel of ["docs/ai-office/JAKLAEN-AI-DEV-OFFICE-MASTER-BRIEF.md", "docs/ai-office/JAKLAEN-AI-STAFF-5-ROLES.md"]) readCommit(rel);
const workflow = readIndex("ai-office/WORKFLOW.md");
if (!workflow.includes("BASELINE_DEFECT_ACCEPTED")) fail("workflow must distinguish accepted baseline defects");

const evidence = parseIndexJson("ai-office/evidence/phase1-verification.json");
exactKeys(evidence, evidenceKeys, "evidence");
for (const key of ["schema_version", "generated_at", "attestation_type", "branch"]) nonEmptyString(evidence[key], `evidence.${key}`);
if (!timestampPattern.test(evidence.generated_at)) fail("evidence.generated_at must have explicit ISO offset");
if (evidence.attestation_type !== "coordinator_recorded_tool_output_non_cryptographic") fail("evidence attestation type mismatch");
exactKeys(evidence.base, ["branch", "commit"], "evidence.base");
exactKeys(evidence.draft_pr_2, ["branch", "commit", "comparison_only"], "evidence.draft_pr_2");
exactKeys(evidence.baseline_defect, ["status", "test", "expected", "actual", "reproduced_on", "owner_instruction"], "evidence.baseline_defect");
exactKeys(evidence.security, ["scope", "method", "result", "limitation"], "evidence.security");
for (const key of ["branch", "commit"]) nonEmptyString(evidence.base[key], `evidence.base.${key}`);
for (const key of ["branch", "commit"]) nonEmptyString(evidence.draft_pr_2[key], `evidence.draft_pr_2.${key}`);
if (typeof evidence.draft_pr_2.comparison_only !== "boolean") fail("evidence.draft_pr_2.comparison_only must be boolean");
stringArray(evidence.source_commits, "evidence.source_commits");
for (const key of ["status", "test", "expected", "actual", "owner_instruction"]) nonEmptyString(evidence.baseline_defect[key], `evidence.baseline_defect.${key}`);
stringArray(evidence.baseline_defect.reproduced_on, "evidence.baseline_defect.reproduced_on");
for (const key of ["scope", "method", "result", "limitation"]) nonEmptyString(evidence.security[key], `evidence.security.${key}`);
if (evidence.branch !== "coord/ai-development-team-readiness") fail("evidence branch mismatch");
const currentBranch = git(["branch", "--show-current"], { encoding: "utf8" }).trim();
if (currentBranch !== evidence.branch) fail(`current branch ${currentBranch} does not match evidence branch`);
if (evidence.base.branch !== "codex/app" || evidence.base.commit !== "f8a2630") fail("evidence base mismatch");
if (!sameArray(evidence.source_commits, ["a05656c64055b1537a643bcbb277cb37f2b2d214", "d9b75f659725164b7e485c0ab1b625ed4bf6c479"])) fail("evidence source commits mismatch");
if (evidence.draft_pr_2.branch !== "codex/jaklaen-owner-search-preview" || evidence.draft_pr_2.commit !== "fc4e52c" || evidence.draft_pr_2.comparison_only !== true) fail("evidence PR2 mismatch");
if (!Array.isArray(evidence.profile_ready_checks) || evidence.profile_ready_checks.length !== 5) fail("evidence profile checks incomplete");
const evidenceProfileIds = new Set();
for (const check of evidence.profile_ready_checks) {
  exactKeys(check, ["profile", "session_id", "result", "toolsets", "operational_status"], `profile ready check ${check.profile}`);
  for (const key of ["profile", "session_id", "result", "toolsets", "operational_status"]) nonEmptyString(check[key], `profile ready check.${key}`);
  if (!profiles.has(check.profile) || evidenceProfileIds.has(check.profile)) fail(`invalid or duplicate evidence profile ${check.profile}`);
  evidenceProfileIds.add(check.profile);
  if (check.result !== "READY" || check.toolsets !== "safe" || check.operational_status !== "disabled_pending_runtime_isolation") fail(`invalid readiness evidence ${check.profile}`);
}
if (!Array.isArray(evidence.commands) || evidence.commands.length < 6) fail("evidence commands incomplete");
for (const command of evidence.commands) {
  exactKeys(command, ["command", "exit_code", "result"], `evidence command ${command.command}`);
  nonEmptyString(command.command, "evidence command.command");
  nonEmptyString(command.result, "evidence command.result");
  if (!Number.isInteger(command.exit_code)) fail("evidence command.exit_code must be integer");
}
const commandMap = new Map(evidence.commands.map((command) => [command.command, command]));
if (commandMap.size !== evidence.commands.length) fail("evidence commands must be unique");
const requiredCommands = [
  ["node scripts/validate-ai-office.mjs", 0, "PASS_WITH_LIMITATIONS: 5 profiles, 5 registry agents, 11 audit events, 15 staged blobs scanned from Git index, HEURISTIC_PASS_STAGED_BLOBS, all profiles operationally disabled pending isolation"],
  ["npx tsc --noEmit", 0, "PASS"],
  ["npm run lint", 0, "PASS: 0 errors, 13 existing no-img-element warnings"],
  ["npm run build", 0, "PASS"],
  ["npm test", 1, "78/79 PASS; BASELINE_DEFECT_ACCEPTED in tests/marketplace-connector.test.mjs"],
  ["git diff --cached --check", 0, "PASS"],
];
for (const [name, exitCode, expectedResult] of requiredCommands) {
  const command = commandMap.get(name);
  if (!command || command.exit_code !== exitCode || command.result !== expectedResult) fail(`required command evidence mismatch: ${name}`);
}
if (evidence.baseline_defect.status !== "BASELINE_DEFECT_ACCEPTED") fail("baseline defect status mismatch");
if (evidence.baseline_defect.test !== "tests/marketplace-connector.test.mjs" || evidence.baseline_defect.expected !== "imported" || evidence.baseline_defect.actual !== "partial") fail("baseline defect detail mismatch");
if (!sameArray(evidence.baseline_defect.reproduced_on, ["codex/app@f8a2630", "codex/jaklaen-owner-search-preview@fc4e52c"])) fail("baseline reproduced_on mismatch");
if (evidence.baseline_defect.owner_instruction !== "Do not modify the test to hide the failure; propose a separate root-cause task.") fail("baseline Owner instruction mismatch");
if (evidence.security.result !== "PASS_WITH_LIMITATIONS") fail("security limitations must be preserved");
const lockdown = parseIndexJson("ai-office/evidence/local-profile-lockdown.json");
exactKeys(lockdown, ["generated_at", "scope", "profiles", "enforcement", "credential_statement", "limitations"], "local profile lockdown");
if (!timestampPattern.test(lockdown.generated_at)) fail("lockdown.generated_at must have explicit ISO offset");
for (const key of ["scope", "enforcement", "credential_statement", "limitations"]) nonEmptyString(lockdown[key], `lockdown.${key}`);
if (!Array.isArray(lockdown.profiles) || lockdown.profiles.length !== 5) fail("lockdown evidence must include five profiles");
const lockdownIds = new Set();
for (const profile of lockdown.profiles) {
  exactKeys(profile, ["id", "gateway", "enabled_default_toolsets", "env_scaffold_exists", "env_non_comment_lines", "bundled_skill_files", "operational_status"], `lockdown profile ${profile.id}`);
  if (!profiles.has(profile.id) || lockdownIds.has(profile.id)) fail(`invalid or duplicate lockdown profile ${profile.id}`);
  lockdownIds.add(profile.id);
  if (profile.gateway !== "stopped" || profile.enabled_default_toolsets !== 0 || profile.env_scaffold_exists !== true || profile.env_non_comment_lines !== 0 || !Number.isInteger(profile.bundled_skill_files) || profile.operational_status !== "disabled_pending_runtime_isolation") fail(`lockdown evidence mismatch for ${profile.id}`);
}
for (const ref of [evidence.base.commit, evidence.draft_pr_2.commit, ...evidence.source_commits]) assertCommit(ref, ref);
const sourceDocs = [
  [evidence.source_commits[0], "docs/ai-office/JAKLAEN-AI-DEV-OFFICE-MASTER-BRIEF.md"],
  [evidence.source_commits[1], "docs/ai-office/JAKLAEN-AI-STAFF-5-ROLES.md"],
];
for (const [sourceCommit, rel] of sourceDocs) {
  const sourceBlob = git(["rev-parse", `${sourceCommit}:${rel}`], { encoding: "utf8" }).trim();
  const currentBlob = git(["rev-parse", `HEAD:${rel}`], { encoding: "utf8" }).trim();
  if (sourceBlob !== currentBlob) fail(`authoritative source blob mismatch for ${rel}`);
}
const baseRemote = git(["rev-parse", "--short=7", "origin/codex/app"], { encoding: "utf8" }).trim();
const prRemote = git(["rev-parse", "--short=7", "origin/codex/jaklaen-owner-search-preview"], { encoding: "utf8" }).trim();
if (baseRemote !== evidence.base.commit) fail("origin/codex/app does not match evidence base");
if (prRemote !== evidence.draft_pr_2.commit) fail("origin PR2 branch does not match evidence commit");
try { git(["merge-base", "--is-ancestor", evidence.base.commit, evidence.draft_pr_2.commit]); } catch { fail("PR2 commit is not based on evidence base commit"); }
try { git(["merge-base", "--is-ancestor", evidence.base.commit, "HEAD"]); } catch { fail("current HEAD is not based on evidence base commit"); }

const sensitiveFilenamePatterns = [/(^|\/)\.env($|\.)/i, /(^|\/)(cookies?|sessions?)(\.|\/|$)/i, /\.(pem|key|p12|pfx)$/i, /id_rsa|id_ed25519/i];
const secretValuePatterns = [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bgh[opsu]_[A-Za-z0-9]{20,}\b/, /\bsk-[A-Za-z0-9_-]{20,}\b/, /\bAKIA[0-9A-Z]{16}\b/, /\bAIza[0-9A-Za-z_-]{30,}\b/, /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/, /Authorization:\s*Bearer\s+[A-Za-z0-9._-]{12,}/i, /(?:postgres|mysql|mongodb(?:\+srv)?):\/\/[^\s:@]+:[^\s@]+@/i, /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/];
for (const rel of staged) {
  const normalized = rel.replaceAll("\\", "/");
  if (sensitiveFilenamePatterns.some((pattern) => pattern.test(normalized))) fail(`sensitive filename staged: ${rel}`);
  let blob;
  try { blob = git(["show", `:${normalized}`], { encoding: "buffer", maxBuffer: 10 * 1024 * 1024 }); } catch { fail(`unable to read staged blob ${rel}`); }
  if (blob.includes(0)) fail(`unexpected binary staged file ${rel}`);
  const text = blob.toString("utf8");
  if (secretValuePatterns.some((pattern) => pattern.test(text))) fail(`possible secret value in staged blob ${rel}`);
}

console.log(JSON.stringify({ status: "PASS_WITH_LIMITATIONS", profiles: expected.length, registryAgents: registry.agents.length, auditEvents: auditLines.length, stagedFilesScanned: staged.length, workflow: "Product->Development->QA/Security->Owner Approval", secretValueScan: "HEURISTIC_PASS_STAGED_BLOBS", runtimeStatus: "ALL_PROFILES_DISABLED_PENDING_ISOLATION", evidenceCommits: "VERIFIED" }));
