import { AutoComplete } from 'antd';
import { debounce } from 'lodash';
import { useCallback, useContext, useMemo, useState } from 'react';
import HereMap from './HereMap';
interface CityOption {
  value: string; // City name
  lat: number; // Latitude
  lng: number; // Longitude
}

interface City {
  label: string;
  lat: number;
  lng: number;
}
export default function MapDashboard() {
  const apiKey = 'TIAGlD6jic7l9Aa8Of8IFxo3EUemmcZlHm_agfAm6Ew';
  const [origin, setOrigin] = useState<City | null>(null);
  const [destination, setDestination] = useState<City | null>(null);
  const [options, setOptions] = useState<CityOption[]>([]);
  // const [map, setMap] = useState<H.Map | null>(null);
  const fetchCitySuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query) return;

      const url = `https://geocode.search.hereapi.com/v1/geocode?q=${query}&apikey=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      setOptions(
        data.items.map((item: any) => ({
          value: item.address.label,
          lat: item.position.lat,
          lng: item.position.lng,
        })),
      );
    }, 300), // 300ms debounce delay
    [],
  );

  const onSelectCity = (
    value: string,
    option: CityOption,
    isOrigin: boolean,
  ) => {
    const city: City = {
      label: value,
      lat: option.lat,
      lng: option.lng,
    };

    if (isOrigin) {
      setOrigin(city);
    } else {
      setDestination(city);
    }
  };
  const points = useMemo(() => {
    let _points = [];
    if (origin) {
      _points[0] = { lat: origin.lat, lng: origin.lng };
    }
    if (destination) {
      _points.push({ lat: destination.lat, lng: destination.lng });
    }
    return _points;
  }, [origin, destination]);
  const onSearch = (query: string) => {
    fetchCitySuggestions(query);
  };
  return (
    <>
      <div style={{ padding: 5 }}>
        <AutoComplete
          style={{ width: 200, marginRight: 10 }}
          placeholder="Select Origin"
          onSearch={onSearch}
          onSelect={(value, option) =>
            onSelectCity(value as string, option as CityOption, true)
          }
          options={options}
        />
        <AutoComplete
          style={{ width: 200 }}
          placeholder="Select Destination"
          onSearch={onSearch}
          onSelect={(value, option) =>
            onSelectCity(value as string, option as CityOption, false)
          }
          options={options}
        />
      </div>

      <HereMap apiKey={apiKey} points={points} />
    </>
  );
}
