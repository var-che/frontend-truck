import React, { useState, useEffect, useCallback } from 'react';
import { Table, Select, Space, Tag } from 'antd';

import dayjs from 'dayjs';
import { DatSearchResponse } from '../types/dat';

interface Driver {
  id: string;
  driverName: string;
}

interface Lane {
  id: string;
  origin: {
    city: string;
    state: string;
  };
  destination: {
    city: string;
    state: string;
  };
  dateRange: [string, string]; // ISO date strings
  weight: number;
  details?: string; // Optional details for expansion
  driverIds: string[]; // Array of associated driver IDs
  source?: string; // Optional source field
}

const mockLanes: Lane[] = [
  {
    id: '1',
    origin: { city: 'Chicago', state: 'IL' },
    destination: { city: 'Dallas', state: 'TX' },
    dateRange: ['2024-12-27', '2024-12-28'],
    weight: 100000,
    details: 'Regular route, no special requirements. Box truck needed.',
    driverIds: [],
  },
  {
    id: '2',
    origin: { city: 'New York', state: 'NY' },
    destination: { city: 'Miami', state: 'FL' },
    dateRange: ['2024-12-28', '2024-12-29'],
    weight: 8000,
    details: 'Fragile items, temperature controlled required.',
    driverIds: [],
  },
  {
    id: '3',
    origin: { city: 'Los Angeles', state: 'CA' },
    destination: { city: 'Phoenix', state: 'AZ' },
    dateRange: ['2024-12-29', '2024-12-30'],
    weight: 12000,
    driverIds: [],
  },
];

const DatSourceTag: React.FC<{ laneId: string }> = ({ laneId }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    console.log('nothing yet');
  }, [laneId]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span
        style={{
          backgroundColor: isRefreshing ? '#52c41a' : '#1890ff',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          transition: 'background-color 2s ease',
        }}
      >
        DAT
      </span>
      <button
        onClick={handleRefresh}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: '4px',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
        </svg>
      </button>
    </div>
  );
};

const LanesContainerList: React.FC = () => {
  // Initialize state from localStorage or fallback to mockLanes
  const [lanes, setLanes] = useState<Lane[]>(() => {
    const savedLanes = localStorage.getItem('lanes');
    return savedLanes ? JSON.parse(savedLanes) : mockLanes;
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Load drivers from localStorage
  useEffect(() => {
    const savedElements = localStorage.getItem('canvas-elements');
    if (savedElements) {
      const elements = JSON.parse(savedElements);
      const availableDrivers = elements.map((el: any) => ({
        id: el.id,
        driverName: el.driverName || 'Unnamed Driver',
      }));
      setDrivers(availableDrivers);
    }
  }, []);

  const handleAddDriver = (laneId: string, driverId: string) => {
    const updatedLanes = lanes.map((lane) => {
      if (lane.id === laneId) {
        return {
          ...lane,
          driverIds: [...(lane.driverIds || []), driverId],
        };
      }
      return lane;
    });
    setLanes(updatedLanes);
    localStorage.setItem('lanes', JSON.stringify(updatedLanes));
  };

  const handleRemoveDriver = (laneId: string, driverId: string) => {
    const updatedLanes = lanes.map((lane) => {
      if (lane.id === laneId) {
        return {
          ...lane,
          driverIds: (lane.driverIds || []).filter((id) => id !== driverId),
        };
      }
      return lane;
    });
    setLanes(updatedLanes);
    localStorage.setItem('lanes', JSON.stringify(updatedLanes));
  };

  const handleDatLinesReceived = (rawData: string) => {
    try {
      const parsedData: DatSearchResponse[] = JSON.parse(rawData);

      const newLanes = parsedData
        .map((searchCriteria): Lane | null => {
          const { formParams } = searchCriteria;
          if (!formParams) return null;

          return {
            id: searchCriteria.searchId,
            origin: {
              city:
                formParams.origin?.city ||
                formParams.origin?.name?.split(',')[0] ||
                '',
              state:
                formParams.origin?.state ||
                formParams.origin?.name?.split(',')[1]?.trim() ||
                '',
            },
            destination: {
              city:
                formParams.destination?.city ||
                formParams.destination?.name?.split(',')[0] ||
                '',
              state:
                formParams.destination?.state ||
                formParams.destination?.name?.split(',')[1]?.trim() ||
                '',
            },
            dateRange: [
              new Date(formParams.startDate).toISOString().split('T')[0],
              new Date(formParams.endDate).toISOString().split('T')[0],
            ],
            weight: formParams.weightPounds,
            driverIds: [],
            source: 'DAT',
          };
        })
        .filter((lane): lane is Lane => lane !== null);

      setLanes((prevLanes) => {
        // Create map of existing lanes by ID
        const existingLanesMap = new Map(
          prevLanes.map((lane) => [lane.id, lane]),
        );

        // Add or update lanes
        newLanes.forEach((lane) => {
          existingLanesMap.set(lane.id, lane);
        });

        const updatedLanes = Array.from(existingLanesMap.values());
        localStorage.setItem('lanes', JSON.stringify(updatedLanes));
        return updatedLanes;
      });
    } catch (error) {
      console.error('Error processing DAT data:', error);
    }
  };

  const columns = [
    {
      title: 'Route',
      key: 'route',
      render: (record: Lane) =>
        `${record.origin.city} ${record.origin.state} - ${record.destination.city} ${record.destination.state}`,
      width: '40%',
    },
    {
      title: 'Date Range',
      key: 'dateRange',
      render: (record: Lane) =>
        `${dayjs(record.dateRange[0]).format('MM/DD')}-${dayjs(
          record.dateRange[1],
        ).format('MM/DD')}`,
      width: '30%',
    },
    {
      title: 'Weight',
      key: 'weight',
      render: (record: Lane) => `${record.weight.toLocaleString()}lbs`,
      width: '30%',
    },
    {
      title: 'Source',
      key: 'source',
      render: (record: Lane) =>
        record.source === 'DAT' ? <DatSourceTag laneId={record.id} /> : null,
      width: '15%',
    },
  ];

  const ExpandedRow: React.FC<{ record: Lane }> = ({ record }) => {
    const availableDrivers = drivers.filter(
      (driver) => !record.driverIds?.includes(driver.id),
    );

    return (
      <div style={{ padding: '20px', backgroundColor: '#fafafa' }}>
        <div>{record.details}</div>
        <div style={{ marginTop: '16px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <strong>Associated Drivers:</strong>
              <div style={{ marginTop: '8px' }}>
                {record.driverIds?.map((driverId) => {
                  const driver = drivers.find((d) => d.id === driverId);
                  return (
                    <Tag
                      key={driverId}
                      closable
                      onClose={() => handleRemoveDriver(record.id, driverId)}
                      style={{ marginBottom: '8px' }}
                    >
                      {driver?.driverName || 'Unknown Driver'}
                    </Tag>
                  );
                })}
              </div>
            </div>
            <Space>
              <Select
                style={{ width: 200 }}
                placeholder="Select driver"
                options={availableDrivers.map((driver) => ({
                  value: driver.id,
                  label: driver.driverName,
                }))}
                onChange={(value) => handleAddDriver(record.id, value)}
              />
            </Space>
          </Space>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Table
        dataSource={lanes}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        expandable={{
          expandedRowRender: (record) => <ExpandedRow record={record} />,
          expandRowByClick: true,
        }}
      />
    </div>
  );
};

export default LanesContainerList;
