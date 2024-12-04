import React, { useMemo, useState } from 'react';
import {
  Modal,
  AutoComplete,
  Space,
  Typography,
  Row,
  Col,
  DatePicker,
} from 'antd';
import dayjs from 'dayjs';
import { USAMap, StateAbbreviations } from '@mirawision/usa-map-react';
import { debounce } from 'lodash';

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

interface CityOption {
  value: string;
  label: string;
  state: string;
}

const AddNewSearch: React.FC<AddNewSearchProps> = ({ isOpen, onClose }) => {
  const [originStates, setOriginStates] = useState<string[]>([]);
  const [destinationStates, setDestinationStates] = useState<string[]>([]);
  const [originCityOptions, setOriginCityOptions] = useState<CityOption[]>([]);
  const [destinationCityOptions, setDestinationCityOptions] = useState<
    CityOption[]
  >([]);
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);

  const handleCitySearch = debounce(
    async (searchText: string, setOptions: any) => {
      if (!searchText) return;
      const mockCities: CityOption[] = [
        { value: 'Chicago, IL', label: 'Chicago, IL', state: 'IL' },
        { value: 'New York, NY', label: 'New York, NY', state: 'NY' },
      ].filter((city) =>
        city.value.toLowerCase().includes(searchText.toLowerCase()),
      );
      setOptions(mockCities);
    },
    300,
  );

  const originMapSettings = useMemo<MapSettings>(() => {
    const settings: MapSettings = {};
    StateAbbreviations.forEach((state) => {
      settings[state] = {
        fill: originStates.includes(state) ? '#c6dbee' : undefined,
        stroke: originStates.includes(state) ? '#6f8fa5' : undefined,
        onClick: () =>
          setOriginStates(
            originStates.includes(state)
              ? originStates.filter((s) => s !== state)
              : [...originStates, state],
          ),
      };
    });
    return settings;
  }, [originStates]);

  const destinationMapSettings = useMemo<MapSettings>(() => {
    const settings: MapSettings = {};
    StateAbbreviations.forEach((state) => {
      settings[state] = {
        fill: destinationStates.includes(state) ? '#d9f7be' : undefined,
        stroke: destinationStates.includes(state) ? '#7cb305' : undefined,
        onClick: () =>
          setDestinationStates(
            destinationStates.includes(state)
              ? destinationStates.filter((s) => s !== state)
              : [...destinationStates, state],
          ),
      };
    });
    return settings;
  }, [destinationStates]);

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
              <AutoComplete
                style={{ width: '100%' }}
                placeholder="Enter origin city"
                onSearch={(text) =>
                  handleCitySearch(text, setOriginCityOptions)
                }
                options={originCityOptions}
              />
            </div>
            <div>
              <Title level={5}>Select Origin States</Title>
              <div style={{ height: '300px' }}>
                <USAMap customStates={originMapSettings} />
              </div>
              {originStates.length > 0 && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                  }}
                >
                  <strong>Selected origin states:</strong>{' '}
                  {originStates.map((state) => (
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
                        setOriginStates(originStates.filter((s) => s !== state))
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

        {/* Destination Column */}
        <Col span={12}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={5}>Destination</Title>
              <AutoComplete
                style={{ width: '100%' }}
                placeholder="Enter destination city"
                onSearch={(text) =>
                  handleCitySearch(text, setDestinationCityOptions)
                }
                options={destinationCityOptions}
              />
            </div>
            <div>
              <Title level={5}>Select Destination States</Title>
              <div style={{ height: '300px' }}>
                <USAMap customStates={destinationMapSettings} />
              </div>
              {destinationStates.length > 0 && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                  }}
                >
                  <strong>Selected destination states:</strong>{' '}
                  {destinationStates.map((state) => (
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
                        setDestinationStates(
                          destinationStates.filter((s) => s !== state),
                        )
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
              setDateRange(dates ? [dates[0], dates[1]] : [null, null])
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
