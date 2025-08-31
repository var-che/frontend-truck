import React, { useState } from 'react';
import { Card, Space, Button, message } from 'antd';
import { ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useLaneAutoAdd } from '../hooks/useLaneAutoAdd';
import { useSearchResults } from '../context/SearchResultsContext';
import { useChromeMessaging } from '../hooks/useChromeMessaging';
import { Lane } from './lanes/types';
import { LaneTable } from './lanes/LaneTable';
import { EditLaneModal } from './lanes/EditLaneModal';
import LoadsContainer from './LoadsContainer';

const LanesContainerList: React.FC = () => {
  // Initialize state from localStorage or fallback to empty array
  const [lanes, setLanes] = useState<Lane[]>(() => {
    const savedLanes = localStorage.getItem('lanes');
    return savedLanes ? JSON.parse(savedLanes) : [];
  });
  const [loading, setLoading] = useState(false);
  const [editingLane, setEditingLane] = useState<Lane | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLane, setSelectedLane] = useState<Lane | null>(null);

  // Get search submission results for auto-adding lanes
  const {
    latestDatResult,
    latestSylectusResult,
    addSylectusResult,
    deleteResultBySearchModuleId,
    deleteSylectusResult,
    datResults,
    sylectusResults,
  } = useSearchResults();

  // Get Chrome messaging capabilities
  const { sendMessageToExtension } = useChromeMessaging();

  // Auto-add successful search results to lanes
  useLaneAutoAdd({
    setLanes,
    datResult: latestDatResult,
    sylectusResult: latestSylectusResult,
  });

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // TODO: Implement refresh logic
      console.log('🔄 Refreshing lanes...');
      // For now, just reload from localStorage
      const savedLanes = localStorage.getItem('lanes');
      if (savedLanes) {
        setLanes(JSON.parse(savedLanes));
      }
      message.success('Lanes refreshed successfully');
    } catch (error) {
      console.error('Error refreshing lanes:', error);
      message.error('Failed to refresh lanes');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLane = (lane: Lane) => {
    setEditingLane(lane);
    setIsEditModalOpen(true);
  };

  const handleSelectLane = (lane: Lane) => {
    setSelectedLane(lane);
  };

  const handleBackToLanes = () => {
    setSelectedLane(null);
  };

  const handleDeleteLane = async (laneId: string) => {
    try {
      // Find the lane to be deleted to get its associated search result IDs
      const laneToDelete = lanes.find((lane) => lane.id === laneId);

      if (laneToDelete) {
        console.log(
          '🗑️ Cascade delete: Deleting lane and associated search results:',
          laneToDelete,
        );

        // Delete associated DAT search results if they exist
        if (laneToDelete.datQueryId) {
          console.log(
            '🗑️ Deleting associated DAT search results:',
            laneToDelete.datQueryId,
          );
          deleteResultBySearchModuleId(laneToDelete.datQueryId);
        }

        // Delete associated Sylectus search results if they exist
        if (laneToDelete.sylectusQueryId) {
          console.log(
            '🗑️ Deleting associated Sylectus search results:',
            laneToDelete.sylectusQueryId,
          );
          deleteResultBySearchModuleId(laneToDelete.sylectusQueryId);
        }

        // Also delete by the lane's searchModuleId if it exists and is different
        if (
          laneToDelete.searchModuleId &&
          laneToDelete.searchModuleId !== laneToDelete.datQueryId &&
          laneToDelete.searchModuleId !== laneToDelete.sylectusQueryId
        ) {
          console.log(
            '🗑️ Deleting search results by lane searchModuleId:',
            laneToDelete.searchModuleId,
          );
          deleteResultBySearchModuleId(laneToDelete.searchModuleId);
        }
      }

      // Delete the lane itself
      const updatedLanes = lanes.filter((lane) => lane.id !== laneId);
      setLanes(updatedLanes);
      localStorage.setItem('lanes', JSON.stringify(updatedLanes));

      message.success(
        'Lane and associated search results deleted successfully',
      );
    } catch (error) {
      console.error('Error deleting lane:', error);
      message.error('Failed to delete lane');
    }
  };

  const handleSaveLane = async (updatedLane: Lane) => {
    try {
      const updatedLanes = lanes.map((lane) =>
        lane.id === updatedLane.id ? updatedLane : lane,
      );
      setLanes(updatedLanes);
      localStorage.setItem('lanes', JSON.stringify(updatedLanes));
      message.success('Lane updated successfully');
    } catch (error) {
      console.error('Error updating lane:', error);
      message.error('Failed to update lane');
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingLane(null);
  };

  const handleRefreshSylectus = async (lane: Lane) => {
    try {
      console.log('🔄 Refreshing Sylectus data for lane:', lane);

      // Convert lane data to Sylectus search format
      const sylectusParams = {
        fromCity: lane.origin.city.toLowerCase(),
        fromState: lane.origin.state,
        toCity: lane.destination?.city?.toLowerCase() || '',
        toState: lane.destination?.state || '',
        miles: 120, // Default miles radius
        fromDate: lane.dateRange[0], // Use the lane's date range
        loadTypes: [],
        maxWeight: '',
        minCargo: '',
        maxCargo: '',
        freight: 'Both',
        refreshRate: 300,
      };

      // Prepare the message for the extension
      const extensionMessage = {
        type: 'SYLECTUS_SEARCH',
        params: sylectusParams,
      };

      console.log('📨 Sending Sylectus refresh message:', extensionMessage);

      // Send message to extension
      const response = await sendMessageToExtension(extensionMessage);

      if (response && response.success) {
        console.log('✅ Sylectus refresh successful:', response);

        // Extract loads from response
        const loads = response.data?.loads || response.loads || [];

        // Use actual loads count if totalRecords is not provided or is 0
        const actualTotalRecords =
          response.totalRecords > 0 ? response.totalRecords : loads.length;

        // Always create a new search module ID for refreshes to ensure old results are replaced
        const newSearchModuleId = `sylectus_refresh_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // If the lane has an existing sylectusQueryId, we should remove those old results first
        if (lane.sylectusQueryId) {
          console.log(
            '🧹 Removing old Sylectus results for lane:',
            lane.sylectusQueryId,
          );
          deleteSylectusResult(lane.sylectusQueryId);
        }

        // Create a LoadBoardSearchResult from the response
        const searchResult = {
          success: true,
          message: `Found ${actualTotalRecords} loads for lane refresh`,
          data: {
            provider: 'SYLECTUS',
            searchModuleId: newSearchModuleId,
            timestamp: new Date().toISOString(),
            loads: loads,
            totalRecords: actualTotalRecords,
            searchData: {
              origin: `${lane.origin.city}, ${lane.origin.state}`,
              destination:
                lane.destination?.city && lane.destination?.state
                  ? `${lane.destination.city}, ${lane.destination.state}`
                  : '',
              searchModuleId: newSearchModuleId,
            },
          },
        };

        // Always add/update the search result in SearchResultsContext so loads are displayed
        // The useLaneAutoAdd hook should be smart enough to not create duplicates
        console.log('🔄 Updating search result for lane refresh');
        addSylectusResult(searchResult);

        // Update the lane with new data
        const updatedLane: Lane = {
          ...lane,
          lastRefreshed: new Date().toISOString(),
          resultsCount: actualTotalRecords,
          sylectusQueryId: newSearchModuleId, // Use the search module ID
        };

        // Update lanes state
        const updatedLanes = lanes.map((l) =>
          l.id === lane.id ? updatedLane : l,
        );
        setLanes(updatedLanes);
        localStorage.setItem('lanes', JSON.stringify(updatedLanes));

        message.success(
          `Sylectus data refreshed successfully. Found ${actualTotalRecords} loads.`,
        );
      } else {
        throw new Error(response?.error || 'Failed to refresh Sylectus data');
      }
    } catch (error) {
      console.error('❌ Error refreshing Sylectus data:', error);
      message.error(
        'Failed to refresh Sylectus data. Make sure the extension is connected.',
      );
    }
  };

  const handleRefreshDAT = async (lane: Lane) => {
    try {
      console.log('🔄 Refreshing DAT data for lane:', lane);

      // Convert lane data to DAT search format
      const datParams = {
        origin: `${lane.origin.city}, ${lane.origin.state}`,
        destination:
          lane.destination?.city && lane.destination?.state
            ? `${lane.destination.city}, ${lane.destination.state}`
            : '',
        pickupDate: lane.dateRange[0], // Use the lane's date range
        equipmentType: 'V', // Default to Van
        datQueryId: lane.datQueryId, // Use existing query ID for refresh
      };

      // Prepare the message for the extension
      const extensionMessage = {
        type: 'DAT_SEARCH',
        params: datParams,
        isRefresh: true, // Flag to indicate this is a refresh operation
      };

      console.log('📨 Sending DAT refresh message:', extensionMessage);

      // Send message to extension
      if (window.chrome && window.chrome.runtime) {
        window.chrome.runtime.sendMessage(extensionMessage, (response: any) => {
          if (window.chrome.runtime.lastError) {
            console.error(
              'Extension communication error:',
              window.chrome.runtime.lastError,
            );
            message.error('Failed to communicate with browser extension');
          } else {
            console.log('✅ DAT refresh message sent successfully:', response);
            message.success('DAT refresh initiated');
          }
        });
      } else {
        console.warn('Chrome extension not available');
        message.warning('Browser extension not detected');
      }
    } catch (error) {
      console.error('❌ Error refreshing DAT data:', error);
      message.error('Failed to refresh DAT data');
    }
  };

  // Get search results for the selected lane
  const getSelectedLaneResults = () => {
    if (!selectedLane) return [];

    const allResults = [...datResults, ...sylectusResults];
    return allResults.filter((result) => {
      const searchModuleId = result.data?.searchModuleId;
      return (
        searchModuleId === selectedLane.datSearchModuleId ||
        searchModuleId === selectedLane.sylectusSearchModuleId ||
        searchModuleId === selectedLane.searchModuleId || // Legacy support
        // Fallback: also check backend query IDs (less reliable but for backwards compatibility)
        searchModuleId === selectedLane.datQueryId ||
        searchModuleId === selectedLane.sylectusQueryId
      );
    });
  };

  // If a lane is selected, show the lane loads view
  if (selectedLane) {
    const laneResults = getSelectedLaneResults();

    return (
      <div>
        <Card
          title={
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBackToLanes}
                type="text"
              >
                Back to Lanes
              </Button>
              <span>
                Loads for: {selectedLane.origin.city},{' '}
                {selectedLane.origin.state}
                {selectedLane.destination?.city &&
                  selectedLane.destination?.state &&
                  ` → ${selectedLane.destination.city}, ${selectedLane.destination.state}`}
              </span>
            </Space>
          }
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => handleRefreshSylectus(selectedLane)}
                loading={loading}
              >
                Refresh Sylectus
              </Button>
            </Space>
          }
        >
          {laneResults.length > 0 ? (
            <div>
              {laneResults.map((searchResult, index) => {
                const searchModuleId = searchResult.data?.searchModuleId;
                const provider = searchResult.data?.provider || 'Unknown';
                const loadCount =
                  searchResult.data?.loads?.length ||
                  searchResult.data?.rawResponse?.data?.createAssetAndGetMatches
                    ?.assetMatchesBody?.matches?.length ||
                  0;

                if (!searchModuleId) return null;

                return (
                  <div key={searchModuleId} style={{ marginBottom: '24px' }}>
                    <LoadsContainer
                      searchModuleId={searchModuleId}
                      searchResult={searchResult}
                      title={`${provider} Results (${loadCount} loads)`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#666',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
              }}
            >
              <h3>No loads found for this lane</h3>
              <p>
                Click "Refresh Sylectus" to search for loads on this lane, or go
                back to lanes to select a different one.
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card
        title="Lane Management"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <LaneTable
            lanes={lanes}
            onEdit={handleEditLane}
            onDelete={handleDeleteLane}
            onRefreshSylectus={handleRefreshSylectus}
            onRefreshDAT={handleRefreshDAT}
            onSelectLane={handleSelectLane}
          />
        </Space>
      </Card>

      <EditLaneModal
        lane={editingLane}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveLane}
      />
    </div>
  );
};

export default LanesContainerList;
