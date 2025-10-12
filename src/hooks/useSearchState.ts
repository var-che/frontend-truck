import { useState } from 'react';
import dayjs from 'dayjs';

export interface CityData {
  city: string;
  state: string;
  zip: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface SelectedCity {
  name: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

export interface SearchState {
  origin?: CityData;
  destination?: CityData;
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  originStates: string[];
  destinationStates: string[];
}

export const useSearchState = () => {
  const [searchState, setSearchState] = useState<SearchState>({
    dateRange: [null, null],
    originStates: [],
    destinationStates: [],
  });

  const handleOriginCitySelect = (city: SelectedCity) => {
    const [cityName, stateCode] = city.name.split(', ');
    setSearchState((prev) => ({
      ...prev,
      origin: {
        city: cityName,
        state: stateCode,
        zip: city.postalCode,
        coordinates:
          city.lat && city.lng
            ? {
                lat: city.lat,
                lng: city.lng,
              }
            : undefined,
      },
    }));
  };

  const handleDestinationCitySelect = (city: SelectedCity) => {
    const [cityName, stateCode] = city.name.split(', ');
    setSearchState((prev) => ({
      ...prev,
      destination: {
        city: cityName,
        state: stateCode,
        zip: city.postalCode,
        coordinates:
          city.lat && city.lng
            ? {
                lat: city.lat,
                lng: city.lng,
              }
            : undefined,
      },
    }));
  };

  const updateDateRange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null]) => {
    setSearchState((prev) => ({
      ...prev,
      dateRange: dates,
    }));
  };

  const toggleOriginState = (state: string) => {
    setSearchState((prev) => ({
      ...prev,
      originStates: prev.originStates.includes(state)
        ? prev.originStates.filter((s) => s !== state)
        : [...prev.originStates, state],
    }));
  };

  const toggleDestinationState = (state: string) => {
    setSearchState((prev) => ({
      ...prev,
      destinationStates: prev.destinationStates.includes(state)
        ? prev.destinationStates.filter((s) => s !== state)
        : [...prev.destinationStates, state],
    }));
  };

  const removeOriginState = (state: string) => {
    setSearchState((prev) => ({
      ...prev,
      originStates: prev.originStates.filter((s) => s !== state),
    }));
  };

  const removeDestinationState = (state: string) => {
    setSearchState((prev) => ({
      ...prev,
      destinationStates: prev.destinationStates.filter((s) => s !== state),
    }));
  };

  return {
    searchState,
    handleOriginCitySelect,
    handleDestinationCitySelect,
    updateDateRange,
    toggleOriginState,
    toggleDestinationState,
    removeOriginState,
    removeDestinationState,
  };
};
