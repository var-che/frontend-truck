import React from 'react';
import { Space } from 'antd';
import CitySelection from '../../../location/CitySelection';
import StateMapSelector from '../../../StateMapSelector';
import { CityData, SelectedCity } from '../../../../hooks/useSearchState';

interface OriginSelectorProps {
  selectedCity: CityData | undefined;
  selectedStates: string[];
  onCitySelect: (city: SelectedCity) => void;
  onStateToggle: (stateCode: string) => void;
  onStateRemove: (stateCode: string) => void;
}

/**
 * OriginSelector - Component for selecting origin location
 * Combines city selection and state map selection for origin
 */
const OriginSelector: React.FC<OriginSelectorProps> = ({
  selectedCity,
  selectedStates,
  onCitySelect,
  onStateToggle,
  onStateRemove,
}) => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <CitySelection
        title="Origin"
        placeholder="Enter origin city"
        selectedCity={selectedCity}
        onCitySelect={onCitySelect}
      />
      <StateMapSelector
        title="Select Origin States"
        selectedStates={selectedStates}
        onStateToggle={onStateToggle}
        onStateRemove={onStateRemove}
        fillColor="#c6dbee"
        strokeColor="#6f8fa5"
        selectedBadgeColor="#1890ff"
      />
    </Space>
  );
};

export default OriginSelector;
