import { apiClient } from './apiClient';
import { Location, CreateLocationData, UpdateLocationData } from '../types';

interface LocationsResponse {
  locations: Location[];
  total: number;
  page: number;
  totalPages: number;
}

interface LocationFilters {
  category?: string[];
  accessibility?: boolean;
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number; // in meters
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'category' | 'distance' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class LocationService {
  static async getLocations(filters?: LocationFilters): Promise<LocationsResponse> {
    const params = new URLSearchParams();

    if (filters) {
      // Backend expects 'q' for search
      if (filters.search) params.append('q', filters.search);

      // Backend expects a single 'type'; if multiple provided, take the first
      if (filters.category?.length) params.append('type', filters.category[0]);

      // Pagination
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      // Bounds support (north/south/east/west) if provided via lat/lng/radius is not supported on this endpoint; use /nearby for radius queries
    }

    const queryString = params.toString();
    const url = queryString ? `/locations?${queryString}` : '/locations';

    // Backend returns { success, data: { locations, pagination } }
    const raw = await apiClient.get<{ success: boolean; data: { locations: Location[]; pagination: { current: number; pages: number; total: number } } }>(url);
    const { locations, pagination } = raw.data;
    return {
      locations,
      page: pagination.current,
      totalPages: pagination.pages,
      total: pagination.total,
    };
  }

  static async getLocationById(id: string): Promise<Location> {
    return apiClient.get<Location>(`/locations/${id}`);
  }

  static async getNearbyLocations(
    lat: number, 
    lng: number, 
    radius: number = 1000
  ): Promise<Location[]> {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: String(radius),
    });

  const raw = await apiClient.get<{ success: boolean; data: { locations: Location[] } }>(`/locations/nearby?${params.toString()}`);
  return raw.data.locations;
  }

  static async searchLocations(query: string): Promise<Location[]> {
    const params = new URLSearchParams({ q: query });
    const raw = await apiClient.get<{ success: boolean; data: { locations: Location[] } }>(`/locations?${params.toString()}`);
    return raw.data.locations;
  }

  static async getLocationsByCategory(category: string): Promise<Location[]> {
    const params = new URLSearchParams({ type: category });
    const raw = await apiClient.get<{ success: boolean; data: { locations: Location[] } }>(`/locations?${params.toString()}`);
    return raw.data.locations;
  }

  static async createLocation(data: CreateLocationData): Promise<Location> {
    const response = await apiClient.post<{ success: boolean; data: { location: Location } }>('/locations', data);
    return response.data.location;
  }

  static async updateLocation(id: string, data: UpdateLocationData): Promise<Location> {
    const response = await apiClient.put<{ success: boolean; data: { location: Location } }>(`/locations/${id}`, data);
    return response.data.location;
  }

  static async deleteLocation(id: string): Promise<void> {
    return apiClient.delete(`/locations/${id}`);
  }

  static async uploadLocationImage(id: string, file: File): Promise<Location> {
    return apiClient.uploadFile<Location>(`/locations/${id}/image`, file);
  }

  static async importLocationsFromCSV(file: File): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    return apiClient.uploadFile(`/locations/import`, file);
  }

  static async exportLocationsToCSV(): Promise<void> {
    return apiClient.downloadFile('/locations/export', 'locations.csv');
  }

  // Utility methods for filtering and sorting
  static sortLocationsByDistance(
    locations: Location[], 
    userLat: number, 
    userLng: number
  ): Location[] {
    return locations.sort((a, b) => {
      const distanceA = this.calculateDistance(userLat, userLng, a.coordinates.lat, a.coordinates.lng);
      const distanceB = this.calculateDistance(userLat, userLng, b.coordinates.lat, b.coordinates.lng);
      return distanceA - distanceB;
    });
  }

  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  static getBoundsForLocations(locations: Location[]): {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null {
    if (locations.length === 0) return null;

    let north = locations[0].coordinates.lat;
    let south = locations[0].coordinates.lat;
    let east = locations[0].coordinates.lng;
    let west = locations[0].coordinates.lng;

    locations.forEach(location => {
      north = Math.max(north, location.coordinates.lat);
      south = Math.min(south, location.coordinates.lat);
      east = Math.max(east, location.coordinates.lng);
      west = Math.min(west, location.coordinates.lng);
    });

    return { north, south, east, west };
  }
}
