# AI Development Office Workflow

## Authority
Owner → Jaklaen Coordinator → Product → Frontend/Backend → QA → Security → Coordinator → Owner Approval.

No worker can merge `main`, deploy Production, apply a real migration, modify real data, contact an external party, or reveal/change credentials.

## Required states
`INTAKE → PLANNING → IN_PROGRESS → QA_SECURITY_REVIEW → PREVIEW_READY → OWNER_APPROVAL → DONE`

Use `BLOCKED` for missing information/permission, a new failed build/test, or unresolved risk. A failure explicitly accepted by the Owner as a pre-existing baseline defect is recorded as `BASELINE_DEFECT_ACCEPTED` and does not block an unrelated documentation/governance-only task.

## Intake and dispatch
1. Coordinator creates a Task ID and Task Card.
2. Product AI converts the Owner request into acceptance criteria, assumptions, and blockers.
3. Coordinator freezes scope for the development pass.
4. Frontend and/or Backend AI receives an isolated task branch/worktree and only task-relevant context.
5. Development returns changed files, tests, result, and risks.
6. QA AI runs acceptance and regression checks independently.
7. Security AI reviews diff, dependencies, permissions, secrets, and logs independently.
8. Coordinator verifies evidence and opens/updates a Draft PR.
9. Owner alone approves or rejects Merge/Production/real migration/credential expansion.

## QA gate
Required for code changes: targeted tests, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and full `npm test` with pre-existing failures recorded separately.

Owner-accepted baseline defect: `tests/marketplace-connector.test.mjs` expects `imported` while the current fail-closed result is `partial`; 78/79 pass on both base and Draft PR #2. Record this as `BASELINE_DEFECT_ACCEPTED`. Do not edit this test to hide the failure.

## Security gate
- scan added lines for hard-coded secrets and dangerous execution
- inspect dependency and lockfile changes
- check auth/authz, validation, logging, PII, and least privilege
- verify `.env*`, cookies, profiles, tokens, and session files are absent from the diff
- unresolved Critical/High findings issue `SECURITY BLOCK`

## Reporting
Every worker returns only: result, evidence, blocker, next action, and approval required. The Coordinator owns the Owner-facing summary and audit entry.

## GitHub-first completion gate

Before any task or Phase can be called complete, Jaklaen must:

1. Post the project-level result and status in GitHub Issue #1.
2. Post implementation details and verification evidence in that Phase's Draft PR.
3. State Branch, Commit, changed files, Test/Build, Security findings, remaining blockers, and Owner approvals required.
4. Attach or link Preview screenshots and other review evidence.
5. Read both GitHub records back and verify their durable URLs/content.

After reporting, the state is `WAITING_OWNER_APPROVAL`. Do not Merge, Deploy, or start the next Phase until the Owner explicitly approves it.
