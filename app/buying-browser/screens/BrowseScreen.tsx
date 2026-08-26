"use client";

import Link from "next/link";
import { ArrowUpDown, Bot, Link2, MapPin, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { DEFAULT_FILTERS, filterListings } from "../domain.mjs";
import { customerFxDisclosure, customerUsdInputToThb } from "../format";
import type { BrowseFilters } from "../types";
import ListingCard from "../components/ListingCard";

const locations = ["All Thailand", "Bangkok", "Chon Buri", "Rayong", "Ayutthaya", "Chiang Mai", "Khon Kaen", "Nakhon Ratchasima"];
const yearOptions = ["", "2014", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];

export default function BrowseScreen({ savedOnly = false }: { savedOnly?: boolean }) {
  const { listings, state, sourceStatus } = useBuyingBrowser();
  const [filters, setFilters] = useState<BrowseFilters>({ ...DEFAULT_FILTERS });
  const [filterOpen, setFilterOpen] = useState(false);
  const sourceListings = savedOnly ? listings.filter((item) => state.savedListingIds.includes(item.id)) : listings;
  const domainFilters = useMemo(() => ({ ...filters, priceMin: customerUsdInputToThb(filters.priceMin), priceMax: customerUsdInputToThb(filters.priceMax) }), [filters]);
  const visibleListings = useMemo(() => filterListings(sourceListings, domainFilters), [domainFilters, sourceListings]);
  const activeFilterCount = [filters.location !== "All Thailand", filters.yearFrom, filters.yearTo, filters.priceMin, filters.priceMax, filters.mileageMax, filters.transmission !== "Any", filters.drive !== "Any", filters.body !== "Any"].filter(Boolean).length;
  const capturedCount = listings.filter((item) => !item.demo).length;
  const sourceLabel = sourceStatus.live ? "Live" : capturedCount ? `${capturedCount} selected` : "Demo";

  function setFilter<Key extends keyof BrowseFilters>(key: Key, value: BrowseFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <>
      {savedOnly && <section className="bb-page-heading bb-browse-heading">
        <div><p className="bb-kicker">NK Cars · Thailand vehicle search</p><h1>{savedOnly ? "Saved Vehicles" : "Browse Vehicles"}</h1><p>{savedOnly ? "Vehicles saved on this preview account." : "Explore customer-safe vehicle results, then save one as an NK Vehicle Case."}</p></div>
        <span className="bb-result-count">{visibleListings.length} results</span>
      </section>}

      <section className={savedOnly ? "bb-marketplace-toolbar saved" : "bb-marketplace-toolbar"} aria-label="Vehicle search and filters" data-browse-marketplace-v2={!savedOnly ? true : undefined}>
        {!savedOnly && <h1 className="bb-sr-only">Browse Vehicles</h1>}
        <div className="bb-market-search-row">
          <label className="bb-search-field"><Search size={19} /><input value={filters.query} onChange={(event) => setFilter("query", event.target.value)} placeholder="Search vehicles" aria-label="Search vehicles" />{filters.query && <button onClick={() => setFilter("query", "")} aria-label="Clear search"><X size={17} /></button>}</label>
          <button className={activeFilterCount ? "bb-filter-button active" : "bb-filter-button"} onClick={() => setFilterOpen(true)} aria-label="Open vehicle filters" title="Filters"><SlidersHorizontal size={18} /><span className="bb-filter-text">Filters</span>{activeFilterCount > 0 && <i>{activeFilterCount}</i>}</button>
          <label className="bb-sort-button" title="Sort vehicles"><ArrowUpDown size={18} /><span>Sort</span><select value={filters.sort} onChange={(event) => setFilter("sort", event.target.value as BrowseFilters["sort"])} aria-label="Sort vehicles"><option value="recommended">Recommended</option><option value="price-low">Price: low first</option><option value="price-high">Price: high first</option><option value="year-new">Newest year</option><option value="mileage-low">Lowest mileage</option></select></label>
        </div>

        <div className="bb-quick-filters">
          <button className={filters.location === "All Thailand" ? "active" : ""} onClick={() => setFilter("location", "All Thailand")}><MapPin size={14} />Thailand</button>
          {locations.slice(1, 5).map((location) => <button key={location} className={filters.location === location ? "active" : ""} onClick={() => setFilter("location", location)}>{location}</button>)}
        </div>

        {!savedOnly && <div className="bb-marketplace-meta">
          <div><b>{visibleListings.length}</b> vehicles <span className={sourceStatus.live || capturedCount ? "live" : "demo"} role="status">{sourceLabel}</span></div>
          <nav aria-label="More vehicle search tools"><Link href="/buy/paste" title="Paste Vehicle Link"><Link2 size={14} />Paste link</Link><Link href="/buy/ask" title="Ask NK AI"><Bot size={14} />Ask NK AI</Link></nav>
        </div>}
      </section>

      {visibleListings.length ? <section className="bb-listing-grid" aria-label="Vehicle results">{visibleListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</section> : <section className="bb-empty-state"><Search size={30} /><h2>{savedOnly ? "No saved vehicles yet" : "No vehicles match these filters"}</h2><p>{savedOnly ? "Use the heart button while browsing, or save a vehicle as a case." : "Change one or more filters. Hard requirements are never relaxed automatically."}</p><button className="bb-button secondary" onClick={() => setFilters({ ...DEFAULT_FILTERS })}><RotateCcw size={17} />Reset filters</button></section>}

      {filterOpen && <div className="bb-filter-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFilterOpen(false); }}>
        <section className="bb-filter-sheet" role="dialog" aria-modal="true" aria-label="Vehicle filters">
          <header><div><p className="bb-kicker">Vehicle criteria</p><h2>Filters</h2></div><button onClick={() => setFilterOpen(false)} aria-label="Close filters"><X size={21} /></button></header>
          <div className="bb-filter-form">
            <label><span>Thai search location</span><select value={filters.location} onChange={(event) => setFilter("location", event.target.value)}>{locations.map((location) => <option key={location}>{location}</option>)}</select></label>
            <div className="bb-field-pair"><label><span>Year from</span><select value={filters.yearFrom} onChange={(event) => setFilter("yearFrom", event.target.value)}>{yearOptions.map((year) => <option key={year || "from-any"} value={year}>{year || "Any"}</option>)}</select></label><label><span>Year to</span><select value={filters.yearTo} onChange={(event) => setFilter("yearTo", event.target.value)}>{yearOptions.map((year) => <option key={year || "to-any"} value={year}>{year || "Any"}</option>)}</select></label></div>
            <div className="bb-field-pair"><label><span>Minimum price (USD)</span><input inputMode="numeric" value={filters.priceMin} onChange={(event) => setFilter("priceMin", event.target.value.replace(/\D/g, ""))} placeholder="Any" /></label><label><span>Maximum price (USD)</span><input inputMode="numeric" value={filters.priceMax} onChange={(event) => setFilter("priceMax", event.target.value.replace(/\D/g, ""))} placeholder="Any" /></label></div>
            <p className="bb-filter-fx">{customerFxDisclosure()}</p>
            <label><span>Maximum mileage (km)</span><input inputMode="numeric" value={filters.mileageMax} onChange={(event) => setFilter("mileageMax", event.target.value.replace(/\D/g, ""))} placeholder="Any" /></label>
            <div className="bb-field-pair"><label><span>Transmission</span><select value={filters.transmission} onChange={(event) => setFilter("transmission", event.target.value)}><option>Any</option><option>AT</option><option>MT</option></select></label><label><span>Drive</span><select value={filters.drive} onChange={(event) => setFilter("drive", event.target.value)}><option>Any</option><option>2WD</option><option>4WD</option></select></label></div>
            <label><span>Body / cab</span><select value={filters.body} onChange={(event) => setFilter("body", event.target.value)}><option>Any</option><option>Double Cab</option><option>Smart Cab</option></select></label>
          </div>
          <footer><button className="bb-button secondary" onClick={() => setFilters({ ...DEFAULT_FILTERS })}><RotateCcw size={17} />Reset</button><button className="bb-button primary" onClick={() => setFilterOpen(false)}>Show {visibleListings.length} vehicles</button></footer>
        </section>
      </div>}
    </>
  );
}
