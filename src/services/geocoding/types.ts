/**
 * Geocoding Service Types
 * Common interfaces for location search across different providers
 */

export interface LocationSuggestion {
  id: string;
  label: string;
  value: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  lat: number;
  lng: number;
}

export interface SelectedLocation {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  lat: number;
  lng: number;
}

export interface GeocodingProvider {
  searchLocations(
    query: string,
    maxResults?: number,
  ): Promise<LocationSuggestion[]>;
  geocodeAddress(address: string): Promise<SelectedLocation | null>;
}

export enum GeocodingProviderType {
  HERE_MAPS = 'HERE_MAPS',
  TRIMBLE_MAPS = 'TRIMBLE_MAPS',
}
