function numberAfter(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(String(match[1]).replace(/,/g, ""));
  }
  return null;
}

export function parseWantedRequest(input = "") {
  const text = String(input).trim();
  const lower = text.toLowerCase();
  const brand = /toyota|โตโยต้า/i.test(text) ? "Toyota" : /ford|ฟอร์ด/i.test(text) ? "Ford" : /isuzu|อีซูซุ/i.test(text) ? "Isuzu" : /mitsubishi|มิตซูบิชิ/i.test(text) ? "Mitsubishi" : /nissan|นิสสัน/i.test(text) ? "Nissan" : null;
  const model = /hilux|revo|รีโว่/i.test(text) ? "Hilux Revo" : /ranger|เรนเจอร์/i.test(text) ? "Ranger" : /d-?max|ดีแม็ก/i.test(text) ? "D-Max" : /triton|ไทรทัน/i.test(text) ? "Triton" : /navara|นาวารา/i.test(text) ? "Navara" : null;
  const yearFrom = numberAfter(text, [/(?:ปี|year|from)\s*(20\d{2})/i, /(20\d{2})\s*(?:ขึ้นไป|or newer|\+)/i]);
  const priceMaxThb = numberAfter(text, [/(?:ไม่เกิน|งบ|สูงสุด|under|max)\s*(?:thb|บาท|฿)?\s*([0-9][0-9,]*)/i, /(?:thb|฿)\s*([0-9][0-9,]*)/i]);
  const mileageMax = numberAfter(text, [/(?:ไมล์|เลขไมล์|mileage)\s*(?:ไม่เกิน|under|max)?\s*([0-9][0-9,]*)/i]);
  const transmission = /\bAT\b|automatic|ออโต้|อัตโนมัติ/i.test(text) ? "AT" : /\bMT\b|manual|ธรรมดา/i.test(text) ? "MT" : null;
  const drive = /4wd|4x4|ขับสี่/i.test(text) ? "4WD" : /2wd|4x2/i.test(text) ? "2WD" : null;
  const body = /double\s*cab|4\s*ประตู|สี่ประตู/i.test(text) ? "Double Cab" : /smart\s*cab|แค็บ/i.test(text) ? "Smart Cab" : /single\s*cab|ตอนเดียว/i.test(text) ? "Single Cab" : null;
  const must = { brand, model, yearFrom, priceMaxThb, transmission, drive, body };
  const flexible = { mileageMax };
  return { originalText: text, must, flexible, recognized: Object.values(must).filter(Boolean).length + Object.values(flexible).filter(Boolean).length, lower };
}

function evidenceStatus(listing, field) {
  const aliases = { mileageKm: "mileage", observedPriceThb: "price" };
  const evidence = listing.specEvidence?.find((item) => item.field === (aliases[field] || field));
  if (evidence) return evidence.status;
  const value = listing[field];
  return value === null || value === undefined || value === "" || value === "Unknown" || value === "Need Review" ? "unknown" : "confirmed";
}

export function matchVehicle(listing, request) {
  const checks = [];
  const add = (label, wanted, actual, pass, field, importance = "must") => {
    if (!wanted) return;
    const status = evidenceStatus(listing, field);
    checks.push({ label, wanted: String(wanted), actual: status === "unknown" ? "Unknown" : String(actual), result: status === "unknown" ? "unknown" : pass ? "match" : "mismatch", importance });
  };
  add("Brand", request.must.brand, listing.brand, listing.brand?.toLowerCase() === request.must.brand?.toLowerCase(), "brand");
  add("Model", request.must.model, listing.model, `${listing.brand} ${listing.model} ${listing.title}`.toLowerCase().includes(request.must.model?.toLowerCase()), "model");
  add("Year from", request.must.yearFrom, listing.year, Number(listing.year) >= request.must.yearFrom, "year");
  add("Maximum price", request.must.priceMaxThb, listing.observedPriceThb, Number(listing.observedPriceThb) <= request.must.priceMaxThb, "observedPriceThb");
  add("Transmission", request.must.transmission, listing.transmission, listing.transmission === request.must.transmission, "transmission");
  add("Drive", request.must.drive, listing.drive, listing.drive === request.must.drive, "drive");
  add("Body / Cab", request.must.body, listing.body, listing.body?.toLowerCase().includes(request.must.body?.toLowerCase()), "body");
  add("Maximum mileage", request.flexible.mileageMax, listing.mileageKm, Number(listing.mileageKm) <= request.flexible.mileageMax, "mileageKm", "flexible");
  const mustMismatch = checks.some((item) => item.importance === "must" && item.result === "mismatch");
  const confirmed = checks.filter((item) => item.result === "match").length;
  const unknown = checks.filter((item) => item.result === "unknown").length;
  const score = checks.length ? Math.round((confirmed / checks.length) * 100) : 0;
  return { listing, checks, score, unknown, category: mustMismatch ? "not_match" : unknown ? "possible" : "confirmed" };
}

export function rankVehicleMatches(listings, request) {
  return listings.map((listing) => matchVehicle(listing, request)).filter((item) => item.category !== "not_match").sort((a, b) => (a.category === b.category ? b.score - a.score : a.category === "confirmed" ? -1 : 1));
}
