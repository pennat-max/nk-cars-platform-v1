import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";
import {
  collectFacebookListingOnPage,
  collectFacebookSearchCards,
} from "./facebook-page-reader.mjs";
import { SearchQueue } from "./search-queue.mjs";
import { FacebookPlaywrightSourceAdapter } from "./source-adapter.mjs";

const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "nk-cars-browser-fixture-"));
let context;

try {
  context = await chromium.launchPersistentContext(temporaryRoot, {
    channel: process.env.NK_CONNECTOR_BROWSER_CHANNEL?.trim() || "chrome",
    headless: true,
    viewport: { width: 1365, height: 1000 },
  });
  await context.route("https://scontent.fbcdn.net/**", (route) => route.fulfill({
    status: 200,
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#456"/></svg>',
  }));
  await context.route("https://www.facebook.com/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/checkpoint")) {
      return route.fulfill({
        status: 200,
        contentType: "text/html",
        body: '<!doctype html><html><body><h1>Security check required to continue</h1><form action="/checkpoint/"><input name="email"><input name="pass"></form></body></html>',
      });
    }
    if (url.pathname.includes("/marketplace/search")) {
      return route.fulfill({
        status: 200,
        contentType: "text/html",
        body: `<!doctype html><html><head><title>Marketplace Search</title></head><body>
          <main role="main">
            <a href="https://www.facebook.com/marketplace/item/111111111/"><img src="https://scontent.fbcdn.net/card-1.svg" alt="2023 Toyota Hilux Revo"><span>2023 Toyota Hilux Revo THB 765,000</span></a>
            <a href="https://www.facebook.com/marketplace/item/222222222/"><img src="https://scontent.fbcdn.net/card-2.svg" alt="2022 Toyota Hilux Revo"><span>2022 Toyota Hilux Revo THB 700,000</span></a>
          </main>
        </body></html>`,
      });
    }
    const itemId = url.pathname.match(/\/marketplace\/item\/(\d+)/)?.[1];
    if (itemId && itemId !== "123456789") {
      const year = itemId === "111111111" ? 2023 : 2022;
      const price = itemId === "111111111" ? "765,000" : "700,000";
      return route.fulfill({
        status: 200,
        contentType: "text/html",
        body: `<!doctype html><html><head>
          <meta property="og:title" content="${year} Toyota Hilux Revo A/T 4WD">
          <meta property="og:description" content="Double Cab, mileage 65,454 km, THB ${price}">
          <meta property="og:url" content="https://www.facebook.com/marketplace/item/${itemId}/">
          <meta property="og:image" content="https://scontent.fbcdn.net/vehicle-${itemId}.svg">
        </head><body><main role="main">
          <h1>${year} Toyota Hilux Revo A/T 4WD</h1>
          <img src="https://scontent.fbcdn.net/vehicle-${itemId}.svg" alt="${year} Toyota Hilux Revo" style="width:900px;height:600px">
          <section>Description\nDouble Cab, mileage 65,454 km, THB ${price}</section>
        </main></body></html>`,
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `<!doctype html><html><head>
        <meta property="og:title" content="2023 Toyota Hilux Revo Rocco 2.4 A/T 4WD">
        <meta property="og:description" content="Double Cab, mileage 65,454 km, THB 765,000">
        <meta property="og:url" content="https://www.facebook.com/marketplace/item/123456789/">
        <meta property="og:image" content="https://scontent.fbcdn.net/vehicle-1.svg">
      </head><body>
        <main role="main">
          <h1>2023 Toyota Hilux Revo Rocco</h1>
          <img id="hero" src="https://scontent.fbcdn.net/vehicle-1.svg" alt="2023 Toyota Hilux Revo" style="width:900px;height:600px">
          <div id="counter">1 of 3</div>
          <button aria-label="Next photo" onclick="window.nextPhoto()">Next photo</button>
          <section>Description\nDouble Cab, mileage 65,454 km, THB 765,000</section>
          <section>Seller\nInternal Seller</section>
        </main>
        <script>
          const images = [
            'https://scontent.fbcdn.net/vehicle-1.svg',
            'https://scontent.fbcdn.net/vehicle-2.svg',
            'https://scontent.fbcdn.net/vehicle-3.svg'
          ];
          let current = 0;
          window.nextPhoto = () => {
            current = Math.min(images.length - 1, current + 1);
            document.getElementById('hero').src = images[current];
            document.getElementById('counter').textContent = (current + 1) + ' of ' + images.length;
          };
        </script>
      </body></html>`,
    });
  });

  const searchPage = await context.newPage();
  const search = await collectFacebookSearchCards(
    searchPage,
    "https://www.facebook.com/marketplace/search/?query=Toyota+Revo",
    { initialWaitMs: 20, scrollWaitMs: 10, scrollSteps: 1, maxCards: 10 },
  );
  assert.equal(search.state, "ok");
  assert.equal(search.cards.length, 2);
  await searchPage.close();

  const checkpointPage = await context.newPage();
  const checkpoint = await collectFacebookSearchCards(
    checkpointPage,
    "https://www.facebook.com/checkpoint/",
    { initialWaitMs: 10, scrollSteps: 0 },
  );
  assert.equal(checkpoint.state, "login_required");
  await checkpointPage.close();

  const listingPage = await context.newPage();
  const listing = await collectFacebookListingOnPage(
    listingPage,
    "https://www.facebook.com/marketplace/item/123456789/",
    {
      maxImages: 30,
      timings: { initialWaitMs: 20, scrollWaitMs: 10, galleryWaitMs: 10, imageWaitMs: 20 },
    },
  );
  assert.equal(listing.state, "ok");
  assert.equal(listing.expected_image_count, 3);
  assert.equal(listing.images.length, 3);
  assert.equal(listing.gallery_complete, true);
  assert.equal(listing.source_listing_id, "123456789");
  await listingPage.close();

  const profileManager = {
    getStatus: () => ({ profile_id: "fb-buyer-01", state: "ready" }),
    withPage: async (_profileId, operation, options = {}) => {
      const page = await context.newPage();
      try {
        return await operation(page, { signal: options.signal });
      } finally {
        await page.close();
      }
    },
  };
  const adapter = new FacebookPlaywrightSourceAdapter({
    profileManager,
    profileId: "fb-buyer-01",
    readerTimings: { initialWaitMs: 20, scrollWaitMs: 10, galleryWaitMs: 10, imageWaitMs: 10 },
    searchReaderOptions: { initialWaitMs: 20, scrollWaitMs: 10, scrollSteps: 1, maxCards: 10 },
  });
  const queue = new SearchQueue({ minimumIntervalMs: 0, requestsPerMinute: 60, runTimeoutMs: 10_000 });
  const request = {
    request_id: "fixture_search",
    query: "Toyota Hilux Revo",
    year_from: 2020,
    year_to: 2023,
    transmission: "AT",
    drive_type: "4WD",
    max_results: 2,
  };
  const run = queue.enqueue({
    request,
    profileId: "fb-buyer-01",
    execute: ({ signal, runId }) => adapter.search(request, { signal, runId }),
  });
  await queue.waitForIdle(15_000);
  const completed = queue.getRun(run.run_id);
  assert.equal(completed.status, "completed");
  assert.equal(completed.listings_found, 2);
  assert.equal(completed.candidate_count, 2);
  assert.ok(completed.candidates.every((candidate) => candidate.status === "found_unverified"));

  process.stdout.write("Browser fixture smoke passed: queued 2 candidates and completed a 3-image gallery.\n");
} finally {
  if (context) await context.close().catch(() => undefined);
  if (temporaryRoot.startsWith(os.tmpdir())) {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
}
