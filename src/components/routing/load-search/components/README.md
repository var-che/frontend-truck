# Load Search Subcomponents

This directory contains the subcomponents used within the AddNewSearchModal component.

## Overview

These components were extracted from AddNewSearchModal to improve code organization, maintainability, and reusability. Each component has a single, focused responsibility.

## Components

### OriginSelector

**File**: `OriginSelector.tsx`

Combines city and state selection for origin location.

**Props**:

```typescript
{
  selectedCity: CityData | undefined;
  selectedStates: string[];
  onCitySelect: (city: SelectedCity) => void;
  onStateToggle: (stateCode: string) => void;
  onStateRemove: (stateCode: string) => void;
}
```

**Features**:

- CitySelection component for entering origin city
- StateMapSelector with blue color scheme (#c6dbee, #6f8fa5, #1890ff)
- Vertical layout with proper spacing

### DestinationSelector

**File**: `DestinationSelector.tsx`

Combines city and state selection for destination location.

**Props**:

```typescript
{
  selectedCity: CityData | undefined;
  selectedStates: string[];
  onCitySelect: (city: SelectedCity) => void;
  onStateToggle: (stateCode: string) => void;
  onStateRemove: (stateCode: string) => void;
}
```

**Features**:

- CitySelection component for entering destination city
- StateMapSelector with green color scheme (#d9f7be, #7cb305, #52c41a)
- Vertical layout with proper spacing

### SearchDatePicker

**File**: `SearchDatePicker.tsx`

Wrapper component for date range selection.

**Props**:

```typescript
{
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  onDateChange: (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null]) => void;
}
```

**Features**:

- Wraps the DateRangePicker component
- Uses Dayjs for date handling
- Provides clean interface for pickup date selection

### SearchFooter

**File**: `SearchFooter.tsx`

Footer section containing load board results and action buttons.

**Props**:

```typescript
{
  isPosting: boolean;
  hasAnySuccess: boolean;
  hasAnyError: boolean;
  allErrors: string;
  datResult: LoadBoardSearchResult | null;
  sylectusResult: LoadBoardSearchResult | null;
  datError: string | null;
  sylectusError: string | null;
  extensionConnected?: boolean;
  onSearchAll: () => void;
  onSearchDAT: () => void;
  onSearchSylectus: () => void;
}
```

**Features**:

- Wraps LoadBoardResults component
- Displays search status and results
- Provides search action buttons
- Used as Modal footer in AddNewSearchModal

## Design Rationale

### Why Subcomponents?

1. **Single Responsibility**: Each component has one clear purpose
2. **Maintainability**: Easier to understand and modify individual components
3. **Testability**: Can be tested in isolation
4. **Reusability**: Components can potentially be reused elsewhere
5. **Code Organization**: Reduces the size and complexity of AddNewSearchModal

### Color Scheme

- **Origin (Blue)**: #c6dbee (fill), #6f8fa5 (stroke), #1890ff (selected badge)
- **Destination (Green)**: #d9f7be (fill), #7cb305 (stroke), #52c41a (selected badge)

This color differentiation helps users quickly distinguish between origin and destination selections.

## Usage in AddNewSearchModal

```typescript
// Origin column
<OriginSelector
  selectedCity={searchState.origin}
  selectedStates={searchState.originStates}
  onCitySelect={handleOriginCitySelect}
  onStateToggle={toggleOriginState}
  onStateRemove={removeOriginState}
/>

// Destination column
<DestinationSelector
  selectedCity={searchState.destination}
  selectedStates={searchState.destinationStates}
  onCitySelect={handleDestinationCitySelect}
  onStateToggle={toggleDestinationState}
  onStateRemove={removeDestinationState}
/>

// Date picker
<SearchDatePicker
  dateRange={searchState.dateRange}
  onDateChange={updateDateRange}
/>

// Modal footer
<SearchFooter
  isPosting={isPosting}
  hasAnySuccess={hasAnySuccess}
  // ...other props
/>
```

## Dependencies

All subcomponents depend on shared components from the parent component library:

- `CitySelection` - City search with autocomplete
- `StateMapSelector` - Interactive US state map
- `DateRangePicker` - Date range selection
- `LoadBoardResults` - Search results display

## Future Enhancements

- Add unit tests for each subcomponent
- Consider adding loading states
- Add validation messages
- Consider making components more generic for other use cases
