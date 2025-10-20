import { GeocodingProvider, GeocodingProviderType } from './types';
import { HereMapsProvider } from './HereMapsProvider';
import { TrimbleMapsProvider } from './TrimbleMapsProvider';

/**
 * Geocoding Service Factory
 * Creates and manages geocoding provider instances
 */
export class GeocodingService {
  private static providers: Map<GeocodingProviderType, GeocodingProvider> =
    new Map();

  /**
   * Get or create a geocoding provider instance
   */
  static getProvider(
    type: GeocodingProviderType,
    apiKey?: string,
  ): GeocodingProvider {
    // Return cached provider if available
    if (this.providers.has(type)) {
      return this.providers.get(type)!;
    }

    // Create new provider based on type
    let provider: GeocodingProvider;

    switch (type) {
      case GeocodingProviderType.HERE_MAPS:
        const hereApiKey =
          apiKey ||
          process.env.REACT_APP_HERE_API_KEY ||
          'b190a0605344cc4f3af08d0dd473dd25';
        provider = new HereMapsProvider(hereApiKey);
        break;

      case GeocodingProviderType.TRIMBLE_MAPS:
        const trimbleApiKey =
          apiKey ||
          process.env.REACT_APP_TRIMBLE_API_KEY ||
          '299354C7A83A67439273691EA750BB7F';
        provider = new TrimbleMapsProvider(trimbleApiKey);
        break;

      default:
        throw new Error(`Unsupported geocoding provider: ${type}`);
    }

    // Cache the provider
    this.providers.set(type, provider);
    return provider;
  }

  /**
   * Clear cached providers (useful for testing or switching API keys)
   */
  static clearCache() {
    this.providers.clear();
  }
}
