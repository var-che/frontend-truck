import React from 'react';
import { Table, Button, Space, Popconfirm } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Lane } from './types';
import { useTimeAgo } from '../../utils/timeUtils';

interface TimeAgoDisplayProps {
  timestamp: string;
}

const TimeAgoDisplay: React.FC<TimeAgoDisplayProps> = ({ timestamp }) => {
  const timeAgo = useTimeAgo(timestamp);
  return <span>{timeAgo}</span>;
};

interface LaneTableProps {
  lanes: Lane[];
  onEdit: (lane: Lane) => void;
  onDelete: (laneId: string) => void;
  onRefreshSylectus?: (lane: Lane) => void;
  onRefreshDAT?: (lane: Lane) => void;
  onSelectLane?: (lane: Lane) => void;
}

export const LaneTable: React.FC<LaneTableProps> = ({
  lanes,
  onEdit,
  onDelete,
  onRefreshSylectus,
  onRefreshDAT,
  onSelectLane,
}) => {
  const columns: ColumnsType<Lane> = [
    {
      title: 'Origin',
      dataIndex: 'origin',
      key: 'origin',
      render: (origin) => `${origin.city}, ${origin.state}`,
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
      render: (destination) =>
        destination.city && destination.state
          ? `${destination.city}, ${destination.state}`
          : 'Not set',
    },
    {
      title: 'Date Range',
      dataIndex: 'dateRange',
      key: 'dateRange',
      render: (dateRange) => `${dateRange[0]} - ${dateRange[1]}`,
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight) => `${weight} lbs`,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source, record) => {
        const badges = [];
        if (record.datQueryId) badges.push('DAT');
        if (record.sylectusQueryId) badges.push('SYLECTUS');

        if (badges.length > 1) {
          return (
            <span style={{ color: '#1890ff' }}>
              COMBINED ({badges.join(' + ')})
            </span>
          );
        } else if (badges.length === 1) {
          return badges[0];
        }
        return source || 'MANUAL';
      },
    },
    {
      title: 'Results',
      key: 'results',
      render: (_, record) => {
        const parts = [];
        if (record.datResultsCount !== undefined) {
          parts.push(`DAT: ${record.datResultsCount}`);
        }
        if (record.sylectusResultsCount !== undefined) {
          parts.push(`SYL: ${record.sylectusResultsCount}`);
        }

        if (parts.length > 1) {
          return (
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {parts.join(' | ')}
              </div>
              <div style={{ fontWeight: 'bold' }}>
                Total: {record.resultsCount || 0}
              </div>
            </div>
          );
        } else if (parts.length === 1) {
          return parts[0];
        }
        return record.resultsCount || 0;
      },
    },
    {
      title: 'Last Refreshed',
      dataIndex: 'lastRefreshed',
      key: 'lastRefreshed',
      render: (lastRefreshed) =>
        lastRefreshed ? <TimeAgoDisplay timestamp={lastRefreshed} /> : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          {onSelectLane && (
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => onSelectLane(record)}
              title="View loads for this lane"
            >
              View Loads
            </Button>
          )}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            Edit
          </Button>
          {onRefreshDAT && record.datQueryId && (
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={() => onRefreshDAT(record)}
              title="Refresh DAT data for this lane"
              style={{ color: '#52c41a' }}
            >
              Refresh DAT
            </Button>
          )}
          {onRefreshSylectus && record.sylectusQueryId && (
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={() => onRefreshSylectus(record)}
              title="Refresh Sylectus data for this lane"
              style={{ color: '#1890ff' }}
            >
              Refresh Sylectus
            </Button>
          )}
          <Popconfirm
            title="Are you sure you want to delete this lane?"
            onConfirm={() => onDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={lanes}
      rowKey="id"
      pagination={{ pageSize: 10 }}
    />
  );
};
