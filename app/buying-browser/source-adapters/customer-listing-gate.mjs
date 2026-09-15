export function customerEligibleListing(listing) {
  return Boolean(listing)
    && !String(listing.id || "").startsWith("nk-auto-20260912-")
    && !Array.from(listing.imageUrls || []).some((url) => String(url).includes("/auto-published-20260912/"));
}

export function mergeCustomerSafeListings(liveListings = [], bundledListings = []) {
  const merged = new Map();
  for (const listing of [...liveListings, ...bundledListings]) {
    if (customerEligibleListing(listing)) merged.set(listing.id, listing);
  }
  return [...merged.values()];
}
