const MAX_STATE_BYTES = 900_000;
const MAX_COLLECTION_ITEMS = 500;
const MAX_TEXT_LENGTH = 20_000;
const CUSTOMER_LISTING_FORBIDDEN_KEYS = new Set([
  "sellerName",
  "sellerPhone",
  "sourceUrl",
  "exactLocation",
  "internalNotes",
  "internalMargin",
  "sourceCost",
  "dealerIdentity",
]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function boundedArray(value, label) {
  if (!Array.isArray(value) || value.length > MAX_COLLECTION_ITEMS) throw new Error(`invalid_${label}`);
  return value;
}

function assertNoForbiddenListingKeys(value, path) {
  if (!isRecord(value)) throw new Error(`invalid_${path}`);
  for (const key of Object.keys(value)) {
    if (CUSTOMER_LISTING_FORBIDDEN_KEYS.has(key)) throw new Error(`internal_field_not_allowed:${path}.${key}`);
  }
}

function assertBoundedStrings(value, path = "state") {
  if (typeof value === "string") {
    if (value.length > MAX_TEXT_LENGTH) throw new Error(`text_too_long:${path}`);
    return;
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) assertBoundedStrings(value[index], `${path}[${index}]`);
    return;
  }
  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) assertBoundedStrings(child, `${path}.${key}`);
  }
}

export function customerWorkspaceId(userId) {
  const normalized = String(userId || "").trim();
  if (!normalized) throw new Error("authenticated_user_required");
  return `chatgpt-${normalized}`;
}

export function validateAndOwnBuyingBrowserState(value, userId) {
  if (!isRecord(value) || value.version !== 1) throw new Error("invalid_workspace_state");
  const savedListingIds = boundedArray(value.savedListingIds, "saved_listings");
  const cases = boundedArray(value.cases, "cases");
  const importedListings = boundedArray(value.importedListings, "imported_listings");
  const sourceCaptures = boundedArray(value.sourceCaptures, "source_captures");
  const generalMessages = boundedArray(value.generalMessages, "general_messages");
  const ownerId = customerWorkspaceId(userId);

  for (const listing of importedListings) assertNoForbiddenListingKeys(listing, "imported_listing");
  for (const vehicleCase of cases) {
    if (!isRecord(vehicleCase)) throw new Error("invalid_case");
    assertNoForbiddenListingKeys(vehicleCase.vehicle, "case.vehicle");
  }

  const state = {
    version: 1,
    savedListingIds: savedListingIds.filter((id) => typeof id === "string").map((id) => id.slice(0, 200)),
    cases: cases.map((vehicleCase) => ({ ...vehicleCase, customerId: ownerId })),
    importedListings,
    sourceCaptures,
    generalMessages,
  };
  assertBoundedStrings(state);
  const json = JSON.stringify(state);
  if (new TextEncoder().encode(json).byteLength > MAX_STATE_BYTES) throw new Error("workspace_state_too_large");
  return state;
}

function mergeById(base, incoming, preferIncoming) {
  const merged = new Map(base.map((item) => [item.id, item]));
  for (const item of incoming) {
    const existing = merged.get(item.id);
    merged.set(item.id, existing ? preferIncoming(existing, item) : item);
  }
  return [...merged.values()];
}

export function mergeBuyingBrowserStates(serverState, localState) {
  if (!serverState) return localState;
  if (!localState) return serverState;
  const newer = (base, incoming) => String(incoming.updatedAt || incoming.createdAt || "") >= String(base.updatedAt || base.createdAt || "") ? incoming : base;
  return {
    version: 1,
    savedListingIds: [...new Set([...localState.savedListingIds, ...serverState.savedListingIds])],
    cases: mergeById(serverState.cases, localState.cases, newer),
    importedListings: mergeById(serverState.importedListings, localState.importedListings, (_base, incoming) => incoming),
    sourceCaptures: mergeById(serverState.sourceCaptures, localState.sourceCaptures, (_base, incoming) => incoming),
    generalMessages: mergeById(serverState.generalMessages, localState.generalMessages, (_base, incoming) => incoming)
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))),
  };
}

export function workspaceSummary(state) {
  return {
    savedVehicles: state.savedListingIds.length,
    vehicleCases: state.cases.length,
    importedListings: state.importedListings.length,
    sourceCaptures: state.sourceCaptures.length,
    messages: state.generalMessages.length + state.cases.reduce((total, item) => total + (Array.isArray(item.messages) ? item.messages.length : 0), 0),
  };
}
