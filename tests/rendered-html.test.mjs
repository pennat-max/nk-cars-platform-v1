import assert from "node:assert/strict";
import test from "node:test";

const platformTitle = /<title>NK Cars Platform V1<\/title>/i;
const shellMarkup = /class="app-shell"/i;

test("redirects the public root to Buying Browser", async () => {
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

  assert.ok([307, 308].includes(response.status), `unexpected redirect status ${response.status}`);
  assert.equal(new URL(response.headers.get("location"), "http://localhost").pathname, "/buy");
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
    assert.equal(payload.gallery_complete, false);
    assert.equal(payload.cloud_status, "not_configured");
    assert.equal(payload.images.length, 1);
    assert.equal(payload.canonical_url, "https://www.facebook.com/marketplace/item/1716607786274590/");
    assert.equal(payload.source_price, "1389000");
    assert.equal(payload.draft_fields.brand, "Toyota");
    assert.equal(payload.draft_fields.model, "Hilux Revo");
    assert.equal(payload.draft_fields.year, "2025");
    assert.equal(payload.draft_fields.drive, "4WD");
    assert.equal(payload.draft_fields.body, "Double Cab");
    assert.equal(payload.draft_fields.mileage, "24,000 km");
    assert.equal(payload.draft_fields.grade, "GR SPORT WIDE");
    assert.match(requestedUserAgent, /Mobile\/15E148 Safari\/604\.1 NKCars\/1\.0/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("extracts detailed Thai listing facts for the English customer draft", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `facebook-thai-details-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    const html = `<!doctype html><html><head>
      <meta property="og:title" content="2023 Toyota REVO">
      <meta property="og:description" content="REVO 2.4 Rocco D/C Pre A/T ปี2023 ไมล์ 65,454 เข้าใหม่สวยเดิมๆ ราคา 765,000 บาท">
      <meta property="og:url" content="https://www.facebook.com/marketplace/item/2023000765000/">
      <meta property="og:image" content="https://scontent.fbkk22-8.fna.fbcdn.net/revo-rocco.jpg">
    </head></html>`;
    const response = new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
    Object.defineProperty(response, "url", { value: "https://www.facebook.com/marketplace/item/2023000765000/" });
    return response;
  };

  try {
    const response = await worker.fetch(
      new Request("http://localhost/api/marketplace-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://www.facebook.com/share/example-rocco/" }),
      }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.source_price, "765000");
    assert.equal(payload.draft_fields.brand, "Toyota");
    assert.equal(payload.draft_fields.model, "Hilux Revo");
    assert.equal(payload.draft_fields.year, "2023");
    assert.equal(payload.draft_fields.grade, "Rocco");
    assert.equal(payload.draft_fields.engine, "2.4L");
    assert.equal(payload.draft_fields.transmission, "AT");
    assert.equal(payload.draft_fields.body, "Double Cab");
    assert.equal(payload.draft_fields.mileage, "65,454 km");
    assert.equal("drive" in payload.draft_fields, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("supplements public metadata with the configured Cloud Browser gallery", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `facebook-cloud-gallery-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.BROWSERLESS_TOKEN;
  const originalProfile = process.env.BROWSERLESS_PROFILE;
  process.env.BROWSERLESS_TOKEN = "test-token";
  process.env.BROWSERLESS_PROFILE = "nk-facebook";
  const calls = [];
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push(url);
    if (url.startsWith("https://www.facebook.com/")) {
      const html = `<!doctype html><html><head>
        <meta property="og:title" content="2023 Toyota REVO">
        <meta property="og:description" content="REVO 2.4 Rocco D/C A/T ไมล์ 65,454 ราคา 765,000 บาท">
        <meta property="og:url" content="https://www.facebook.com/marketplace/item/2023000765000/">
        <meta property="og:image" content="https://scontent.fbkk22-8.fna.fbcdn.net/revo-1.jpg">
      </head></html>`;
      const response = new Response(html, { status: 200, headers: { "content-type": "text/html" } });
      Object.defineProperty(response, "url", { value: "https://www.facebook.com/marketplace/item/2023000765000/" });
      return response;
    }
    assert.match(url, /^https:\/\/production-sfo\.browserless\.io\/function\?/);
    return Response.json({
      state: "ok",
      final_url: "https://www.facebook.com/marketplace/item/2023000765000/",
      title: "2023 Toyota REVO",
      description: "REVO 2.4 Rocco D/C A/T",
      listing_text: "2023 Toyota REVO 2.4 Rocco D/C A/T ไมล์ 65,454 ราคา 765,000 บาท",
      source_price: "765000",
      seller: "Internal Seller",
      location: "Bangkok",
      images: [
        "https://scontent.fbkk22-8.fna.fbcdn.net/revo-1.jpg?size=large",
        "https://scontent.fbkk22-8.fna.fbcdn.net/revo-2.jpg",
        "https://scontent.fbkk22-8.fna.fbcdn.net/revo-3.jpg",
      ],
      expected_image_count: 3,
      gallery_complete: true,
    });
  };

  try {
    const response = await worker.fetch(
      new Request("http://localhost/api/marketplace-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://www.facebook.com/share/example-gallery/" }),
      }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(calls.length, 2);
    assert.equal(payload.status, "imported", JSON.stringify(payload));
    assert.equal(payload.gallery_complete, true);
    assert.equal(payload.expected_image_count, 3);
    assert.equal(payload.images.length, 3);
    assert.match(payload.provider, /public metadata \+ Browserless Cloud Browser/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.BROWSERLESS_TOKEN;
    else process.env.BROWSERLESS_TOKEN = originalToken;
    if (originalProfile === undefined) delete process.env.BROWSERLESS_PROFILE;
    else process.env.BROWSERLESS_PROFILE = originalProfile;
  }
});

test("removes sourcing details from the customer English description", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `customer-safe-description-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  globalThis.fetch = async () => Response.json({
    output: [{
      content: [{
        type: "output_text",
        text: JSON.stringify({
          fields: {
            customerDescriptionEn: {
              value: "2023 Toyota Hilux Revo with automatic transmission and 65,454 km. Seller Freedom posted it on Facebook Marketplace. Contact 081-234-5678. Source price THB 765,000.",
              confidence: 90,
              status: "Extracted",
              evidence: ["listing text"],
              alternatives: [],
            },
          },
          conflicts: [],
          summary: "Test extraction",
          image_count: 0,
        }),
      }],
    }],
  });

  try {
    const response = await worker.fetch(
      new Request("http://localhost/api/vehicle-extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listingText: "2023 Toyota Hilux Revo" }),
      }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(
      payload.fields.customerDescriptionEn.value,
      "2023 Toyota Hilux Revo with automatic transmission and 65,454 km.",
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
  }
});
