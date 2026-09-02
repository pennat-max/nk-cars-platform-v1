# AI Office V1 Preview — Product Brief

## User story

ในฐานะ Owner พี่คอมต้องเปิดหน้า AI Office บนมือถือแล้วเห็นทีม AI คิวงาน หลักฐาน QA/Security รายการรออนุมัติ และ Audit Log โดยข้อมูลทั้งหมดเป็น Mock/Test เท่านั้น และไม่มี Worker จริงทำงาน

## Acceptance criteria

1. Route `/buy/owner-preview/ai-office` เปิดได้และแสดง `AI Development Office` พร้อมป้าย `MOCK / PREVIEW` ชัดเจน
2. มีแบบฟอร์มภาษาไทยสำหรับร่างคำสั่งงาน แต่การ Submit เปลี่ยนเฉพาะ UI state
3. แสดงพนักงาน 5 ตำแหน่ง: Product AI, Frontend AI, Backend AI, QA AI, Security AI
4. Worker ทุกตัวเริ่ม `ปิดใช้งาน` และ Toggle เปลี่ยนได้เฉพาะ Mock UI โดยไม่เพิ่ม Tool/Credential หรือเรียก Runtime
5. แสดงคิวงาน 5 สถานะ: รอทำ, กำลังทำ, รอตรวจ, ติดปัญหา, เสร็จแล้ว
6. แสดงหลักฐาน Test/Build, Approval Queue และ Audit Timeline
7. Mock records ทุกส่วนต้องมีป้าย MOCK/PREVIEW และไม่มีข้อมูลลูกค้า รถ หรือ Credential จริง
8. Mobile viewport 390px ไม่มี horizontal overflow และ touch target อ่าน/กดได้
9. ไม่มี API call, Worker execution, external message, Merge, Production deploy, Migration หรือ real-data write
10. Phase 2 เปิดเป็น Branch และ Draft PR แยกจาก Phase 1

## Error and safety states

- ปุ่มที่มีผลภายนอกต้อง Disabled หรือแสดงว่า `Preview เท่านั้น`
- ข้อมูลไม่ครบต้องแสดง `PENDING` ไม่เดา
- Baseline defect `tests/marketplace-connector.test.mjs` คงเดิมและไม่ถูกแก้

## Owner gate

หน้า Preview และ Draft PR ต้องหยุดรอ Owner ตรวจ ห้าม Merge หรือเริ่ม Worker จริง
