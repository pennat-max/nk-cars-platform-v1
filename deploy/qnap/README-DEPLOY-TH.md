# NK Cars Buying Browser - QNAP LAN Deploy

เอกสารนี้ใช้สำหรับ deploy เว็บ preview ภายใน LAN บน QNAP เท่านั้น

## ขอบเขต

- Container: `tony-nk-cars-buying-browser`
- Image: `tony-nk-cars-buying-browser:f018cd5`
- URL ภายใน LAN: `http://192.168.0.132:4330/`
- Internal container port: `3000`
- Host bind: `192.168.0.132:4330`
- ไม่ย้ายฐานข้อมูล
- ไม่แตะ Hermes, n8n หรือ PostgreSQL
- ไม่เปิด port router

## Start

```bash
cd /share/CACHEDEV6_DATA/nk-cars-buying-browser-preview/releases/f018cd5-20260826-233323/deploy/qnap
/share/CACHEDEV6_DATA/.qpkg/container-station/bin/docker compose up -d --build
```

## ตรวจสอบ

```bash
/share/CACHEDEV6_DATA/.qpkg/container-station/bin/docker ps --filter name=tony-nk-cars-buying-browser
/share/CACHEDEV6_DATA/.qpkg/container-station/bin/docker inspect tony-nk-cars-buying-browser --format '{{.State.Health.Status}}'
curl -I http://192.168.0.132:4330/
curl -I http://192.168.0.132:4330/buy
```

## Rollback

คำสั่งนี้หยุดเฉพาะ container ของเว็บ preview นี้ ไม่แตะ Hermes, n8n หรือ PostgreSQL

```bash
cd /share/CACHEDEV6_DATA/nk-cars-buying-browser-preview/releases/f018cd5-20260826-233323/deploy/qnap
/share/CACHEDEV6_DATA/.qpkg/container-station/bin/docker compose down
```

Source snapshot ยังอยู่ที่:

```text
/share/CACHEDEV6_DATA/nk-cars-buying-browser-preview/releases/f018cd5-20260826-233323
```

## Deploy build ปัจจุบันแบบไม่ทับ preview เดิม

ไฟล์ `docker-compose.current.yml` ใช้ container และ port แยกจาก preview เดิม:

- Container ใหม่: `tony-nk-cars-current`
- LAN URL ใหม่: `http://192.168.0.132:4331/buy`
- Container เดิม `tony-nk-cars-buying-browser` ที่ port `4330` จะไม่ถูกหยุดหรือลบ

จาก root ของ release ปัจจุบัน:

```bash
chmod +x deploy/qnap/deploy-current.sh
deploy/qnap/deploy-current.sh <CURRENT_GIT_COMMIT_SHA>
```

คำสั่งนี้ validate Compose, build image, start container แยก และรอ health check `/buy` ก่อนรายงานสำเร็จ ไม่มีการเชื่อม D1, PostgreSQL หรือ production secrets โดยอัตโนมัติ

ข้อจำกัดสำคัญ:

- QNAP build เปิดหน้าเว็บปัจจุบันได้ แต่ ChatGPT authentication headers และ Cloudflare D1 binding ไม่มีอยู่นอก ChatGPT Site
- Account workspace, Owner queue, Quote และ PI จึงยังใช้เป็น production บน QNAP ไม่ได้จนกว่าจะมี approved auth และ database adapter
- ห้ามเปิด Quick Tunnel ที่ไม่มี Access ให้กับข้อมูลลูกค้า ผู้ขาย การเงิน หรือ source evidence จริง
