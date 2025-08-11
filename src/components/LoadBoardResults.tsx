import React from 'react';
import { Button, Space, Alert, Card, Typography, Spin, Tabs } from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { LoadBoardSearchResult } from '../types/loadboard';

const { Text } = Typography;

interface LoadBoardResultsProps {
  isPosting: boolean;
  hasAnySuccess: boolean;
  hasAnyError: boolean;
  allErrors: string;
  datResult: LoadBoardSearchResult | null;
  sylectusResult: LoadBoardSearchResult | null;
  datError: string | null;
  sylectusError: string | null;
  extensionConnected?: boolean;
  onSearchAll: () => void;
  onSearchDAT: () => void;
  onSearchSylectus: () => void;
}

const LoadBoardResults: React.FC<LoadBoardResultsProps> = ({
  isPosting,
  hasAnySuccess,
  hasAnyError,
  allErrors,
  datResult,
  sylectusResult,
  datError,
  sylectusError,
  extensionConnected = false,
  onSearchAll,
  onSearchDAT,
  onSearchSylectus,
}) => {
  const getResultIcon = (
    result: LoadBoardSearchResult | null,
    error: string | null,
  ) => {
    if (result?.success) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
    if (error) {
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
    return null;
  };

  const getResultStatus = (
    result: LoadBoardSearchResult | null,
    error: string | null,
  ) => {
    if (result?.success) {
      return { type: 'success' as const, message: result.message };
    }
    if (error) {
      return { type: 'error' as const, message: error };
    }
    return null;
  };

  const renderExtensionStatus = () => (
    <Card size="small" style={{ textAlign: 'left' }}>
      <Space>
        <Text strong>Extension Status:</Text>
        {extensionConnected ? (
          <span style={{ color: '#52c41a' }}>
            <CheckCircleOutlined /> Connected
          </span>
        ) : (
          <span style={{ color: '#ff4d4f' }}>
            <ExclamationCircleOutlined /> Disconnected
          </span>
        )}
      </Space>
      {!extensionConnected && (
        <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
          Install and enable the Truckarooskie extension to send searches
          directly to load boards
        </div>
      )}
    </Card>
  );

  const renderSearchResult = (
    result: LoadBoardSearchResult | null,
    error: string | null,
    platform: string,
  ) => {
    if (!result && !error) return null;

    return (
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {getResultIcon(result, error)}
            <Text strong>{platform} Search Result</Text>
          </div>
          {(() => {
            const status = getResultStatus(result, error);
            return status ? (
              <Alert message={status.message} type={status.type} showIcon />
            ) : null;
          })()}
          {result?.data && (
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                Search completed at:{' '}
                {new Date(result.data.timestamp).toLocaleString()}
              </Text>
              {result.data.mode && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Mode:{' '}
                    {result.data.mode === 'simulation'
                      ? 'Simulated (extension not connected)'
                      : 'Extension'}
                  </Text>
                </div>
              )}
              {result.data.loads && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Found {result.data.loads.length} loads
                  </Text>
                </div>
              )}
            </div>
          )}
        </Space>
      </Card>
    );
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <Tabs
        defaultActiveKey="all"
        items={[
          {
            key: 'all',
            label: 'Search All',
            children: (
              <div style={{ textAlign: 'center' }}>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: '100%' }}
                >
                  <Button
                    type="primary"
                    loading={isPosting}
                    onClick={onSearchAll}
                    size="large"
                  >
                    Search All Load Boards
                  </Button>

                  {isPosting && (
                    <Card style={{ textAlign: 'center' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>
                        <Text>Searching load boards...</Text>
                      </div>
                    </Card>
                  )}

                  {!isPosting && (hasAnySuccess || hasAnyError) && (
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: '100%' }}
                    >
                      {(datResult || datError) && (
                        <Card size="small">
                          <Space>
                            {getResultIcon(datResult, datError)}
                            <Text strong>DAT Power:</Text>
                            {(() => {
                              const status = getResultStatus(
                                datResult,
                                datError,
                              );
                              return status ? (
                                <Alert
                                  message={status.message}
                                  type={status.type}
                                  showIcon={false}
                                  style={{ margin: 0 }}
                                />
                              ) : null;
                            })()}
                          </Space>
                        </Card>
                      )}

                      {(sylectusResult || sylectusError) && (
                        <Card size="small">
                          <Space>
                            {getResultIcon(sylectusResult, sylectusError)}
                            <Text strong>Sylectus:</Text>
                            {(() => {
                              const status = getResultStatus(
                                sylectusResult,
                                sylectusError,
                              );
                              return status ? (
                                <Alert
                                  message={status.message}
                                  type={status.type}
                                  showIcon={false}
                                  style={{ margin: 0 }}
                                />
                              ) : null;
                            })()}
                          </Space>
                        </Card>
                      )}
                    </Space>
                  )}

                  {hasAnyError && allErrors && !isPosting && (
                    <Alert
                      message="Some searches failed"
                      description={allErrors}
                      type="warning"
                      showIcon
                    />
                  )}

                  {hasAnySuccess && !hasAnyError && !isPosting && (
                    <Alert
                      message="All searches completed successfully!"
                      type="success"
                      showIcon
                    />
                  )}
                </Space>
              </div>
            ),
          },
          {
            key: 'dat',
            label: 'DAT Power',
            children: (
              <div style={{ textAlign: 'center' }}>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: '100%' }}
                >
                  {renderExtensionStatus()}

                  <Button
                    type="primary"
                    loading={isPosting}
                    onClick={onSearchDAT}
                    size="large"
                  >
                    Search DAT Power
                  </Button>

                  {isPosting && (
                    <Card style={{ textAlign: 'center' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>
                        <Text>Searching DAT Power...</Text>
                      </div>
                    </Card>
                  )}

                  {!isPosting &&
                    renderSearchResult(datResult, datError, 'DAT Power')}
                </Space>
              </div>
            ),
          },
          {
            key: 'sylectus',
            label: 'Sylectus',
            children: (
              <div style={{ textAlign: 'center' }}>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: '100%' }}
                >
                  {renderExtensionStatus()}

                  <Button
                    type="primary"
                    loading={isPosting}
                    onClick={onSearchSylectus}
                    size="large"
                  >
                    Search Sylectus
                  </Button>

                  {isPosting && (
                    <Card style={{ textAlign: 'center' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>
                        <Text>Searching Sylectus...</Text>
                      </div>
                    </Card>
                  )}

                  {!isPosting &&
                    renderSearchResult(
                      sylectusResult,
                      sylectusError,
                      'Sylectus',
                    )}
                </Space>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default LoadBoardResults;
