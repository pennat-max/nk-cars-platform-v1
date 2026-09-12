import {
  buildSearchTerms,
  candidateMatchesRequest,
  normalizeCandidate,
  normalizeSearchRequest,
} from "./contracts.mjs";
import {
  collectFacebookListingOnPage,
  collectFacebookSearchCards,
} from "./facebook-page-reader.mjs";
import { boundedImageCount, validateFacebookUrl } from "./url-policy.mjs";

export class SourceAdapter {
  canHandle() {
    return false;
  }

  async search() {
    throw new Error("source_search_not_implemented");
  }

  async openListing() {
    throw new Error("source_open_not_implemented");
  }
}

export function buildFacebookSearchUrl(request) {
  const terms = buildSearchTerms(request);
  const url = new URL("https://www.facebook.com/marketplace/search/");
  url.searchParams.set("query", terms);
  url.searchParams.set("exact", "false");
  return url.toString();
}

function inferMarketplaceLocation(...values) {
  const evidence = values.filter((value) => typeof value === "string").join(" ").toLowerCase();
  const locations = [
    ["Bangkok", ["bangkok", "กรุงเทพ"]],
    ["Nonthaburi", ["nonthaburi", "นนทบุรี"]],
    ["Pathum Thani", ["pathum thani", "ปทุมธานี"]],
    ["Samut Prakan", ["samut prakan", "สมุทรปราการ"]],
    ["Samut Sakhon", ["samut sakhon", "สมุทรสาคร"]],
    ["Nakhon Pathom", ["nakhon pathom", "นครปฐม"]],
    ["Phetchaburi", ["phetchaburi", "เพชรบุรี"]],
  ];
  return locations.find(([, aliases]) => aliases.some((alias) => evidence.includes(alias)))?.[0] || "";
}

export class FacebookPlaywrightSourceAdapter extends SourceAdapter {
  constructor({
    profileManager,
    profileId = "fb-buyer-01",
    navigationTimeoutMs = 45_000,
    readerTimings,
    searchReaderOptions,
  } = {}) {
    super();
    if (!profileManager) throw new Error("profile_manager_required");
    this.profileManager = profileManager;
    this.profileId = profileId;
    this.navigationTimeoutMs = navigationTimeoutMs;
    this.readerTimings = readerTimings;
    this.searchReaderOptions = searchReaderOptions || {};
    this.name = "facebook_playwright";
  }

  canHandle(value) {
    try {
      validateFacebookUrl(value);
      return true;
    } catch {
      return false;
    }
  }

  profileStatus() {
    return this.profileManager.getStatus(this.profileId);
  }

  profileIdFor(options = {}) {
    return typeof options.profileId === "string" && options.profileId.trim() ? options.profileId.trim() : this.profileId;
  }

  async search(input, options = {}) {
    const request = normalizeSearchRequest(input);
    const profileId = this.profileIdFor(options);
    const searchUrl = buildFacebookSearchUrl(request);
    const searchPage = await this.profileManager.withPage(
      profileId,
      (page) => collectFacebookSearchCards(page, searchUrl, {
        signal: options.signal,
        navigationTimeoutMs: this.navigationTimeoutMs,
        maxCards: Math.max(20, request.max_results * 4),
        ...this.searchReaderOptions,
      }),
      { signal: options.signal },
    );
    if (searchPage.state === "login_required") throw new Error("facebook_login_required");

    const candidates = [];
    let rejected = 0;
    const inspectLimit = Math.min(searchPage.cards.length, Math.max(request.max_results * 3, request.max_results));
    for (const card of searchPage.cards.slice(0, inspectLimit)) {
      if (options.signal?.aborted) throw options.signal.reason || new Error("cancelled");
      const cardCandidate = normalizeCandidate(card, {
        search_request_id: request.request_id,
        search_run_id: options.runId,
        adapter: this.name,
      });
      const cardMatch = candidateMatchesRequest(cardCandidate, request);
      if (!cardMatch.matches) {
        rejected += 1;
        continue;
      }

      try {
        const listing = await this.openListing(card.source_url, {
          signal: options.signal,
          maxImages: 6,
          profileId,
        });
        const candidate = normalizeCandidate({
          ...card,
          ...listing,
          title: listing.title || card.title,
          location: listing.location || card.location || inferMarketplaceLocation(card.title, card.listing_text, listing.title, listing.listing_text),
          listing_text: listing.listing_text || card.listing_text,
        }, {
          search_request_id: request.request_id,
          search_run_id: options.runId,
          adapter: this.name,
        });
        const match = candidateMatchesRequest(candidate, request);
        if (!match.matches) {
          rejected += 1;
          continue;
        }
        candidates.push(candidate);
        if (candidates.length >= request.max_results) break;
      } catch (error) {
        if (error instanceof Error && error.message === "facebook_login_required") throw error;
        rejected += 1;
      }
    }

    const uniqueCandidates = [...new Map(candidates.map((candidate) => [candidate.candidate_id, candidate])).values()];
    return {
      request,
      profile_id: profileId,
      listings_found: searchPage.cards.length,
      duplicates: Math.max(0, candidates.length - uniqueCandidates.length),
      rejected,
      candidates: uniqueCandidates,
    };
  }

  async openListing(sourceUrl, options = {}) {
    const validatedUrl = validateFacebookUrl(sourceUrl);
    const profileId = this.profileIdFor(options);
    const result = await this.profileManager.withPage(
      profileId,
      (page) => collectFacebookListingOnPage(page, validatedUrl, {
        signal: options.signal,
        maxImages: boundedImageCount(options.maxImages),
        navigationTimeoutMs: this.navigationTimeoutMs,
        timings: options.timings || this.readerTimings,
      }),
      { signal: options.signal },
    );
    if (result.state === "login_required") throw new Error("facebook_login_required");
    if (result.state !== "ok") throw new Error("listing_unavailable");
    return result;
  }
}
