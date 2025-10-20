import React from 'react';
import { Typography } from 'antd';
import CitySearch from './CitySearch';
import { CityData, SelectedCity } from '../../hooks/useSearchState';

const { Title } = Typography;

interface CitySelectionProps {
  title: string;
  placeholder: string;
  selectedCity?: CityData;
  onCitySelect: (city: SelectedCity) => void;
}

const CitySelection: React.FC<CitySelectionProps> = ({
  title,
  placeholder,
  selectedCity,
  onCitySelect,
}) => {
  return (
    <div>
      <Title level={5}>{title}</Title>
      <CitySearch placeholder={placeholder} onSelect={onCitySelect} />
      {selectedCity && (
        <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
          Selected: {selectedCity.city}, {selectedCity.state} (
          {selectedCity.zip})
        </div>
      )}
    </div>
  );
};

export default CitySelection;
