import {
  GeocodingProvider,
  LocationSuggestion,
  SelectedLocation,
} from './types';

/**
 * Trimble Maps Geocoding Provider
 * Uses Trimble Maps Single Search API for location search
 */
export class TrimbleMapsProvider implements GeocodingProvider {
  private apiKey: string;
  private baseUrl: string = 'https://singlesearch.alk.com';
  private region: string = 'NA'; // North America

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate a unique ID for location suggestions
   */
  private generateUniqueId(prefix: string = 'trimble'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async searchLocations(
    query: string,
    maxResults: number = 5,
  ): Promise<LocationSuggestion[]> {
    if (!query || query.length < 3) return [];

    try {
      const url = `${this.baseUrl}/${this.region}/api/search?authToken=${
        this.apiKey
      }&query=${encodeURIComponent(query)}&maxResults=${maxResults}`;

      console.log('🔍 Trimble search:', query);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Trimble Maps API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Check for API errors
      if (
        !data ||
        data.Err !== 0 ||
        !data.Locations ||
        !Array.isArray(data.Locations)
      ) {
        console.warn(
          '⚠️ Trimble API response error or unexpected format:',
          data,
        );
        return [];
      }

      console.log(`✅ Trimble found ${data.Locations.length} locations`);

      return data.Locations.map((location: any) => {
        const lat = parseFloat(location.Coords?.Lat || '0');
        const lng = parseFloat(location.Coords?.Lon || '0');
        const city = location.Address?.City || '';
        const state = location.Address?.State || '';
        const zip = location.Address?.Zip || '';

        // Use ShortString for display, or construct from components
        const displayText =
          location.ShortString || `${city}, ${state} ${zip}`.trim();
        const fullAddress = location.Address?.StreetAddress
          ? `${location.Address.StreetAddress}, ${city}, ${state} ${zip}`.trim()
          : displayText;

        return {
          id: this.generateUniqueId('search'),
          label: displayText,
          value: displayText,
          address: fullAddress,
          city,
          state,
          postalCode: zip,
          lat,
          lng,
        };
      });
    } catch (error) {
      console.error('❌ Trimble Maps search failed:', error);
      return [];
    }
  }

  async geocodeAddress(address: string): Promise<SelectedLocation | null> {
    if (!address) return null;

    try {
      // Use search with maxResults=1 for geocoding
      const locations = await this.searchLocations(address, 1);

      if (locations.length === 0) {
        return null;
      }

      const location = locations[0];
      return {
        name: location.value,
        address: location.address,
        city: location.city,
        state: location.state,
        postalCode: location.postalCode,
        lat: location.lat,
        lng: location.lng,
      };
    } catch (error) {
      console.error('❌ Trimble Maps geocoding failed:', error);
      return null;
    }
  }
}
