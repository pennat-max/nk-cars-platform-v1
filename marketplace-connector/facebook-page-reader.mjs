/* global document, location, window */

import { cleanFacebookImageUrl, uniqueFacebookImages, validateFacebookUrl } from "./url-policy.mjs";

const DEFAULT_TIMINGS = Object.freeze({
  initialWaitMs: 2_500,
  scrollWaitMs: 650,
  galleryWaitMs: 900,
  imageWaitMs: 650,
});

function safeText(value, max = 30_000) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function expectedCount(value) {
  const count = Number(value);
  return Number.isInteger(count) && count > 1 && count <= 60 ? count : undefined;
}

function abortIfNeeded(signal) {
  if (signal?.aborted) throw signal.reason instanceof Error ? signal.reason : new Error("cancelled");
}

async function wait(page, milliseconds, signal) {
  abortIfNeeded(signal);
  await page.waitForTimeout(milliseconds);
  abortIfNeeded(signal);
}

export async function inspectFacebookPage(page) {
  return page.evaluate(() => {
    const text = (value) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
    const meta = (key) => text(
      document.querySelector(`meta[property="${key}"]`)?.getAttribute("content")
      || document.querySelector(`meta[name="${key}"]`)?.getAttribute("content")
      || "",
    );
    const rawBodyText = document.body?.innerText || "";
    const bodyText = text(rawBodyText).slice(0, 30_000);
    const finalUrl = location.href;
    const canonicalUrl = meta("og:url") || document.querySelector('link[rel="canonical"]')?.getAttribute("href") || finalUrl;
    const title = meta("og:title") || text(document.querySelector("h1")?.textContent || "") || text(document.title);
    const description = meta("og:description") || meta("description");
    const images = [];
    const titleWords = title.toLowerCase().split(/\s+/).filter((word) => word.length > 3);
    const addImage = (value, width = 0, height = 0, rectangle = null, alt = "", force = false) => {
      if (!value || !/^https:\/\//i.test(value) || !/fbcdn\.net|fbsbx\.com/i.test(value)) return;
      const visible = rectangle && rectangle.width > 0 && rectangle.height > 0
        && rectangle.bottom > 0 && rectangle.top < window.innerHeight * 1.8;
      const titleMatch = titleWords.some((word) => text(alt).toLowerCase().includes(word));
      if (force || (visible && width >= 420 && height >= 260) || titleMatch) images.push(value);
    };
    addImage(meta("og:image"), 1200, 630, { width: 1200, height: 630, top: 0, bottom: 630 }, title, true);
    document.querySelectorAll("img").forEach((image) => {
      const rectangle = image.getBoundingClientRect();
      addImage(image.currentSrc || image.src, image.naturalWidth, image.naturalHeight, rectangle, image.alt || "");
    });
    document.querySelectorAll("video[poster]").forEach((video) => {
      addImage(video.getAttribute("poster"), 1200, 630, video.getBoundingClientRect(), title, true);
    });

    const visiblePrice = bodyText.match(/(?:THB\s*|\u0e3f\s*|\u0e23\u0e32\u0e04\u0e32\s*)[\d,]+(?:\.\d{1,2})?/i)?.[0] || "";
    const sourcePrice = meta("product:price:amount") || meta("og:price:amount") || visiblePrice;
    const counters = [...bodyText.matchAll(/\b\d{1,2}\s*(?:of|\/|\u0e08\u0e32\u0e01)\s*(\d{1,2})\b/gi)]
      .map((match) => Number(match[1]))
      .filter((count) => count > 1 && count <= 60);
    const relatedMarker = bodyText.search(/(?:Today's picks|More from this seller|Related listings)/i);
    const primaryText = relatedMarker > 200 ? bodyText.slice(0, relatedMarker) : bodyText;
    const lines = rawBodyText.split(/\r?\n/).map(text).filter(Boolean);
    const sellerIndex = lines.findIndex((line) => /^(?:seller|\u0e1c\u0e39\u0e49\u0e02\u0e32\u0e22)$/i.test(line));
    const seller = sellerIndex >= 0 ? lines[sellerIndex + 1] || "" : "";
    const locationLine = lines.find((line) => /^listed\b/i.test(line) && /[\u00b7\u2022]/.test(line)) || "";
    const listedLocation = locationLine.split(/[\u00b7\u2022]/).at(-1)?.trim() || "";
    const loginPath = /\/(?:login|checkpoint|recover|two_factor)(?:\/|\?|$)/i.test(location.pathname);
    const loginForm = Boolean(document.querySelector('input[name="email"], input[name="pass"], form[action*="login"], form[action*="checkpoint"]'));
    const securityText = /log in to facebook|security check|required to continue|confirm your identity/i.test(bodyText.slice(0, 5_000));
    const listingPath = /\/marketplace\/item\//i.test(finalUrl) || /\/marketplace\/item\//i.test(canonicalUrl);
    const meaningfulTitle = title && !/^facebook(?: marketplace)?$/i.test(title);
    const hasListingEvidence = listingPath && Boolean(meaningfulTitle || description || sourcePrice || images.length);

    return {
      state: loginPath || ((loginForm || securityText) && !hasListingEvidence) ? "login_required" : "ok",
      final_url: finalUrl,
      canonical_url: canonicalUrl,
      title,
      description,
      listing_text: [title, description, primaryText].filter(Boolean).join("\n\n").slice(0, 30_000),
      source_price: text(sourcePrice),
      seller: text(seller),
      location: text(listedLocation),
      images,
      expected_image_count: counters.length ? Math.max(...counters) : undefined,
    };
  });
}

export async function collectFacebookListingOnPage(page, sourceUrl, options = {}) {
  const validatedUrl = validateFacebookUrl(sourceUrl);
  const maxImages = Math.min(30, Math.max(1, options.maxImages || 30));
  const timings = { ...DEFAULT_TIMINGS, ...(options.timings || {}) };
  const signal = options.signal;
  abortIfNeeded(signal);
  await page.goto(validatedUrl, { waitUntil: "domcontentloaded", timeout: options.navigationTimeoutMs || 45_000 });
  await wait(page, timings.initialWaitMs, signal);

  const snapshots = [await inspectFacebookPage(page)];
  if (snapshots[0].state === "login_required") return snapshots[0];

  for (let step = 0; step < 3; step += 1) {
    await page.evaluate(() => window.scrollBy(0, Math.max(650, window.innerHeight * 0.8)));
    await wait(page, timings.scrollWaitMs, signal);
    snapshots.push(await inspectFacebookPage(page));
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(page, Math.min(400, timings.scrollWaitMs), signal);

  const galleryOpened = await page.evaluate(() => {
    const images = [...document.querySelectorAll("img")]
      .map((image) => ({ image, area: image.naturalWidth * image.naturalHeight, rectangle: image.getBoundingClientRect() }))
      .filter(({ image, area, rectangle }) => area >= 420 * 260
        && rectangle.width > 0 && rectangle.height > 0
        && rectangle.top < window.innerHeight * 1.5
        && /fbcdn\.net|fbsbx\.com/i.test(image.currentSrc || image.src))
      .sort((left, right) => right.area - left.area);
    const action = images[0]?.image.closest('a, button, [role="button"]') || images[0]?.image;
    if (!action) return false;
    action.click();
    return true;
  });
  if (galleryOpened) await wait(page, timings.galleryWaitMs, signal);

  let previousHero = "";
  let repeatedHero = 0;
  for (let step = 0; step < maxImages; step += 1) {
    const snapshot = await inspectFacebookPage(page);
    snapshots.push(snapshot);
    if (snapshot.state === "login_required") return snapshot;
    const imagesSoFar = uniqueFacebookImages(snapshots.flatMap((item) => item.images || []), maxImages);
    const count = Math.max(...snapshots.map((item) => expectedCount(item.expected_image_count) || 0));
    if (count && imagesSoFar.length >= Math.min(count, maxImages)) break;

    const hero = await page.evaluate(() => [...document.querySelectorAll("img")]
      .filter((image) => {
        const rectangle = image.getBoundingClientRect();
        return rectangle.width > 0 && rectangle.height > 0
          && image.naturalWidth >= 600 && image.naturalHeight >= 350
          && /fbcdn\.net|fbsbx\.com/i.test(image.currentSrc || image.src);
      })
      .sort((left, right) => (right.naturalWidth * right.naturalHeight) - (left.naturalWidth * left.naturalHeight))[0]?.currentSrc || "");
    repeatedHero = hero && hero === previousHero ? repeatedHero + 1 : 0;
    previousHero = hero || previousHero;
    if (repeatedHero >= 2) break;

    const clicked = await page.evaluate(() => {
      const labels = (element) => [element.getAttribute("aria-label"), element.getAttribute("title"), element.textContent]
        .filter(Boolean).map((value) => value.replace(/\s+/g, " ").trim());
      const nextPattern = /^(?:next(?: photo| image)?|\u0e23\u0e39\u0e1b\u0e16\u0e31\u0e14\u0e44\u0e1b|\u0e16\u0e31\u0e14\u0e44\u0e1b)(?:\s+\d+)?$/i;
      const target = [...document.querySelectorAll('button, [role="button"], [aria-label], [title]')]
        .find((element) => {
          const rectangle = element.getBoundingClientRect();
          return rectangle.width > 0 && rectangle.height > 0
            && rectangle.bottom > 0 && rectangle.top < window.innerHeight
            && labels(element).some((value) => nextPattern.test(value));
        });
      if (!target) return false;
      target.click();
      return true;
    });
    if (!clicked) break;
    await wait(page, timings.imageWaitMs, signal);
  }

  const best = snapshots.reduce((selected, item) => {
    const selectedScore = (selected.listing_text?.length || 0) + (selected.images?.length || 0) * 500;
    const itemScore = (item.listing_text?.length || 0) + (item.images?.length || 0) * 500;
    return itemScore > selectedScore ? item : selected;
  }, snapshots[0]);
  const images = uniqueFacebookImages(snapshots.flatMap((item) => item.images || []), maxImages);
  const count = Math.max(...snapshots.map((item) => expectedCount(item.expected_image_count) || 0)) || undefined;
  const canonicalUrl = validateFacebookUrl(best.canonical_url || best.final_url || validatedUrl);

  return {
    state: "ok",
    canonical_url: canonicalUrl,
    source_listing_id: canonicalUrl.match(/\/marketplace\/item\/(\d+)/i)?.[1],
    title: safeText(best.title, 500),
    description: safeText(best.description),
    listing_text: safeText(best.listing_text),
    source_price: safeText(best.source_price, 100),
    seller: safeText(best.seller, 500),
    location: safeText(best.location, 500),
    images: images.map(cleanFacebookImageUrl).filter(Boolean),
    expected_image_count: count,
    gallery_complete: Boolean(count && images.length >= Math.min(count, maxImages)),
    observed_at: new Date().toISOString(),
  };
}

export async function collectFacebookSearchCards(page, searchUrl, options = {}) {
  const validatedUrl = validateFacebookUrl(searchUrl);
  const signal = options.signal;
  abortIfNeeded(signal);
  await page.goto(validatedUrl, { waitUntil: "domcontentloaded", timeout: options.navigationTimeoutMs || 45_000 });
  await wait(page, options.initialWaitMs ?? 2_500, signal);

  const pageState = await inspectFacebookPage(page);
  if (pageState.state === "login_required") return { state: "login_required", cards: [] };

  for (let step = 0; step < (options.scrollSteps ?? 4); step += 1) {
    await page.evaluate(() => window.scrollBy(0, Math.max(700, window.innerHeight * 0.9)));
    await wait(page, options.scrollWaitMs ?? 700, signal);
  }

  const cards = await page.evaluate(() => {
    const text = (value) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
    const results = [];
    document.querySelectorAll('a[href*="/marketplace/item/"]').forEach((anchor) => {
      const href = anchor.href;
      const container = anchor.closest('[role="main"] a[href*="/marketplace/item/"]') || anchor;
      const cardText = text(container.textContent || anchor.textContent || "").slice(0, 3_000);
      const image = container.querySelector("img") || anchor.querySelector("img");
      results.push({
        source_url: href,
        source_listing_id: href.match(/\/marketplace\/item\/(\d+)/i)?.[1] || "",
        title: text(image?.alt || cardText).slice(0, 500),
        listing_text: cardText,
        images: image?.currentSrc || image?.src ? [image.currentSrc || image.src] : [],
      });
    });
    return results;
  });

  const unique = new Map();
  for (const card of cards) {
    try {
      const sourceUrl = validateFacebookUrl(card.source_url);
      const image = cleanFacebookImageUrl(card.images?.[0]);
      const listingId = sourceUrl.match(/\/marketplace\/item\/(\d+)/i)?.[1] || card.source_listing_id;
      if (!listingId || unique.has(listingId)) continue;
      unique.set(listingId, {
        source_url: sourceUrl,
        source_listing_id: listingId,
        title: safeText(card.title, 500),
        listing_text: safeText(card.listing_text, 3_000),
        images: image ? [image] : [],
      });
    } catch {
      // Ignore malformed card URLs rather than leaving the Facebook allowlist.
    }
  }
  return { state: "ok", cards: [...unique.values()].slice(0, options.maxCards || 30) };
}
