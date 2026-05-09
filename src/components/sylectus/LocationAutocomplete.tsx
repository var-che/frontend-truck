import React, { useState, useMemo, useEffect } from 'react';
import { AutoComplete, Input } from 'antd';
import { debounce } from 'lodash';
import {
  GeocodingService,
  GeocodingProviderType,
  LocationSuggestion,
} from '../../services/geocoding';

export interface LocationResult {
  displayName: string;
  city: string;
  state: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

interface Props {
  placeholder?: string;
  initialValue?: string;
  onSelect: (location: LocationResult) => void;
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
}

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]);

/** Returns array of uppercase state codes if value looks like state(s), else null. */
function parseStateInput(value: string): string[] | null {
  const upper = value.trim().toUpperCase();
  if (!upper) return null;
  const parts = upper.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.every((p) => US_STATES.has(p))) return parts;
  return null;
}

const LocationAutocomplete: React.FC<Props> = ({
  placeholder = 'City, State',
  initialValue = '',
  onSelect,
  size = 'small',
  style,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [options, setOptions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const provider = useMemo(
    () => GeocodingService.getProvider(GeocodingProviderType.TRIMBLE_MAPS),
    [],
  );

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query || query.length < 2) {
          setOptions([]);
          setLoading(false);
          return;
        }
        try {
          const suggestions = await provider.searchLocations(query, 8);
          setOptions(suggestions);
        } catch {
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }, 400),
    [provider],
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const handleSearch = (value: string) => {
    setInputValue(value);

    // Check for state-only or multi-state input (e.g. "MN", "MN,IL")
    const upper = value.trim().toUpperCase();

    // Ends with comma → user is still typing more states; don't search cities
    if (upper.endsWith(',')) {
      debouncedSearch.cancel();
      setOptions([]);
      setLoading(false);
      return;
    }

    const states = parseStateInput(value);
    if (states) {
      debouncedSearch.cancel();
      setLoading(false);
      const stateValue = states.join(',');
      const label =
        states.length === 1
          ? `${stateValue} — State only`
          : `${states.join(', ')} — Multiple states`;
      setOptions([
        {
          id: `state-${stateValue}`,
          label,
          value: stateValue,
          address: stateValue,
          city: '',
          state: stateValue,
          postalCode: '',
          lat: 0,
          lng: 0,
        } as LocationSuggestion,
      ]);
      return;
    }

    // Regular city search (3+ chars)
    if (value) setLoading(true);
    debouncedSearch(value);
  };

  const handleSelect = (_: string, option: any) => {
    const suggestion = option as LocationSuggestion;
    const display = suggestion.city && suggestion.state
      ? `${suggestion.city}, ${suggestion.state}`
      : suggestion.value || suggestion.label;
    setInputValue(display);
    onSelect({
      displayName: display,
      city: suggestion.city || '',
      state: suggestion.state || '',
      postalCode: suggestion.postalCode || '',
      lat: suggestion.lat,
      lng: suggestion.lng,
    });
  };

  const handleClear = () => {
    setInputValue('');
    setOptions([]);
  };

  const autocompleteOptions = options.map((s) => ({
    ...s,
    value: s.city && s.state ? `${s.city}, ${s.state}` : s.value,
    label: s.city && s.state
      ? `${s.city}, ${s.state}${s.postalCode ? ` (${s.postalCode})` : ''}`
      : s.label,
  }));

  return (
    <AutoComplete
      value={inputValue}
      options={autocompleteOptions}
      onSearch={handleSearch}
      onSelect={handleSelect}
      style={{ width: '100%', ...style }}
      allowClear
      onClear={handleClear}
      notFoundContent={loading ? 'Searching…' : inputValue.length >= 2 ? 'No results' : null}
    >
      <Input size={size} placeholder={placeholder} />
    </AutoComplete>
  );
};

export default LocationAutocomplete;
