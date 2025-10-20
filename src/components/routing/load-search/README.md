# Load Search Module

## Overview

This module handles all load search functionality, lane management, and load board integration for the Truckarooskie application.

## Structure

```
routing/load-search/
├── LoadSearchPage.tsx          # Main page component
├── AddNewSearchModal.tsx       # Modal for creating new searches
├── index.ts                    # Module exports
└── README.md                   # This file
```

## Components

### LoadSearchPage

**File**: `LoadSearchPage.tsx`  
**Route**: `/load-search` (previously `/test`)

Main page for load search and lane management. Provides:

- Button to open new search modal
- Lane management interface
- Integration with load boards (DAT, Sylectus)

**Props**: None (top-level page component)

### AddNewSearchModal

**File**: `AddNewSearchModal.tsx`  
**Previously**: `AddNewSearch.tsx` in root components

Modal component for creating new load searches. Features:

- Origin and destination city selection
- State map selection for pick-up and drop-off areas
- Date range picker for pick-up dates
- Load board submission (DAT, Sylectus, or both)
- Real-time search results display

**Props**:

- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback when modal closes

## Related Components

The following components are still in the parent `components/` directory but are heavily used by this module:

### Search Configuration

- **CitySelection**: City search and selection using HERE Maps API
- **StateMapSelector**: Interactive US state map for selecting origin/destination states
- **DateRangePicker**: Date range selection for load pickup dates

### Results Display

- **LoadBoardResults**: Displays search results and provides search actions
- **LoadSearchResults**: Detailed load search results display

### Lane Management

- **LanesContainerList**: Main container for lane list
- **lanes/**: Directory with lane-related subcomponents
  - `LanesContainer.tsx`: Individual lane container
  - `LaneTable.tsx`: Table display of lanes
  - `LaneDetails.tsx`: Detailed lane information
  - `EditLaneModal.tsx`: Modal for editing lanes
  - `DriverManagement.tsx`: Driver assignment
  - `SourceTags.tsx`: Load board source tags

## Hooks

Used by this module but located in `src/hooks/`:

- **useSearchState**: Manages search form state
- **useSearchSubmission**: Handles load board API submissions

## Types

Related TypeScript types in `src/types/`:

- **loadboard.ts**: Load board provider enums and interfaces
- **sylectus.ts**: Sylectus API types
- **routing.ts**: Routing and waypoint types

## Usage Example

```typescript
import { LoadSearchPage } from './components/routing/load-search';

// In App.tsx or routing configuration
<Route path="/load-search" element={<LoadSearchPage />} />;
```

## Future Improvements

Potential components to move into this module:

1. **CitySelection** → `load-search/CitySelection.tsx`
2. **StateMapSelector** → `load-search/StateMapSelector.tsx`
3. **DateRangePicker** → `load-search/DateRangePicker.tsx`
4. **LoadBoardResults** → `load-search/LoadBoardResults.tsx`
5. **LoadSearchResults** → `load-search/LoadSearchResults.tsx`

This would create a fully self-contained load search module.

## Migration Notes

### Changed Routes

- Old: `/test`
- New: `/load-search`

### Changed Component Names

- `LoadContainerListing` → `LoadSearchPage`
- `AddNewSearch` → `AddNewSearchModal`

### Import Path Changes

```typescript
// Old
import LoadContainerListing from './components/LoadContainerListing';
import AddNewSearch from './components/AddNewSearch';

// New
import {
  LoadSearchPage,
  AddNewSearchModal,
} from './components/routing/load-search';
// or
import LoadSearchPage from './components/routing/load-search/LoadSearchPage';
import AddNewSearchModal from './components/routing/load-search/AddNewSearchModal';
```
