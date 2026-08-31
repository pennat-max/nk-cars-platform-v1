"use client";

import Link from "next/link";
import { ArrowUpDown, Bot, Link2, MapPin, RotateCcw, Search, Ship, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { DEFAULT_FILTERS, filterListings } from "../domain.mjs";
import { customerFxDisclosure, customerUsdInputToThb } from "../format";
import { useI18n } from "../use-i18n";
import type { BrowseFilters } from "../types";
import ListingCard from "../components/ListingCard";

const metroLocations = ["Bangkok Metro", "Bangkok", "Nonthaburi", "Pathum Thani", "Samut Prakan", "Samut Sakhon", "Nakhon Pathom"];
const locations = [...metroLocations, "Nearby Provinces", "All Thailand", "Chon Buri", "Ayutthaya", "Rayong", "Chiang Mai", "Khon Kaen", "Nakhon Ratchasima"];
const yearOptions = ["", "2014", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];

export default function BrowseScreen({ savedOnly = false }: { savedOnly?: boolean }) {
  const { listings, state, sourceStatus, saveAsCase } = useBuyingBrowser();
  const { language, t } = useI18n();
  const [filters, setFilters] = useState<BrowseFilters>({ ...DEFAULT_FILTERS });
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSavedIds, setSelectedSavedIds] = useState<string[]>([]);
  const sourceListings = savedOnly ? listings.filter((item) => state.savedListingIds.includes(item.id)) : listings;
  const domainFilters = useMemo(() => ({
    ...filters,
    priceMin: language === "th" ? filters.priceMin : customerUsdInputToThb(filters.priceMin),
    priceMax: language === "th" ? filters.priceMax : customerUsdInputToThb(filters.priceMax),
  }), [filters, language]);
  const visibleListings = useMemo(() => filterListings(sourceListings, domainFilters), [domainFilters, sourceListings]);
  const activeFilterCount = [filters.location !== DEFAULT_FILTERS.location, filters.yearFrom, filters.yearTo, filters.priceMin, filters.priceMax, filters.mileageMax, filters.transmission !== "Any", filters.drive !== "Any", filters.body !== "Any"].filter(Boolean).length;
  const capturedCount = listings.filter((item) => !item.demo).length;
  const sourceLabel = sourceStatus.live ? "Live" : capturedCount ? "NK Selection" : "Demo";

  function locationLabel(location: string) {
    if (location === "Bangkok Metro") return t("bangkokMetro");
    if (location === "Nearby Provinces") return t("nearbyProvinces");
    if (location === "All Thailand") return t("allThailand");
    return location;
  }

  function setFilter<Key extends keyof BrowseFilters>(key: Key, value: BrowseFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleSavedSelection(listingId: string) {
    setSelectedSavedIds((current) => current.includes(listingId) ? current.filter((id) => id !== listingId) : [...current, listingId]);
  }

  function addSelectedToShipment() {
    const selected = visibleListings.filter((item) => selectedSavedIds.includes(item.id)).slice(0, 3);
    if (!selected.length) return;
    for (const listing of selected) saveAsCase(listing);
    window.setTimeout(() => window.location.assign("/buy/shipments"), 80);
  }

  const marketplaceHeading = language === "th" ? "รถที่เหมาะกับคุณ" : "Today's picks";
  const priceStatus = language === "th" ? "ราคายังไม่ยืนยัน" : "Price not verified";
  const reviewedVehiclesLabel = language === "th" ? `รถที่ตรวจแล้ว ${visibleListings.length} คัน` : `${visibleListings.length} reviewed vehicles`;
  const minimumPriceLabel = language === "th" ? "ราคาต่ำสุด (THB)" : t("minPrice");
  const maximumPriceLabel = language === "th" ? "ราคาสูงสุด (THB)" : t("maxPrice");
  const priceFxNote = language === "th" ? "กรอกตัวกรองราคาเป็นบาทไทย ส่วนราคา USD เป็นประมาณการตาม FX ที่ตั้งค่าไว้" : customerFxDisclosure();

  return (
    <>
      {savedOnly && <section className="bb-page-heading bb-browse-heading">
        <div><p className="bb-kicker">NK Cars · {t("thailand")}</p><h1>{savedOnly ? t("savedVehicles") : t("browseVehicles")}</h1></div>
        <span className="bb-result-count">{visibleListings.length} {t("results")}</span>
      </section>}
      {savedOnly && <section className="bb-shortlist-bar" aria-label="Saved vehicle shortlist actions">
        <div><b>Shortlist</b><span>{selectedSavedIds.length ? `${selectedSavedIds.length} selected` : "Select cars to compare or build a shipment"}</span></div>
        <button className="bb-button secondary" disabled={selectedSavedIds.length < 2}>Compare</button>
        <button className="bb-button primary" disabled={!selectedSavedIds.length} onClick={addSelectedToShipment}><Ship size={17} />Add selected to shipment</button>
      </section>}

      <section className={savedOnly ? "bb-marketplace-toolbar saved" : "bb-marketplace-toolbar"} aria-label="Vehicle search and filters" data-browse-marketplace-v2={!savedOnly ? true : undefined}>
        {!savedOnly && <h1 className="bb-sr-only">{t("browseVehicles")}</h1>}
        <div className="bb-market-search-row">
          <label className="bb-search-field"><Search size={19} /><input value={filters.query} onChange={(event) => setFilter("query", event.target.value)} placeholder={t("searchVehicles")} aria-label={t("searchVehicles")} />{filters.query && <button onClick={() => setFilter("query", "")} aria-label="Clear search"><X size={17} /></button>}</label>
          <button className={activeFilterCount ? "bb-filter-button active" : "bb-filter-button"} onClick={() => setFilterOpen(true)} aria-label={t("filters")} title={t("filters")}><SlidersHorizontal size={18} /><span className="bb-filter-text">{t("filters")}</span>{activeFilterCount > 0 && <i>{activeFilterCount}</i>}</button>
          <label className="bb-sort-button" title={t("sort")}><ArrowUpDown size={18} /><span>{t("sort")}</span><select value={filters.sort} onChange={(event) => setFilter("sort", event.target.value as BrowseFilters["sort"])} aria-label={t("sort")}><option value="recommended">{t("recommended")}</option><option value="price-low">{t("priceLow")}</option><option value="price-high">{t("priceHigh")}</option><option value="year-new">{t("newestYear")}</option><option value="mileage-low">{t("lowestMileage")}</option></select></label>
        </div>

        <div className="bb-quick-filters">
          {metroLocations.filter((location) => location !== "Pathum Thani" && location !== "Nakhon Pathom").map((location, index) => <button key={location} className={filters.location === location ? "active" : ""} onClick={() => setFilter("location", location)}>{index === 0 && <MapPin size={14} />}{locationLabel(location)}</button>)}
        </div>

        {!savedOnly && <div className="bb-marketplace-title-row"><div><h2>{marketplaceHeading}</h2><p>{reviewedVehiclesLabel}</p></div><span>{priceStatus}</span></div>}

        {!savedOnly && <div className="bb-marketplace-meta">
          <div><b>{visibleListings.length}</b> {t("vehicles")} <span className={sourceStatus.live || capturedCount ? "live" : "demo"} role="status">{sourceLabel}</span></div>
          <nav aria-label="More vehicle search tools"><Link href="/buy/paste" title={t("pasteLink")}><Link2 size={14} />{t("pasteLink")}</Link><Link href="/buy/ask" title={t("askNkAi")}><Bot size={14} />{t("askNkAi")}</Link></nav>
        </div>}
      </section>

      {visibleListings.length ? <section className="bb-listing-grid" aria-label="Vehicle results">{visibleListings.map((listing) => <ListingCard key={listing.id} listing={listing} selectable={savedOnly} selected={selectedSavedIds.includes(listing.id)} onSelect={toggleSavedSelection} />)}</section> : <section className="bb-empty-state"><Search size={30} /><h2>{savedOnly ? t("noSaved") : t("noMatches")}</h2><button className="bb-button secondary" onClick={() => setFilters({ ...DEFAULT_FILTERS })}><RotateCcw size={17} />{t("resetFilters")}</button></section>}

      {filterOpen && <div className="bb-filter-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFilterOpen(false); }}>
        <section className="bb-filter-sheet" role="dialog" aria-modal="true" aria-label="Vehicle filters">
          <header><div><p className="bb-kicker">{t("vehicleCriteria")}</p><h2>{t("filters")}</h2></div><button onClick={() => setFilterOpen(false)} aria-label="Close filters"><X size={21} /></button></header>
          <div className="bb-filter-form">
            <label><span>{t("location")}</span><select value={filters.location} onChange={(event) => setFilter("location", event.target.value)}>{locations.map((location) => <option key={location} value={location}>{locationLabel(location)}</option>)}</select></label>
            <div className="bb-field-pair"><label><span>{t("yearFrom")}</span><select value={filters.yearFrom} onChange={(event) => setFilter("yearFrom", event.target.value)}>{yearOptions.map((year) => <option key={year || "from-any"} value={year}>{year || t("any")}</option>)}</select></label><label><span>{t("yearTo")}</span><select value={filters.yearTo} onChange={(event) => setFilter("yearTo", event.target.value)}>{yearOptions.map((year) => <option key={year || "to-any"} value={year}>{year || t("any")}</option>)}</select></label></div>
            <div className="bb-field-pair"><label><span>{minimumPriceLabel}</span><input inputMode="numeric" value={filters.priceMin} onChange={(event) => setFilter("priceMin", event.target.value.replace(/\D/g, ""))} placeholder={t("any")} /></label><label><span>{maximumPriceLabel}</span><input inputMode="numeric" value={filters.priceMax} onChange={(event) => setFilter("priceMax", event.target.value.replace(/\D/g, ""))} placeholder={t("any")} /></label></div>
            <p className="bb-filter-fx">{priceFxNote}</p>
            <label><span>{t("maxMileage")}</span><input inputMode="numeric" value={filters.mileageMax} onChange={(event) => setFilter("mileageMax", event.target.value.replace(/\D/g, ""))} placeholder={t("any")} /></label>
            <div className="bb-field-pair"><label><span>{t("transmission")}</span><select value={filters.transmission} onChange={(event) => setFilter("transmission", event.target.value)}><option value="Any">{t("any")}</option><option>AT</option><option>MT</option></select></label><label><span>{t("drive")}</span><select value={filters.drive} onChange={(event) => setFilter("drive", event.target.value)}><option value="Any">{t("any")}</option><option>2WD</option><option>4WD</option></select></label></div>
            <label><span>{t("bodyCab")}</span><select value={filters.body} onChange={(event) => setFilter("body", event.target.value)}><option value="Any">{t("any")}</option><option>Double Cab</option><option>Smart Cab</option></select></label>
          </div>
          <footer><button className="bb-button secondary" onClick={() => setFilters({ ...DEFAULT_FILTERS })}><RotateCcw size={17} />{t("resetFilters")}</button><button className="bb-button primary" onClick={() => setFilterOpen(false)}>{t("showVehicles", { count: visibleListings.length })}</button></footer>
        </section>
      </div>}
    </>
  );
}
