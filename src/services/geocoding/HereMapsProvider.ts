import {
  GeocodingProvider,
  LocationSuggestion,
  SelectedLocation,
} from './types';

/**
 * HERE Maps Geocoding Provider
 * Uses HERE Maps Geocoding API for location search
 */
export class HereMapsProvider implements GeocodingProvider {
  private apiKey: string;
  private baseUrl: string = 'https://geocode.search.hereapi.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchLocations(
    query: string,
    maxResults: number = 5,
  ): Promise<LocationSuggestion[]> {
    if (!query || query.length < 2) return [];

    try {
      const url = `${this.baseUrl}/geocode?q=${encodeURIComponent(
        query,
      )}&apiKey=${this.apiKey}&limit=${maxResults}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `HERE Maps API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      return data.items.map((item: any, index: number) => {
        const { title, address, position } = item;
        const postalCode = address.postalCode || '';
        const label = postalCode ? `${title} (${postalCode})` : title;

        return {
          id: `here-${index}-${Date.now()}`,
          label,
          value: title,
          address: title,
          city: address.city || '',
          state: address.state || '',
          postalCode,
          lat: position?.lat || 0,
          lng: position?.lng || 0,
        };
      });
    } catch (error) {
      console.error('HERE Maps search failed:', error);
      return [];
    }
  }

  async geocodeAddress(address: string): Promise<SelectedLocation | null> {
    if (!address) return null;

    try {
      const url = `${this.baseUrl}/geocode?q=${encodeURIComponent(
        address,
      )}&apiKey=${this.apiKey}&limit=1`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `HERE Maps API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return null;
      }

      const item = data.items[0];
      const { title, address: addr, position } = item;

      return {
        name: title,
        address: title,
        city: addr.city || '',
        state: addr.state || '',
        postalCode: addr.postalCode || '',
        lat: position?.lat || 0,
        lng: position?.lng || 0,
      };
    } catch (error) {
      console.error('HERE Maps geocoding failed:', error);
      return null;
    }
  }
}
