import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import LanesContainerList from '../../LanesContainerList';
import AddNewSearchModal from './AddNewSearchModal';

/**
 * LoadSearchPage - Main page for load search and lane management
 * Previously known as LoadContainerListing (/test route)
 */
const LoadSearchPage: React.FC = () => {
  const [isAddSearchModalOpen, setIsAddSearchModalOpen] = useState(false);

  const handleOpenAddSearch = () => {
    setIsAddSearchModalOpen(true);
  };

  const handleCloseAddSearch = () => {
    setIsAddSearchModalOpen(false);
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Add New Search Button */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddSearch}
          style={{
            background: '#52c41a',
            borderColor: '#52c41a',
            borderRadius: '8px',
            padding: '8px 32px',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          Add New Search
        </Button>
      </div>

      {/* Lanes Management Section - Now the main focus */}
      <div>
        <h2 style={{ marginBottom: '16px', color: '#1890ff' }}>
          Lane Management
        </h2>
        <p style={{ marginBottom: '16px', color: '#666' }}>
          Click "View Loads" on any lane to see its associated loads. Use
          "Refresh Sylectus" to get fresh data for a lane.
        </p>
        <LanesContainerList />
      </div>

      {/* Add New Search Modal */}
      <AddNewSearchModal
        isOpen={isAddSearchModalOpen}
        onClose={handleCloseAddSearch}
      />
    </div>
  );
};

export default LoadSearchPage;
