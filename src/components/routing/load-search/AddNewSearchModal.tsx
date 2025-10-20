import React from 'react';
import { Modal, Row, Col } from 'antd';
import { useSearchState } from '../../../hooks/useSearchState';
import { useSearchSubmission } from '../../../hooks/useSearchSubmission';
import { LoadBoardProvider } from '../../../types/loadboard';
import OriginSelector from './components/OriginSelector';
import DestinationSelector from './components/DestinationSelector';
import SearchDatePicker from './components/SearchDatePicker';
import SearchFooter from './components/SearchFooter';

interface AddNewSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AddNewSearchModal - Modal for creating new load searches
 * Allows users to configure search parameters and submit to load boards
 */
const AddNewSearchModal: React.FC<AddNewSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
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
        <SearchFooter
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
          <OriginSelector
            selectedCity={searchState.origin}
            selectedStates={searchState.originStates}
            onCitySelect={handleOriginCitySelect}
            onStateToggle={toggleOriginState}
            onStateRemove={removeOriginState}
          />
        </Col>

        <Col span={12}>
          <DestinationSelector
            selectedCity={searchState.destination}
            selectedStates={searchState.destinationStates}
            onCitySelect={handleDestinationCitySelect}
            onStateToggle={toggleDestinationState}
            onStateRemove={removeDestinationState}
          />
        </Col>
      </Row>

      <Row style={{ marginTop: 24 }}>
        <SearchDatePicker
          dateRange={searchState.dateRange}
          onDateChange={updateDateRange}
        />
      </Row>
    </Modal>
  );
};

export default AddNewSearchModal;
