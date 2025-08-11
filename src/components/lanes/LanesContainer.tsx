import React, { useState, useEffect } from 'react';
import { Card, Space, Button, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { SylectusService } from '../../services/SylectusService';
import { Lane } from '../../types/lanes';
import { SourceTags } from './SourceTags';
import { DriverManagement } from './DriverManagement';
import { LaneDetails } from './LaneDetails';
import { LaneTable } from './LaneTable';
import { EditLaneModal } from './EditLaneModal';

export const LanesContainer: React.FC = () => {
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingLane, setEditingLane] = useState<Lane | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch lanes on component mount
  useEffect(() => {
    fetchLanes();
  }, []);

  const fetchLanes = async () => {
    setLoading(true);
    try {
      const lanesData = await SylectusService.getLanes();
      setLanes(lanesData);
    } catch (error) {
      console.error('Error fetching lanes:', error);
      message.error('Failed to fetch lanes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchLanes();
  };

  const handleEditLane = (lane: Lane) => {
    setEditingLane(lane);
    setIsEditModalOpen(true);
  };

  const handleDeleteLane = async (laneId: string) => {
    try {
      await SylectusService.deleteLane(laneId);
      message.success('Lane deleted successfully');
      fetchLanes(); // Refresh the lanes list
    } catch (error) {
      console.error('Error deleting lane:', error);
      message.error('Failed to delete lane');
    }
  };

  const handleSaveLane = async (updatedLane: Lane) => {
    try {
      await SylectusService.updateLane(updatedLane);
      message.success('Lane updated successfully');
      fetchLanes(); // Refresh the lanes list
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

  const sourceCounts = lanes.reduce((acc, lane) => {
    const source = lane.source || 'MANUAL';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <Card
        title="Lane Management"
        extra={
          <Space>
            <SourceTags sourceCounts={sourceCounts} />
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <DriverManagement
            lane={editingLane}
            drivers={[]}
            onAddDriver={() => {}}
            onRemoveDriver={() => {}}
          />

          <LaneDetails lane={editingLane} sourceCounts={sourceCounts} />

          <LaneTable
            lanes={lanes}
            onEdit={handleEditLane}
            onDelete={handleDeleteLane}
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
