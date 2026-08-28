"use client";

import { createContext, useContext, useEffect, useEffectEvent, useMemo, useRef, useState, type ReactNode } from "react";
import { addCaseQuestion, applyCustomerShippingSelection, createVehicleCase, initialBuyingBrowserState, requestAvailability, requestInspection, requestQuotation } from "./domain.mjs";
import { normalizeLanguage } from "./i18n.mjs";
import { loadPricingSettings } from "./pricing-settings";
import { clearPreviewMedia, hydratePreviewMedia, persistPreviewMedia, stateForLocalStorage } from "./preview-media";
import { mergeBuyingBrowserStates } from "./workspace-state.mjs";
import type { BuyingBrowserState, CustomerIdentity, CustomerLanguage, CustomerListing, GeneralMessage, SourceAdapterStatus, SourceCapture, VehicleCase, WorkspaceSyncStatus } from "./types";

type BuyingBrowserContextValue = {
  customer: CustomerIdentity;
  sourceStatus: SourceAdapterStatus;
  state: BuyingBrowserState;
  listings: CustomerListing[];
  hydrated: boolean;
  language: CustomerLanguage;
  workspaceSync: WorkspaceSyncStatus;
  setLanguage: (language: CustomerLanguage) => void;
  isSaved: (listingId: string) => boolean;
  toggleSaved: (listingId: string) => void;
  saveAsCase: (listing: CustomerListing, action?: "availability" | "inspection", sourceCapture?: SourceCapture) => string;
  findCaseById: (caseId: string) => VehicleCase | undefined;
  findCaseByListing: (listingId: string) => VehicleCase | undefined;
  requestCaseAvailability: (caseId: string) => void;
  requestCaseInspection: (caseId: string) => void;
  requestCaseQuotation: (caseId: string) => void;
  updateCaseShippingPlan: (caseId: string, selection: { destinationCountry: string; vehicleQuantity: number }) => void;
  acceptCaseQuotation: (caseId: string, quotationNumber: string) => Promise<void>;
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
  durableAccount = false,
  legacyCustomerId,
  children,
}: {
  customer: CustomerIdentity;
  sourceStatus: SourceAdapterStatus;
  initialListings: CustomerListing[];
  seedCases?: VehicleCase[];
  durableAccount?: boolean;
  legacyCustomerId?: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<BuyingBrowserState>(() => withSeedCases(initialBuyingBrowserState(), seedCases));
  const [hydrated, setHydrated] = useState(false);
  const [language, setLanguageState] = useState<CustomerLanguage>("en");
  const [workspaceSync, setWorkspaceSync] = useState<WorkspaceSyncStatus>({
    mode: durableAccount ? "syncing" : "local",
    message: durableAccount ? "Connecting secure account workspace" : "Stored on this device only",
    updatedAt: null,
  });
  const storageKey = useMemo(() => `nk-cars-buying-browser-v1:${customer.id}`, [customer.id]);
  const legacyStorageKey = useMemo(() => legacyCustomerId ? `nk-cars-buying-browser-v1:${legacyCustomerId}` : null, [legacyCustomerId]);
  const languageStorageKey = useMemo(() => `nk-cars-language:${customer.id}`, [customer.id]);
  const revisionRef = useRef(0);
  const serverReadyRef = useRef(false);
  const pendingServerStateRef = useRef<BuyingBrowserState | null>(null);
  const syncingRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushServerState = useEffectEvent(async () => {
    if (!durableAccount || syncingRef.current || !serverReadyRef.current) return;
    syncingRef.current = true;
    let attempts = 0;
    try {
      while (pendingServerStateRef.current && attempts < 4) {
        attempts += 1;
        const snapshot = pendingServerStateRef.current;
        pendingServerStateRef.current = null;
        setWorkspaceSync((current) => ({ ...current, mode: "syncing", message: "Saving account workspace" }));
        const response = await fetch("/api/buying-browser/workspace", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ state: snapshot, expectedRevision: revisionRef.current }),
        });
        const payload = await response.json().catch(() => null);
        if (response.status === 409 && payload && validStoredState(payload.state)) {
          revisionRef.current = Number(payload.revision) || 0;
          const merged = mergeBuyingBrowserStates(payload.state, snapshot) as BuyingBrowserState;
          pendingServerStateRef.current = merged;
          setState(merged);
          continue;
        }
        if (!response.ok) throw new Error(payload?.error || "workspace_sync_failed");
        revisionRef.current = Number(payload.revision) || revisionRef.current + 1;
        setWorkspaceSync({ mode: "synced", message: "Saved to secure account workspace", updatedAt: payload.updatedAt || new Date().toISOString() });
      }
      if (pendingServerStateRef.current) throw new Error("workspace_sync_conflict");
    } catch {
      setWorkspaceSync((current) => ({ ...current, mode: "error", message: "Account sync unavailable; this device copy is preserved" }));
    } finally {
      syncingRef.current = false;
      if (pendingServerStateRef.current && serverReadyRef.current) {
        syncTimerRef.current = setTimeout(() => void flushServerState(), 1000);
      }
    }
  });

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      let nextState: BuyingBrowserState | null = null;
      try {
        setLanguageState(normalizeLanguage(window.localStorage.getItem(languageStorageKey)) as CustomerLanguage);
        const raw = window.localStorage.getItem(storageKey) || (legacyStorageKey ? window.localStorage.getItem(legacyStorageKey) : null);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (validStoredState(parsed)) nextState = withSeedCases(await hydratePreviewMedia(storageKey, {
            ...parsed,
            sourceCaptures: Array.isArray(parsed.sourceCaptures) ? parsed.sourceCaptures : [],
            cases: parsed.cases.map((record) => ({
              ...record,
              sourceCaptureId: record.sourceCaptureId || null,
              actualVehiclePurchasePriceThb: record.actualVehiclePurchasePriceThb ?? null,
              platformTransactionRate: record.platformTransactionRate ?? 6,
              buyingServiceRate: record.buyingServiceRate ?? 4,
              quotationRequest: record.quotationRequest ?? null,
              quotation: record.quotation ?? null,
              proformaInvoice: record.proformaInvoice ?? null,
              translationHistory: Array.isArray(record.translationHistory) ? record.translationHistory : [],
            })),
          }), seedCases);
        }
      } catch {
        // A blocked or corrupt local preview store falls back to a fresh state.
      }
      if (durableAccount) {
        try {
          const response = await fetch("/api/buying-browser/workspace", { cache: "no-store" });
          const payload = await response.json().catch(() => null);
          if (!response.ok) throw new Error(payload?.error || "workspace_load_failed");
          revisionRef.current = Number(payload.revision) || 0;
          if (validStoredState(payload.state)) nextState = mergeBuyingBrowserStates(payload.state, nextState) as BuyingBrowserState;
          serverReadyRef.current = true;
          setWorkspaceSync({ mode: "synced", message: payload.state ? "Loaded from secure account workspace" : "Secure account workspace ready", updatedAt: payload.updatedAt || null });
        } catch {
          setWorkspaceSync({ mode: "error", message: "Account sync unavailable; using this device copy", updatedAt: null });
        }
      }
      if (cancelled) return;
      queueMicrotask(() => {
        if (nextState) setState(nextState);
        setHydrated(true);
      });
    }
    void hydrate();
    return () => { cancelled = true; };
  }, [durableAccount, languageStorageKey, legacyStorageKey, seedCases, storageKey]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(stateForLocalStorage(state)));
    } catch {
      // Production persistence will use a server database; preview storage may be unavailable.
    }
    if (durableAccount && serverReadyRef.current) {
      pendingServerStateRef.current = stateForLocalStorage(state);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => void flushServerState(), 500);
    }
  }, [durableAccount, hydrated, state, storageKey]);

  useEffect(() => () => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
  }, []);

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
    const { caseRecord } = createVehicleCase(listing, state.cases, customer.id, new Date(), sourceCapture?.id || null, loadPricingSettings());
    const nextRecord = action === "availability" ? requestAvailability(caseRecord, new Date(), language) : action === "inspection" ? requestInspection(caseRecord, new Date(), language) : caseRecord;
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
    updateCase(caseId, (record) => requestAvailability(record, new Date(), language));
  }

  function requestCaseInspection(caseId: string) {
    updateCase(caseId, (record) => requestInspection(record, new Date(), language));
  }

  function askCaseQuestion(caseId: string, question: string) {
    updateCase(caseId, (record) => addCaseQuestion(record, question, new Date(), language));
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
    const reply = language === "zh-CN"
      ? (matches.length ? `找到 ${matches.length} 个与部分需求匹配的当前结果。请查看车辆，并在筛选器中保留硬性条件。实时来源搜索尚未连接。` : "当前结果没有足够匹配的车辆。需求已记录在本地预览历史中；真实来源搜索需要授权会话。")
      : language === "th"
        ? (matches.length ? `พบรถปัจจุบัน ${matches.length} คันที่ตรงกับบางส่วนของคำขอ โปรดตรวจสอบรถและคงเงื่อนไขสำคัญไว้ในตัวกรอง การค้นหาแหล่งจริงยังไม่ได้เชื่อมต่อ` : "ยังไม่พบรถปัจจุบันที่ตรงกับคำขอเพียงพอ ระบบบันทึกความต้องการไว้ในประวัติตัวอย่างแล้ว การค้นหาแหล่งจริงต้องใช้เซสชันที่ได้รับอนุญาต")
        : (matches.length ? `I found ${matches.length} current result${matches.length === 1 ? "" : "s"} matching parts of your request. Review the vehicles below and keep hard requirements in the filters. Live source search is not connected yet.` : "No current result matches enough of that request. I recorded the requirement in local preview history. A real source search will require an authorized source session.");
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

  function requestCaseQuotation(caseId: string) {
    updateCase(caseId, (record) => requestQuotation(record, new Date(), language));
  }

  function updateCaseShippingPlan(caseId: string, selection: { destinationCountry: string; vehicleQuantity: number }) {
    updateCase(caseId, (record) => applyCustomerShippingSelection(record, selection, new Date()));
  }

  async function acceptCaseQuotation(caseId: string, quotationNumber: string) {
    if (!durableAccount) throw new Error("authentication_required");
    const response = await fetch("/api/buying-browser/quotation/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseId, quotationNumber }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !validStoredState(payload?.state)) {
      if (response.status === 409) {
        const latestResponse = await fetch("/api/buying-browser/workspace", { cache: "no-store" });
        const latest = await latestResponse.json().catch(() => null);
        if (latestResponse.ok && validStoredState(latest?.state)) {
          revisionRef.current = Number(latest.revision) || revisionRef.current;
          setState(latest.state);
        }
      }
      throw new Error(payload?.error || "quotation_acceptance_failed");
    }
    revisionRef.current = Number(payload.revision) || revisionRef.current + 1;
    pendingServerStateRef.current = null;
    setState(payload.state);
    setWorkspaceSync({ mode: "synced", message: "Quotation acceptance saved to secure account workspace", updatedAt: payload.updatedAt || new Date().toISOString() });
  }

  function setLanguage(nextLanguage: CustomerLanguage) {
    const normalized = normalizeLanguage(nextLanguage) as CustomerLanguage;
    setLanguageState(normalized);
    try { window.localStorage.setItem(languageStorageKey, normalized); } catch { /* Language still applies for this session. */ }
  }

  const value: BuyingBrowserContextValue = {
    customer,
    sourceStatus,
    state,
    listings,
    hydrated,
    language,
    workspaceSync,
    setLanguage,
    isSaved,
    toggleSaved,
    saveAsCase,
    findCaseById: (caseId) => state.cases.find((item) => item.id === caseId),
    findCaseByListing: (listingId) => state.cases.find((item) => item.listingId === listingId),
    requestCaseAvailability,
    requestCaseInspection,
    requestCaseQuotation,
    updateCaseShippingPlan,
    acceptCaseQuotation,
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
