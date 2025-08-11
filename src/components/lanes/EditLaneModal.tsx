import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Space, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Lane } from './types';
import CitySelection from '../CitySelection';
import StateMapSelector from '../StateMapSelector';
import DateRangePicker from '../DateRangePicker';
import { CityData } from '../../hooks/useSearchState';

interface EditLaneModalProps {
  lane: Lane | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLane: Lane) => Promise<void>;
}

interface EditableSearchState {
  origin?: CityData;
  destination?: CityData;
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  originStates: string[];
  destinationStates: string[];
}

export const EditLaneModal: React.FC<EditLaneModalProps> = ({
  lane,
  isOpen,
  onClose,
  onSave,
}) => {
  const [editState, setEditState] = useState<EditableSearchState>({
    origin: undefined,
    destination: undefined,
    dateRange: [null, null],
    originStates: [],
    destinationStates: [],
  });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize edit state when lane changes
  useEffect(() => {
    if (lane) {
      setEditState({
        origin:
          lane.origin.city && lane.origin.state
            ? { city: lane.origin.city, state: lane.origin.state, zip: '' }
            : undefined,
        destination:
          lane.destination.city && lane.destination.state
            ? {
                city: lane.destination.city,
                state: lane.destination.state,
                zip: '',
              }
            : undefined,
        dateRange: [
          lane.dateRange[0] ? dayjs(lane.dateRange[0]) : null,
          lane.dateRange[1] ? dayjs(lane.dateRange[1]) : null,
        ],
        originStates: [],
        destinationStates: [],
      });
    }
  }, [lane]);

  const handleOriginCitySelect = (city: any) => {
    // Convert from SelectedCity to CityData format
    const cityData: CityData | undefined = city
      ? {
          city: city.name ? city.name.split(',')[0].trim() : '',
          state: city.name ? city.name.split(',')[1]?.trim() || '' : '',
          zip: city.postalCode || '',
          coordinates:
            city.lat && city.lng ? { lat: city.lat, lng: city.lng } : undefined,
        }
      : undefined;
    setEditState((prev) => ({ ...prev, origin: cityData }));
  };

  const handleDestinationCitySelect = (city: any) => {
    // Convert from SelectedCity to CityData format
    const cityData: CityData | undefined = city
      ? {
          city: city.name ? city.name.split(',')[0].trim() : '',
          state: city.name ? city.name.split(',')[1]?.trim() || '' : '',
          zip: city.postalCode || '',
          coordinates:
            city.lat && city.lng ? { lat: city.lat, lng: city.lng } : undefined,
        }
      : undefined;
    setEditState((prev) => ({ ...prev, destination: cityData }));
  };

  const updateDateRange = (
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null],
  ) => {
    setEditState((prev) => ({ ...prev, dateRange }));
  };

  const toggleOriginState = (state: string) => {
    setEditState((prev) => ({
      ...prev,
      originStates: prev.originStates.includes(state)
        ? prev.originStates.filter((s) => s !== state)
        : [...prev.originStates, state],
    }));
  };

  const toggleDestinationState = (state: string) => {
    setEditState((prev) => ({
      ...prev,
      destinationStates: prev.destinationStates.includes(state)
        ? prev.destinationStates.filter((s) => s !== state)
        : [...prev.destinationStates, state],
    }));
  };

  const removeOriginState = (state: string) => {
    setEditState((prev) => ({
      ...prev,
      originStates: prev.originStates.filter((s) => s !== state),
    }));
  };

  const removeDestinationState = (state: string) => {
    setEditState((prev) => ({
      ...prev,
      destinationStates: prev.destinationStates.filter((s) => s !== state),
    }));
  };

  const handleSave = async () => {
    if (!lane) return;

    // Validate required fields
    if (
      !editState.origin ||
      !editState.origin.city ||
      !editState.origin.state
    ) {
      message.error('Please select an origin city');
      return;
    }

    if (!editState.dateRange[0] || !editState.dateRange[1]) {
      message.error('Please select a date range');
      return;
    }

    setIsSaving(true);

    try {
      const updatedLane: Lane = {
        ...lane,
        origin: {
          city: editState.origin.city,
          state: editState.origin.state,
          zip: editState.origin.zip || '',
          coordinates: editState.origin.coordinates,
        },
        destination: {
          city: editState.destination?.city || '',
          state: editState.destination?.state || '',
          zip: editState.destination?.zip || '',
          coordinates: editState.destination?.coordinates,
        },
        dateRange: [
          editState.dateRange[0]!.format('YYYY-MM-DD'),
          editState.dateRange[1]!.format('YYYY-MM-DD'),
        ],
        lastRefreshed: new Date().toISOString(),
      };

      await onSave(updatedLane);
      onClose();
    } catch (error) {
      console.error('Error updating lane:', error);
      message.error('Failed to update lane');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!lane) return null;

  return (
    <Modal
      title="Edit Lane"
      open={isOpen}
      onCancel={handleCancel}
      width={1200}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={isSaving}
          onClick={handleSave}
        >
          Save Changes
        </Button>,
      ]}
    >
      <Row gutter={24}>
        <Col span={12}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <CitySelection
              title="Origin"
              placeholder="Enter origin city"
              selectedCity={editState.origin}
              onCitySelect={handleOriginCitySelect}
            />
            <StateMapSelector
              title="Select Origin States"
              selectedStates={editState.originStates}
              onStateToggle={toggleOriginState}
              onStateRemove={removeOriginState}
              fillColor="#c6dbee"
              strokeColor="#6f8fa5"
              selectedBadgeColor="#1890ff"
            />
          </Space>
        </Col>

        <Col span={12}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <CitySelection
              title="Destination (Optional)"
              placeholder="Enter destination city"
              selectedCity={editState.destination}
              onCitySelect={handleDestinationCitySelect}
            />
            <StateMapSelector
              title="Select Destination States"
              selectedStates={editState.destinationStates}
              onStateToggle={toggleDestinationState}
              onStateRemove={removeDestinationState}
              fillColor="#d9f7be"
              strokeColor="#7cb305"
              selectedBadgeColor="#52c41a"
            />
          </Space>
        </Col>
      </Row>

      <Row style={{ marginTop: 24 }}>
        <DateRangePicker
          dateRange={editState.dateRange}
          onDateChange={updateDateRange}
        />
      </Row>
    </Modal>
  );
};
