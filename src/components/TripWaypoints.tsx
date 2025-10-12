import React, { useState, useEffect } from 'react';
import { Collapse, List, AutoComplete, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';
import { useMap } from '../context/MapContext';

const { Panel } = Collapse;

interface CityOption {
  value: string;
  label: string;
  lat: number;
  lng: number;
}

const calculateDistance = async (waypoints: { lat: number; lng: number }[]) => {
  if (waypoints.length < 2) return null;

  const origin = `${waypoints[0].lat},${waypoints[0].lng}`;
  const destination = `${waypoints[waypoints.length - 1].lat},${
    waypoints[waypoints.length - 1].lng
  }`;
  const via = waypoints
    .slice(1, -1)
    .map((point) => `&via=${point.lat},${point.lng}`)
    .join('');

  const url =
    `https://router.hereapi.com/v8/routes?` +
    `transportMode=truck` +
    `&origin=${origin}` +
    `&destination=${destination}` +
    via +
    `&return=summary` +
    `&truck[grossWeight]=8000` +
    `&truck[length]=26` +
    `&truck[width]=9` +
    `&truck[height]=12` +
    `&apikey=TIAGlD6jic7l9Aa8Of8IFxo3EUemmcZlHm_agfAm6Ew`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    // Convert meters to miles
    const distanceInMiles = (
      data.routes[0].sections[0].summary.length / 1609.344
    ).toFixed(2);
    console.log(`Total distance: ${distanceInMiles} miles`);
    return distanceInMiles;
  } catch (error) {
    console.error('Error calculating distance:', error);
    return null;
  }
};

const TripWaypoints: React.FC<{
  driverId: string;
  waypoints: { lat: number; lng: number }[];
  onPointsChange: (points: { lat: number; lng: number }[]) => void;
}> = ({ driverId, waypoints = [], onPointsChange }) => {
  const { showMap } = useMap();
  const [options, setOptions] = useState<CityOption[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const apiKey = 'TIAGlD6jic7l9Aa8Of8IFxo3EUemmcZlHm_agfAm6Ew';

  useEffect(() => {
    console.log('TripWaypoints received new waypoints:', waypoints);
  }, [waypoints]);

  const fetchCitySuggestions = async (query: string) => {
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
  };

  const debouncedFetchCitySuggestions = debounce(fetchCitySuggestions, 300);

  const onSearch = (searchText: string) => {
    debouncedFetchCitySuggestions(searchText);
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

  const handleRunRoute = async () => {
    await calculateDistance(waypoints);
    showMap(waypoints);
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
        <Button
          type="primary"
          onClick={handleRunRoute}
          disabled={waypoints.length < 2}
          style={{ marginTop: '10px' }}
        >
          Run Route
        </Button>
      </Panel>
    </Collapse>
  );
};

export default TripWaypoints;
