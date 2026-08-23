import type { BuyingBrowserState, CustomerListing } from "./types";

const DATABASE_NAME = "nk-cars-buying-browser-preview";
const STORE_NAME = "listing-media";
const DATABASE_VERSION = 1;

function isEmbeddedImage(url: string) {
  return url.startsWith("data:image/");
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function transactionComplete(transaction: IDBTransaction) {
  return new Promise<void>((resolve) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
    transaction.onabort = () => resolve();
  });
}

function mediaKey(storageKey: string, listingId: string) {
  return `${storageKey}|${listingId}`;
}

function stripEmbeddedImages(listing: CustomerListing): CustomerListing {
  return { ...listing, imageUrls: listing.imageUrls.filter((url) => !isEmbeddedImage(url)) };
}

export function stateForLocalStorage(state: BuyingBrowserState): BuyingBrowserState {
  return {
    ...state,
    importedListings: state.importedListings.map(stripEmbeddedImages),
    cases: state.cases.map((vehicleCase) => ({ ...vehicleCase, vehicle: stripEmbeddedImages(vehicleCase.vehicle) })),
  };
}

export async function persistPreviewMedia(storageKey: string, listingId: string, imageUrls: string[]) {
  const database = await openDatabase();
  if (!database) return;
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const complete = transactionComplete(transaction);
  const store = transaction.objectStore(STORE_NAME);
  const embedded = imageUrls.filter(isEmbeddedImage);
  if (embedded.length) store.put(embedded, mediaKey(storageKey, listingId));
  else store.delete(mediaKey(storageKey, listingId));
  await complete;
  database.close();
}

export async function hydratePreviewMedia(storageKey: string, state: BuyingBrowserState): Promise<BuyingBrowserState> {
  const database = await openDatabase();
  if (!database) return state;
  const listingIds = [...new Set([...state.importedListings.map((item) => item.id), ...state.cases.map((item) => item.listingId)])];
  const transaction = database.transaction(STORE_NAME, "readonly");
  const complete = transactionComplete(transaction);
  const store = transaction.objectStore(STORE_NAME);
  const entries = await Promise.all(listingIds.map((listingId) => new Promise<[string, string[]]>((resolve) => {
    const request = store.get(mediaKey(storageKey, listingId));
    request.onsuccess = () => resolve([listingId, Array.isArray(request.result) ? request.result.filter((value): value is string => typeof value === "string" && isEmbeddedImage(value)) : []]);
    request.onerror = () => resolve([listingId, []]);
  })));
  await complete;
  database.close();
  const media = new Map(entries);
  const restore = (listing: CustomerListing) => {
    const embedded = media.get(listing.id) || [];
    return embedded.length ? { ...listing, imageUrls: [...embedded, ...listing.imageUrls.filter((url) => !isEmbeddedImage(url))] } : listing;
  };
  return {
    ...state,
    importedListings: state.importedListings.map(restore),
    cases: state.cases.map((vehicleCase) => ({ ...vehicleCase, vehicle: restore(vehicleCase.vehicle) })),
  };
}

export async function clearPreviewMedia(storageKey: string) {
  const database = await openDatabase();
  if (!database) return;
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const complete = transactionComplete(transaction);
  const request = transaction.objectStore(STORE_NAME).openCursor();
  request.onsuccess = () => {
    const cursor = request.result;
    if (!cursor) return;
    if (String(cursor.key).startsWith(`${storageKey}|`)) cursor.delete();
    cursor.continue();
  };
  await complete;
  database.close();
}
