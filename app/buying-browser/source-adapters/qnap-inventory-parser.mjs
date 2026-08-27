export function parseQnapInventoryPayload(payload, now = new Date()) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.listings)) throw new Error("qnap_inventory_invalid");
  for (const value of payload.listings) {
    if (!value || typeof value !== "object"
      || typeof value.id !== "string"
      || typeof value.sourceReference !== "string"
      || typeof value.title !== "string"
      || typeof value.brand !== "string"
      || typeof value.model !== "string"
      || !Number.isSafeInteger(value.year)
      || !Array.isArray(value.imageUrls)
      || !value.imageUrls.every((url) => typeof url === "string" && url.startsWith("/vehicle-marketplace/"))) {
      throw new Error("qnap_inventory_invalid_listing");
    }
  }
  return {
    listings: payload.listings,
    observedAt: typeof payload.observedAt === "string" ? payload.observedAt : now.toISOString(),
  };
}
