import { Event, Location, User } from '../types';
import { EventService } from './eventService';
import { LocationService } from './locationService';

export interface EventRecommendation {
  event: Event;
  score: number;
  reasons: string[];
  location: Location | null;
  status: 'upcoming' | 'ongoing' | 'completed';
  distanceKm: number | null;
}

interface RecommendationOptions {
  events: Event[];
  locations: Location[];
  user: User | null;
  anchorLocation?: Location | null;
  limit?: number;
}

const normalize = (value: string): string =>
  value.toLowerCase().trim();

const toInterestTokens = (user: User | null): string[] =>
  Array.isArray(user?.interests)
    ? user.interests.map(normalize).filter(Boolean)
    : [];

const resolveEventLocation = (event: Event, locations: Location[]): Location | null => {
  if (event.locationId && typeof event.locationId === 'object' && 'coordinates' in event.locationId) {
    return event.locationId;
  }

  const locationId = typeof event.locationId === 'string' ? event.locationId : null;
  if (!locationId) return null;

  return locations.find(location => location._id === locationId) ?? null;
};

const getEventKeywordMatches = (event: Event, interests: string[]): string[] => {
  const keywords = new Set<string>();
  const haystacks = [
    normalize(event.category),
    ...event.tags.map(normalize),
    normalize(event.title),
    normalize(event.description || ''),
  ];

  interests.forEach(interest => {
    if (haystacks.some(haystack => haystack.includes(interest))) {
      keywords.add(interest);
    }
  });

  return Array.from(keywords);
};

export class EventRecommendationService {
  static getRecommendations({
    events,
    locations,
    user,
    anchorLocation = null,
    limit = 3,
  }: RecommendationOptions): EventRecommendation[] {
    const interests = toInterestTokens(user);

    return events
      .map((event) => {
        const status = EventService.getEventStatus(event);
        const location = resolveEventLocation(event, locations);
        const keywordMatches = getEventKeywordMatches(event, interests);
        const availableSpots = EventService.getAvailableSpots(event);

        let score = 0;
        const reasons: string[] = [];
        let distanceKm: number | null = null;

        if (status === 'ongoing') {
          score += 40;
          reasons.push('Happening right now');
        } else if (status === 'upcoming') {
          score += 22;
          reasons.push('Coming up soon');
        }

        if (interests.includes(normalize(event.category))) {
          score += 32;
          reasons.push(`Matches your interest in ${event.category}`);
        }

        if (keywordMatches.length > 0) {
          score += Math.min(keywordMatches.length * 12, 24);
          if (!reasons.some(reason => reason.includes('Matches your interest'))) {
            reasons.push(`Related to ${keywordMatches.slice(0, 2).join(' and ')}`);
          }
        }

        if (availableSpots > 0) {
          score += 8;
        }

        if (location && anchorLocation?.coordinates) {
          distanceKm = LocationService.calculateDistance(
            anchorLocation.coordinates.lat,
            anchorLocation.coordinates.lng,
            location.coordinates.lat,
            location.coordinates.lng
          ) / 1000;

          if (distanceKm <= 0.35) {
            score += 18;
            reasons.push(`Very close to ${anchorLocation.name}`);
          } else if (distanceKm <= 0.9) {
            score += 12;
            reasons.push(`Near ${anchorLocation.name}`);
          } else if (distanceKm <= 1.6) {
            score += 6;
          }
        }

        if (interests.length === 0) {
          score += status === 'ongoing' ? 18 : 10;
          if (!reasons.some(reason => reason.includes('Happening'))) {
            reasons.push('Popular active campus event');
          }
        }

        return {
          event,
          score,
          reasons: reasons.slice(0, 2),
          location,
          status,
          distanceKm,
        };
      })
      .filter((recommendation) => recommendation.status !== 'completed')
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        if (left.status !== right.status) {
          return left.status === 'ongoing' ? -1 : 1;
        }

        return new Date(left.event.dateTime).getTime() - new Date(right.event.dateTime).getTime();
      })
      .slice(0, limit);
  }
}
