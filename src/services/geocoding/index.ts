/**
 * Geocoding Service
 *
 * This module provides a unified interface for location search and geocoding
 * across multiple providers (HERE Maps, Trimble Maps).
 */

export { GeocodingService } from './GeocodingService';
export { HereMapsProvider } from './HereMapsProvider';
export { TrimbleMapsProvider } from './TrimbleMapsProvider';
export type {
  GeocodingProvider,
  LocationSuggestion,
  SelectedLocation,
} from './types';
export { GeocodingProviderType } from './types';
