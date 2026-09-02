# JAKLAEN AI Development Office — Phase 1

This directory contains reviewable, version-controlled governance for the five-worker NK Cars development office.

- `../docs/ai-office/`: authoritative Owner-provided briefs imported from commits `a05656c` and `d9b75f6`
- `profiles/`: least-privilege Agent Profile definitions
- `agent-registry.json`: role, status, credential access, and write boundaries
- `WORKFLOW.md`: intake, dispatch, QA, Security, and Owner approval flow
- `task-cards/`: durable task evidence
- `AUDIT_LOG.jsonl`: append-only Phase 1 activity record

The five local Hermes profiles exist under the Hermes profile home. Each has a blank `.env` scaffold with zero non-comment lines, no copied credentials, a stopped gateway, and zero default-enabled toolsets. Hermes reference skill files remain present but cannot act without a coordinator-granted task-scoped toolset. Runtime launches must use isolated worktrees and be recorded in the Audit Log. See `evidence/local-profile-lockdown.json`.

Nothing in this directory authorizes Merge, Production deployment, real migrations, real data writes, external contact, or credential changes.

## Validate

This is a **pre-commit/index validator**. Stage the intended Phase 1 files first; it validates the Git index rather than the mutable working tree. Command results in `evidence/phase1-verification.json` are Coordinator-recorded attestations backed by this session's tool output, not cryptographic CI attestations.

```bash
git add HANDOVER.md docs/ai-office ai-office scripts/validate-ai-office.mjs
node scripts/validate-ai-office.mjs
```

Phase 1 ends at Owner review. Phase 2 is prohibited until the Owner explicitly approves it.
