# QNAP Handoff - NK Cars Buying Browser Preview

อัปเดตล่าสุด: 2026-08-27 06:45 Asia/Bangkok

เอกสารนี้บันทึกเฉพาะงาน QNAP infrastructure สำหรับ `NK-Cars-Buying-Browser-V1-Preview` บน branch `codex/qnap-infrastructure` ห้ามใช้เป็นเอกสารยืนยันว่า production business logic หรือ production data ถูกย้ายแล้ว

> Integration note: QNAP currently runs the older application snapshot `f018cd5`. The infrastructure commit was imported into `codex/buying-browser-rebuild` after application commit `f3cbf7a`, but the current application build has not been deployed to QNAP. The temporary Quick Tunnel has no access control and must not carry real customer, seller, financial, or source data.

## 1. ขอบเขต

- ทำงานเฉพาะ infrastructure บน QNAP
- ไม่แก้ NK Cars production site
- ไม่แก้ application business logic
- ไม่ย้าย database จริง
- ไม่แตะ Hermes, n8n หรือ PostgreSQL เดิม
- ไม่เปิด port router
- ไม่ commit password, token, private key หรือ production secret

## 2. Source และ Commit

- Local project: `C:\Users\TONY\Documents\Codex\NK-Cars-Buying-Browser-V1-Preview`
- Branch สำหรับงานนี้: `codex/qnap-infrastructure`
- App source base commit ที่ deploy อยู่บน QNAP: `f018cd5`
- Deployed image tag: `tony-nk-cars-buying-browser:f018cd5`
- Git remote `origin`: `C:\Codex\NK-Cars`
- Git remote `sites-preview`: `https://git.chatgpt-team.site/.../appgprj_6a8b559387c48191be9a47db2fdb6468.git`

หมายเหตุ: เอกสารนี้จะถูก commit ใน branch infrastructure และ SHA ล่าสุดให้ดูจากรายงานส่งมอบหลัง push

## 3. QNAP Host

- Hostname: `NAS12EB48`
- LAN IP หลักที่ใช้ deploy: `192.168.0.132`
- OS: QNAP Linux `5.10.60-qnap`
- CPU architecture: `x86_64`
- Docker path: `/share/CACHEDEV6_DATA/.qpkg/container-station/bin/docker`
- Docker Compose: ผ่าน Container Station Docker plugin

## 4. Container Architecture

```text
Internet user
  -> Cloudflare Quick Tunnel temporary URL
  -> tony-nk-cars-quick-tunnel-v2
  -> network namespace ของ tony-nk-cars-buying-browser
  -> http://127.0.0.1:3000

LAN user
  -> http://192.168.0.132:4330
  -> tony-nk-cars-buying-browser:3000
```

Container ที่เกี่ยวข้อง:

| Container | Image | Status ล่าสุด | Purpose |
|---|---|---:|---|
| `tony-nk-cars-buying-browser` | `tony-nk-cars-buying-browser:f018cd5` | `healthy` | Web preview |
| `tony-nk-cars-quick-tunnel-v2` | `cloudflare/cloudflared:2026.8.2-amd64` | `running` | Temporary public tunnel |

Container เดิมที่ต้องไม่แตะ:

| Container | Status ล่าสุด | หมายเหตุ |
|---|---:|---|
| `hermes` | `running` | ไม่ถูก restart |
| `tony-n8n` | `healthy` | ไม่ถูก restart |
| `tony-n8n-postgres` | `healthy` | ไม่ถูก restart |
| `tony-web-starter` | `healthy` | ไม่ถูก restart |

## 5. Ports และ URLs

| Service | URL / Port | Scope |
|---|---|---|
| NK Cars Buying Browser | `http://192.168.0.132:4330/buy` | LAN-only host bind |
| NK Cars Buying Browser root | `http://192.168.0.132:4330/` | LAN-only host bind |
| Cloudflare Quick Tunnel | `https://bits-attributes-brussels-order.trycloudflare.com/buy` | Temporary public URL, no Access |
| n8n เดิม | `http://192.168.0.132:5678/` | Existing LAN service |
| web-starter เดิม | `http://192.168.0.132:4321/` | Existing LAN service |

ไม่มีการเปิด port router หรือ port forwarding ที่ router

## 6. Volumes และ Persistent Data

Web preview container ปัจจุบันไม่มี Docker mount/volume เฉพาะสำหรับ app data

Storage structure บน QNAP:

```text
/share/CACHEDEV6_DATA/nk-cars-buying-browser-preview/
  releases/
    f018cd5-20260826-233323/
      deploy/qnap/Dockerfile
      deploy/qnap/docker-compose.yml
      deploy/qnap/README-DEPLOY-TH.md
      app source snapshot
```

ข้อมูลในหน้า preview ส่วนใหญ่ยังเป็น demo/local browser state:

- demo vehicle seed อยู่ใน source code
- saved vehicles / cases ใน preview เก็บที่ browser `localStorage` ของผู้ใช้
- uploaded preview media อยู่ใน browser storage ของผู้ใช้
- ยังไม่มี server-side persistent database สำหรับ Vehicle Cases

## 7. PostgreSQL Connection Requirements

ยังไม่เชื่อม PostgreSQL สำหรับ NK Cars Buying Browser

หากจะเชื่อม production data ในอนาคต ต้องมี approval แยก และต้องกำหนดอย่างน้อย:

- Database host ภายใน LAN หรือ Docker network
- Database name แยกจาก production ที่มีอยู่
- Read-only user สำหรับช่วงแรก
- TLS requirement หากข้าม host/network
- Migration/RLS/audit plan
- Backup และ restore test ก่อนเปิดใช้งานจริง
- ห้ามใช้ database ของ `tony-n8n-postgres` ร่วมกับเว็บนี้โดยไม่อนุมัติ

หมายเหตุ: source code ปัจจุบันมี database helper สำหรับ Cloudflare D1 binding ชื่อ `DB` ไม่ใช่ PostgreSQL โดยตรง

## 8. Environment Variables

Container ที่รันบน QNAP มีเฉพาะ key พื้นฐาน:

- `NODE_ENV`
- `PORT`
- `TZ`
- `WRANGLER_LOG_PATH`
- Node image defaults เช่น `NODE_VERSION`, `YARN_VERSION`, `PATH`

ยังไม่มี production secrets หรือ data-source credentials:

- `OPENAI_API_KEY`: ไม่มีใน container
- `BROWSERLESS_TOKEN`: ไม่มีใน container
- `BROWSERLESS_PROFILE`: ไม่มีใน container
- `MARKETPLACE_CONNECTOR_URL`: ไม่มีใน container
- `MARKETPLACE_CONNECTOR_TOKEN`: ไม่มีใน container
- `DATABASE_URL`: ไม่มีใน container
- `SUPABASE_*`: ไม่มีใน container
- `GOOGLE_*`: ไม่มีใน container

## 9. API และ Tunnel Status

API ที่ตรวจแล้ว:

- `GET /buy`: 200 OK
- `GET /`: 200 OK
- `GET /api/marketplace-cloud/status`: ทำงาน แต่รายงานว่า provider ยังไม่ configured
- `POST /api/vehicle-extract`: ต้องใช้ `OPENAI_API_KEY`; เมื่อไม่มี key จะตอบ 503 ตามที่ออกแบบไว้

Tunnel:

- ประเภท: Cloudflare Quick Tunnel แบบ account-less
- Container: `tony-nk-cars-quick-tunnel-v2`
- Public URL: `https://bits-attributes-brussels-order.trycloudflare.com/buy`
- Access login: ไม่มี
- Production guarantee: ไม่มี
- ใครมี URL สามารถเปิดได้ จึงไม่ควรใส่ข้อมูลลับใน preview นี้

## 10. Tests ล่าสุด

คำสั่งตรวจจากเครื่อง Codex:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri 'https://bits-attributes-brussels-order.trycloudflare.com/buy' -TimeoutSec 45
```

ผล:

- `200 OK`
- พบข้อความ/HTML ของ NK Cars Buying Browser

คำสั่งตรวจจาก QNAP:

```bash
/share/CACHEDEV6_DATA/.qpkg/container-station/bin/docker ps --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}'
/share/CACHEDEV6_DATA/.qpkg/container-station/bin/docker stats --no-stream
curl -I -m 10 -s http://192.168.0.132:4330/buy
curl -I -m 10 -s http://192.168.0.132:4321/
curl -I -m 10 -s http://192.168.0.132:5678/
```

ผลล่าสุด:

- `tony-nk-cars-buying-browser`: healthy
- `tony-nk-cars-quick-tunnel-v2`: running
- `hermes`: running
- `tony-n8n`: healthy
- `tony-n8n-postgres`: healthy
- `tony-web-starter`: healthy
- `http://192.168.0.132:4330/buy`: 200 OK
- `http://192.168.0.132:4321/`: 200 OK
- `http://192.168.0.132:5678/`: 200 OK

Resource usage snapshot:

| Container | CPU | Memory |
|---|---:|---:|
| `tony-nk-cars-quick-tunnel-v2` | ~0.06% | ~15 MiB |
| `tony-nk-cars-buying-browser` | ~0.00% | ~151 MiB |
| `tony-web-starter` | ~0.00% | ~5 MiB |
| `tony-n8n` | ~0.47% | ~455 MiB |
| `hermes` | ~0.15% | ~413 MiB |
| `tony-n8n-postgres` | ~0.00% | ~164 MiB |

## 11. Backup / Restore Status

ปัจจุบันยังไม่มี server-side user data ของ NK Cars Buying Browser ให้ backup แยก เพราะยังเป็น preview/demo และ browser-local state

สิ่งที่มี:

- Source release snapshot บน QNAP ที่ `/share/CACHEDEV6_DATA/nk-cars-buying-browser-preview/releases/f018cd5-20260826-233323`
- Dockerfile และ Compose สำหรับสร้าง container ใหม่

สิ่งที่ยังต้องทำก่อน production:

- กำหนด persistent storage สำหรับ uploads/media/logs
- กำหนด database จริง
- ทำ backup script
- ทำ restore test ลง temporary database/storage
- กำหนด retention policy

## 12. Rollback

หยุดเฉพาะ public temporary tunnel:

```bash
/share/CACHEDEV6_DATA/.qpkg/container-station/bin/docker stop tony-nk-cars-quick-tunnel-v2
```

หยุดเฉพาะ web preview service:

```bash
cd /share/CACHEDEV6_DATA/nk-cars-buying-browser-preview/releases/f018cd5-20260826-233323/deploy/qnap
/share/CACHEDEV6_DATA/.qpkg/container-station/bin/docker compose down
```

ห้ามใช้ rollback command ใด ๆ ที่แตะ:

- `hermes`
- `tony-n8n`
- `tony-n8n-postgres`
- QNAP host reboot/shutdown
- RAID / Storage Pool / Volume / Firewall / Router

## 13. Blockers

- เว็บยังใช้ demo/local browser data ไม่ใช่ข้อมูลจริง
- ยังไม่เชื่อม Record 2026
- ยังไม่เชื่อม Supabase/PostgreSQL สำหรับ app data
- ยังไม่มี Auth/RLS/audit สำหรับ production users
- Quick Tunnel ไม่มี Access login และไม่มี uptime guarantee
- ไม่มี persistent server-side upload/media storage
- `OPENAI_API_KEY` ยังไม่ได้ตั้งใน web container จึงใช้ AI extraction จริงไม่ได้
- Marketplace connector ยังไม่ได้ configured

## 14. Approval Required ก่อนทำต่อ

ต้องขออนุมัติแยกก่อนทำรายการต่อไปนี้:

- เปลี่ยนจาก Quick Tunnel เป็น Cloudflare Named Tunnel + Access
- ใส่ production secrets หรือ API keys
- เชื่อม Google Sheet Record 2026
- เชื่อม Supabase/PostgreSQL
- สร้าง persistent volumes
- deploy production service ใหม่
- restart container เดิมที่ไม่ใช่ web preview/tunnel
- เปิดให้ลูกค้าจริงใช้งาน
- เขียน/แก้ไข database หรือ Google Sheets
- ลบข้อมูลหรือ restore ทับ production

## 15. Current Application Side-by-Side Release

The application branch now includes a side-by-side QNAP release definition:

- Compose: `deploy/qnap/docker-compose.current.yml`
- Deploy script: `deploy/qnap/deploy-current.sh`
- New container: `tony-nk-cars-current`
- New LAN port: `4331`
- Existing preview container and port `4330` remain unchanged for rollback.

The current build passed its production build and 52/52 application tests before packaging. Deployment still requires an authenticated QNAP admin or SSH session. This package does not silently copy ChatGPT authentication, D1 data, Google credentials, or production secrets.

### Deployed 2026-08-27

- Application commit: `736277a`
- Image: `tony-nk-cars-current:736277a`
- Container: `tony-nk-cars-current`
- Release directory: `/share/CACHEDEV6_DATA/nk-cars-buying-browser-current/releases/736277a-20260827-083905`
- LAN URL: `http://192.168.0.132:4331/buy`
- Temporary public URL: `https://modelling-explorer-student-further.trycloudflare.com/buy`
- Tunnel container: `tony-nk-cars-current-tunnel`
- Previous preview at port `4330` remains running and unchanged.

Verification:

- QNAP Docker build passed.
- Container health check passed.
- LAN `/buy`: HTTP 200.
- Temporary public `/buy`: HTTP 200.
- Mobile viewport 390 x 844 rendered Browse and Vehicle Detail without horizontal overflow or console errors.
- Vehicle Detail loaded 12 image elements and retained customer-safe source redaction.

The public URL is an account-less Cloudflare Quick Tunnel with no access control or uptime guarantee. It is a review URL, not a production identity/data cutover. ChatGPT Site D1 data and authentication have not moved to QNAP.

## 16. Full QNAP Data Stack - 2026-08-27

The current application and reviewed inventory now run side-by-side on QNAP from Git commit `99ed4c02ee98da6709f6ba10cd0040e752bdf437`. The previous ports `4330` and `4331`, their tunnels, and the existing ChatGPT Site remain available as rollback/reference points.

Architecture:

```text
Public review -> Cloudflare Quick Tunnel -> nk-cars-edge -> tony-nk-cars-full:3000
Customer web -> nk-cars-private -> tony-nk-cars-data:3001 -> tony-nk-cars-postgres:5432
Daily backup -> tony-nk-cars-backup -> /share/CACHEDEV6_DATA/nk-cars/backups/postgres
```

- LAN URL: `http://192.168.0.132:4332/buy`
- Temporary public review URL: `https://desktop-tampa-unnecessary-provinces.trycloudflare.com/buy`
- Release: `/share/CACHEDEV6_DATA/nk-cars/releases/99ed4c02ee98`
- PostgreSQL data: `/share/CACHEDEV6_DATA/nk-cars/data/postgres`
- Customer-visible media: `/share/CACHEDEV6_DATA/nk-cars/media/customer-visible`
- Internal-only media: `/share/CACHEDEV6_DATA/nk-cars/media/internal-only`
- Backups: `/share/CACHEDEV6_DATA/nk-cars/backups/postgres`

Imported and verified:

- 20 inventory vehicles: 10 `APPROVED`, 10 `NEEDS_REVIEW`.
- 368 media records: 64 `CUSTOMER_VISIBLE`, 304 `INTERNAL_ONLY`.
- 73 customer-media files, including the active reviewed galleries and retained POC/reference assets.
- 137 Google Drive private-evidence files and 167 repository private-evidence files.
- Browse reads approved inventory through the authenticated internal QNAP Data API; PostgreSQL and the Data API publish no host ports.
- Public `/buy` and a customer-visible image return HTTP 200.
- Mobile 390 x 844 Browse loaded all 6 filtered cover images; Vehicle Detail loaded all 14 rendered images.
- A post-import PostgreSQL backup passed SHA-256 verification and restored into an isolated test database with 20 vehicles and 368 media rows.

Not migrated or activated:

- ChatGPT authentication headers and the existing Cloudflare D1 workspace remain on the ChatGPT Site.
- Existing signed-in Saved items, Vehicle Cases, quotations, PI records, and audit history were not imported because a complete non-truncated D1 export and an approved replacement authentication boundary are not available.
- The temporary public tunnel has no access control or stable URL guarantee and must not carry confidential customer, seller, financial, or internal-only data.
- No Facebook, seller messaging, payment, paid AI, or other real external action was activated.

Security note: QNAP-only database/API secrets are random, stored outside Git in a mode-600 environment file, and were not printed or copied into this document. The QNAP administrator password disclosed in chat must be rotated.

## 17. Identity and workspace implementation handoff - 2026-08-27

The `codex/app` branch now contains the production-compatible identity and QNAP workspace clients. Infrastructure implementation must follow `docs/QNAP_APP_REQUIREMENTS.md`.

Required next infrastructure work:

1. Implement the opaque-session identity endpoint and secure sign-in gateway.
   - Accept only `provider=google|apple` values enabled by infrastructure configuration.
   - Implement Google Authorization Code/OIDC first; keep Apple disabled until the Owner App ID/Services ID/Key ID/private key are available.
   - Follow the callback, token-validation, account-linking, least-privilege role, session-rotation, and secret-handling requirements in `docs/QNAP_APP_REQUIREMENTS.md`.
2. Implement the revisioned customer workspace and Owner Case endpoints.
3. Enforce service-token authentication, account ownership, least-privilege roles, deterministic commercial restrictions, atomic document numbering, and append-only audit in PostgreSQL.
4. Test with staging-only accounts and data through stable authenticated HTTPS ingress.
5. Rehearse backup/restore and rollback before any Vercel environment is changed.

Do not enable Vercel `NK_IDENTITY_PROVIDER=qnap` or `NK_WORKSPACE_BACKEND=qnap` until contract tests pass. The current Vercel site intentionally remains Guest/device-local, and the ChatGPT Site/D1 path remains rollback.
