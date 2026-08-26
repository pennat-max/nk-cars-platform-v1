# NK Cars Recovery Checklist

Use this checklist when the primary development machine is lost, replaced, or rebuilt.

## Immediate safety

- [ ] If theft/compromise is possible, secure the lost device and revoke exposed sessions where appropriate.
- [ ] Confirm access to the GitHub account and `pennat-max/nk-cars-platform-v1`.
- [ ] Confirm the active approved branch/commit before rebuilding.

## New machine bootstrap

- [ ] Install Git.
- [ ] Install Node.js/runtime version required by the repository.
- [ ] Install any platform toolchain needed for the current target (for example WebView2/Android/iOS tooling when applicable).
- [ ] Clone the repository.
- [ ] Checkout the approved branch/commit.
- [ ] Install dependencies using the committed lockfile.

## Configuration restore

- [ ] Copy `.env.example` to the required local environment file.
- [ ] Obtain real secret values from authorized provider dashboards/secret storage.
- [ ] Do not paste secrets into Git-tracked files.
- [ ] Verify database project URL/key configuration.
- [ ] Verify AI/provider configuration.
- [ ] Verify deployment/runtime configuration if needed.
- [ ] Verify domain/DNS/deployment project ownership if restoring production.

## Data restore

- [ ] Confirm production database availability.
- [ ] If database restore is required, stop before destructive restore and obtain Owner approval.
- [ ] Verify migrations/schema version.
- [ ] Verify file/object storage and critical documents/media.
- [ ] Re-authenticate Facebook/source browser sessions manually rather than restoring plaintext passwords.

## Verification before work resumes

- [ ] Run typecheck.
- [ ] Run targeted tests.
- [ ] Run full relevant test suite.
- [ ] Run production build.
- [ ] Confirm no secrets appear in Git diff/status.
- [ ] Launch NK Cars locally/preview.
- [ ] Test core Buying Browser/Vehicle Case flow.
- [ ] Confirm source-adapter fallbacks still work.

## Recovery success criteria

Recovery is considered successful when:

- repository builds from a clean clone;
- required tests pass;
- documented configuration is sufficient to reconnect authorized services;
- production data/storage is intact or restored correctly;
- the Owner can access the application and critical Vehicle Case workflows;
- any lost browser sessions can be restored through normal login.

## After recovery

- [ ] Record anything that had to be guessed or rediscovered.
- [ ] Update `.env.example` if a required variable was missing.
- [ ] Update `docs/DISASTER_RECOVERY.md` if the real recovery differed from the documented process.
- [ ] Commit and push recovery-documentation improvements.
