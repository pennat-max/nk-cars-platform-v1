# NK Cars Disaster Recovery Policy

Status: Operational recovery policy
Scope: NK Cars Buying Browser / platform repository and connected production services

## 1. Recovery objective

The project must be recoverable even if the primary development computer is completely lost, damaged, stolen, or reinstalled.

Target recovery principle:

**New computer -> GitHub clone -> restore configuration/secrets -> restore external data/services -> install dependencies -> run tests/build -> resume development/operations.**

No critical project knowledge should exist only on one developer machine.

## 2. What GitHub is the source of truth for

GitHub should preserve all durable project artifacts that are safe to commit:

- application source code
- domain/business logic
- platform/browser adapters
- UI source
- tests
- database migrations/schema definitions
- architecture documents
- product specifications
- `AGENTS.md`
- `docs/CURRENT_V1.md`
- runbooks and recovery documentation
- non-secret configuration templates
- dependency lockfiles
- rollback branches/tags/commits

Stable milestones must be committed and pushed. Work that exists only in a local working tree is not considered backed up.

## 3. What must NOT rely on GitHub

Secrets and mutable production data require separate protection.

Do not commit real values for:

- API keys
- passwords
- OAuth/client secrets
- service-role keys
- signing certificates/private keys
- Facebook/session cookies or browser profiles
- OTP/MFA recovery material
- production database dumps containing sensitive customer/business data
- `.env` files with real credentials

Current `.gitignore` intentionally excludes `.env*`, local connector/browser profiles, build output and preview/runtime folders.

## 4. Recovery classes

### Class A - Source code / project knowledge

Recovery source: GitHub.

Expected recoverability: Very high once committed and pushed.

### Class B - Secrets / credentials

Recovery source: approved secret manager/provider dashboards and controlled recovery records.

Examples:

- Supabase project keys
- OpenAI/API provider keys
- Vercel/runtime secrets
- Facebook/source integration credentials where permitted
- signing credentials

Never depend on one local `.env` file as the only copy.

### Class C - Production database

Recovery source: managed database backup / point-in-time recovery / scheduled encrypted exports as supported by the production provider.

Git migrations recreate structure; they do not recreate live customer/order/case records.

### Class D - Uploaded media/documents

Recovery source: storage provider backup/versioning/replication policy.

Do not assume GitHub stores customer vehicle photos, inspection media, documents or production uploads unless they were intentionally committed as safe static assets.

### Class E - Browser/source sessions

Recovery source: re-authentication by the authorized customer/user.

Facebook/session cookies and isolated browser profiles are disposable credentials, not authoritative business data. If lost, the safe recovery procedure is to sign in again. Do not build disaster recovery around copying passwords or bypassing MFA.

## 5. Required repository policy

- Push every stable tested milestone to GitHub.
- Preserve important rollback commits/branches before major architecture changes.
- Never force-rewrite important shared history without explicit Owner approval.
- Never commit secrets.
- Keep `.env.example` current whenever a new required environment variable is introduced.
- Keep recovery docs current after material infrastructure changes.
- Database schema changes must be represented by migrations or equivalent reproducible code.
- Production-specific manual configuration must be documented in a runbook.

## 6. Backup policy for connected services

Before production activation, each external production service must have an explicit recovery path documented.

Minimum requirements:

### Database
- automated managed backup enabled where available
- retention period documented
- point-in-time recovery enabled where commercially appropriate
- periodic restore test

### Object/file storage
- versioning/backup or secondary copy where available
- retention policy documented
- access policy reproducible

### Runtime/deployment
- source deployable again from GitHub
- environment-variable inventory documented
- domain/DNS ownership documented
- deployment project/account ownership documented

### Secrets
- authoritative location documented without putting secret values in Git
- account recovery/MFA recovery process known to Owner

## 7. Recovery time priorities

Priority 1:
- repository access
- current production branch/commit
- environment configuration
- production database

Priority 2:
- uploaded documents/media
- external integrations
- notification/messaging channels

Priority 3:
- disposable local previews
- browser login sessions
- generated build caches

## 8. Machine loss procedure

If the development computer is lost:

1. Do not attempt to recover Facebook/browser passwords from source control; re-authenticate later.
2. Secure the lost device/account if theft is suspected; revoke exposed sessions where appropriate.
3. Obtain a replacement development machine.
4. Install Git and required runtime/toolchain.
5. Clone `pennat-max/nk-cars-platform-v1` from GitHub.
6. Checkout the approved active branch/commit.
7. Copy `.env.example` to the required local env file and obtain real values from the authorized secret sources.
8. Restore/verify production database and storage connections if applicable.
9. Install dependencies from the lockfile.
10. Run typecheck/tests/build before resuming work.
11. Re-authenticate browser/source profiles manually where required.
12. Record any missing configuration discovered during recovery so the runbook can be improved.

See `docs/RECOVERY_CHECKLIST.md` for the short operational checklist.

## 9. Restore testing

A backup that has never been restored is not considered fully proven.

Before production launch and after major infrastructure changes, perform a recovery rehearsal in a non-production environment:

- fresh clone
- fresh dependency install
- environment setup from documented inventory
- database/schema setup
- test data or approved backup restore
- build/test
- launch application

Document failures and fix the recovery process.

## 10. Current known limitations

At the current V1 stage:

- source code and project documentation are protected when pushed to GitHub;
- local browser/source sessions are intentionally not backed up in Git;
- production Auth/database/RLS and durable production storage are not yet fully activated;
- therefore full production disaster recovery cannot be declared complete until the real production services and their backup policies are configured.

## 11. Owner approval gates

Owner approval is required before:

- destructive production restore over existing data
- changing backup retention in a way that reduces protection
- deleting historical backups or important rollback branches
- rotating/revoking production credentials when it may interrupt service
- restoring production to an older point that may discard newer transactions

Routine non-production recovery testing may proceed without repeated approval when it does not affect live data.