import React from 'react';
import { Button, Space, Alert, Card, Typography, Spin, Tabs } from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface LoadBoardResultsProps {
  isPosting: boolean;
  hasAnySuccess: boolean;
  hasAnyError: boolean;
  allErrors: string;
  datResult: any;
  sylectusResult: any;
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
  const getResultIcon = (result: any, error: string | null) => {
    if (result?.success) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
    if (error) {
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
    return null;
  };

  const getResultStatus = (result: any, error: string | null) => {
    if (result?.success) {
      return { type: 'success' as const, message: result.message };
    }
    if (error) {
      return { type: 'error' as const, message: error };
    }
    return null;
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

                  {/* Loading Indicator */}
                  {isPosting && (
                    <Card style={{ textAlign: 'center' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>
                        <Text>Searching load boards...</Text>
                      </div>
                    </Card>
                  )}

                  {/* Results Display */}
                  {!isPosting && (hasAnySuccess || hasAnyError) && (
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: '100%' }}
                    >
                      {/* DAT Results */}
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

                      {/* Sylectus Results */}
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

                  {/* Overall Error Display */}
                  {hasAnyError && allErrors && !isPosting && (
                    <Alert
                      message="Some searches failed"
                      description={allErrors}
                      type="warning"
                      showIcon
                    />
                  )}

                  {/* Overall Success Display */}
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
                  {/* Extension Status Indicator */}
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
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: '12px',
                          color: '#666',
                        }}
                      >
                        Install and enable the Truckarooskie extension to send
                        searches directly to DAT
                      </div>
                    )}
                  </Card>

                  <Button
                    type="primary"
                    loading={isPosting}
                    onClick={onSearchDAT}
                    size="large"
                  >
                    Search DAT Power
                  </Button>

                  {/* Loading Indicator */}
                  {isPosting && (
                    <Card style={{ textAlign: 'center' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>
                        <Text>Searching DAT Power...</Text>
                      </div>
                    </Card>
                  )}

                  {/* DAT Results */}
                  {!isPosting && (datResult || datError) && (
                    <Card>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          {getResultIcon(datResult, datError)}
                          <Text strong>DAT Power Search Result</Text>
                        </div>
                        {(() => {
                          const status = getResultStatus(datResult, datError);
                          return status ? (
                            <Alert
                              message={status.message}
                              type={status.type}
                              showIcon
                            />
                          ) : null;
                        })()}
                        {datResult?.data && (
                          <div style={{ marginTop: 16 }}>
                            <Text type="secondary">
                              Search completed at:{' '}
                              {new Date(
                                datResult.data.timestamp,
                              ).toLocaleString()}
                            </Text>
                            {datResult.data.mode && (
                              <div style={{ marginTop: 4 }}>
                                <Text
                                  type="secondary"
                                  style={{ fontSize: '12px' }}
                                >
                                  Mode:{' '}
                                  {datResult.data.mode === 'simulation'
                                    ? 'Simulated (extension not connected)'
                                    : 'Extension'}
                                </Text>
                              </div>
                            )}
                          </div>
                        )}
                      </Space>
                    </Card>
                  )}
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
                  <Button
                    type="primary"
                    loading={isPosting}
                    onClick={onSearchSylectus}
                    size="large"
                  >
                    Search Sylectus
                  </Button>

                  {/* Loading Indicator */}
                  {isPosting && (
                    <Card style={{ textAlign: 'center' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>
                        <Text>Searching Sylectus...</Text>
                      </div>
                    </Card>
                  )}

                  {/* Sylectus Results */}
                  {!isPosting && (sylectusResult || sylectusError) && (
                    <Card>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          {getResultIcon(sylectusResult, sylectusError)}
                          <Text strong>Sylectus Search Result</Text>
                        </div>
                        {(() => {
                          const status = getResultStatus(
                            sylectusResult,
                            sylectusError,
                          );
                          return status ? (
                            <Alert
                              message={status.message}
                              type={status.type}
                              showIcon
                            />
                          ) : null;
                        })()}
                        {sylectusResult?.data && (
                          <div style={{ marginTop: 16 }}>
                            <Text type="secondary">
                              Search completed at:{' '}
                              {new Date(
                                sylectusResult.data.timestamp,
                              ).toLocaleString()}
                            </Text>
                          </div>
                        )}
                      </Space>
                    </Card>
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
