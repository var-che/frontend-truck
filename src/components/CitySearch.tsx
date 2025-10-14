import React, { useState, useCallback, useEffect } from 'react';
import { AutoComplete, Input } from 'antd';
import { debounce } from 'lodash';

const { Search } = Input;

interface CitySuggestion {
  label: string;
  value: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

interface SelectedCity {
  name: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

interface CitySearchProps {
  onSelect?: (city: SelectedCity) => void;
  placeholder?: string;
  label?: string;
}

const HERE_API_KEY = 'TIAGlD6jic7l9Aa8Of8IFxo3EUemmcZlHm_agfAm6Ew';

const CitySearch: React.FC<CitySearchProps> = ({
  onSelect,
  placeholder = 'Enter city name',
  label,
}) => {
  const [options, setOptions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query) {
        setOptions([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(
            query,
          )}&apiKey=${HERE_API_KEY}`,
        );
        const data = await response.json();

        const suggestions = data.items.map((item: any) => {
          const { title, address, position } = item;
          // Format label to include postal code when available
          const postalCode = address.postalCode || '';
          const label = postalCode ? `${title} (${postalCode})` : title;

          return {
            label: label,
            value: title,
            postalCode: postalCode,
            lat: position?.lat,
            lng: position?.lng,
          };
        });

        setOptions(suggestions);
      } catch (error) {
        console.error('Failed to fetch city suggestions:', error);
      } finally {
        setLoading(false);
      }
    }, 1500),
    [setOptions, setLoading],
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
    const selectedCity = {
      name: value,
      postalCode: option.postalCode,
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
