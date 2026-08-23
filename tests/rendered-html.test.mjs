import assert from "node:assert/strict";
import test from "node:test";

const platformTitle = /<title>NK Cars Platform V1<\/title>/i;
const shellMarkup = /class="app-shell"/i;

test("renders platform shell metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, platformTitle);
  assert.match(html, shellMarkup);
});

test("renders production rebuild route shell entry points", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `routes-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  };
  const ctx = {
    waitUntil() {},
    passThroughOnException() {},
  };
  const routes = [
    "/dashboard",
    "/vehicles",
    "/vehicles/new",
    "/vehicles/v1/review",
    "/vehicles/v4/360",
    "/vehicles/v4/edit",
    "/leads",
    "/wanted",
    "/sourcing-rules",
    "/more",
    "/marketplace",
    "/marketplace/nk-26071",
    "/wanted/new",
    "/inquiry",
  ];

  for (const route of routes) {
    const response = await worker.fetch(
      new Request(`http://localhost${route}`, {
        headers: { accept: "text/html" },
      }),
      env,
      ctx,
    );

    assert.equal(response.status, 200, route);
    assert.match(
      response.headers.get("content-type") ?? "",
      /^text\/html\b/i,
      route,
    );
    const html = await response.text();
    assert.match(html, platformTitle, route);
    assert.match(html, shellMarkup, route);
  }
});

test("imports public Facebook Marketplace metadata using the mobile content path", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `facebook-metadata-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const originalFetch = globalThis.fetch;
  let requestedUserAgent = "";
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    assert.match(url, /^https:\/\/(?:www\.)?facebook\.com\//i);
    requestedUserAgent = new Headers(init?.headers).get("user-agent") || "";
    const html = `<!doctype html><html><head>
      <meta property="og:title" content="2025 Toyota HILUX REVO 2.8 4WD GR SPORT WIDE">
      <meta property="og:description" content="เลขไมล์24,000กิโลแท้
ราคา 1,389,000 บาท ขับ4WD DOUBLE CAB">
      <meta property="og:url" content="https://www.facebook.com/marketplace/item/1716607786274590/">
      <meta property="og:image" content="https://scontent.fbkk22-8.fna.fbcdn.net/vehicle.jpg">
    </head></html>`;
    const response = new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
    Object.defineProperty(response, "url", { value: "https://www.facebook.com/marketplace/item/1716607786274590/" });
    return response;
  };

  try {
    const response = await worker.fetch(
      new Request("http://localhost/api/marketplace-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://www.facebook.com/share/1DF6CzLM1A/" }),
      }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.status, "partial");
    assert.equal(payload.canonical_url, "https://www.facebook.com/marketplace/item/1716607786274590/");
    assert.equal(payload.source_price, "1389000");
    assert.equal(payload.draft_fields.brand, "Toyota");
    assert.equal(payload.draft_fields.model, "Hilux Revo");
    assert.equal(payload.draft_fields.year, "2025");
    assert.equal(payload.draft_fields.drive, "4WD");
    assert.equal(payload.draft_fields.body, "Double Cab");
    assert.equal(payload.draft_fields.mileage, "24,000 km");
    assert.equal("grade" in payload.draft_fields, false);
    assert.match(requestedUserAgent, /Mobile\/15E148 Safari\/604\.1 NKCars\/1\.0/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
