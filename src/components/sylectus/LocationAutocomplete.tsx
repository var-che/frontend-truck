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
