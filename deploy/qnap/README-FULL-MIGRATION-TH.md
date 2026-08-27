# NK Cars Full QNAP Migration

เอกสารนี้ใช้สำหรับย้ายระบบแบบคู่ขนานไปยัง QNAP โดยไม่หยุดหรือลบ ChatGPT Site เดิม

## ขอบเขตของ Stack

- `tony-nk-cars-full`: เว็บแอปบนพอร์ต LAN `4332`
- `tony-nk-cars-data`: internal data service; ไม่เปิดพอร์ตสู่ LAN/Internet
- `tony-nk-cars-postgres`: PostgreSQL แยกจากฐานข้อมูล n8n/Hermes; ไม่เปิดพอร์ตสู่ LAN/Internet
- `tony-nk-cars-backup`: สำรองฐานข้อมูลแบบ custom dump พร้อม SHA-256 ทุก 24 ชั่วโมง
- Customer-visible media mount แบบ read-only
- Internal evidence อยู่ใน private media directory และไม่ mount เข้า web container

## QNAP Paths

แนะนำให้ใช้:

```text
/share/CACHEDEV6_DATA/nk-cars/data/postgres
/share/CACHEDEV6_DATA/nk-cars/media/customer-visible
/share/CACHEDEV6_DATA/nk-cars/media/internal-only
/share/CACHEDEV6_DATA/nk-cars/backups
/share/CACHEDEV6_DATA/nk-cars/releases
```

ไฟล์ environment จริงต้องอยู่บน QNAP เท่านั้นและ permission `600`:

```dotenv
NK_CARS_RELEASE_TAG=<git-commit>
NK_CARS_BIND_IP=192.168.0.132
NK_CARS_HOST_PORT=4332
NK_CARS_DATA_ROOT=/share/CACHEDEV6_DATA/nk-cars/data
NK_CARS_MEDIA_ROOT=/share/CACHEDEV6_DATA/nk-cars/media
NK_CARS_BACKUP_ROOT=/share/CACHEDEV6_DATA/nk-cars/backups
NK_CARS_DB_ADMIN_PASSWORD=<random-secret>
NK_CARS_APP_DB_PASSWORD=<different-random-secret>
NK_INTERNAL_API_TOKEN=<random-token-at-least-32-characters>
NK_HERMES_WORKER_TOKEN=<different-random-token-at-least-32-characters-when-worker-is-enabled>
```

ห้ามใช้รหัส QNAP เป็นรหัสฐานข้อมูลหรือ API token และห้าม commit ไฟล์ environment

`NK_HERMES_WORKER_TOKEN` ต้องต่างจาก `NK_INTERNAL_API_TOKEN` และปล่อยว่างได้จนกว่าจะติดตั้ง Hermes worker จริง การปล่อยว่างจะปิด worker endpoints แบบ fail-closed แต่ยังอนุญาตให้ Data API เก็บกฎ Owner ได้

สำหรับ PostgreSQL volume เดิม ให้ใช้ `sh deploy/qnap/deploy-full.sh <git-commit-sha>` จาก root ของ release สคริปต์จะรัน migration `020_sourcing_automation.sql` แบบ idempotent ก่อนเริ่ม Data API รุ่นใหม่

## Import และตรวจข้อมูล

1. สร้าง stack และรอ health checks ผ่าน
2. สร้าง migration seed ด้วย `node scripts/build-qnap-migration-seed.mjs`
3. คัดลอก customer media และ internal evidence แยก directory
4. รัน `import-inventory.mjs` ใน data container
5. เทียบจำนวน vehicle/media และ SHA-256 manifest
6. สร้าง backup และ restore เข้า temporary test database
7. เปิด `/buy` บนพอร์ต `4332` เพื่อตรวจว่า Browse อ่านจาก `QNAP PostgreSQL`

## Cutover Boundary

การย้าย inventory/media ไม่ได้อนุญาตให้สร้างระบบ login ที่ไม่ปลอดภัย D1 workspace เดิมต้องคงอยู่จนกว่าจะส่งออก `state_json` แบบครบถ้วนและมี authentication boundary ที่ Owner อนุมัติ เช่น Cloudflare Access/OIDC หรือระบบบัญชีที่ผ่านการออกแบบและทดสอบแล้ว

ห้าม inject Owner headers, ใช้ shared password หรือเปิด data service ต่อ Internet เพื่อเลี่ยง authentication
