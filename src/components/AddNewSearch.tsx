import React, { useMemo, useState } from 'react';
import { Modal, Space, Typography, Row, Col, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { USAMap, StateAbbreviations } from '@mirawision/usa-map-react';
import CitySearch from './CitySearch';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface MapSettings {
  [stateCode: string]: {
    fill?: string;
    stroke?: string;
    onClick?: () => void;
  };
}

interface AddNewSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedCity {
  name: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

interface CityData {
  city: string;
  state: string;
  zip: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface AddNewSearchState {
  origin?: CityData;
  destination?: CityData;
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  originStates: string[];
  destinationStates: string[];
}

const AddNewSearch: React.FC<AddNewSearchProps> = ({ isOpen, onClose }) => {
  const [searchState, setSearchState] = useState<AddNewSearchState>({
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

  const originMapSettings = useMemo<MapSettings>(() => {
    const settings: MapSettings = {};
    StateAbbreviations.forEach((state) => {
      settings[state] = {
        fill: searchState.originStates.includes(state) ? '#c6dbee' : undefined,
        stroke: searchState.originStates.includes(state)
          ? '#6f8fa5'
          : undefined,
        onClick: () =>
          setSearchState((prev) => ({
            ...prev,
            originStates: prev.originStates.includes(state)
              ? prev.originStates.filter((s) => s !== state)
              : [...prev.originStates, state],
          })),
      };
    });
    return settings;
  }, [searchState.originStates]);

  const destinationMapSettings = useMemo<MapSettings>(() => {
    const settings: MapSettings = {};
    StateAbbreviations.forEach((state) => {
      settings[state] = {
        fill: searchState.destinationStates.includes(state)
          ? '#d9f7be'
          : undefined,
        stroke: searchState.destinationStates.includes(state)
          ? '#7cb305'
          : undefined,
        onClick: () =>
          setSearchState((prev) => ({
            ...prev,
            destinationStates: prev.destinationStates.includes(state)
              ? prev.destinationStates.filter((s) => s !== state)
              : [...prev.destinationStates, state],
          })),
      };
    });
    return settings;
  }, [searchState.destinationStates]);

  return (
    <Modal
      title="Add New Search"
      open={isOpen}
      onCancel={onClose}
      width={1200}
      footer={null}
    >
      <Row gutter={24}>
        <Col span={12}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={5}>Origin</Title>
              <CitySearch
                placeholder="Enter origin city"
                onSelect={handleOriginCitySelect}
              />
              {searchState.origin && (
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  Selected: {searchState.origin.city},{' '}
                  {searchState.origin.state} ({searchState.origin.zip})
                </div>
              )}
            </div>
            <div>
              <Title level={5}>Select Origin States</Title>
              <div style={{ height: '300px' }}>
                <USAMap customStates={originMapSettings} />
              </div>
              {searchState.originStates.length > 0 && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                  }}
                >
                  <strong>Selected origin states:</strong>{' '}
                  {searchState.originStates.map((state) => (
                    <span
                      key={state}
                      style={{
                        display: 'inline-block',
                        margin: '0 4px',
                        padding: '2px 8px',
                        background: '#1890ff',
                        color: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        setSearchState((prev) => ({
                          ...prev,
                          originStates: prev.originStates.filter(
                            (s) => s !== state,
                          ),
                        }))
                      }
                    >
                      {state} ×
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Space>
        </Col>

        <Col span={12}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={5}>Destination</Title>
              <CitySearch
                placeholder="Enter destination city"
                onSelect={handleDestinationCitySelect}
              />
              {searchState.destination && (
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  Selected: {searchState.destination.city},{' '}
                  {searchState.destination.state} ({searchState.destination.zip}
                  )
                </div>
              )}
            </div>
            <div>
              <Title level={5}>Select Destination States</Title>
              <div style={{ height: '300px' }}>
                <USAMap customStates={destinationMapSettings} />
              </div>
              {searchState.destinationStates.length > 0 && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                  }}
                >
                  <strong>Selected destination states:</strong>{' '}
                  {searchState.destinationStates.map((state) => (
                    <span
                      key={state}
                      style={{
                        display: 'inline-block',
                        margin: '0 4px',
                        padding: '2px 8px',
                        background: '#52c41a',
                        color: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        setSearchState((prev) => ({
                          ...prev,
                          destinationStates: prev.destinationStates.filter(
                            (s) => s !== state,
                          ),
                        }))
                      }
                    >
                      {state} ×
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Space>
        </Col>
      </Row>
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Title level={5}>Select Pickup Dates</Title>
          <RangePicker
            onChange={(dates) =>
              setSearchState((prev) => ({
                ...prev,
                dateRange: dates ? [dates[0], dates[1]] : [null, null],
              }))
            }
            format="MM/DD/YYYY"
            placeholder={['Start Date', 'End Date']}
          />
        </Col>
      </Row>
    </Modal>
  );
};

export default AddNewSearch;
