import React, { useState, useMemo, useEffect } from 'react';
import { AutoComplete, Input } from 'antd';
import { debounce } from 'lodash';
import {
  GeocodingService,
  GeocodingProviderType,
  LocationSuggestion,
} from '../../services/geocoding';

const { Search } = Input;

// Re-export types for backward compatibility with useSearchState
export interface CitySuggestion extends LocationSuggestion {}
export interface SelectedCity {
  name: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

interface CitySearchProps {
  onSelect?: (city: SelectedCity) => void;
  placeholder?: string;
  label?: string;
  provider?: GeocodingProviderType; // Allow switching between providers
}

// Default to Trimble Maps (can be changed via props)
const DEFAULT_PROVIDER = GeocodingProviderType.TRIMBLE_MAPS;

const CitySearch: React.FC<CitySearchProps> = ({
  onSelect,
  placeholder = 'Enter city name',
  label,
  provider = DEFAULT_PROVIDER,
}) => {
  const [options, setOptions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  // Get the geocoding provider
  const geocodingProvider = GeocodingService.getProvider(provider);

  // Debounce the search function using useMemo
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query) {
          setOptions([]);
          setLoading(false);
          return;
        }

        try {
          const suggestions = await geocodingProvider.searchLocations(
            query,
            10,
          );
          setOptions(suggestions);
        } catch (error) {
          console.error('Failed to fetch city suggestions:', error);
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }, 1500),
    [geocodingProvider],
  );

  // Effect to cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearch = (value: string) => {
    setInputValue(value);
    setLoading(Boolean(value)); // Show loading immediately when typing
    debouncedSearch(value);
  };

  const handleSelect = (value: string, option: CitySuggestion) => {
    setInputValue(value);
    // Match the SelectedCity interface from useSearchState
    const selectedCity: SelectedCity = {
      name: value,
      postalCode: option.postalCode || '',
      lat: option.lat,
      lng: option.lng,
    };
    setSelectedCity(selectedCity);
    if (onSelect) {
      onSelect(selectedCity);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <AutoComplete
        value={inputValue}
        options={options}
        onSelect={handleSelect}
        onSearch={handleSearch}
        style={{ width: '100%' }}
      >
        <Search placeholder={placeholder} loading={loading} enterButton />
      </AutoComplete>
      {selectedCity && (
        <div style={{ marginTop: 16 }}>
          <p>Selected: {selectedCity.name}</p>
          {selectedCity.postalCode && <p>ZIP: {selectedCity.postalCode}</p>}
          {selectedCity.lat && selectedCity.lng && (
            <p>
              Coordinates: {selectedCity.lat.toFixed(4)},{' '}
              {selectedCity.lng.toFixed(4)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CitySearch;
