import { Coordinates, Event, EventCategory, Location } from '../types';

type ViewMode = 'all' | 'locations' | 'events';

interface MatchScore<T> {
  item: T;
  score: number;
}

export interface SmartNavAssistantRoutePoint {
  label: string;
  coordinates: Coordinates;
  location?: Location;
  event?: Event;
}

export interface SmartNavAssistantResult {
  summary: string;
  mapState: {
    searchQuery: string;
    locationTypes: Location['type'][];
    eventCategories: EventCategory[];
    viewMode: ViewMode;
  };
  selectedLocation: Location | null;
  selectedEvent: Event | null;
  focusCoordinates: Coordinates | null;
  route: {
    start: SmartNavAssistantRoutePoint;
    destination: SmartNavAssistantRoutePoint;
  } | null;
  suggestions: string[];
}

const LOCATION_TYPES: Location['type'][] = [
  'hostel',
  'class',
  'faculty',
  'entertainment',
  'shop',
  'parking',
  'medical',
  'sports',
  'eatables',
  'religious',
  'bank',
];

const EVENT_CATEGORIES: EventCategory[] = [
  'academic',
  'cultural',
  'sports',
  'workshop',
  'seminar',
  'conference',
  'social',
  'other',
];

const DEFAULT_SUGGESTIONS = [
  'Try "take me from hostel j to the library".',
  'Try "show only sports events".',
  'Try "find the main gate".',
];

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const compact = (value: string): string => normalize(value).replace(/\s+/g, '');

const cleanReference = (value: string): string =>
  normalize(
    value
      .replace(/\b(please|show|find|take me|navigate|route|directions|go|get me|bring me)\b/gi, ' ')
      .replace(/\b(the|a|an|to|from|for|near|towards)\b/gi, ' ')
  );

const tokenize = (value: string): string[] =>
  normalize(value)
    .split(' ')
    .filter(token => token.length > 1);

const scoreByTokens = (tokens: string[], haystack: string, weight: number): number =>
  tokens.reduce((score, token) => (haystack.includes(token) ? score + weight : score), 0);

const getEventLocation = (event: Event, locations: Location[]): Location | null => {
  if (event.locationId && typeof event.locationId === 'object' && 'coordinates' in event.locationId) {
    return event.locationId;
  }

  const locationId = typeof event.locationId === 'string' ? event.locationId : null;
  return locations.find(location => location._id === locationId) ?? null;
};

const scoreLocationMatch = (query: string, location: Location): number => {
  if (!query) return 0;

  const normalizedQuery = cleanReference(query);
  const queryCompact = compact(normalizedQuery);
  const name = normalize(location.name);
  const nameCompact = compact(location.name);
  const description = normalize(location.description || '');
  const tags = Array.isArray(location.tags) ? normalize(location.tags.join(' ')) : '';
  const type = normalize(location.type);
  const tokens = tokenize(normalizedQuery);

  let score = 0;

  if (name === normalizedQuery || nameCompact === queryCompact) score += 120;
  if (name.startsWith(normalizedQuery) && normalizedQuery.length >= 3) score += 70;
  if (name.includes(normalizedQuery) && normalizedQuery.length >= 3) score += 55;
  if (queryCompact && nameCompact.includes(queryCompact) && queryCompact.length >= 3) score += 45;
  if (tags.includes(normalizedQuery) && normalizedQuery.length >= 3) score += 25;
  if (description.includes(normalizedQuery) && normalizedQuery.length >= 3) score += 18;
  if (type.includes(normalizedQuery)) score += 16;

  score += scoreByTokens(tokens, name, 12);
  score += scoreByTokens(tokens, tags, 5);
  score += scoreByTokens(tokens, description, 3);
  score += scoreByTokens(tokens, type, 6);

  return score;
};

const scoreEventMatch = (query: string, event: Event): number => {
  if (!query) return 0;

  const normalizedQuery = cleanReference(query);
  const queryCompact = compact(normalizedQuery);
  const title = normalize(event.title);
  const titleCompact = compact(event.title);
  const description = normalize(event.description || '');
  const tags = Array.isArray(event.tags) ? normalize(event.tags.join(' ')) : '';
  const category = normalize(event.category);
  const tokens = tokenize(normalizedQuery);

  let score = 0;

  if (title === normalizedQuery || titleCompact === queryCompact) score += 120;
  if (title.startsWith(normalizedQuery) && normalizedQuery.length >= 3) score += 72;
  if (title.includes(normalizedQuery) && normalizedQuery.length >= 3) score += 54;
  if (queryCompact && titleCompact.includes(queryCompact) && queryCompact.length >= 3) score += 44;
  if (category.includes(normalizedQuery)) score += 24;
  if (description.includes(normalizedQuery) && normalizedQuery.length >= 3) score += 14;

  score += scoreByTokens(tokens, title, 12);
  score += scoreByTokens(tokens, tags, 5);
  score += scoreByTokens(tokens, description, 3);
  score += scoreByTokens(tokens, category, 7);

  return score;
};

const bestMatch = <T,>(matches: MatchScore<T>[], threshold: number): T | null => {
  const best = matches.sort((a, b) => b.score - a.score)[0];
  return best && best.score >= threshold ? best.item : null;
};

const detectViewMode = (prompt: string): ViewMode => {
  const normalizedPrompt = normalize(prompt);

  if (
    normalizedPrompt.includes('only events') ||
    normalizedPrompt.includes('show events only') ||
    normalizedPrompt.includes('event only')
  ) {
    return 'events';
  }

  if (
    normalizedPrompt.includes('only locations') ||
    normalizedPrompt.includes('show locations only') ||
    normalizedPrompt.includes('location only')
  ) {
    return 'locations';
  }

  return 'all';
};

const detectLocationTypes = (prompt: string): Location['type'][] => {
  const normalizedPrompt = normalize(prompt);

  return LOCATION_TYPES.filter(type => {
    const normalizedType = normalize(type);
    return normalizedPrompt.includes(normalizedType);
  });
};

const detectEventCategories = (prompt: string, events: Event[]): EventCategory[] => {
  const normalizedPrompt = normalize(prompt);
  const availableCategories = new Set(events.map(event => event.category));

  return EVENT_CATEGORIES.filter(category =>
    availableCategories.has(category) && normalizedPrompt.includes(normalize(category))
  );
};

const isEventPrompt = (prompt: string, categories: EventCategory[]): boolean => {
  const normalizedPrompt = normalize(prompt);
  const standaloneEventWords = ['seminar', 'workshop', 'conference'];
  const hasStandaloneCategoryWord = standaloneEventWords.some(word => normalizedPrompt.includes(word));
  const hasCategoryWithEventContext =
    categories.length > 0 &&
    (
      normalizedPrompt.includes('event') ||
      normalizedPrompt.includes('ongoing') ||
      normalizedPrompt.includes('upcoming') ||
      normalizedPrompt.includes('happening')
    );

  return (
    normalizedPrompt.includes('event') ||
    hasStandaloneCategoryWord ||
    normalizedPrompt.includes('ongoing') ||
    normalizedPrompt.includes('upcoming') ||
    hasCategoryWithEventContext
  );
};

const resolveRoutePoint = (
  reference: string,
  locations: Location[],
  events: Event[]
): SmartNavAssistantRoutePoint | null => {
  const location = bestMatch(
    locations.map(item => ({ item, score: scoreLocationMatch(reference, item) })),
    22
  );

  if (location) {
    return {
      label: location.name,
      coordinates: location.coordinates,
      location,
    };
  }

  const event = bestMatch(
    events.map(item => ({ item, score: scoreEventMatch(reference, item) })),
    22
  );

  if (!event) return null;

  const eventLocation = getEventLocation(event, locations);
  if (!eventLocation) return null;

  return {
    label: `${event.title} (${eventLocation.name})`,
    coordinates: eventLocation.coordinates,
    event,
    location: eventLocation,
  };
};

const buildFallbackResult = (): SmartNavAssistantResult => ({
  summary: 'I could not confidently match that request to the campus data yet.',
  mapState: {
    searchQuery: '',
    locationTypes: [],
    eventCategories: [],
    viewMode: 'all',
  },
  selectedLocation: null,
  selectedEvent: null,
  focusCoordinates: null,
  route: null,
  suggestions: DEFAULT_SUGGESTIONS,
});

export class SmartNavAssistantService {
  static async interpret(prompt: string, locations: Location[], events: Event[]): Promise<SmartNavAssistantResult> {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return {
        ...buildFallbackResult(),
        summary: 'Ask for a route, an event category, or a place on campus.',
      };
    }

    const normalizedPrompt = normalize(trimmedPrompt);
    const detectedViewMode = detectViewMode(trimmedPrompt);
    const detectedLocationTypes = detectLocationTypes(trimmedPrompt);
    const detectedEventCategories = detectEventCategories(trimmedPrompt, events);

    const routeMatch =
      trimmedPrompt.match(/\bfrom\s+(.+?)\s+to\s+(.+)$/i) ||
      trimmedPrompt.match(/\bbetween\s+(.+?)\s+and\s+(.+)$/i);

    if (routeMatch) {
      const startReference = cleanReference(routeMatch[1]);
      const destinationReference = cleanReference(routeMatch[2]);
      const start = resolveRoutePoint(startReference, locations, events);
      const destination = resolveRoutePoint(destinationReference, locations, events);

      if (start && destination) {
        return {
          summary: `Routing from ${start.label} to ${destination.label}.`,
          mapState: {
            searchQuery: '',
            locationTypes: [],
            eventCategories: [],
            viewMode: 'all',
          },
          selectedLocation: destination.location ?? null,
          selectedEvent: destination.event ?? null,
          focusCoordinates: destination.coordinates,
          route: { start, destination },
          suggestions: [
            'Click the swap button if you want to reverse the route.',
            'You can still replace either point by clicking a marker on the map.',
          ],
        };
      }

      const missingLabels = [
        !start ? `"${routeMatch[1].trim()}"` : null,
        !destination ? `"${routeMatch[2].trim()}"` : null,
      ].filter(Boolean);

      return {
        ...buildFallbackResult(),
        summary: `I found part of the route, but I could not match ${missingLabels.join(' and ')} yet.`,
      };
    }

    if (isEventPrompt(trimmedPrompt, detectedEventCategories)) {
      const matchedEvent = bestMatch(
        events.map(item => ({ item, score: scoreEventMatch(trimmedPrompt, item) })),
        26
      );

      if (matchedEvent) {
        const eventLocation = getEventLocation(matchedEvent, locations);
        return {
          summary: `Showing ${matchedEvent.title} on the map.`,
          mapState: {
            searchQuery: matchedEvent.title,
            locationTypes: [],
            eventCategories: [matchedEvent.category],
            viewMode: 'events',
          },
          selectedLocation: null,
          selectedEvent: matchedEvent,
          focusCoordinates: eventLocation?.coordinates ?? null,
          route: null,
          suggestions: [
            'Ask for directions by saying "take me from hostel j to this event".',
            'Try another category like sports, workshop, or seminar.',
          ],
        };
      }

      if (detectedEventCategories.length > 0) {
        return {
          summary: `Filtering the map to ${detectedEventCategories.join(', ')} events.`,
          mapState: {
            searchQuery: '',
            locationTypes: [],
            eventCategories: detectedEventCategories,
            viewMode: detectedViewMode === 'locations' ? 'all' : 'events',
          },
          selectedLocation: null,
          selectedEvent: null,
          focusCoordinates: null,
          route: null,
          suggestions: [
            'Add a place name to narrow it further, like "sports events near library".',
            'Ask for directions by saying "from hostel j to robotics workshop".',
          ],
        };
      }
    }

    if (detectedLocationTypes.length > 0) {
      return {
        summary: `Filtering the map to ${detectedLocationTypes.join(', ')} locations.`,
        mapState: {
          searchQuery: '',
          locationTypes: detectedLocationTypes,
          eventCategories: [],
          viewMode: detectedViewMode === 'events' ? 'all' : 'locations',
        },
        selectedLocation: null,
        selectedEvent: null,
        focusCoordinates: null,
        route: null,
        suggestions: [
          'Add a place name like "find hostel j".',
          'Ask for directions with "from main gate to library".',
        ],
      };
    }

    const matchedLocation = bestMatch(
      locations.map(item => ({ item, score: scoreLocationMatch(trimmedPrompt, item) })),
      24
    );

    if (matchedLocation) {
      return {
        summary: `Focusing the map on ${matchedLocation.name}.`,
        mapState: {
          searchQuery: matchedLocation.name,
          locationTypes: [],
          eventCategories: [],
          viewMode: 'locations',
        },
        selectedLocation: matchedLocation,
        selectedEvent: null,
        focusCoordinates: matchedLocation.coordinates,
        route: null,
        suggestions: [
          'Ask for directions by saying "from hostel j to this place".',
          'Try a type filter like "show only medical locations".',
        ],
      };
    }

    const matchedEvent = bestMatch(
      events.map(item => ({ item, score: scoreEventMatch(trimmedPrompt, item) })),
      24
    );

    if (matchedEvent) {
      const eventLocation = getEventLocation(matchedEvent, locations);
      return {
        summary: `Focusing the map on ${matchedEvent.title}.`,
        mapState: {
          searchQuery: matchedEvent.title,
          locationTypes: [],
          eventCategories: [matchedEvent.category],
          viewMode: 'events',
        },
        selectedLocation: null,
        selectedEvent: matchedEvent,
        focusCoordinates: eventLocation?.coordinates ?? null,
        route: null,
        suggestions: [
          'Ask for directions to this event from a hostel or gate.',
          'Try another event category if you want a broader view.',
        ],
      };
    }

    if (normalizedPrompt.includes('clear filters') || normalizedPrompt.includes('reset map')) {
      return {
        summary: 'Resetting the map filters.',
        mapState: {
          searchQuery: '',
          locationTypes: [],
          eventCategories: [],
          viewMode: 'all',
        },
        selectedLocation: null,
        selectedEvent: null,
        focusCoordinates: null,
        route: null,
        suggestions: DEFAULT_SUGGESTIONS,
      };
    }

    return buildFallbackResult();
  }
}
