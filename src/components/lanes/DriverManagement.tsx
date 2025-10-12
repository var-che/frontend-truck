import React from 'react';
import { Card, Empty, Select, Space, Tag } from 'antd';
import { Driver, Lane } from './types';

interface DriverManagementProps {
  lane?: Lane | null;
  drivers: Driver[];
  onAddDriver: (laneId: string, driverId: string) => void;
  onRemoveDriver: (laneId: string, driverId: string) => void;
}

export const DriverManagement: React.FC<DriverManagementProps> = ({
  lane,
  drivers,
  onAddDriver,
  onRemoveDriver,
}) => {
  if (!lane) {
    return (
      <Card title="Driver Management">
        <Empty description="Select a lane to manage drivers" />
      </Card>
    );
  }

  const availableDrivers = drivers.filter(
    (driver) => !lane.driverIds?.includes(driver.id),
  );

  const assignedDrivers = drivers.filter((driver) =>
    lane.driverIds?.includes(driver.id),
  );

  return (
    <Card title="Driver Management">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <strong>Assigned Drivers:</strong>
          {assignedDrivers.length > 0 ? (
            assignedDrivers.map((driver) => (
              <Tag
                key={driver.id}
                closable
                onClose={() => onRemoveDriver(lane.id, driver.id)}
                style={{ marginLeft: '8px' }}
              >
                {driver.driverName}
              </Tag>
            ))
          ) : (
            <span style={{ marginLeft: '8px', color: '#999' }}>
              No drivers assigned
            </span>
          )}
        </div>
        <Space>
          <Select
            placeholder="Add driver to lane"
            style={{ width: 200 }}
            options={availableDrivers.map((driver) => ({
              label: driver.driverName,
              value: driver.id,
            }))}
            onChange={(value: string) => onAddDriver(lane.id, value)}
          />
        </Space>
      </Space>
    </Card>
  );
};
