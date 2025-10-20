import React from 'react';
import { Space } from 'antd';
import CitySelection from '../../../location/CitySelection';
import StateMapSelector from '../../../StateMapSelector';
import { CityData, SelectedCity } from '../../../../hooks/useSearchState';

interface DestinationSelectorProps {
  selectedCity: CityData | undefined;
  selectedStates: string[];
  onCitySelect: (city: SelectedCity) => void;
  onStateToggle: (stateCode: string) => void;
  onStateRemove: (stateCode: string) => void;
}

/**
 * DestinationSelector - Component for selecting destination location
 * Combines city selection and state map selection for destination
 */
const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  selectedCity,
  selectedStates,
  onCitySelect,
  onStateToggle,
  onStateRemove,
}) => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <CitySelection
        title="Destination"
        placeholder="Enter destination city"
        selectedCity={selectedCity}
        onCitySelect={onCitySelect}
      />
      <StateMapSelector
        title="Select Destination States"
        selectedStates={selectedStates}
        onStateToggle={onStateToggle}
        onStateRemove={onStateRemove}
        fillColor="#d9f7be"
        strokeColor="#7cb305"
        selectedBadgeColor="#52c41a"
      />
    </Space>
  );
};

export default DestinationSelector;
