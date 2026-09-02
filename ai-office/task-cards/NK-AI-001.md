# Task Card — NK-AI-001

- **Original Owner request:** Establish the five-role AI Development Office for NK Cars Platform V1 with least privilege.
- **Deliverable:** Version-controlled profiles, registry, workflow, task card, audit log, Phase 0 handover, and Draft PR.
- **Acceptance Criteria:**
  1. Five profiles exactly match the authoritative role document.
  2. Every role declares allowed and prohibited operations.
  3. No external credential or Production permission is granted.
  4. Workflow reaches Product → Development → QA/Security → Owner Approval.
  5. TypeScript, lint, build, and full test are actually run.
  6. Existing 78/79 baseline defect is reported, not hidden.
- **Repository:** `pennat-max/nk-cars-platform-v1`
- **Base Branch:** `codex/app`
- **Task Branch:** `coord/ai-development-team-readiness`
- **Assigned Workers:** Product AI, Frontend AI, Backend AI, QA AI, Security AI
- **Status:** `OWNER_APPROVAL`
- **Changed Files:** governance/configuration/documentation under `ai-office/`, `HANDOVER.md`, and `scripts/validate-ai-office.mjs`
- **Test/Build Evidence:** see `ai-office/evidence/phase1-verification.json`; all five Hermes profiles returned `READY` in safe one-shot checks but remain disabled for operational work pending runtime isolation; TypeScript PASS; lint PASS with 0 errors/13 existing warnings; build PASS; full test 78/79 with Owner-accepted baseline defect `BASELINE_DEFECT_ACCEPTED`
- **Preview URL:** not applicable; Phase 1 does not create the Phase 2 AI Office UI
- **Risks/Constraints:** Hermes toolsets do not enforce read-only filesystem access by themselves; coordinator-scoped context, isolated worktrees, no gateways, no copied secrets, and audit gates are required.
- **Owner Approval Required:** accept Phase 1 and authorize any Phase 2 work. Merge and Production remain prohibited.

## Workflow evidence
1. **Product AI:** authoritative documents translated into the six acceptance criteria above.
2. **Development:** Frontend AI and Backend AI profiles/branch boundaries created; no product runtime code changed.
3. **QA AI:** PASS — file presence, JSON/YAML syntax, registry/profile consistency, TypeScript, lint, build, and full-test evidence checked; one accepted baseline defect remains.
4. **Security AI:** PASS WITH LIMITATIONS for Phase 1 artifacts — least privilege recorded, no external credentials copied, staged-file heuristic secret scan PASS, and no Production capability added. All agents remain disabled for operational work until Coordinator isolation is enforced.
5. **Coordinator:** consolidates evidence in Draft PR and waits for Owner approval.
