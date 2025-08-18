import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Space,
  Table,
  Typography,
  message,
  Tooltip,
  Divider,
  InputNumber,
  Checkbox,
  Tag,
} from 'antd';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  SylectusSearchParams,
  SylectusLoad,
  SYLECTUS_LOAD_TYPES,
  SYLECTUS_STATES,
} from '../types/sylectus';
import { SylectusService } from '../services/SylectusService';

const { Title, Text } = Typography;
const { Option } = Select;

const SylectusSearchPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loads, setLoads] = useState<SylectusLoad[]>([]);
  const [searchResults, setSearchResults] = useState<{
    totalRecords: number;
    lastRefresh: string;
    searchParams: SylectusSearchParams;
  } | null>(null);

  const handleSearch = async (values: any) => {
    setLoading(true);
    try {
      const searchParams: SylectusSearchParams = {
        fromCity: values.fromCity,
        fromState: values.fromState,
        toCity: values.toCity,
        toState: values.toState,
        miles: values.miles,
        fromDate: values.fromDate,
        loadTypes: values.loadTypes,
        maxWeight: values.maxWeight,
        minCargo: values.minCargo,
        maxCargo: values.maxCargo,
        freight: values.freight,
        refreshRate: values.refreshRate,
      };

      const sylectusService = new SylectusService();
      const response = await sylectusService.searchLoads(searchParams);

      setLoads(response.loads);
      setSearchResults({
        totalRecords: response.totalRecords,
        lastRefresh: response.lastRefresh,
        searchParams: response.searchParams,
      });

      message.success(`Found ${response.loads.length} loads on Sylectus`);
    } catch (error) {
      console.error('Search error:', error);
      message.error(
        `Search failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    form.resetFields();
    setLoads([]);
    setSearchResults(null);
  };

  const columns: ColumnsType<SylectusLoad> = [
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      width: 60,
      render: (text: string) => (
        <Tag
          color={
            text?.includes('min')
              ? 'red'
              : text?.includes('hr')
              ? 'orange'
              : 'green'
          }
        >
          {text}
        </Tag>
      ),
    },
    {
      title: 'Origin',
      dataIndex: 'origin',
      key: 'origin',
      width: 140,
      render: (text: string, record: SylectusLoad) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{text}</div>
          {record.dhO && (
            <div style={{ fontSize: '10px', color: '#666' }}>
              DH: {record.dhO}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
      width: 140,
      render: (text: string, record: SylectusLoad) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{text}</div>
          {record.dhD && (
            <div style={{ fontSize: '10px', color: '#666' }}>
              DH: {record.dhD}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Pickup',
      dataIndex: 'pickUp',
      key: 'pickUp',
      width: 100,
      render: (text: string) => <div style={{ fontSize: '11px' }}>{text}</div>,
    },
    {
      title: 'Equipment',
      dataIndex: 'eq',
      key: 'eq',
      width: 80,
    },
    {
      title: 'Trip Miles',
      dataIndex: 'trip',
      key: 'trip',
      width: 70,
      render: (text: number) => (
        <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
          {text?.toLocaleString() || 0}
        </div>
      ),
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      width: 80,
      render: (text: string) => (
        <div
          style={{
            textAlign: 'center',
            fontWeight: 'bold',
            color: '#52c41a',
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: 'Specs',
      key: 'specs',
      width: 120,
      render: (_, record: SylectusLoad) => (
        <div style={{ fontSize: '10px' }}>
          <div>Length: {record.length}</div>
          <div>Weight: {record.weight}</div>
          <div>Capacity: {record.capacity}</div>
          <div>Pieces: {record.pieces}</div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Sylectus Load Search</Title>
      <Text type="secondary">
        Search for available loads on the Sylectus load board
      </Text>

      <Card style={{ marginTop: '16px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearch}
          initialValues={{
            miles: 120,
            freight: 'Both',
            refreshRate: 300,
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="From City"
                name="fromCity"
                rules={[
                  { required: true, message: 'Please enter origin city' },
                ]}
              >
                <Input placeholder="e.g., Chicago" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="From State"
                name="fromState"
                rules={[
                  { required: true, message: 'Please select origin state' },
                ]}
              >
                <Select
                  placeholder="Select state"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {SYLECTUS_STATES.map((state) => (
                    <Option key={state.value} value={state.value}>
                      {state.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Pickup Within (miles)" name="miles">
                <InputNumber
                  min={1}
                  max={500}
                  placeholder="120"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="To City (optional)" name="toCity">
                <Input placeholder="e.g., Dallas" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="To State (optional)" name="toState">
                <Select
                  placeholder="Select state"
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {SYLECTUS_STATES.map((state) => (
                    <Option key={state.value} value={state.value}>
                      {state.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Freight Type" name="freight">
                <Select>
                  <Option value="Both">Both</Option>
                  <Option value="3PL">3PL</Option>
                  <Option value="Alliance">Alliance</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Max Weight (lbs)" name="maxWeight">
                <Input placeholder="e.g., 45000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Min Cargo Insurance" name="minCargo">
                <Input placeholder="e.g., 100000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Max Cargo Insurance" name="maxCargo">
                <Input placeholder="e.g., 1000000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Load Types" name="loadTypes">
            <Checkbox.Group>
              <Row gutter={[8, 8]}>
                {SYLECTUS_LOAD_TYPES.map((loadType) => (
                  <Col span={6} key={loadType.value}>
                    <Checkbox value={loadType.value}>{loadType.label}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Divider />

          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SearchOutlined />}
                  size="large"
                >
                  Search Loads
                </Button>
                <Button onClick={handleClearForm}>Clear Form</Button>
              </Space>
            </Col>
            <Col>
              {searchResults && (
                <Space
                  direction="vertical"
                  size="small"
                  style={{ textAlign: 'right' }}
                >
                  <Text type="secondary">
                    Found {searchResults.totalRecords} loads
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Last refresh: {searchResults.lastRefresh}
                  </Text>
                </Space>
              )}
            </Col>
          </Row>
        </Form>
      </Card>

      {loads.length > 0 && (
        <Card style={{ marginTop: '16px' }}>
          <Title level={4}>Search Results ({loads.length} loads)</Title>
          <Table
            columns={columns}
            dataSource={loads}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              total: loads.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} loads`,
            }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: '8px 0' }}>
                  {record.notes && (
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong>Notes: </Text>
                      <Text>{record.notes}</Text>
                    </div>
                  )}
                  {record.otherInfo && (
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong>Other Info: </Text>
                      <Text>{record.otherInfo}</Text>
                    </div>
                  )}
                  <div>
                    <Text strong>Full Pickup Address: </Text>
                    <Text>{record.pickupLocation?.fullAddress || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Full Delivery Address: </Text>
                    <Text>{record.deliveryLocation?.fullAddress || 'N/A'}</Text>
                  </div>
                </div>
              ),
              expandIcon: ({ expanded, onExpand, record }) => (
                <Tooltip title={expanded ? 'Hide details' : 'Show details'}>
                  <InfoCircleOutlined
                    onClick={(e) => onExpand(record, e)}
                    style={{
                      cursor: 'pointer',
                      color: expanded ? '#1976d2' : '#999',
                    }}
                  />
                </Tooltip>
              ),
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default SylectusSearchPage;
