"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { addCaseQuestion, createVehicleCase, initialBuyingBrowserState, requestAvailability, requestInspection } from "./domain.mjs";
import { clearPreviewMedia, hydratePreviewMedia, persistPreviewMedia, stateForLocalStorage } from "./preview-media";
import type { BuyingBrowserState, CustomerIdentity, CustomerListing, GeneralMessage, SourceAdapterStatus, SourceCapture, VehicleCase } from "./types";

type BuyingBrowserContextValue = {
  customer: CustomerIdentity;
  sourceStatus: SourceAdapterStatus;
  state: BuyingBrowserState;
  listings: CustomerListing[];
  hydrated: boolean;
  isSaved: (listingId: string) => boolean;
  toggleSaved: (listingId: string) => void;
  saveAsCase: (listing: CustomerListing, action?: "availability" | "inspection", sourceCapture?: SourceCapture) => string;
  findCaseById: (caseId: string) => VehicleCase | undefined;
  findCaseByListing: (listingId: string) => VehicleCase | undefined;
  requestCaseAvailability: (caseId: string) => void;
  requestCaseInspection: (caseId: string) => void;
  askCaseQuestion: (caseId: string, question: string) => void;
  addImportedListing: (listing: CustomerListing, sourceCapture?: SourceCapture) => void;
  askFindOne: (question: string) => void;
  resetPreview: () => void;
};

const BuyingBrowserContext = createContext<BuyingBrowserContextValue | null>(null);

function validStoredState(value: unknown): value is BuyingBrowserState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BuyingBrowserState>;
  return candidate.version === 1 && Array.isArray(candidate.savedListingIds) && Array.isArray(candidate.cases) && Array.isArray(candidate.importedListings) && Array.isArray(candidate.generalMessages);
}

function withSeedCases(current: BuyingBrowserState, seedCases: VehicleCase[]) {
  const existingListings = new Set(current.cases.map((item) => item.listingId));
  const missingSeeds = seedCases.filter((item) => !existingListings.has(item.listingId));
  if (!missingSeeds.length) return current;
  return {
    ...current,
    savedListingIds: [...new Set([...missingSeeds.map((item) => item.listingId), ...current.savedListingIds])],
    cases: [...missingSeeds, ...current.cases],
  };
}

export function BuyingBrowserProvider({
  customer,
  sourceStatus,
  initialListings,
  seedCases = [],
  children,
}: {
  customer: CustomerIdentity;
  sourceStatus: SourceAdapterStatus;
  initialListings: CustomerListing[];
  seedCases?: VehicleCase[];
  children: ReactNode;
}) {
  const [state, setState] = useState<BuyingBrowserState>(() => withSeedCases(initialBuyingBrowserState(), seedCases));
  const [hydrated, setHydrated] = useState(false);
  const storageKey = useMemo(() => `nk-cars-buying-browser-v1:${customer.id}`, [customer.id]);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      let nextState: BuyingBrowserState | null = null;
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (validStoredState(parsed)) nextState = withSeedCases(await hydratePreviewMedia(storageKey, {
            ...parsed,
            sourceCaptures: Array.isArray(parsed.sourceCaptures) ? parsed.sourceCaptures : [],
            cases: parsed.cases.map((record) => ({ ...record, sourceCaptureId: record.sourceCaptureId || null })),
          }), seedCases);
        }
      } catch {
        // A blocked or corrupt local preview store falls back to a fresh state.
      }
      if (cancelled) return;
      queueMicrotask(() => {
        if (nextState) setState(nextState);
        setHydrated(true);
      });
    }
    void hydrate();
    return () => { cancelled = true; };
  }, [seedCases, storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(stateForLocalStorage(state)));
    } catch {
      // Production persistence will use a server database; preview storage may be unavailable.
    }
  }, [hydrated, state, storageKey]);

  const listings = useMemo(() => {
    const importedIds = new Set(state.importedListings.map((item) => item.id));
    return [...state.importedListings, ...initialListings.filter((item) => !importedIds.has(item.id))];
  }, [initialListings, state.importedListings]);

  function isSaved(listingId: string) {
    return state.savedListingIds.includes(listingId);
  }

  function toggleSaved(listingId: string) {
    setState((current) => ({
      ...current,
      savedListingIds: current.savedListingIds.includes(listingId)
        ? current.savedListingIds.filter((id) => id !== listingId)
        : [listingId, ...current.savedListingIds],
    }));
  }

  function saveAsCase(listing: CustomerListing, action?: "availability" | "inspection", explicitSourceCapture?: SourceCapture) {
    const existing = state.cases.find((item) => item.listingId === listing.id);
    const sourceCapture = explicitSourceCapture || state.sourceCaptures.find((item) => item.listingId === listing.id);
    const { caseRecord } = createVehicleCase(listing, state.cases, customer.id, new Date(), sourceCapture?.id || null);
    const nextRecord = action === "availability" ? requestAvailability(caseRecord) : action === "inspection" ? requestInspection(caseRecord) : caseRecord;
    setState((current) => ({
      ...current,
      savedListingIds: current.savedListingIds.includes(listing.id) ? current.savedListingIds : [listing.id, ...current.savedListingIds],
      importedListings: listing.demo ? current.importedListings : [listing, ...current.importedListings.filter((item) => item.id !== listing.id)],
      sourceCaptures: sourceCapture ? [sourceCapture, ...current.sourceCaptures.filter((item) => item.id !== sourceCapture.id)] : current.sourceCaptures,
      cases: existing ? current.cases.map((item) => item.id === existing.id ? nextRecord : item) : [nextRecord, ...current.cases],
    }));
    return nextRecord.id;
  }

  function updateCase(caseId: string, update: (record: VehicleCase) => VehicleCase) {
    setState((current) => ({ ...current, cases: current.cases.map((record) => record.id === caseId ? update(record) : record) }));
  }

  function requestCaseAvailability(caseId: string) {
    updateCase(caseId, (record) => requestAvailability(record));
  }

  function requestCaseInspection(caseId: string) {
    updateCase(caseId, (record) => requestInspection(record));
  }

  function askCaseQuestion(caseId: string, question: string) {
    updateCase(caseId, (record) => addCaseQuestion(record, question));
  }

  function addImportedListing(listing: CustomerListing, sourceCapture?: SourceCapture) {
    void persistPreviewMedia(storageKey, listing.id, listing.imageUrls);
    setState((current) => ({
      ...current,
      importedListings: [listing, ...current.importedListings.filter((item) => item.id !== listing.id)],
      sourceCaptures: sourceCapture
        ? [sourceCapture, ...current.sourceCaptures.filter((item) => item.id !== sourceCapture.id)]
        : current.sourceCaptures,
    }));
  }

  function askFindOne(question: string) {
    const text = question.trim().slice(0, 1000);
    if (!text) return;
    const now = new Date().toISOString();
    const words = text.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
    const matches = listings.filter((listing) => {
      const haystack = `${listing.title} ${listing.engine} ${listing.transmission} ${listing.drive} ${listing.body} ${listing.generalLocation}`.toLowerCase();
      return words.some((word) => haystack.includes(word));
    }).slice(0, 5);
    const reply = matches.length
      ? `I found ${matches.length} labeled demo result${matches.length === 1 ? "" : "s"} matching parts of your request. Review the vehicles below and keep hard requirements in the filters. Live source search is not connected yet.`
      : "No current demo result matches enough of that request. I recorded the requirement in local preview history. A real source search will require an authorized source session.";
    const messages: GeneralMessage[] = [
      { id: `find-customer-${now}`, sender: "Customer", text, createdAt: now },
      { id: `find-ai-${now}`, sender: "NK AI", text: reply, createdAt: now },
    ];
    setState((current) => ({ ...current, generalMessages: [...current.generalMessages, ...messages] }));
  }

  function resetPreview() {
    void clearPreviewMedia(storageKey);
    setState(initialBuyingBrowserState());
  }

  const value: BuyingBrowserContextValue = {
    customer,
    sourceStatus,
    state,
    listings,
    hydrated,
    isSaved,
    toggleSaved,
    saveAsCase,
    findCaseById: (caseId) => state.cases.find((item) => item.id === caseId),
    findCaseByListing: (listingId) => state.cases.find((item) => item.listingId === listingId),
    requestCaseAvailability,
    requestCaseInspection,
    askCaseQuestion,
    addImportedListing,
    askFindOne,
    resetPreview,
  };

  return <BuyingBrowserContext.Provider value={value}>{children}</BuyingBrowserContext.Provider>;
}

export function useBuyingBrowser() {
  const context = useContext(BuyingBrowserContext);
  if (!context) throw new Error("useBuyingBrowser must be used inside BuyingBrowserProvider");
  return context;
}
