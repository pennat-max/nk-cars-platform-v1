# Decision Log

This file records owner-approved project and infrastructure decisions that affect Codex work. It must not contain passwords, tokens, API keys, private keys, cookies, OAuth secrets, production `.env` contents, or customer-private data.

## 2026-08-27 - QNAP Infrastructure Ownership

Decision: This Codex chat owns QNAP and infrastructure work for NK Cars.

Authoritative repository:

- `pennat-max/nk-cars-platform-v1`

Dedicated branch:

- `codex/qnap-infrastructure`

Scope owned by this chat:

- QNAP
- Docker / Container Station
- Hermes
- PostgreSQL
- storage
- networking
- reverse proxy / tunnel
- deployment
- backup / recovery
- monitoring

Boundaries:

- Do not become the primary editor of NK Cars application, UI, or business logic.
- Do not modify another Codex agent's branch.
- Do not merge into `main` without Owner approval.
- If application changes are required for infrastructure, document the requirement first.
- Never store secrets in GitHub.

Routine before each infrastructure task:

1. Fetch or pull the latest GitHub state.
2. Read `docs/CURRENT_V1.md`.
3. Read this file.
4. Read the relevant infrastructure docs, especially `docs/QNAP_HANDOFF.md` when QNAP runtime is involved.
5. Treat GitHub as authoritative project memory; do not assume QNAP runtime state or chat history is newer.

Routine after each completed infrastructure milestone:

1. Update the relevant GitHub documentation.
2. Commit stable infrastructure/config-as-code changes.
3. Push to `codex/qnap-infrastructure`.
4. Report the commit SHA.
