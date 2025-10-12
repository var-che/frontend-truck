import React from 'react';
import { Modal, Space, Row, Col } from 'antd';
import { useSearchState } from '../hooks/useSearchState';
import { useSearchSubmission } from '../hooks/useSearchSubmission';
import { LoadBoardProvider } from '../types/loadboard';
import CitySelection from './CitySelection';
import StateMapSelector from './StateMapSelector';
import DateRangePicker from './DateRangePicker';
import LoadBoardResults from './LoadBoardResults';

interface AddNewSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddNewSearch: React.FC<AddNewSearchProps> = ({ isOpen, onClose }) => {
  const {
    searchState,
    handleOriginCitySelect,
    handleDestinationCitySelect,
    updateDateRange,
    toggleOriginState,
    toggleDestinationState,
    removeOriginState,
    removeDestinationState,
  } = useSearchState();

  const {
    isPosting,
    hasAnySuccess,
    hasAnyError,
    allErrors,
    searchOnLoadBoards,
    searchOnSpecificLoadBoard,
    resetStatus,
    datResult,
    sylectusResult,
    datError,
    sylectusError,
    extensionConnected,
  } = useSearchSubmission();

  const onModalClose = () => {
    resetStatus();
    onClose();
  };

  const handleSearchAll = () => {
    searchOnLoadBoards(searchState);
  };

  const handleSearchDAT = () => {
    searchOnSpecificLoadBoard(searchState, LoadBoardProvider.DAT);
  };

  const handleSearchSylectus = () => {
    searchOnSpecificLoadBoard(searchState, LoadBoardProvider.SYLECTUS);
  };

  return (
    <Modal
      title="Add New Search"
      open={isOpen}
      onCancel={onModalClose}
      width={1200}
      footer={
        <LoadBoardResults
          isPosting={isPosting}
          hasAnySuccess={hasAnySuccess}
          hasAnyError={hasAnyError}
          allErrors={allErrors}
          datResult={datResult}
          sylectusResult={sylectusResult}
          datError={datError}
          sylectusError={sylectusError}
          extensionConnected={extensionConnected}
          onSearchAll={handleSearchAll}
          onSearchDAT={handleSearchDAT}
          onSearchSylectus={handleSearchSylectus}
        />
      }
    >
      <Row gutter={24}>
        <Col span={12}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <CitySelection
              title="Origin"
              placeholder="Enter origin city"
              selectedCity={searchState.origin}
              onCitySelect={handleOriginCitySelect}
            />
            <StateMapSelector
              title="Select Origin States"
              selectedStates={searchState.originStates}
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
              title="Destination"
              placeholder="Enter destination city"
              selectedCity={searchState.destination}
              onCitySelect={handleDestinationCitySelect}
            />
            <StateMapSelector
              title="Select Destination States"
              selectedStates={searchState.destinationStates}
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
          dateRange={searchState.dateRange}
          onDateChange={updateDateRange}
        />
      </Row>
    </Modal>
  );
};

export default AddNewSearch;
