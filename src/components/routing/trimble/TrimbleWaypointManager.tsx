import React, { useState } from 'react';
import { List, Button, Space, Typography, AutoComplete } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTrimbleRouting } from '../../../context/routing/TrimbleRoutingContext';
import { Waypoint, Route } from '../../../types/routing';

const { Text } = Typography;

// Sortable waypoint item component
interface SortableWaypointItemProps {
  waypoint: Waypoint;
  index: number;
  totalWaypoints: number;
  onRemove: (waypointId: string) => void;
  segmentDistance?: number; // Distance from previous waypoint
  totalDistance?: number; // Total cumulative distance
}

const SortableWaypointItem: React.FC<SortableWaypointItemProps> = ({
  waypoint,
  index,
  totalWaypoints,
  onRemove,
  segmentDistance,
  totalDistance,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: waypoint.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <List.Item
        actions={[
          <Button
            key="delete"
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onRemove(waypoint.id)}
            danger
          />,
        ]}
      >
        <List.Item.Meta
          avatar={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                {...attributes}
                {...listeners}
                style={{
                  cursor: 'grab',
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #d9d9d9',
                }}
              >
                <HolderOutlined style={{ fontSize: '12px', color: '#999' }} />
              </div>
              <div
                style={{
                  background:
                    index === 0
                      ? '#52c41a'
                      : index === totalWaypoints - 1
                      ? '#f5222d'
                      : '#1890ff',
                  color: 'white',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}
              >
                {index + 1}
              </div>
            </div>
          }
          title={
            <Text style={{ fontSize: '12px' }}>
              {waypoint.address ||
                `${waypoint.lat.toFixed(4)}, ${waypoint.lng.toFixed(4)}`}
            </Text>
          }
          description={
            <div>
              {waypoint.city && waypoint.state && (
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {waypoint.city}, {waypoint.state}
                </Text>
              )}
              {(segmentDistance !== undefined ||
                totalDistance !== undefined) && (
                <div style={{ marginTop: 2 }}>
                  {index === 0 ? (
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      0 miles
                    </Text>
                  ) : (
                    <Space size={8}>
                      {segmentDistance !== undefined && (
                        <Text type="secondary" style={{ fontSize: '10px' }}>
                          {segmentDistance.toFixed(1)} miles
                        </Text>
                      )}
                      {totalDistance !== undefined &&
                        index === totalWaypoints - 1 && (
                          <Text
                            type="secondary"
                            style={{ fontSize: '10px', fontWeight: 'bold' }}
                          >
                            ({totalDistance.toFixed(1)} miles total)
                          </Text>
                        )}
                    </Space>
                  )}
                </div>
              )}
            </div>
          }
        />
      </List.Item>
    </div>
  );
};

interface TrimbleWaypointManagerProps {
  elementId: string;
  waypoints: Waypoint[];
  route?: Route; // Optional route data for distance calculations
}

const TrimbleWaypointManager: React.FC<TrimbleWaypointManagerProps> = ({
  elementId,
  waypoints,
  route,
}) => {
  const {
    addWaypoint,
    removeWaypoint,
    reorderWaypoints,
    searchLocations,
    geocodeAddress,
  } = useTrimbleRouting();
  const [newAddress, setNewAddress] = useState('');
  const [searchOptions, setSearchOptions] = useState<
    { key: string; value: string; label: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  // Calculate distances for each waypoint
  const getWaypointDistances = () => {
    if (!route || !route.segments || route.segments.length === 0) {
      return { segmentDistances: [], totalDistances: [] };
    }

    const segmentDistances: (number | undefined)[] = [];
    const totalDistances: number[] = [];
    let cumulativeDistance = 0;

    waypoints.forEach((_, index) => {
      if (index === 0) {
        segmentDistances.push(undefined); // First waypoint has no segment distance
        totalDistances.push(0);
      } else {
        const segmentIndex = index - 1;
        const segmentDistance = route.segments[segmentIndex]?.distance || 0;
        cumulativeDistance += segmentDistance;

        segmentDistances.push(segmentDistance);
        totalDistances.push(cumulativeDistance);
      }
    });

    return { segmentDistances, totalDistances };
  };

  const { segmentDistances, totalDistances } = getWaypointDistances();

  const handleAddWaypoint = async () => {
    if (!newAddress.trim()) return;

    try {
      // Use geocodeAddress for better accuracy with user input
      const waypoint = await geocodeAddress(newAddress);

      if (waypoint) {
        addWaypoint(elementId, waypoint);
        setNewAddress('');
        setSearchOptions([]);
      } else {
        console.error('Could not geocode address:', newAddress);
      }
    } catch (error) {
      console.error('Failed to add waypoint:', error);
    }
  };

  const handleRemoveWaypoint = (waypointId: string) => {
    removeWaypoint(elementId, waypointId);
  };

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setSearchOptions([]);
      return;
    }

    setIsSearching(true);
    try {
      const locations = await searchLocations(value);
      const options = locations.map((location) => ({
        key: location.id, // Add unique key for each option
        value: location.address || `${location.lat}, ${location.lng}`,
        label: location.address || `${location.lat}, ${location.lng}`,
      }));
      setSearchOptions(options);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchOptions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (value: string) => {
    setNewAddress(value);
    handleAddWaypoint();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = waypoints.findIndex((wp) => wp.id === active.id);
      const newIndex = waypoints.findIndex((wp) => wp.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderWaypoints(elementId, oldIndex, newIndex);
      }
    }
  };

  return (
    <div>
      {/* Add Waypoint Input */}
      <Space.Compact style={{ width: '100%', marginBottom: 4 }}>
        <AutoComplete
          style={{ flex: 1 }}
          value={newAddress}
          onChange={setNewAddress}
          onSearch={handleSearch}
          onSelect={handleSelect}
          options={searchOptions}
          placeholder="Enter address (e.g., Chicago IL, 60601, or 123 Main St)"
          notFoundContent={isSearching ? 'Searching...' : 'No results'}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddWaypoint}
          disabled={!newAddress.trim()}
        >
          Add
        </Button>
      </Space.Compact>

      {/* Help text */}
      <Text
        type="secondary"
        style={{ fontSize: '11px', marginBottom: 8, display: 'block' }}
      >
        Examples: "Chicago IL", "60601", "123 Main St, Chicago IL"
      </Text>

      {/* Waypoints List */}
      {waypoints.length > 0 ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={waypoints.map((wp) => wp.id)}
            strategy={verticalListSortingStrategy}
          >
            <List size="small">
              {waypoints.map((waypoint, index) => (
                <SortableWaypointItem
                  key={waypoint.id}
                  waypoint={waypoint}
                  index={index}
                  totalWaypoints={waypoints.length}
                  onRemove={handleRemoveWaypoint}
                  segmentDistance={segmentDistances[index]}
                  totalDistance={totalDistances[index]}
                />
              ))}
            </List>
          </SortableContext>
        </DndContext>
      ) : (
        <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
          <EnvironmentOutlined style={{ fontSize: '20px', marginBottom: 8 }} />
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            No waypoints added yet
          </Text>
        </div>
      )}
    </div>
  );
};

export default TrimbleWaypointManager;
