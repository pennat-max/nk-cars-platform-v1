const FACEBOOK_HOSTS = new Set(["facebook.com", "fb.com"]);

export const MAX_LISTING_IMAGES = 30;

export function isFacebookHost(hostname) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return [...FACEBOOK_HOSTS].some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

export function validateFacebookUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("invalid_url");
  }

  if (
    url.protocol !== "https:"
    || !isFacebookHost(url.hostname)
    || url.username
    || url.password
    || url.port
  ) {
    throw new Error("invalid_url");
  }

  url.hash = "";
  return url.toString();
}

export function cleanFacebookImageUrl(value) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const trusted = host === "fbcdn.net"
      || host.endsWith(".fbcdn.net")
      || host === "fbsbx.com"
      || host.endsWith(".fbsbx.com")
      || isFacebookHost(host);
    return url.protocol === "https:" && trusted ? url.toString() : "";
  } catch {
    return "";
  }
}

export function uniqueFacebookImages(values, limit = MAX_LISTING_IMAGES) {
  const images = [];
  const seen = new Set();
  for (const value of values) {
    const image = cleanFacebookImageUrl(value);
    if (!image) continue;
    const url = new URL(image);
    const identity = `${url.hostname.toLowerCase()}${url.pathname}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    images.push(image);
    if (images.length >= Math.min(MAX_LISTING_IMAGES, Math.max(1, limit))) break;
  }
  return images;
}

export function boundedImageCount(value, fallback = MAX_LISTING_IMAGES) {
  const count = Number(value);
  return Number.isInteger(count) && count > 0
    ? Math.min(MAX_LISTING_IMAGES, count)
    : fallback;
}
