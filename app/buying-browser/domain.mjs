import { normalizeLanguage, translate } from "./i18n.mjs";

export const DEFAULT_PLATFORM_TRANSACTION_RATE = 6;
export const DEFAULT_BUYING_SERVICE_RATE = 4;
export const DEFAULT_TOTAL_NK_FEE_TARGET = 10;
export const CUSTOMER_FX_THB_PER_USD = 35;
export const BANGKOK_METRO_LOCATIONS = Object.freeze([
  "Bangkok",
  "Nonthaburi",
  "Pathum Thani",
  "Samut Prakan",
  "Samut Sakhon",
  "Nakhon Pathom",
]);
export const NEARBY_BANGKOK_LOCATIONS = Object.freeze([
  "Ayutthaya",
  "Chachoengsao",
  "Chon Buri",
]);
export const BANGKOK_INSPECTION_FEE_THB = 5000;
export const OUTSIDE_BANGKOK_INSPECTION_RATE_THB_PER_KM = 20;
export const THREE_CAR_CONTAINER_LOADING_FEE_THB = 25000;
export const SHIPPING_PLANNING_BUFFER_RATE = 0.15;
export const SHIPPING_DESTINATIONS = Object.freeze([
  { country: "Kenya", port: "Mombasa", estimateUsdLow: 5100, estimateUsdHigh: 6800, estimateSource: "Public 40ft Kenya market benchmarks; verify Thailand route before booking.", routeType: "Direct port", routeNote: "Port-country shipment. Inland delivery beyond the port is quoted separately when required.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Tanzania", port: "Dar es Salaam", estimateUsdLow: 9300, estimateUsdHigh: 9300, estimateSource: "Public Thailand to Dar es Salaam 40ft quote sample; verify before booking.", routeType: "Direct port", routeNote: "Port-country shipment. Inland delivery beyond the port is quoted separately when required.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Zambia", port: "Dar es Salaam", estimateUsdLow: 9300, estimateUsdHigh: 9300, estimateSource: "Ocean freight estimate to Dar es Salaam only; inland Zambia charges excluded.", routeType: "Transit / landlocked", routeNote: "Ocean freight is to Dar es Salaam gateway only. Inland transit to Zambia, border, clearing, and local delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Malawi", port: "Beira", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "No reliable public Thailand-to-Beira rate found; NK quote required.", routeType: "Transit / landlocked", routeNote: "Likely gateway is Beira or Dar es Salaam. Inland Malawi transit, border, clearing, and local delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Zimbabwe", port: "Maputo", estimateUsdLow: 2700, estimateUsdHigh: 5500, estimateSource: "Public 2026 Maputo 40ft regional benchmark; verify Thailand route before booking.", routeType: "Transit / landlocked", routeNote: "Ocean freight is to Maputo gateway only. Inland transit to Zimbabwe, border, clearing, and local delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Mozambique", port: "Maputo", estimateUsdLow: 2700, estimateUsdHigh: 5500, estimateSource: "Public 2026 Maputo 40ft regional benchmark; verify Thailand route before booking.", routeType: "Direct port", routeNote: "Port-country shipment. Inland delivery beyond Maputo is quoted separately when required.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Ghana", port: "Tema", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "No reliable public Thailand-to-Tema rate found; NK quote required.", routeType: "Direct port / import rule check", routeNote: "Port-country shipment. Ghana is included for quote handling, but right-hand-drive vehicle eligibility must be checked before quote issue.", importNote: "Import eligibility requires NK/local agent confirmation before final quote." },
  { country: "Uganda", port: "Mombasa", estimateUsdLow: 5100, estimateUsdHigh: 6800, estimateSource: "Ocean freight estimate to Mombasa only; inland Uganda charges excluded.", routeType: "Transit / landlocked", routeNote: "Ocean freight is to Mombasa gateway only. Inland transit to Uganda, border, clearing, and local delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "South Africa", port: "Durban", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "No reliable public Thailand-to-Durban rate found; NK quote required.", routeType: "Direct port", routeNote: "Port-country shipment. Inland delivery beyond the port is quoted separately when required.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Australia", port: "Fremantle / Melbourne", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-Australia route and compliance costs.", routeType: "Direct port / strict compliance", routeNote: "Ocean freight can be planned to a main Australian port. Import approval, quarantine, asbestos/compliance, and local charges must be checked before quotation.", importNote: "Right-hand-drive market, but import rules are strict and must be confirmed before final quote." },
  { country: "Bangladesh", port: "Chattogram", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-Chattogram route.", routeType: "Direct port", routeNote: "Port-country shipment. Inland delivery beyond the port is quoted separately when required.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Barbados", port: "Bridgetown", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for Caribbean transshipment route.", routeType: "Island / transshipment", routeNote: "Likely requires transshipment. Port fees, local clearing, and inland delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Botswana", port: "Durban", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required; ocean freight to Durban and inland Botswana transit must be confirmed together.", routeType: "Transit / landlocked", routeNote: "Ocean freight is to Durban gateway only. Inland transit to Botswana, border, clearing, and local delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Brunei", port: "Muara", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-Muara route.", routeType: "Direct port", routeNote: "Port-country shipment. Inland delivery beyond the port is quoted separately when required.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Cyprus", port: "Limassol", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-Limassol route.", routeType: "Island / direct port", routeNote: "Island port shipment. Local port, clearing, and registration costs are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Eswatini", port: "Durban / Maputo", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required; gateway can be Durban or Maputo depending on booking.", routeType: "Transit / landlocked", routeNote: "Ocean freight is to the selected gateway port only. Inland transit to Eswatini, border, clearing, and local delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Fiji", port: "Suva", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for Pacific island transshipment route.", routeType: "Island / transshipment", routeNote: "Likely requires transshipment. Port fees, local clearing, and inland delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Guyana", port: "Georgetown", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for South America/Caribbean transshipment route.", routeType: "Direct port / transshipment", routeNote: "Route may require transshipment. Port fees, local clearing, and inland delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Hong Kong", port: "Hong Kong", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-Hong Kong route and compliance costs.", routeType: "Direct port / strict compliance", routeNote: "Port-city shipment. Import approval, compliance, and local registration costs must be checked before quotation.", importNote: "Right-hand-drive market, but import rules must be confirmed before final quote." },
  { country: "India", port: "Chennai / Nhava Sheva", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-India route and import compliance.", routeType: "Direct port / strict compliance", routeNote: "Ocean freight can be planned to a main Indian port. Import approval, compliance, port charges, and local delivery must be checked before quotation.", importNote: "Right-hand-drive market, but import rules are strict and must be confirmed before final quote." },
  { country: "Ireland", port: "Dublin", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-Dublin route and compliance costs.", routeType: "Direct port / strict compliance", routeNote: "Port-country shipment. VAT/duty, compliance, registration, and local delivery are quoted separately.", importNote: "Right-hand-drive market, but import rules must be confirmed before final quote." },
  { country: "Jamaica", port: "Kingston", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for Caribbean transshipment route.", routeType: "Island / transshipment", routeNote: "Likely requires transshipment. Port fees, local clearing, and inland delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Japan", port: "Yokohama / Kobe", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-Japan route and compliance costs.", routeType: "Direct port / strict compliance", routeNote: "Port-country shipment. Compliance, inspection, and local registration costs must be checked before quotation.", importNote: "Right-hand-drive market, but import rules must be confirmed before final quote." },
  { country: "Lesotho", port: "Durban", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required; ocean freight to Durban and inland Lesotho transit must be confirmed together.", routeType: "Transit / landlocked", routeNote: "Ocean freight is to Durban gateway only. Inland transit to Lesotho, border, clearing, and local delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Malaysia", port: "Port Klang", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-Port Klang route and import compliance.", routeType: "Direct port / strict compliance", routeNote: "Port-country shipment. Import approval, compliance, and local registration costs must be checked before quotation.", importNote: "Right-hand-drive market, but import rules must be confirmed before final quote." },
  { country: "Mauritius", port: "Port Louis", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for Indian Ocean island route.", routeType: "Island / direct port", routeNote: "Island port shipment. Port fees, local clearing, and inland delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Namibia", port: "Walvis Bay", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-Walvis Bay route.", routeType: "Direct port", routeNote: "Port-country shipment. Inland delivery beyond the port is quoted separately when required.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Nepal", port: "Kolkata / Haldia", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required; ocean freight to India gateway and inland Nepal transit must be confirmed together.", routeType: "Transit / landlocked", routeNote: "Ocean freight is to an India gateway only. Inland transit to Nepal, border, clearing, and local delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "New Zealand", port: "Auckland", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-Auckland route and compliance costs.", routeType: "Direct port / strict compliance", routeNote: "Port-country shipment. Import approval, compliance, biosecurity, and local delivery must be checked before quotation.", importNote: "Right-hand-drive market, but import rules are strict and must be confirmed before final quote." },
  { country: "Pakistan", port: "Karachi", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-Karachi route and import compliance.", routeType: "Direct port / strict compliance", routeNote: "Port-country shipment. Import approval, compliance, and local delivery must be checked before quotation.", importNote: "Right-hand-drive market, but import rules must be confirmed before final quote." },
  { country: "Papua New Guinea", port: "Port Moresby", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for Pacific island route.", routeType: "Island / direct port", routeNote: "Island port shipment. Port fees, local clearing, and inland delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Rwanda", port: "Dar es Salaam / Mombasa", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required; gateway and inland Rwanda transit must be confirmed together.", routeType: "Transit / landlocked", routeNote: "Ocean freight is to the selected gateway port only. Inland transit to Rwanda, border, clearing, and local delivery are quoted separately.", importNote: "Traffic/import eligibility requires NK/local agent confirmation before final quote." },
  { country: "Seychelles", port: "Port Victoria", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for Indian Ocean island route.", routeType: "Island / direct port", routeNote: "Island port shipment. Port fees, local clearing, and inland delivery are quoted separately.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Singapore", port: "Singapore", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-Singapore route and strict import compliance.", routeType: "Direct port / strict compliance", routeNote: "Port-city shipment. Import approval, compliance, quota/tax, and registration costs must be checked before quotation.", importNote: "Right-hand-drive market, but import rules are strict and must be confirmed before final quote." },
  { country: "Sri Lanka", port: "Colombo", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-Colombo route and import compliance.", routeType: "Direct port", routeNote: "Port-country shipment. Inland delivery beyond the port is quoted separately when required.", importNote: "Right-hand-drive market; final import eligibility still requires NK/local agent check." },
  { country: "Thailand", port: "Laem Chabang / Bangkok", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "Domestic delivery or export not required; NK quote required for any special logistics.", routeType: "Domestic / no ocean freight", routeNote: "No international ocean freight is assumed. Domestic transport is handled under Domestic Transport, not Export / Shipping.", importNote: "Thailand uses right-hand-drive vehicles." },
  { country: "United Kingdom", port: "Southampton / Felixstowe", estimateUsdLow: null, estimateUsdHigh: null, estimateSource: "NK quote required for current Thailand-to-UK route and compliance costs.", routeType: "Direct port / strict compliance", routeNote: "Port-country shipment. VAT/duty, compliance, registration, and local delivery are quoted separately.", importNote: "Right-hand-drive market, but import rules must be confirmed before final quote." },
]);

export function formatCustomerUsd(value) {
  if (value === null || value === undefined) return "Pending";
  return `USD ${Math.round(value / CUSTOMER_FX_THB_PER_USD).toLocaleString("en-US")}`;
}

export function customerUsdToThb(value) {
  const amountUsd = Number(value);
  return value && Number.isFinite(amountUsd) ? String(amountUsd * CUSTOMER_FX_THB_PER_USD) : "";
}

/** @type {import("./types").BrowseFilters} */
export const DEFAULT_FILTERS = Object.freeze({
  query: "",
  location: "Bangkok Metro",
  yearFrom: "",
  yearTo: "",
  priceMin: "",
  priceMax: "",
  mileageMax: "",
  transmission: "Any",
  drive: "Any",
  body: "Any",
  sort: "recommended",
});

const INSPECTION_LOCATIONS = [
  { location: "Bangkok", region: "Bangkok", distanceKm: 0 },
  { location: "Nonthaburi", region: "Outside Bangkok", distanceKm: 18 },
  { location: "Pathum Thani", region: "Outside Bangkok", distanceKm: 42 },
  { location: "Samut Prakan", region: "Outside Bangkok", distanceKm: 32 },
  { location: "Samut Sakhon", region: "Outside Bangkok", distanceKm: 39 },
  { location: "Nakhon Pathom", region: "Outside Bangkok", distanceKm: 58 },
  { location: "Ayutthaya", region: "Outside Bangkok", distanceKm: 81 },
  { location: "Chachoengsao", region: "Outside Bangkok", distanceKm: 72 },
  { location: "Saraburi", region: "Outside Bangkok", distanceKm: 108 },
  { location: "Suphan Buri", region: "Outside Bangkok", distanceKm: 110 },
  { location: "Chon Buri", region: "Outside Bangkok", distanceKm: 85 },
  { location: "Pattaya", region: "Outside Bangkok", distanceKm: 150 },
  { location: "Rayong", region: "Outside Bangkok", distanceKm: 179 },
  { location: "Chanthaburi", region: "Outside Bangkok", distanceKm: 245 },
  { location: "Nakhon Ratchasima", region: "Outside Bangkok", distanceKm: 260 },
  { location: "Khon Kaen", region: "Outside Bangkok", distanceKm: 450 },
  { location: "Udon Thani", region: "Outside Bangkok", distanceKm: 565 },
  { location: "Ubon Ratchathani", region: "Outside Bangkok", distanceKm: 630 },
  { location: "Phitsanulok", region: "Outside Bangkok", distanceKm: 377 },
  { location: "Lampang", region: "Outside Bangkok", distanceKm: 600 },
  { location: "Chiang Mai", region: "Outside Bangkok", distanceKm: 700 },
  { location: "Chiang Rai", region: "Outside Bangkok", distanceKm: 785 },
  { location: "Surat Thani", region: "Outside Bangkok", distanceKm: 645 },
  { location: "Nakhon Si Thammarat", region: "Outside Bangkok", distanceKm: 780 },
  { location: "Phuket", region: "Outside Bangkok", distanceKm: 840 },
  { location: "Songkhla", region: "Outside Bangkok", distanceKm: 950 },
];

const numberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const safeTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

/**
 * @param {import("./types").CustomerListing[]} listings
 * @param {import("./types").BrowseFilters} filters
 * @returns {import("./types").CustomerListing[]}
 */
export function filterListings(listings, filters = DEFAULT_FILTERS) {
  const query = String(filters.query || "").trim().toLowerCase();
  const yearFrom = numberOrNull(filters.yearFrom);
  const yearTo = numberOrNull(filters.yearTo);
  const priceMin = numberOrNull(filters.priceMin);
  const priceMax = numberOrNull(filters.priceMax);
  const mileageMax = numberOrNull(filters.mileageMax);
  const results = listings.filter((listing) => {
    const haystack = [listing.title, listing.brand, listing.model, listing.grade, listing.engine, listing.body, listing.color, listing.generalLocation].filter(Boolean).join(" ").toLowerCase();
    if (query && !query.split(/\s+/).every((part) => haystack.includes(part))) return false;
    if (filters.location && filters.location !== "All Thailand") {
      const allowedLocations = filters.location === "Bangkok Metro"
        ? BANGKOK_METRO_LOCATIONS
        : filters.location === "Nearby Provinces"
          ? NEARBY_BANGKOK_LOCATIONS
          : null;
      if (allowedLocations ? !allowedLocations.includes(listing.generalLocation) : listing.generalLocation !== filters.location) return false;
    }
    if (yearFrom !== null && (listing.year === null || listing.year < yearFrom)) return false;
    if (yearTo !== null && (listing.year === null || listing.year > yearTo)) return false;
    if (priceMin !== null && (listing.observedPriceThb === null || listing.observedPriceThb < priceMin)) return false;
    if (priceMax !== null && (listing.observedPriceThb === null || listing.observedPriceThb > priceMax)) return false;
    if (mileageMax !== null && (listing.mileageKm === null || listing.mileageKm > mileageMax)) return false;
    if (filters.transmission && filters.transmission !== "Any" && listing.transmission !== filters.transmission) return false;
    if (filters.drive && filters.drive !== "Any" && listing.drive !== filters.drive) return false;
    if (filters.body && filters.body !== "Any" && listing.body !== filters.body) return false;
    return true;
  });
  const sorted = [...results];
  if (filters.sort === "price-low") sorted.sort((a, b) => (a.observedPriceThb ?? Number.MAX_SAFE_INTEGER) - (b.observedPriceThb ?? Number.MAX_SAFE_INTEGER));
  if (filters.sort === "price-high") sorted.sort((a, b) => (b.observedPriceThb ?? -1) - (a.observedPriceThb ?? -1));
  if (filters.sort === "year-new") sorted.sort((a, b) => (b.year ?? -1) - (a.year ?? -1));
  if (filters.sort === "mileage-low") sorted.sort((a, b) => (a.mileageKm ?? Number.MAX_SAFE_INTEGER) - (b.mileageKm ?? Number.MAX_SAFE_INTEGER));
  return sorted;
}

export function listingVisibleForChannel(listing, channel = "nk") {
  if (channel === "hispeed") return listing?.visibleOnHispeed !== false;
  return listing?.visibleOnNk !== false;
}

export function inspectionQuoteForLocation(location) {
  const normalized = String(location || "").toLowerCase();
  const matched = INSPECTION_LOCATIONS.find((item) => normalized.includes(item.location.toLowerCase()));
  if (!matched) return null;
  const isBangkokMetro = BANGKOK_METRO_LOCATIONS.includes(matched.location);
  const outsideBangkokFeeThb = Math.max(BANGKOK_INSPECTION_FEE_THB, matched.distanceKm * OUTSIDE_BANGKOK_INSPECTION_RATE_THB_PER_KM);
  const totalThb = isBangkokMetro ? BANGKOK_INSPECTION_FEE_THB : outsideBangkokFeeThb;
  return {
    region: isBangkokMetro ? "Bangkok Metro" : `${matched.region} - ${matched.distanceKm} km`,
    baseFeeThb: BANGKOK_INSPECTION_FEE_THB,
    travelFeeThb: isBangkokMetro ? 0 : totalThb - BANGKOK_INSPECTION_FEE_THB,
    totalThb,
    status: "Quote Ready",
  };
}

export function normalizeShippingVehicleQuantity(value) {
  const parsed = Math.trunc(Number(value));
  return [1, 2, 3].includes(parsed) ? parsed : 1;
}

export function shippingDestinationForCountry(country) {
  const normalized = String(country || "").trim().toLowerCase();
  return SHIPPING_DESTINATIONS.find((item) => item.country.toLowerCase() === normalized) || null;
}

function shippingPlanningBenchmarkForDestination(destination) {
  if (!destination) return { low: null, high: null, source: null, group: null };
  if (destination.country === "Thailand") return { low: null, high: null, source: destination.estimateSource, group: "Domestic / no ocean freight" };
  if (destination.estimateUsdLow !== null && destination.estimateUsdLow !== undefined && destination.estimateUsdHigh !== null && destination.estimateUsdHigh !== undefined) {
    return { low: destination.estimateUsdLow, high: destination.estimateUsdHigh, source: destination.estimateSource, group: "Public route benchmark" };
  }

  const route = `${destination.country} ${destination.port} ${destination.routeType || ""}`.toLowerCase();
  if (route.includes("mombasa")) {
    return { low: 5100, high: 6800, source: "Planning benchmark group: Mombasa / East Africa gateway. NK must confirm live booking rate and inland transit before final quote.", group: "Mombasa / East Africa gateway" };
  }
  if (route.includes("dar es salaam")) {
    return { low: 9300, high: 9300, source: "Planning benchmark group: Dar es Salaam / East Africa gateway. NK must confirm live booking rate and inland transit before final quote.", group: "Dar es Salaam / East Africa gateway" };
  }
  if (/(maputo|beira|durban|walvis bay)/.test(route)) {
    return { low: 2700, high: 5500, source: "Planning benchmark group: Southern Africa gateway. NK must confirm the live port, booking rate, and inland transit before final quote.", group: "Southern Africa gateway" };
  }
  if (/(australia|new zealand|fiji|papua new guinea|seyc?helles|mauritius)/.test(route)) {
    return { low: 5100, high: 6800, source: "Planning benchmark group: Pacific / Indian Ocean RHD markets. NK must confirm live booking, transshipment, and compliance costs before final quote.", group: "Pacific / Indian Ocean RHD markets" };
  }
  if (/(singapore|malaysia|brunei|bangladesh|sri lanka|india|pakistan|nepal|japan|hong kong)/.test(route)) {
    return { low: 2700, high: 5500, source: "Planning benchmark group: Asia RHD markets. NK must confirm live booking rate, import eligibility, and compliance costs before final quote.", group: "Asia RHD markets" };
  }
  if (/(united kingdom|ireland|cyprus|barbados|jamaica|guyana|ghana)/.test(route)) {
    return { low: 9300, high: 9300, source: "Planning benchmark group: long-haul RHD markets. NK must confirm live booking, transshipment, and import costs before final quote.", group: "Long-haul RHD markets" };
  }
  return { low: 9300, high: 9300, source: "Planning benchmark group: fallback RHD market. NK must confirm live booking and route costs before final quote.", group: "Fallback RHD market" };
}

function planningFreightHigh(estimateHigh) {
  return estimateHigh === null || estimateHigh === undefined
    ? null
    : Math.ceil((estimateHigh * (1 + SHIPPING_PLANNING_BUFFER_RATE)) / 100) * 100;
}

function customerUsdFromThb(valueThb) {
  return Math.round(valueThb / CUSTOMER_FX_THB_PER_USD);
}

function perVehicleEstimate(valueUsd, quantity) {
  return valueUsd === null || valueUsd === undefined ? null : Math.round(valueUsd / quantity);
}

function midpointEstimate(lowUsd, highUsd) {
  return lowUsd === null || lowUsd === undefined || highUsd === null || highUsd === undefined
    ? null
    : Math.round((lowUsd + highUsd) / 2);
}

export function shippingPlanForSelection(destinationCountry, vehicleQuantity = 1) {
  const destination = shippingDestinationForCountry(destinationCountry);
  const quantity = normalizeShippingVehicleQuantity(vehicleQuantity);
  const benchmark = shippingPlanningBenchmarkForDestination(destination);
  const indicativeFreightUsdLow = benchmark.low;
  const indicativeFreightUsdHigh = benchmark.high;
  const containerLoadingFeeThb = quantity === 3 ? THREE_CAR_CONTAINER_LOADING_FEE_THB : 0;
  const containerLoadingFeeUsd = containerLoadingFeeThb ? customerUsdFromThb(containerLoadingFeeThb) : 0;
  const containerLoadingPerVehicleUsd = containerLoadingFeeThb ? customerUsdFromThb(containerLoadingFeeThb / quantity) : 0;
  const planningFreightUsdHigh = planningFreightHigh(indicativeFreightUsdHigh);
  const planningShipmentUsdLow = indicativeFreightUsdLow === null ? null : indicativeFreightUsdLow + containerLoadingFeeUsd;
  const planningShipmentUsdHigh = planningFreightUsdHigh === null ? null : planningFreightUsdHigh + containerLoadingFeeUsd;
  return {
    destinationCountry: destination?.country || null,
    destinationPort: destination?.port || null,
    vehicleQuantity: quantity,
    containerLoadingFeeThb,
    containerLoadingFeeUsd,
    containerLoadingPerVehicleUsd,
    indicativeFreightUsdLow,
    indicativeFreightUsdHigh,
    planningFreightUsdLow: indicativeFreightUsdLow,
    planningFreightUsdHigh,
    planningShipmentUsdLow,
    planningShipmentUsdHigh,
    planningPerVehicleUsdLow: perVehicleEstimate(planningShipmentUsdLow, quantity),
    planningPerVehicleUsdHigh: perVehicleEstimate(planningShipmentUsdHigh, quantity),
    planningShipmentUsdMid: midpointEstimate(planningShipmentUsdLow, planningShipmentUsdHigh),
    planningPerVehicleUsdMid: midpointEstimate(perVehicleEstimate(planningShipmentUsdLow, quantity), perVehicleEstimate(planningShipmentUsdHigh, quantity)),
    planningBufferRate: SHIPPING_PLANNING_BUFFER_RATE,
    indicativeFreightSource: benchmark.source,
    benchmarkGroup: benchmark.group,
    routeType: destination?.routeType ?? null,
    routeNote: destination?.routeNote ?? null,
    importNote: destination?.importNote ?? null,
    freightRateStatus: destination ? "Pending - rate source required" : "Pending - destination required",
  };
}

export function applyCustomerShippingSelection(caseRecord, selection, now = new Date()) {
  const createdAt = safeTime(now);
  const plan = shippingPlanForSelection(selection?.destinationCountry, selection?.vehicleQuantity);
  const priorShippingMessagePrefix = `${caseRecord.id}-shipping-plan-`;
  const priorShippingTimelinePrefix = `${caseRecord.id}-shipping-plan-timeline-`;
  return {
    ...caseRecord,
    updatedAt: createdAt,
    shippingDestinationCountry: plan.destinationCountry,
    shippingDestinationPort: plan.destinationPort,
    shippingVehicleQuantity: plan.vehicleQuantity,
    shippingContainerLoadingFeeThb: plan.containerLoadingFeeThb,
    messages: [...caseRecord.messages.filter((item) => !String(item.id).startsWith(priorShippingMessagePrefix)), {
      id: `${caseRecord.id}-shipping-plan-${createdAt}`,
      sender: "System",
      text: plan.destinationCountry
        ? `Customer selected ${plan.vehicleQuantity} vehicle${plan.vehicleQuantity === 1 ? "" : "s"} for ${plan.destinationCountry} via ${plan.destinationPort}. Ocean freight remains pending until NK uses an approved rate source.`
        : "Customer cleared the shipping destination. Ocean freight remains pending.",
      createdAt,
      delivery: "Recorded",
    }],
    timeline: [...caseRecord.timeline.filter((item) => !String(item.id).startsWith(priorShippingTimelinePrefix)), {
      id: `${caseRecord.id}-shipping-plan-timeline-${createdAt}`,
      title: "Shipping plan selected",
      detail: plan.destinationCountry
        ? `${plan.destinationCountry} / ${plan.destinationPort}; ${plan.vehicleQuantity} vehicle${plan.vehicleQuantity === 1 ? "" : "s"}. Freight rate pending approved source.`
        : "Shipping destination cleared. Freight rate pending approved source.",
      createdAt,
    }],
  };
}

export function calculatePricing(input) {
  const vehiclePrice = numberOrNull(input.vehiclePriceThb);
  const platformTransactionRate = Number.isFinite(Number(input.platformTransactionRate)) ? Math.max(0, Number(input.platformTransactionRate)) : DEFAULT_PLATFORM_TRANSACTION_RATE;
  const buyingServiceRate = Number.isFinite(Number(input.buyingServiceRate)) ? Math.max(0, Number(input.buyingServiceRate)) : DEFAULT_BUYING_SERVICE_RATE;
  const platformTransactionAmount = vehiclePrice === null ? null : Math.round(vehiclePrice * platformTransactionRate / 100);
  const buyingServiceAmount = vehiclePrice === null ? null : Math.round(vehiclePrice * buyingServiceRate / 100);
  const lines = [
    { key: "vehicle", amountThb: vehiclePrice },
    { key: "platformTransaction", amountThb: platformTransactionAmount },
    { key: "buyingService", amountThb: buyingServiceAmount },
    { key: "inspection", amountThb: numberOrNull(input.inspectionTravelThb) },
    { key: "transport", amountThb: numberOrNull(input.domesticTransportThb) },
    { key: "repair", amountThb: numberOrNull(input.repairModificationThb) },
    { key: "shipping", amountThb: numberOrNull(input.exportShippingThb) },
    ...(numberOrNull(input.containerLoadingFeeThb) ? [{ key: "containerLoading", amountThb: numberOrNull(input.containerLoadingFeeThb) }] : []),
    { key: "other", amountThb: numberOrNull(input.otherAgreedThb) },
  ].map((line) => ({ ...line, status: line.amountThb === null ? "Pending" : "Known" }));
  return { platformTransactionRate, buyingServiceRate, platformTransactionAmountThb: platformTransactionAmount, buyingServiceAmountThb: buyingServiceAmount, totalNkFeeAmountThb: vehiclePrice === null ? null : platformTransactionAmount + buyingServiceAmount, knownSubtotalThb: lines.reduce((total, line) => total + (line.amountThb ?? 0), 0), pendingCount: lines.filter((line) => line.amountThb === null).length, lines };
}

export function assessQuotationReadiness(caseRecord) {
  const nonNegativeAmount = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;
  const items = [
    { key: "availability", ready: caseRecord.availability === "Verified Available" },
    { key: "vehiclePrice", ready: Number.isFinite(Number(caseRecord.actualVehiclePurchasePriceThb)) && Number(caseRecord.actualVehiclePurchasePriceThb) > 0 },
    { key: "inspection", ready: Boolean(caseRecord.inspectionQuote && caseRecord.inspectionQuote.status === "Quote Ready" && nonNegativeAmount(caseRecord.inspectionQuote.totalThb)) },
    { key: "transport", ready: nonNegativeAmount(caseRecord.domesticTransportThb) },
    { key: "repair", ready: nonNegativeAmount(caseRecord.repairModificationThb) },
    { key: "shipping", ready: nonNegativeAmount(caseRecord.exportShippingThb) },
    { key: "other", ready: nonNegativeAmount(caseRecord.otherAgreedThb) },
  ];
  const pendingCount = items.filter((item) => !item.ready).length;
  return {
    status: pendingCount === 0 ? "Ready for NK Review" : "Not Ready",
    ready: pendingCount === 0,
    items,
    pendingCount,
    piStatus: caseRecord.quotation?.status === "Accepted" ? "Ready for PI Review" : "Blocked - Quotation Not Accepted",
  };
}

/** @returns {import("./types").BuyingBrowserState} */
export function initialBuyingBrowserState() {
  return { version: 1, savedListingIds: [], cases: [], importedListings: [], sourceCaptures: [], generalMessages: [{ id: "welcome", sender: "NK AI", text: "Tell me the model, year, transmission, drive, body type, budget, and preferred Thai search area. I will only use available vehicle facts and will mark unknown information clearly.", createdAt: "2026-08-23T09:00:00.000Z" }] };
}

function nextCaseId(existingCases, now) {
  const year = new Date(now).getUTCFullYear();
  const highest = existingCases.reduce((value, item) => { const match = String(item.id || "").match(/(\d{6})$/); return Math.max(value, match ? Number(match[1]) : 0); }, 1244);
  return `NK-CASE-${year}-${String(highest + 1).padStart(6, "0")}`;
}

function externalHttpsUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

/**
 * @param {import("./types").CustomerListing} listing
 * @param {{submittedUrl:string,canonicalUrl?:string,sourcePlatform?:string,captureMethod?:"external_share_link"|"web_share_target"|"ios_share_extension"|"ios_wkwebview"|"android_webview"|"windows_webview2"|"web_browser_companion"|"manual_evidence",importStatus?:"imported"|"partial"|"evidence_only",textEvidence?:import("./types").SourceTextEvidence}} input
 * @param {Date|string} [now]
 * @returns {import("./types").SourceCapture}
 */
export function createExternalSourceCapture(listing, input, now = new Date()) {
  const submittedUrl = externalHttpsUrl(input?.submittedUrl);
  if (!submittedUrl) throw new Error("valid_source_url_required");
  const canonicalUrl = externalHttpsUrl(input?.canonicalUrl) || submittedUrl;
  const importStatus = ["imported", "partial", "evidence_only"].includes(input?.importStatus) ? input.importStatus : "partial";
  return {
    id: `capture-${listing.id}`,
    listingId: listing.id,
    sourceReference: listing.sourceReference,
    adapterId: listing.adapterId,
    sourcePlatform: String(input?.sourcePlatform || "Facebook Marketplace").slice(0, 100),
    submittedUrl,
    canonicalUrl,
    captureMethod: ["web_share_target", "ios_share_extension", "ios_wkwebview", "android_webview", "windows_webview2", "web_browser_companion", "manual_evidence"].includes(input?.captureMethod) ? input.captureMethod : "external_share_link",
    importStatus,
    capturedAt: safeTime(now),
    channel: input?.channel === "hispeed" ? "hispeed" : "nk",
    ...(input?.textEvidence ? { textEvidence: { ...input.textEvidence } } : {}),
  };
}

/**
 * @param {import("./types").CustomerListing} listing
 * @param {import("./types").VehicleCase[]} existingCases
 * @param {string} customerId
 * @param {Date|string} [now]
 * @param {string|null} [sourceCaptureId]
 */
export function createVehicleCase(listing, existingCases, customerId, now = new Date(), sourceCaptureId = null, pricingSettings = {}, channel = "nk") {
  const existing = existingCases.find((item) => item.listingId === listing.id);
  if (existing) {
    if (!sourceCaptureId || existing.sourceCaptureId === sourceCaptureId) return { caseRecord: existing, created: false };
    const linkedAt = safeTime(now);
    return {
      caseRecord: {
        ...existing,
        sourceCaptureId,
        updatedAt: linkedAt,
        timeline: [...existing.timeline, { id: `${existing.id}-source-${linkedAt}`, title: "Source link captured", detail: "External source link captured internally and linked to this customer-safe Vehicle Case.", createdAt: linkedAt }],
      },
      created: false,
    };
  }
  const createdAt = safeTime(now);
  const caseId = nextCaseId(existingCases, createdAt);
  const quote = inspectionQuoteForLocation(listing.generalLocation);
  const platformTransactionRate = Number.isFinite(Number(pricingSettings.platformTransactionRate)) ? Math.max(0, Number(pricingSettings.platformTransactionRate)) : DEFAULT_PLATFORM_TRANSACTION_RATE;
  const buyingServiceRate = Number.isFinite(Number(pricingSettings.buyingServiceRate)) ? Math.max(0, Number(pricingSettings.buyingServiceRate)) : DEFAULT_BUYING_SERVICE_RATE;
  const caseChannel = channel === "hispeed" ? "hispeed" : "nk";
  const caseRecord = {
    id: caseId, customerId, listingId: listing.id, sourceReference: listing.sourceReference, sourceCaptureId, createdAt, updatedAt: createdAt, status: "Saved", availability: "Availability Not Yet Confirmed", vehicle: { ...listing, availability: "Availability Not Yet Confirmed" }, actualVehiclePurchasePriceThb: null, platformTransactionRate, buyingServiceRate, inspectionQuote: quote, domesticTransportThb: null, repairModificationThb: null, exportShippingThb: null, shippingDestinationCountry: null, shippingDestinationPort: null, shippingVehicleQuantity: 1, shippingContainerLoadingFeeThb: null, otherAgreedThb: null, quotationRequest: null, translationHistory: [], channel: caseChannel,
    messages: [{ id: `${caseId}-welcome`, sender: "NK AI", text: `I created ${caseId} for this ${listing.title}. Availability and the current seller price have not been verified yet.`, createdAt, delivery: "Local preview" }],
    timeline: [{ id: `${caseId}-saved`, title: "Vehicle saved", detail: sourceCaptureId ? "External source link captured internally and customer-safe listing data saved as an NK Vehicle Case." : "Customer-safe source result saved as an NK Vehicle Case.", createdAt }],
  };
  return { caseRecord, created: true };
}

function availabilityRequestText(language) {
  const selected = normalizeLanguage(language);
  if (selected === "zh-CN") return "请确认这辆车是否仍可购买，并确认当前价格、里程和 VIN 证据。";
  if (selected === "th") return "กรุณาตรวจสอบว่ารถคันนี้ยังอยู่หรือไม่ และยืนยันราคาปัจจุบัน เลขไมล์ และหลักฐาน VIN";
  return "Please check whether this vehicle is still available and confirm the current price, mileage, and VIN evidence.";
}

export function requestQuotation(caseRecord, now = new Date(), language = "en") {
  if (caseRecord.quotationRequest?.status === "Requested - Awaiting NK Review") return caseRecord;
  const createdAt = safeTime(now);
  const selected = normalizeLanguage(language);
  const customerText = selected === "zh-CN"
    ? "请准备这辆车的报价。所有未确认的费用请保持待确认，不要估算。"
    : selected === "th"
      ? "กรุณาเตรียมใบเสนอราคาสำหรับรถคันนี้ โดยคงรายการที่ยังไม่ยืนยันเป็นรอยืนยันและไม่ประมาณตัวเลข"
      : "Please prepare a quotation for this vehicle. Keep every unconfirmed amount pending and do not estimate it.";
  const systemText = selected === "zh-CN"
    ? "报价申请已记录，等待 NK 审核。车辆可售状态、实际购车价格和所有重要费用确认前，不会签发最终报价或 PI。"
    : selected === "th"
      ? "บันทึกคำขอใบเสนอราคาแล้วและรอ NK ตรวจสอบ จะยังไม่ออกใบเสนอราคาสุดท้ายหรือ PI จนกว่าจะยืนยันสถานะรถ ราคาซื้อจริง และค่าใช้จ่ายสำคัญครบถ้วน"
      : "Quotation request recorded for NK review. No final quotation or PI will be issued until availability, actual purchase price, and all material costs are confirmed.";
  return {
    ...caseRecord,
    updatedAt: createdAt,
    quotationRequest: { status: "Requested - Awaiting NK Review", requestedAt: createdAt },
    messages: [
      ...caseRecord.messages,
      { id: `${caseRecord.id}-quotation-customer-${createdAt}`, sender: "Customer", text: customerText, createdAt, delivery: "Recorded" },
      { id: `${caseRecord.id}-quotation-system-${createdAt}`, sender: "System", text: systemText, createdAt, delivery: "Recorded" },
    ],
    timeline: [...caseRecord.timeline, { id: `${caseRecord.id}-quotation-${createdAt}`, title: "Quotation requested", detail: "Waiting for NK to verify the vehicle and every material pricing line before review.", createdAt }],
  };
}

function thaiSellerRequest() {
  return "กรุณายืนยันว่ารถคันนี้ยังอยู่หรือไม่ พร้อมราคาปัจจุบัน เลขไมล์ และหลักฐาน VIN";
}

export function requestAvailability(caseRecord, now = new Date(), language = "en") {
  if (caseRecord.availability === "Availability Check Requested") return caseRecord;
  const createdAt = safeTime(now);
  const selected = normalizeLanguage(language);
  const originalText = availabilityRequestText(selected);
  return { ...caseRecord, status: "Availability Requested", availability: "Availability Check Requested", vehicle: { ...caseRecord.vehicle, availability: "Availability Check Requested" }, updatedAt: createdAt,
    translationHistory: [...(caseRecord.translationHistory || []), { id: `${caseRecord.id}-translation-${createdAt}`, originalText, sourceLanguage: selected, translatedText: thaiSellerRequest(), translationLanguage: "th", purpose: "buyer_to_seller", status: "Prepared - not sent", createdAt }],
    messages: [...caseRecord.messages, { id: `${caseRecord.id}-availability-customer-${createdAt}`, sender: "Customer", text: originalText, createdAt, delivery: "Recorded" }, { id: `${caseRecord.id}-availability-ai-${createdAt}`, sender: "NK AI", text: selected === "zh-CN" ? "已为 NK 团队准备泰语核实请求。此预览尚未向卖家发送消息，在记录真实回复前，车辆仍为未核实状态。" : selected === "th" ? "เตรียมข้อความภาษาไทยให้ทีม NK แล้ว แต่ระบบตัวอย่างนี้ยังไม่ได้ส่งหาผู้ขาย รถจะยังไม่ถูกยืนยันจนกว่าจะบันทึกคำตอบจริง" : "I prepared a Thai verification request for the NK sourcing team. No seller message has been sent from this preview. The case will remain unverified until a real response is recorded.", createdAt, delivery: "Prepared - not sent" }],
    timeline: [...caseRecord.timeline, { id: `${caseRecord.id}-availability-${createdAt}`, title: "Availability check requested", detail: "Seller inquiry prepared; awaiting an authorized send and real seller response.", createdAt }],
  };
}

export function requestInspection(caseRecord, now = new Date(), language = "en") {
  if (!caseRecord.inspectionQuote || caseRecord.inspectionQuote.status === "Requested - Awaiting Provider") return caseRecord;
  const createdAt = safeTime(now);
  return { ...caseRecord, status: "Inspection Requested", updatedAt: createdAt, inspectionQuote: { ...caseRecord.inspectionQuote, status: "Requested - Awaiting Provider", requestedAt: createdAt },
    messages: [...caseRecord.messages, { id: `${caseRecord.id}-inspection-${createdAt}`, sender: "System", text: normalizeLanguage(language) === "zh-CN" ? `已按配置的预览价格 ${formatCustomerUsd(caseRecord.inspectionQuote.totalThb)} 申请验车。目前尚未指派或预约服务商。` : normalizeLanguage(language) === "th" ? `ส่งคำขอตรวจสภาพตามราคาตัวอย่าง ${formatCustomerUsd(caseRecord.inspectionQuote.totalThb)} แล้ว แต่ยังไม่ได้มอบหมายหรือจองผู้ให้บริการ` : `Inspection requested at the configured preview price of ${formatCustomerUsd(caseRecord.inspectionQuote.totalThb)}. No provider is assigned or booked yet.`, createdAt, delivery: "Recorded" }],
    timeline: [...caseRecord.timeline, { id: `${caseRecord.id}-inspection-${createdAt}`, title: "Inspection requested", detail: "Waiting for an approved provider to accept the job.", createdAt }],
  };
}

export function buildGroundedAssistantReply(caseRecord, question, language = "en") {
  const text = String(question || "").toLowerCase();
  const selected = normalizeLanguage(language);
  const vehicle = caseRecord.vehicle;
  if (selected !== "en") {
    if (/available|availability|still there|seller|还在|可售|ผู้ขาย|ยังอยู่/.test(text)) return selected === "zh-CN" ? `车辆可售状态尚未确认。当前案件状态为“${caseRecord.availability}”。我不会猜测或把车辆描述为可售。` : `ยังไม่ได้ยืนยันว่ารถยังอยู่ สถานะปัจจุบันคือ “${caseRecord.availability}” ระบบจะไม่คาดเดาหรือแสดงว่ารถยังอยู่`;
    if (/price|cost|fee|total|commission|价格|费用|最低|ราคา|ค่าใช้จ่าย/.test(text)) {
      const pricing = calculatePricing({ vehiclePriceThb: caseRecord.actualVehiclePurchasePriceThb ?? vehicle.observedPriceThb, platformTransactionRate: caseRecord.platformTransactionRate, buyingServiceRate: caseRecord.buyingServiceRate, inspectionTravelThb: caseRecord.inspectionQuote?.totalThb ?? null, domesticTransportThb: caseRecord.domesticTransportThb, repairModificationThb: caseRecord.repairModificationThb, exportShippingThb: caseRecord.exportShippingThb, containerLoadingFeeThb: caseRecord.shippingContainerLoadingFeeThb, otherAgreedThb: caseRecord.otherAgreedThb });
      const feeText = `${translate(selected, "platformTransactionFee")} ${formatCustomerUsd(pricing.platformTransactionAmountThb)} + ${translate(selected, "buyingServiceFee")} ${formatCustomerUsd(pricing.buyingServiceAmountThb)}`;
      return selected === "zh-CN" ? `当前已知小计为 ${formatCustomerUsd(pricing.knownSubtotalThb)}，其中包含 ${feeText}。${pricing.pendingCount} 项费用仍待确认，未计入小计。最终费用按实际车辆购买价格重新计算。` : `ยอดย่อยที่ทราบปัจจุบันคือ ${formatCustomerUsd(pricing.knownSubtotalThb)} รวม ${feeText} ยังมีค่าใช้จ่ายรอยืนยัน ${pricing.pendingCount} รายการที่ยังไม่รวม และค่าบริการจะคำนวณใหม่จากราคาซื้อรถจริง`;
    }
    if (/inspection|inspect|condition|验车|车况|ตรวจ|สภาพ/.test(text)) return !caseRecord.inspectionQuote ? (selected === "zh-CN" ? "车辆地点尚未匹配配置的验车区域。NK 必须先确认地点，我不会估算费用。" : "ตำแหน่งรถยังไม่ตรงกับเขตตรวจสภาพที่กำหนด NK ต้องยืนยันตำแหน่งก่อน ระบบจะไม่ประมาณค่าใช้จ่าย") : (selected === "zh-CN" ? `验车及出行预览费用为 ${formatCustomerUsd(caseRecord.inspectionQuote.totalThb)}，区域：${caseRecord.inspectionQuote.region}。状态：${caseRecord.inspectionQuote.status}。` : `ค่าตรวจสภาพและเดินทางตัวอย่างคือ ${formatCustomerUsd(caseRecord.inspectionQuote.totalThb)} สำหรับ ${caseRecord.inspectionQuote.region} สถานะ: ${caseRecord.inspectionQuote.status}`);
    if (/mileage|engine|transmission|drive|spec|model|year|里程|发动机|规格|เลขไมล์|เครื่องยนต์|สเป็ก/.test(text)) return selected === "zh-CN" ? `${vehicle.title}：${vehicle.engine || "发动机待确认"}，${vehicle.transmission}，${vehicle.drive}，${vehicle.body}，${vehicle.mileageKm === null ? "里程待确认" : `${vehicle.mileageKm.toLocaleString("en-US")} km`}。这些信息仍需核实。` : `${vehicle.title}: ${vehicle.engine || "เครื่องยนต์รอตรวจสอบ"}, ${vehicle.transmission}, ${vehicle.drive}, ${vehicle.body}, ${vehicle.mileageKm === null ? "เลขไมล์รอตรวจสอบ" : `${vehicle.mileageKm.toLocaleString("en-US")} km`} ข้อมูลเหล่านี้ยังต้องตรวจสอบ`;
    return selected === "zh-CN" ? "可售状态、当前价格、VIN 和车况必须在购买前核实。我只会根据案件中的信息回答。" : "ต้องยืนยันสถานะรถ ราคาปัจจุบัน VIN และสภาพรถก่อนซื้อ ระบบจะตอบจากข้อมูลในเคสเท่านั้น";
  }
  if (/available|availability|still there|seller/.test(text)) return caseRecord.availability === "Verified Available" ? "This case has a recorded Verified Available status. Open the case timeline for the verification time and evidence." : `Availability is not confirmed. The current case state is “${caseRecord.availability}”. I will not guess or present the vehicle as available.`;
  if (/price|cost|fee|total|commission/.test(text)) {
    const pricing = calculatePricing({ vehiclePriceThb: caseRecord.actualVehiclePurchasePriceThb ?? vehicle.observedPriceThb, platformTransactionRate: caseRecord.platformTransactionRate, buyingServiceRate: caseRecord.buyingServiceRate, inspectionTravelThb: caseRecord.inspectionQuote?.totalThb ?? null, domesticTransportThb: caseRecord.domesticTransportThb, repairModificationThb: caseRecord.repairModificationThb, exportShippingThb: caseRecord.exportShippingThb, containerLoadingFeeThb: caseRecord.shippingContainerLoadingFeeThb, otherAgreedThb: caseRecord.otherAgreedThb });
    return `The known subtotal is ${formatCustomerUsd(pricing.knownSubtotalThb)}, including ${translate("en", "platformTransactionFee")} ${formatCustomerUsd(pricing.platformTransactionAmountThb)} and ${translate("en", "buyingServiceFee")} ${formatCustomerUsd(pricing.buyingServiceAmountThb)}. ${pricing.pendingCount} cost line${pricing.pendingCount === 1 ? " is" : "s are"} pending and excluded. NK service amounts recalculate from the actual vehicle purchase price.`;
  }
  if (/inspection|inspect|condition/.test(text)) return !caseRecord.inspectionQuote ? "The vehicle location does not match a configured inspection zone yet. NK must confirm the location before quoting; I will not estimate the fee." : `The configured inspection and travel preview is ${formatCustomerUsd(caseRecord.inspectionQuote.totalThb)} for ${caseRecord.inspectionQuote.region}. Current status: ${caseRecord.inspectionQuote.status}.`;
  if (/mileage|engine|transmission|drive|spec|model|year/.test(text)) return `${vehicle.title}: ${vehicle.engine || "engine unknown"}, ${vehicle.transmission}, ${vehicle.drive}, ${vehicle.body}, ${vehicle.mileageKm === null ? "mileage needs review" : `${vehicle.mileageKm.toLocaleString("en-US")} km`}. These are normalized from the available ${vehicle.demo ? "labeled demo evidence" : "captured listing evidence"} and remain subject to verification.`;
  return `${vehicle.summary} Availability, current price, VIN, and condition must be verified before purchase. Ask me about specifications, pricing, availability, or inspection and I will answer only from this case.`;
}

export function addCaseQuestion(caseRecord, question, now = new Date(), language = "en") {
  const createdAt = safeTime(now); const trimmed = String(question || "").trim().slice(0, 1000); if (!trimmed) return caseRecord;
  const selected = normalizeLanguage(language);
  const needsSellerTranslation = /available|availability|still there|price|lowest|还在|可售|最低|价格|ยังอยู่|ราคา/.test(trimmed.toLowerCase());
  const translation = needsSellerTranslation ? { id: `${caseRecord.id}-translation-${createdAt}`, originalText: trimmed, sourceLanguage: selected, translatedText: thaiSellerRequest(), translationLanguage: "th", purpose: "buyer_to_seller", status: "Prepared - not sent", createdAt } : null;
  return { ...caseRecord, updatedAt: createdAt, translationHistory: translation ? [...(caseRecord.translationHistory || []), translation] : (caseRecord.translationHistory || []), messages: [...caseRecord.messages, { id: `${caseRecord.id}-q-${createdAt}`, sender: "Customer", text: trimmed, createdAt, delivery: "Recorded" }, { id: `${caseRecord.id}-a-${createdAt}`, sender: "NK AI", text: buildGroundedAssistantReply(caseRecord, trimmed, selected), createdAt, delivery: "Local preview" }] };
}

export function presentCustomerListing(source) {
  return { id: source.id, adapterId: source.adapterId, sourceReference: source.sourceReference, title: source.title, summary: source.summary, brand: source.brand, model: source.model, year: source.year, grade: source.grade, engine: source.engine, transmission: source.transmission, drive: source.drive, body: source.body, mileageKm: source.mileageKm, color: source.color, observedPriceThb: source.observedPriceThb, observedAt: source.observedAt, generalLocation: source.generalLocation, imageUrls: [...source.imageUrls], availability: source.availability, translationState: source.translationState, evidenceLabels: [...source.evidenceLabels], demo: Boolean(source.demo), visibleOnNk: source.visibleOnNk !== false, visibleOnHispeed: source.visibleOnHispeed !== false };
}
