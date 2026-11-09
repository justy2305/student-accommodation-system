import { useEffect, useId, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import ListingCard from "../components/ListingCard";
import SiteFooter from "../components/SiteFooter";
import { MapPinIcon, SlidersIcon } from "../components/icons";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import { getErrorMessage } from "../services/api";
import { getFilterOptions, searchAccommodations } from "../services/accommodationService";
import { getRoomTypeLabel } from "../utils/accommodation";

// Filters kept in the URL, so a refresh or the back button keeps the same results
const FILTER_KEYS = ["roomType", "minPrice", "maxPrice", "available", "facilities", "campus", "maxDistance"];
const DISTANCES = ["1", "2", "5", "10"];
const EMPTY_FILTERS = {
  roomType: "",
  minPrice: "",
  maxPrice: "",
  available: false,
  facilities: [],
  campus: "",
  maxDistance: "",
};

function readFilters(searchParams) {
  return {
    search: searchParams.get("search") ?? "",
    roomType: searchParams.get("roomType") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    available: searchParams.get("available") === "true",
    facilities: (searchParams.get("facilities") ?? "").split(",").filter(Boolean),
    campus: searchParams.get("campus") ?? "",
    maxDistance: searchParams.get("maxDistance") ?? "",
  };
}

function countActiveFilters(filters) {
  return FILTER_KEYS.filter((key) =>
    Array.isArray(filters[key]) ? filters[key].length > 0 : Boolean(filters[key])
  ).length;
}

// Explore page: Figma "Desktop accommodation discovery" frame
export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const activeCount = countActiveFilters(filters);

  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ key: null, items: [], error: "" });
  const [options, setOptions] = useState({ room_types: [], facilities: [], campuses: [] });
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelId = useId();

  const queryKey = `${searchParams.toString()}|${reloadKey}`;
  const isLoading = result.key !== queryKey;

  useEffect(() => {
    let isCurrent = true;

    searchAccommodations(readFilters(searchParams))
      .then((items) => {
        if (isCurrent) setResult({ key: queryKey, items, error: "" });
      })
      .catch((error) => {
        if (isCurrent) {
          setResult({
            key: queryKey,
            items: [],
            error: getErrorMessage(error, "We couldn't load homes right now."),
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [searchParams, queryKey]);

  // Filter choices come from the homes in the database
  useEffect(() => {
    getFilterOptions()
      .then(setOptions)
      .catch(() => {});
  }, []);

  const applyFilters = (next) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (Array.isArray(value)) {
        if (value.length > 0) params.set(key, value.join(","));
      } else if (value === true) {
        params.set(key, "true");
      } else if (value) {
        params.set(key, value);
      }
    }
    setSearchParams(params);
  };

  const count = result.items.length;

  return (
    <div className="page">
      <AppHeader />

      <main className="page__main explore">
        <section className="explore-hero">
          <div className="explore-hero__top">
            <div>
              <h1 className="explore-hero__title">Find your perfect home away from home</h1>
            </div>
          </div>

          <SearchForm
            key={`search-${filters.search}`}
            initialSearch={filters.search}
            onSearch={(search) => applyFilters({ ...filters, search })}
          />

          <div className="filter-bar">
            <button
              type="button"
              className={`filter-toggle${activeCount > 0 ? " is-active" : ""}`}
              aria-expanded={isPanelOpen}
              aria-controls={panelId}
              onClick={() => setIsPanelOpen((open) => !open)}
            >
              <SlidersIcon size={16} />
              Filters
              {activeCount > 0 && (
                <span className="filter-toggle__count">
                  {activeCount}
                  <span className="visually-hidden"> active</span>
                </span>
              )}
            </button>
            {activeCount > 0 && (
              <button
                type="button"
                className="text-link filter-bar__clear"
                onClick={() => applyFilters({ search: filters.search })}
              >
                Clear filters
              </button>
            )}
          </div>

          {isPanelOpen && (
            <FilterPanel
              id={panelId}
              key={searchParams.toString()}
              initial={filters}
              options={options}
              onApply={(chosen) => {
                applyFilters({ ...chosen, search: filters.search });
                setIsPanelOpen(false);
              }}
              onClose={() => setIsPanelOpen(false)}
            />
          )}
        </section>

        <section className="explore-results" aria-label="Student homes" aria-busy={isLoading}>
          {isLoading && (
            <div className="listing-grid" role="status">
              <span className="visually-hidden">Loading homes</span>
              {[0, 1, 2, 3].map((n) => (
                <div key={n} className="skeleton skeleton--listing" aria-hidden="true" />
              ))}
            </div>
          )}

          {!isLoading && result.error && (
            <div className="dashboard-error">
              <Alert variant="error" title="Something went wrong">
                {result.error}
              </Alert>
              <Button variant="secondary" className="btn--sm" onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </Button>
            </div>
          )}

          {!isLoading && !result.error && count === 0 && (
            <div className="empty-state">
              <span className="empty-state__icon">
                <MapPinIcon size={22} />
              </span>
              <p className="empty-state__title">No homes match your search</p>
              <p className="empty-state__text">Try another area, or remove some filters.</p>
              <Button variant="secondary" className="btn--sm" onClick={() => applyFilters({})}>
                Clear search and filters
              </Button>
            </div>
          )}

          {!isLoading && !result.error && count > 0 && (
            <div className="listing-grid">
              {result.items.map((accommodation) => (
                <ListingCard
                  key={accommodation.id}
                  accommodation={accommodation}
                  campus={filters.campus}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

// The pill-shaped search bar (search by name or area). Keyed by the search
// text, so it resets when the URL changes.
function SearchForm({ initialSearch, onSearch }) {
  const [search, setSearch] = useState(initialSearch);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(search.trim());
  };

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      <label className="search-bar__field search-bar__field--where">
        <span className="search-bar__label">Where</span>
        <input
          name="search"
          type="search"
          className="search-bar__input"
          placeholder="Name or area, e.g. Windhoek West"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <button type="submit" className="btn btn--primary search-bar__submit">
        Search
      </button>
    </form>
  );
}

// Room type, price, distance, facilities and availability. Changes apply when
// the student presses "Show homes".
function FilterPanel({ id, initial, options, onApply, onClose }) {
  const [draft, setDraft] = useState({
    roomType: initial.roomType,
    minPrice: initial.minPrice,
    maxPrice: initial.maxPrice,
    available: initial.available,
    facilities: initial.facilities,
    campus: initial.campus,
    maxDistance: initial.maxDistance,
  });
  const [error, setError] = useState("");

  const update = (changes) => {
    setDraft((current) => ({ ...current, ...changes }));
    setError("");
  };

  const toggleFacility = (facility) =>
    update({
      facilities: draft.facilities.includes(facility)
        ? draft.facilities.filter((item) => item !== facility)
        : [...draft.facilities, facility],
    });

  const handleSubmit = (event) => {
    event.preventDefault();
    const min = draft.minPrice === "" ? null : Number(draft.minPrice);
    const max = draft.maxPrice === "" ? null : Number(draft.maxPrice);
    const isBad = (value) => value !== null && (!Number.isFinite(value) || value < 0);

    if (isBad(min) || isBad(max)) {
      setError("Enter prices as amounts in N$, like 3500.");
      return;
    }
    if (min !== null && max !== null && min > max) {
      setError("The minimum price can't be more than the maximum.");
      return;
    }

    // A distance only makes sense with a campus
    onApply({ ...draft, maxDistance: draft.campus ? draft.maxDistance : "" });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") onClose();
  };

  const roomTypes = options.room_types.length > 0 ? options.room_types : ["Single", "Shared", "Triple"];

  return (
    <form
      id={id}
      className="filter-panel"
      aria-label="Filters"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      noValidate
    >
      <div className="filter-panel__grid">
        <fieldset className="filter-group">
          <legend className="filter-group__title">Room type</legend>
          <div className="chips">
            {["", ...roomTypes].map((type) => (
              <button
                key={type || "any"}
                type="button"
                aria-pressed={draft.roomType === type}
                className={`chip${draft.roomType === type ? " is-active" : ""}`}
                onClick={() => update({ roomType: type })}
              >
                {type ? getRoomTypeLabel(type) : "Any"}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="filter-group">
          <legend className="filter-group__title">Price per month</legend>
          <div className="filter-row">
            <label className="filter-input">
              <span className="filter-input__label">Min (N$)</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="100"
                placeholder="No min"
                value={draft.minPrice}
                onChange={(event) => update({ minPrice: event.target.value })}
              />
            </label>
            <label className="filter-input">
              <span className="filter-input__label">Max (N$)</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="100"
                placeholder="No max"
                value={draft.maxPrice}
                onChange={(event) => update({ maxPrice: event.target.value })}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="filter-group">
          <legend className="filter-group__title">Distance from campus</legend>
          <div className="filter-row">
            <label className="filter-input">
              <span className="filter-input__label">Campus</span>
              <select
                className="field__select"
                value={draft.campus}
                onChange={(event) =>
                  update({
                    campus: event.target.value,
                    maxDistance: event.target.value ? draft.maxDistance : "",
                  })
                }
              >
                <option value="">Any campus</option>
                {options.campuses.map((campus) => (
                  <option key={campus} value={campus}>
                    {campus}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-input">
              <span className="filter-input__label">Within</span>
              <select
                className="field__select"
                value={draft.maxDistance}
                disabled={!draft.campus}
                onChange={(event) => update({ maxDistance: event.target.value })}
              >
                <option value="">Any distance</option>
                {DISTANCES.map((km) => (
                  <option key={km} value={km}>
                    {km} km
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="filter-group">
          <legend className="filter-group__title">Availability</legend>
          <label className="filter-check">
            <input
              type="checkbox"
              checked={draft.available}
              onChange={(event) => update({ available: event.target.checked })}
            />
            Only homes with rooms available now
          </label>
        </fieldset>

        {options.facilities.length > 0 && (
          <fieldset className="filter-group filter-group--wide">
            <legend className="filter-group__title">Facilities</legend>
            <div className="chips">
              {options.facilities.map((facility) => {
                const isOn = draft.facilities.includes(facility);
                return (
                  <button
                    key={facility}
                    type="button"
                    aria-pressed={isOn}
                    className={`chip${isOn ? " is-active" : ""}`}
                    onClick={() => toggleFacility(facility)}
                  >
                    {facility}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      </div>

      {error && (
        <p className="filter-panel__error" role="alert">
          {error}
        </p>
      )}

      <div className="filter-panel__actions">
        <button type="button" className="text-link" onClick={() => update(EMPTY_FILTERS)}>
          Clear all
        </button>
        <Button type="submit">Show homes</Button>
      </div>
    </form>
  );
}
