import React from 'react';
import { Card, Space, Statistic } from 'antd';
import { Lane } from './types';

interface LaneDetailsProps {
  lane?: Lane | null;
  sourceCounts: Record<string, number>;
}

export const LaneDetails: React.FC<LaneDetailsProps> = ({
  lane,
  sourceCounts,
}) => {
  if (!lane) {
    return (
      <Card title="Lane Summary">
        <Space direction="horizontal" size="large">
          <Statistic
            title="Total Lanes"
            value={Object.values(sourceCounts).reduce((a, b) => a + b, 0)}
          />
          {Object.entries(sourceCounts).map(([source, count]) => (
            <Statistic key={source} title={`${source} Lanes`} value={count} />
          ))}
        </Space>
      </Card>
    );
  }

  return (
    <Card title="Selected Lane Details">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <strong>Origin:</strong> {lane.origin.city}, {lane.origin.state}
        </div>
        <div>
          <strong>Destination:</strong>{' '}
          {lane.destination.city && lane.destination.state
            ? `${lane.destination.city}, ${lane.destination.state}`
            : 'Not set'}
        </div>
        <div>
          <strong>Date Range:</strong> {lane.dateRange[0]} - {lane.dateRange[1]}
        </div>
        <div>
          <strong>Weight:</strong> {lane.weight} lbs
        </div>
        <div>
          <strong>Source:</strong> {lane.source || 'MANUAL'}
        </div>
        {lane.lastRefreshed && (
          <div>
            <strong>Last Refreshed:</strong>{' '}
            {new Date(lane.lastRefreshed).toLocaleString()}
          </div>
        )}
      </Space>
    </Card>
  );
};
