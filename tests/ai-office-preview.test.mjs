import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
process.env.NK_IDENTITY_PROVIDER = "chatgpt";
process.env.NK_OWNER_ACCOUNT_IDS = "owner-1";
const ownerHeaders = {
  "oai-authenticated-user-id": "owner-1",
  "oai-authenticated-user-email": "owner@example.test",
};

async function renderAiOffice(requestHeaders = ownerHeaders) {
  workerUrl.searchParams.set("test", `ai-office-${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/buy/owner-preview/ai-office", {
      headers: { accept: "text/html", ...requestHeaders },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("requires an authenticated Owner for the AI Office preview", async () => {
  const anonymous = await renderAiOffice({});
  assert.ok([307, 308].includes(anonymous.status));

  const nonOwner = await renderAiOffice({
    "oai-authenticated-user-id": "staff-1",
    "oai-authenticated-user-email": "staff@example.test",
  });
  assert.equal(nonOwner.status, 404);

  const owner = await renderAiOffice();
  assert.equal(owner.status, 200);
});

test("renders the mock-only AI Development Office owner preview", async () => {
  const response = await renderAiOffice();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /AI Development Office/i);
  assert.match(html, /MOCK \/ PREVIEW/i);
  for (const role of ["Product AI", "Frontend AI", "Backend AI", "QA AI", "Security AI"]) {
    assert.match(html, new RegExp(role, "i"));
  }
});

test("renders queue, evidence, approval, audit, and disabled worker boundaries", async () => {
  const response = await renderAiOffice();
  const html = await response.text();
  for (const label of ["รอทำ", "กำลังทำ", "รอตรวจ", "ติดปัญหา", "เสร็จแล้ว", "หลักฐาน Test / Build", "รอ Owner อนุมัติ", "Audit Log", "ปิดใช้งาน", "Preview เท่านั้น"]) {
    assert.match(html, new RegExp(label, "i"));
  }
  assert.equal((html.match(/role="switch"/g) ?? []).length, 5);
  assert.equal((html.match(/aria-checked="false"/g) ?? []).length, 5);
  assert.match(html, /อนุมัติ — Preview เท่านั้น/);
  assert.match(html, /disabled=""/);
  assert.doesNotMatch(html, /Authorization:\s*Bearer/i);
  assert.doesNotMatch(html, /password\s*[:=]/i);
});

test("keeps Phase 2 interactions local and free of runtime/network integration", async () => {
  const component = await readFile(
    new URL("../app/buying-browser/AiDevelopmentOfficePreview.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(component, /\b(?:fetch|axios|WebSocket|EventSource)\s*\(/);
  assert.doesNotMatch(component, /localStorage|sessionStorage/);
  assert.match(component, /useState/);
  assert.match(component, /Toggle เปลี่ยนเฉพาะ local React state/);
});
