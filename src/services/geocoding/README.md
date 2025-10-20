# Geocoding Service

A unified abstraction layer for location search and geocoding across multiple map providers.

## Overview

This service provides a consistent interface for:

- Location search (autocomplete)
- Address geocoding
- Multiple provider support (HERE Maps, Trimble Maps)

## Architecture

```
services/geocoding/
├── types.ts                    # Common interfaces
├── GeocodingService.ts         # Factory and service manager
├── HereMapsProvider.ts         # HERE Maps implementation
├── TrimbleMapsProvider.ts      # Trimble Maps implementation
├── index.ts                    # Public exports
└── README.md                   # This file
```

## Supported Providers

### Trimble Maps (Recommended)

- **API**: Trimble Maps Single Search API
- **Endpoint**: `https://singlesearch.alk.com`
- **Features**: Truck-specific routing, North America focus
- **API Key**: Configured via `REACT_APP_TRIMBLE_API_KEY`

### HERE Maps

- **API**: HERE Geocoding & Search API v1
- **Endpoint**: `https://geocode.search.hereapi.com/v1`
- **Features**: Global coverage, detailed location data
- **API Key**: Configured via `REACT_APP_HERE_API_KEY`

## Usage

### Basic Usage

```typescript
import { GeocodingService, GeocodingProviderType } from '../services/geocoding';

// Get a provider instance
const provider = GeocodingService.getProvider(
  GeocodingProviderType.TRIMBLE_MAPS,
);

// Search for locations
const results = await provider.searchLocations('Chicago IL', 5);

// Geocode an address
const location = await provider.geocodeAddress('123 Main St, Chicago IL');
```

### In React Components

```typescript
import { GeocodingService, GeocodingProviderType } from '../services/geocoding';

function MyComponent() {
  const geocodingProvider = GeocodingService.getProvider(
    GeocodingProviderType.TRIMBLE_MAPS,
  );

  const handleSearch = async (query: string) => {
    const suggestions = await geocodingProvider.searchLocations(query, 10);
    // Use suggestions...
  };

  return (
    <CitySearch
      provider={GeocodingProviderType.TRIMBLE_MAPS}
      onSelect={handleSelect}
    />
  );
}
```

### CitySearch Component

The refactored `CitySearch` component now supports provider selection:

```typescript
<CitySearch
  placeholder="Enter city name"
  provider={GeocodingProviderType.TRIMBLE_MAPS}
  onSelect={(city) => console.log(city)}
/>
```

## Types

### LocationSuggestion

```typescript
interface LocationSuggestion {
  id: string; // Unique identifier
  label: string; // Display text
  value: string; // Selected value
  address: string; // Full address
  city?: string; // City name
  state?: string; // State/province
  postalCode?: string; // ZIP/postal code
  lat: number; // Latitude
  lng: number; // Longitude
}
```

### SelectedLocation

```typescript
interface SelectedLocation {
  name: string; // Location name
  address?: string; // Full address
  city?: string; // City name
  state?: string; // State/province
  postalCode?: string; // ZIP/postal code
  lat: number; // Latitude
  lng: number; // Longitude
}
```

## Provider Interface

All providers implement the `GeocodingProvider` interface:

```typescript
interface GeocodingProvider {
  searchLocations(
    query: string,
    maxResults?: number,
  ): Promise<LocationSuggestion[]>;
  geocodeAddress(address: string): Promise<SelectedLocation | null>;
}
```

## Configuration

### Environment Variables

```bash
# Trimble Maps API Key
REACT_APP_TRIMBLE_API_KEY=your_trimble_api_key

# HERE Maps API Key
REACT_APP_HERE_API_KEY=your_here_api_key
```

### Default Keys

If environment variables are not set, the service falls back to hardcoded keys (for development only).

## Benefits

### 1. Provider Abstraction

- Switch between providers without changing component code
- Easy to add new providers in the future

### 2. Consistent Interface

- Same method signatures across all providers
- Predictable response format

### 3. Centralized Configuration

- Single place to manage API keys
- Provider instances are cached and reused

### 4. Type Safety

- Full TypeScript support
- Compile-time validation

## Migration from Old CitySearch

The refactored `CitySearch` maintains backward compatibility:

```typescript
// Old interface (still works)
interface SelectedCity {
  name: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

// New interface (enhanced)
interface SelectedLocation {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  lat: number;
  lng: number;
}
```

### Migration Steps

1. **No changes required** - Old code continues to work
2. **Optional**: Update to use new `provider` prop
3. **Optional**: Use enhanced location data (city, state, address)

## Adding a New Provider

To add a new geocoding provider:

1. Create a new provider class implementing `GeocodingProvider`
2. Add the provider type to `GeocodingProviderType` enum
3. Update `GeocodingService.getProvider()` to handle the new type

Example:

```typescript
// 1. Create provider
export class GoogleMapsProvider implements GeocodingProvider {
  async searchLocations(query: string): Promise<LocationSuggestion[]> {
    // Implementation
  }

  async geocodeAddress(address: string): Promise<SelectedLocation | null> {
    // Implementation
  }
}

// 2. Add enum value
export enum GeocodingProviderType {
  HERE_MAPS = 'HERE_MAPS',
  TRIMBLE_MAPS = 'TRIMBLE_MAPS',
  GOOGLE_MAPS = 'GOOGLE_MAPS', // New
}

// 3. Update factory
case GeocodingProviderType.GOOGLE_MAPS:
  provider = new GoogleMapsProvider(apiKey);
  break;
```

## Performance Considerations

- **Caching**: Provider instances are cached to avoid recreation
- **Debouncing**: CitySearch debounces searches (1500ms) to reduce API calls
- **Max Results**: Limit results to reduce payload size (default: 5-10)

## Error Handling

All methods handle errors gracefully:

- Network errors return empty arrays or null
- Invalid responses are logged and handled
- No exceptions thrown to UI layer

## Future Enhancements

- [ ] Add response caching for repeated queries
- [ ] Support for reverse geocoding (lat/lng → address)
- [ ] Batch geocoding support
- [ ] Rate limiting and request queuing
- [ ] Provider failover (try HERE if Trimble fails)
- [ ] Analytics and usage tracking
