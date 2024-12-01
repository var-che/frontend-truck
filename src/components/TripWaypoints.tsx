import React, { useState, useCallback, useEffect } from 'react';
import { Collapse, List, AutoComplete } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';

const { Panel } = Collapse;

interface CityOption {
  value: string;
  label: string;
  lat: number;
  lng: number;
}

const TripWaypoints: React.FC<{
  waypoints: { lat: number; lng: number }[];
  onPointsChange: (points: { lat: number; lng: number }[]) => void;
}> = ({ waypoints = [], onPointsChange }) => {
  const [options, setOptions] = useState<CityOption[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const apiKey = 'TIAGlD6jic7l9Aa8Of8IFxo3EUemmcZlHm_agfAm6Ew';

  useEffect(() => {
    console.log('TripWaypoints received new waypoints:', waypoints);
  }, [waypoints]);

  const fetchCitySuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query) return;

      const url = `https://geocode.search.hereapi.com/v1/geocode?q=${query}&apikey=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      setOptions(
        data.items.map((item: any) => ({
          value: item.address.label,
          label: item.address.label,
          lat: item.position.lat,
          lng: item.position.lng,
        })),
      );
    }, 300), // 300ms debounce delay
    [apiKey],
  );

  const onSearch = (searchText: string) => {
    fetchCitySuggestions(searchText);
  };

  const onSelectCity = (value: string, option: any) => {
    console.log('Selection method triggered:', { value, option });

    if (!option || !option.lat || !option.lng) {
      console.warn('Invalid option selected:', option);
      return;
    }

    const newWaypoints = [
      ...waypoints,
      {
        lat: option.lat,
        lng: option.lng,
      },
    ];

    onPointsChange(newWaypoints);
    setInputValue(''); // Clear input after selection
  };

  const handleRemoveWaypoint = (index: number, e: React.MouseEvent) => {
    // Prevent event from bubbling up
    e.stopPropagation();

    // Create new array without the waypoint at specified index
    const newWaypoints = [...waypoints];
    newWaypoints.splice(index, 1);

    // Call the parent's callback with updated waypoints
    onPointsChange(newWaypoints);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  return (
    <Collapse defaultActiveKey={['1']}>
      <Panel header={`Trip Waypoints (${waypoints.length})`} key="1">
        <div style={{ padding: '10px' }}>
          <AutoComplete
            style={{ width: '100%', marginBottom: '10px' }}
            placeholder="Enter city name"
            value={inputValue}
            onChange={setInputValue}
            onSearch={onSearch}
            onSelect={(value, option) => onSelectCity(value, option)}
            options={options.map((option) => ({
              ...option,
              key: `${option.lat}-${option.lng}`, // Add unique key
            }))}
          />
          <List
            size="small"
            bordered
            dataSource={waypoints}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <CloseOutlined
                    key="delete"
                    onClick={(e) => handleRemoveWaypoint(index, e)}
                  />,
                ]}
              >
                {`Lat: ${item.lat}, Lng: ${item.lng}`}
              </List.Item>
            )}
          />
        </div>
      </Panel>
    </Collapse>
  );
};

export default TripWaypoints;
