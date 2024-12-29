import React, { useState, useEffect } from 'react';
import { Table, Select, Space, Tag } from 'antd';

import dayjs from 'dayjs';

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
}

const mockLanes: Lane[] = [
  {
    id: '1',
    origin: { city: 'Chicago', state: 'IL' },
    destination: { city: 'Dallas', state: 'TX' },
    dateRange: ['2024-12-27', '2024-12-28'],
    weight: 10000,
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
  );
};

export default LanesContainerList;
