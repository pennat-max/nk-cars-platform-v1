# Phase 2 Evidence — AI Office V1 Preview

- Branch: `coord/ai-office-v1-preview`
- Base: Phase 1 HEAD `a29855bb125fbb98192a51a48a2f19b5d7817bd0`
- Route: `/buy/owner-preview/ai-office`
- Data: Mock/Test only
- Worker runtime: not enabled

## TDD

- RED: `npm run build && node --test tests/ai-office-preview.test.mjs`
  - Result: FAIL 0/2; expected 404 because route did not exist
- GREEN: same targeted command after implementation and Owner-auth boundary tests
  - Result: PASS 4/4

## Mobile/interaction

- Viewport: 390×844
- Horizontal overflow: PASS (`scrollWidth 375 <= viewport 390`)
- Worker cards: 5
- Initial switches off: PASS
- External form action: false
- QA evidence section and every QA result are labelled `MOCK / PREVIEW` or `MOCK EVIDENCE`
- Thai task form local-state submit: PASS — status changed to `บันทึกร่างในหน้าจอนี้แล้ว — Preview เท่านั้น`
- Product AI Mock toggle false → true: PASS
- Browser viewport: 390×844 CSS pixels
- Captured full-page PNG: 375×3009 pixels (CSS-scale capture excludes the 15px browser scrollbar)
- Screenshot SHA-256: `ab07efd2e6617769f125853eaf3fdbdf03805293f9e80b9ecf0e6a3a67ae13d0`
- Screenshot: `evidence/ai-office-v1-mobile-390x844.png`

## Engineering checks

- `npx tsc --noEmit`: PASS
- `npm run lint`: PASS; 0 errors and 13 pre-existing `no-img-element` warnings after removing the new unused-import warning
- `npm run build`: PASS
- `npm test`: 82/83 PASS
- Accepted baseline defect remains: `tests/marketplace-connector.test.mjs` expected `imported`, actual `partial`

## Security

- New component contains no fetch/axios/WebSocket/EventSource/localStorage/sessionStorage or credential strings
- Toggle and task form update local React state only
- Approval action disabled
- No Worker activation, Tool/Credential change, API integration, migration, real data, external contact, Merge, or Production deploy

## Private Preview deployment attempt

- Owner authorized a Private Preview only; Merge and Production remained prohibited.
- Used isolated Vercel browser profile `jaklaen-vercel` and isolated CLI configuration; normal Chrome and normal Vercel profiles were not used.
- Vercel authentication: PASS.
- Attempted to create dedicated project `nk-cars-ai-office-private-preview` so SSO protection could be enabled before any deployment.
- Result: BLOCKED by Vercel account/team fair-use restriction: `Your Team exceeded our fair use limits and has been blocked.`
- No project, deployment, public URL, credential expansion, or Production action was created.
- Required next action: Owner resolves Vercel fair-use/account access or supplies an authorized unblocked Vercel team/account. Jaklaen must enable SSO protection before deploying.
