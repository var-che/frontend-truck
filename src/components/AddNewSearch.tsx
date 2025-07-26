import React, { useState } from 'react';
import { Modal, Space, Typography, Row, Col, DatePicker, Button } from 'antd';
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

  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [extensionConnected, setExtensionConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

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

  const handlePostToDat = async () => {
    setIsPosting(true);
    setPostSuccess(false);
    setConnectionError(null);

    // Simple search data object
    const searchData = {
      origin: searchState.origin
        ? `${searchState.origin.city}, ${searchState.origin.state}`
        : null,
      destination: searchState.destination
        ? `${searchState.destination.city}, ${searchState.destination.state}`
        : null,
      startDate: searchState.dateRange[0]
        ? searchState.dateRange[0].format('YYYY-MM-DD')
        : null,
      endDate: searchState.dateRange[1]
        ? searchState.dateRange[1].format('YYYY-MM-DD')
        : null,
    };
    console.log('Search data, searchData', searchData);
  };

  const originMapSettings = React.useMemo<MapSettings>(() => {
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

  const destinationMapSettings = React.useMemo<MapSettings>(() => {
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
      footer={
        <div style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            loading={isPosting}
            onClick={handlePostToDat}
            style={{ marginRight: 8 }}
            disabled={!extensionConnected || !!connectionError}
          >
            Search on DAT
          </Button>
          {postSuccess && (
            <div style={{ marginTop: 8, color: '#52c41a' }}>
              Search executed successfully on DAT
            </div>
          )}
          {connectionError && (
            <div style={{ marginTop: 8, color: '#ff4d4f' }}>
              {connectionError}
            </div>
          )}
        </div>
      }
    >
      {/* Extension connection warning */}
      {!extensionConnected && (
        <div
          style={{
            background: '#fff2e8',
            padding: '10px',
            marginBottom: '16px',
            borderRadius: '4px',
            border: '1px solid #ffbb96',
          }}
        >
          <div style={{ color: '#d4380d', marginBottom: '8px' }}>
            <strong>Extension Not Connected</strong>
          </div>
          <p>Please make sure the browser extension is installed and active.</p>
          <Button size="small" style={{ marginTop: '8px' }}>
            Check Connection
          </Button>
        </div>
      )}

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
