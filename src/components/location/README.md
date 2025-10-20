# Location Components

This directory contains reusable components for location search and selection functionality.

## Overview

These components provide a unified interface for searching and selecting cities/locations using various geocoding providers (Trimble Maps, HERE Maps, etc.).

## Components

### CitySearch

**File**: `CitySearch.tsx`

Low-level autocomplete component for city/location search.

**Features**:

- Real-time search with debouncing (1.5s)
- Support for multiple geocoding providers (Trimble Maps by default)
- Displays coordinates and postal codes
- Fully typed with TypeScript

**Props**:

```typescript
{
  onSelect?: (city: SelectedCity) => void;
  placeholder?: string;
  label?: string;
  provider?: GeocodingProviderType; // TRIMBLE_MAPS (default) or HERE_MAPS
}
```

**Types**:

```typescript
interface SelectedCity {
  name: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

interface CitySuggestion extends LocationSuggestion {
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
```

**Usage**:

```tsx
import { CitySearch } from './components/location';

<CitySearch
  placeholder="Enter city name"
  onSelect={(city) => console.log(city)}
  provider={GeocodingProviderType.TRIMBLE_MAPS}
/>;
```

### CitySelection

**File**: `CitySelection.tsx`

Higher-level component that wraps CitySearch with title and selected city display.

**Features**:

- Includes title/label
- Shows selected city information
- Uses types from `useSearchState` hook
- Designed for use in forms

**Props**:

```typescript
{
  title: string;              // Title displayed above search
  placeholder: string;        // Search input placeholder
  selectedCity?: CityData;    // Currently selected city data
  onCitySelect: (city: SelectedCity) => void;
}
```

**Usage**:

```tsx
import { CitySelection } from './components/location';

<CitySelection
  title="Origin City"
  placeholder="Enter origin city"
  selectedCity={searchState.origin}
  onCitySelect={handleOriginCitySelect}
/>;
```

## Dependencies

### Internal Services

- **GeocodingService**: Abstraction layer for geocoding providers
  - Located in: `src/services/geocoding/`
  - Providers: TrimbleMapsProvider, HereMapsProvider

### External Libraries

- **Ant Design**: UI components (AutoComplete, Input, Typography)
- **Lodash**: Debouncing search input

### Hooks

- **useSearchState**: Provides CityData and SelectedCity types
  - Located in: `src/hooks/useSearchState.ts`

## Provider Configuration

Default provider is **Trimble Maps**. To switch providers:

```tsx
import { GeocodingProviderType } from '../services/geocoding';

// Use HERE Maps instead
<CitySearch
  provider={GeocodingProviderType.HERE_MAPS}
  onSelect={handleSelect}
/>;
```

## Integration with Geocoding Service

These components use the geocoding service abstraction layer, which allows seamless switching between providers:

- **Trimble Maps**: Uses Trimble Single Search API

  - API Key: `REACT_APP_TRIMBLE_API_KEY`
  - Better for North American addresses
  - Minimum 3 characters for search

- **HERE Maps**: Uses HERE Geocoding API
  - API Key: `REACT_APP_HERE_API_KEY`
  - Global coverage
  - Minimum 2 characters for search

## Type Compatibility

**Important**: There are two similar but different type definitions:

1. **CitySearch types** (this module):

   - `SelectedCity`: Used by CitySearch component
   - Simpler structure for general use

2. **useSearchState types** (hooks):
   - `CityData`: Used by search state management
   - `SelectedCity`: Hook-specific version
   - More detailed with separate city/state/zip fields

The components handle conversion between these types automatically.

## Used By

These components are used throughout the application:

- **Load Search Module** (`routing/load-search/`):

  - OriginSelector component
  - DestinationSelector component
  - AddNewSearchModal

- **Lane Management**:
  - Lane editing forms
  - Search configuration

## Performance

- **Debouncing**: 1.5 second delay prevents excessive API calls
- **Result Limit**: Maximum 10 suggestions per search
- **Loading States**: Visual feedback during search
- **Cleanup**: Debounced functions properly cleaned up on unmount

## Future Enhancements

- [ ] Add recent searches cache
- [ ] Support for GPS/current location
- [ ] Bulk location import
- [ ] Custom result formatting
- [ ] Offline/fallback mode
- [ ] Multi-language support
- [ ] Distance-based sorting

## Migration Notes

**Previous Location**: `components/CitySearch.tsx` and `components/CitySelection.tsx`

**New Location**: `components/location/`

**Import Changes**:

```typescript
// Old
import CitySearch from './components/CitySearch';
import CitySelection from './components/CitySelection';

// New
import { CitySearch, CitySelection } from './components/location';
// or
import CitySearch from './components/location/CitySearch';
import CitySelection from './components/location/CitySelection';
```

## Related Documentation

- Geocoding Service: `src/services/geocoding/README.md`
- Load Search Module: `src/components/routing/load-search/README.md`
- Trimble Routing: `src/components/routing/trimble/`
