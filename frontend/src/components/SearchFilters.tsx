import { useState, useEffect, useMemo, memo } from 'react';
import { Search, Filter, X, MapPin } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { Location, Event } from '../types';
import { cn, debounce } from '../utils';
import { LocationService } from '../services/locationService';

const LOCATION_TYPES = ['hostel', 'class', 'faculty', 'entertainment', 'shop', 'parking', 'medical', 'sports', 'eatables', 'religious', 'bank'];
const VIEW_MODES = [
  { value: 'all', label: 'All' },
  { value: 'locations', label: 'Locations' },
  { value: 'events', label: 'Events' }
] as const;

interface SearchFiltersProps {
  locations: Location[];
  events: Event[];
  onLocationFilter: (locations: Location[]) => void;
  onEventFilter: (events: Event[]) => void;
  className?: string;
  routingMode: boolean;
  onToggleRouting: () => void;
}

const SearchFilters = memo<SearchFiltersProps>(({
  locations,
  events,
  onLocationFilter,
  onEventFilter,
  className,
  routingMode,
  onToggleRouting,
}) => {
  const {
    searchQuery,
    activeFilters,
    setSearchQuery,
    updateFilters,
    clearFilters,
  } = useMapStore();

  const [showFilters, setShowFilters] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [fetchedLocations, setFetchedLocations] = useState<Location[] | null>(null);
  const [fetchedEvents, setFetchedEvents] = useState<Event[] | null>(null);

  const safeLocations: Location[] = useMemo(() => (Array.isArray(locations) ? locations : []), [locations]);
  const safeEvents: Event[] = useMemo(() => (Array.isArray(events) ? events : []), [events]);

  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
  }, 300);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    debouncedSearch(localSearchQuery);
  }, [localSearchQuery, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    const q = searchQuery.trim();

    if (q.length >= 2) {
      (async () => {
        try {
          const locs = await LocationService.searchLocations(q);
          if (!cancelled) {
            setFetchedLocations(locs);
            setFetchedEvents(null);
          }
        } catch {
          if (!cancelled) {
            setFetchedLocations(null);
            setFetchedEvents(null);
          }
        }
      })();
    } else {
      setFetchedLocations(null);
      setFetchedEvents(null);
    }

    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  const { filteredLocs, filteredEvts } = useMemo(() => {
    const baseLocations = fetchedLocations ?? safeLocations;
    const baseEvents = fetchedEvents ?? safeEvents;

    let filteredLocations = baseLocations;
    let filteredEvents = baseEvents;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      filteredLocations = filteredLocations.filter((location) =>
        location.name.toLowerCase().includes(query) ||
        location.description?.toLowerCase().includes(query) ||
        (Array.isArray(location.tags) && location.tags.some(tag => tag.toLowerCase().includes(query)))
      );

      filteredEvents = filteredEvents.filter((event) =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        (Array.isArray(event.tags) && event.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    if (activeFilters.locationTypes.length > 0) {
      filteredLocations = filteredLocations.filter((location) =>
        activeFilters.locationTypes.includes(location.type)
      );
    }

    if (activeFilters.eventCategories.length > 0) {
      filteredEvents = filteredEvents.filter((event) =>
        activeFilters.eventCategories.includes(event.category)
      );
    }

    if (activeFilters.viewMode === 'locations') {
      filteredEvents = [];
    }

    if (activeFilters.viewMode === 'events') {
      filteredLocations = [];
    }

    return {
      filteredLocs: filteredLocations,
      filteredEvts: filteredEvents
    };
  }, [searchQuery, activeFilters, safeLocations, safeEvents, fetchedLocations, fetchedEvents]);

  const availableEventCategories = useMemo(() => (
    Array.from(new Set(safeEvents.map(event => event.category).filter(Boolean))).sort()
  ), [safeEvents]);

  useEffect(() => {
    onLocationFilter(filteredLocs);
    onEventFilter(filteredEvts);
  }, [filteredLocs, filteredEvts, onLocationFilter, onEventFilter]);

  const handleLocationTypeToggle = (locationType: string) => {
    const locationTypes = activeFilters.locationTypes.includes(locationType)
      ? activeFilters.locationTypes.filter(type => type !== locationType)
      : [...activeFilters.locationTypes, locationType];

    updateFilters({ locationTypes });
  };

  const handleEventCategoryToggle = (eventCategory: string) => {
    const eventCategories = activeFilters.eventCategories.includes(eventCategory)
      ? activeFilters.eventCategories.filter(category => category !== eventCategory)
      : [...activeFilters.eventCategories, eventCategory];

    updateFilters({ eventCategories });
  };

  const handleClearFilters = () => {
    setLocalSearchQuery('');
    clearFilters();
  };

  const activeFilterCount =
    activeFilters.locationTypes.length +
    activeFilters.eventCategories.length +
    (activeFilters.viewMode !== 'all' ? 1 : 0);
  const hasActiveFilters = searchQuery.trim() || activeFilterCount > 0;

  return (
    <div className={cn('card', className)}>
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
          <input
            type="text"
            placeholder="Search locations and events..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="search-input pl-10 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
          />
          {localSearchQuery && (
            <button
              onClick={() => setLocalSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-2 border-b border-blue-100 flex items-center justify-between" style={{
        background: showFilters ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08))' : 'transparent'
      }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'btn btn-ghost !px-3 !py-1 flex items-center space-x-2 transition-all',
            showFilters && 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-md'
          )}
        >
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs rounded-full px-2 py-0.5 font-semibold shadow-sm">
              {activeFilterCount}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="btn btn-outline !text-sm hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white hover:border-transparent transition-all"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="px-4 py-3 border-b border-amber-100">
        <div className="flex items-center justify-center">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            {VIEW_MODES.map((mode) => {
              const isActive = activeFilters.viewMode === mode.value;
              return (
                <button
                  key={mode.value}
                  onClick={() => updateFilters({ viewMode: mode.value })}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-emerald-100" style={{
        background: routingMode ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))' : 'transparent'
      }}>
        <button
          onClick={onToggleRouting}
          className={cn(
            'btn btn-ghost !px-3 !py-1 flex items-center space-x-2 w-full transition-all font-medium',
            routingMode && 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105'
          )}
        >
          <span className="text-lg">🧭</span>
          <span>{routingMode ? 'Exit Navigation' : 'Get Directions'}</span>
        </button>
      </div>

      {showFilters && (
        <div className="p-4 space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center px-3 py-2 rounded-lg" style={{
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.05))'
            }}>
              <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
              Location Types
            </h4>
            <div className="space-y-2">
              {LOCATION_TYPES.map((type) => (
                <label key={type} className="flex items-center hover:bg-emerald-50 px-2 py-1 rounded transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeFilters.locationTypes.includes(type)}
                    onChange={() => handleLocationTypeToggle(type)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center px-3 py-2 rounded-lg" style={{
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))'
            }}>
              <span className="h-4 w-4 mr-2 text-blue-600">🎉</span>
              Event Categories
            </h4>
            {availableEventCategories.length === 0 ? (
              <p className="text-sm text-gray-500 px-2 py-1">No active events available for filtering yet.</p>
            ) : (
              <div className="space-y-2">
                {availableEventCategories.map((category) => (
                  <label key={category} className="flex items-center hover:bg-blue-50 px-2 py-1 rounded transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeFilters.eventCategories.includes(category)}
                      onChange={() => handleEventCategoryToggle(category)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{category}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-600">{filteredLocs.length}</div>
                <div className="text-gray-500">Locations</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{filteredEvts.length}</div>
                <div className="text-gray-500">Events</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 rounded-b-lg">
          {searchQuery.trim() && (
            <span>Searching for "{searchQuery.trim()}" • </span>
          )}
          <span>
            {activeFilters.viewMode === 'locations' && `${filteredLocs.length} locations`}
            {activeFilters.viewMode === 'events' && `${filteredEvts.length} events`}
            {activeFilters.viewMode === 'all' && `${filteredLocs.length} locations, ${filteredEvts.length} events`}
          </span>
        </div>
      )}
    </div>
  );
});

SearchFilters.displayName = 'SearchFilters';

export default SearchFilters;
