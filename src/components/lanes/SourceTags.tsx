import React, { useState, useCallback } from 'react';
import { Tag, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { Lane } from './types';

interface SourceTagProps {
  lane: Lane;
  onRefresh?: (laneId: string) => Promise<void>;
}

interface SourceTagsProps {
  sourceCounts: Record<string, number>;
}

export const SourceTags: React.FC<SourceTagsProps> = ({ sourceCounts }) => {
  return (
    <Space>
      {Object.entries(sourceCounts).map(([source, count]) => (
        <Tag
          key={source}
          color={
            source === 'DAT'
              ? 'blue'
              : source === 'SYLECTUS'
              ? 'green'
              : 'default'
          }
        >
          {source}: {count}
        </Tag>
      ))}
    </Space>
  );
};

export const DatSourceTag: React.FC<SourceTagProps> = ({ lane, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    console.log(`🔄 Refreshing DAT results for lane: ${lane.id}`, lane);

    try {
      await onRefresh(lane.id);
    } catch (error) {
      console.error('Error refreshing DAT results:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [lane, onRefresh]);

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
        title={`DAT Query ID: ${lane.datQueryId || 'N/A'} | Results: ${
          lane.resultsCount || 0
        }`}
      >
        DAT {lane.resultsCount !== undefined ? `(${lane.resultsCount})` : ''}
      </span>
      <button
        onClick={handleRefresh}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: '4px',
        }}
        title="Refresh DAT results"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
        </svg>
      </button>
    </div>
  );
};

export const SylectusSourceTag: React.FC<SourceTagProps> = ({
  lane,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    console.log(`🔄 Refreshing Sylectus results for lane: ${lane.id}`, lane);

    try {
      await onRefresh(lane.id);
    } catch (error) {
      console.error('Error refreshing Sylectus results:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [lane, onRefresh]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span
        style={{
          backgroundColor: isRefreshing ? '#52c41a' : '#52c41a',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          transition: 'background-color 2s ease',
        }}
        title={`Sylectus Query ID: ${
          lane.sylectusQueryId || 'N/A'
        } | Results: ${lane.resultsCount || 0}`}
      >
        Sylectus{' '}
        {lane.resultsCount !== undefined ? `(${lane.resultsCount})` : ''}
      </span>
      <button
        onClick={handleRefresh}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: '4px',
        }}
        title="Refresh Sylectus results"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
        </svg>
      </button>
    </div>
  );
};
