import React, { useState } from 'react';
import {
  Card,
  Button,
  message,
  Space,
  Typography,
  Divider,
  Input,
  Form,
} from 'antd';
import {
  PlusOutlined,
  EnvironmentOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useChromeMessaging } from '../hooks/useChromeMessaging';

const { Title, Text } = Typography;

interface DatTestPageProps {}

const DatTestPage: React.FC<DatTestPageProps> = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { sendMessageToExtension } = useChromeMessaging();

  // Function to send message to DAT test content script
  const sendMessageToDatTest = async (messageType: string, data?: any) => {
    setLoading(true);
    try {
      console.log(`🔄 Sending ${messageType} to DAT Test content script`, data);
      console.log(`📤 Message payload:`, {
        type: 'DAT_TEST_ACTION',
        action: messageType,
        data: data || {},
        timestamp: new Date().toISOString(),
      });

      // Use the proper extension communication
      const response = await sendMessageToExtension({
        type: 'DAT_TEST_ACTION',
        action: messageType,
        data: data || {},
      });

      console.log(`✅ ${messageType} response:`, response);
      console.log(`📊 Response details:`, {
        success: response?.success,
        data: response?.data,
        error: response?.error,
        action: response?.action,
        timestamp: new Date().toISOString(),
      });

      if (response && response.success) {
        message.success(
          `${messageType} executed successfully: ${
            response.data?.message || 'Done'
          }`,
        );
      } else {
        console.error(`❌ ${messageType} failed with response:`, response);
        message.error(
          `${messageType} failed: ${response?.error || 'Unknown error'}`,
        );
      }

      return response;
    } catch (error) {
      console.error(`❌ Error sending ${messageType}:`, error);
      console.error(`❌ Error details:`, {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
      });
      message.error(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create new lane (add button functionality)
  const handleCreateNewLane = async () => {
    console.log('🎯 handleCreateNewLane called - Creating new lane...');
    console.log('🎯 About to call sendMessageToDatTest with CREATE_NEW_LANE');

    try {
      const result = await sendMessageToDatTest('CREATE_NEW_LANE');
      console.log('🎯 handleCreateNewLane completed with result:', result);
      return result;
    } catch (error) {
      console.error('🎯 handleCreateNewLane failed with error:', error);
      throw error;
    }
  };

  // Populate origin field
  const handlePopulateOrigin = async () => {
    const values = form.getFieldsValue();
    const originCity = values.originCity || 'Chicago, IL';

    console.log('🎯 Populating origin field with:', originCity);
    await sendMessageToDatTest('POPULATE_ORIGIN', { origin: originCity });
  };

  // Populate destination field
  const handlePopulateDestination = async () => {
    const values = form.getFieldsValue();
    const destinationCity = values.destinationCity || 'Detroit, MI';

    console.log('🎯 Populating destination field with:', destinationCity);
    await sendMessageToDatTest('POPULATE_DESTINATION', {
      destination: destinationCity,
    });
  };

  // Simple city search
  const handleSimpleCitySearch = async () => {
    console.log(
      '🎯 handleSimpleCitySearch called - Performing simple city search...',
    );
    console.log(
      '🎯 About to call sendMessageToDatTest with SIMPLE_CITY_SEARCH',
    );

    try {
      const result = await sendMessageToDatTest('SIMPLE_CITY_SEARCH', {
        lookupTerm: 'chica',
      });
      console.log('🎯 handleSimpleCitySearch completed with result:', result);
      return result;
    } catch (error) {
      console.error('🎯 handleSimpleCitySearch failed with error:', error);
      throw error;
    }
  };

  // Execute full search
  const handleExecuteSearch = async () => {
    const values = form.getFieldsValue();
    const searchData = {
      origin: values.originCity || 'Chicago, IL',
      destination: values.destinationCity || 'Detroit, MI',
      equipment: values.equipment || 'SB', // Straight Box Truck
    };

    console.log('🎯 Executing full search with:', searchData);
    await sendMessageToDatTest('EXECUTE_SEARCH', searchData);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>DAT Test Page</Title>
      <Text type="secondary">
        Test DAT extension functionality by sending commands to the DAT content
        script. Make sure you have DAT open in another tab and connected.
      </Text>

      <Divider />

      {/* Form for search parameters */}
      <Card
        title="Search Parameters"
        style={{ marginBottom: '24px' }}
        size="small"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            originCity: 'Chicago, IL',
            destinationCity: 'Detroit, MI',
            equipment: 'SB',
          }}
        >
          <Form.Item
            label="Origin City"
            name="originCity"
            extra="City and state for pickup location"
          >
            <Input placeholder="Chicago, IL" />
          </Form.Item>

          <Form.Item
            label="Destination City"
            name="destinationCity"
            extra="City and state for delivery location"
          >
            <Input placeholder="Detroit, MI" />
          </Form.Item>

          <Form.Item
            label="Equipment Type"
            name="equipment"
            extra="Equipment code (e.g., SB for Straight Box Truck)"
          >
            <Input placeholder="SB" maxLength={2} />
          </Form.Item>
        </Form>
      </Card>

      {/* Test Actions */}
      <Card title="DAT Actions" size="small">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Lane Creation */}
          <div>
            <Title level={4}>Lane Management</Title>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={loading}
                onClick={() => {
                  console.log('🎯 Add New Lane button clicked!');
                  console.log('🎯 Loading state:', loading);
                  handleCreateNewLane();
                }}
              >
                Create New Lane
              </Button>
              <Text type="secondary">
                Clicks the "Add" button in DAT to start a new search lane
              </Text>
            </Space>
          </div>

          <Divider />

          {/* Simple City Search */}
          <div>
            <Title level={4}>City Search</Title>
            <Space>
              <Button
                type="default"
                icon={<SearchOutlined />}
                loading={loading}
                onClick={() => {
                  console.log('🎯 Simple city search button clicked!');
                  handleSimpleCitySearch();
                }}
              >
                Simple City Search
              </Button>
              <Text type="secondary">
                Test DAT GraphQL API city search functionality
              </Text>
            </Space>
          </div>

          <Divider />

          {/* Field Population */}
          <div>
            <Title level={4}>Field Population</Title>
            <Space>
              <Button
                icon={<EnvironmentOutlined />}
                loading={loading}
                onClick={handlePopulateOrigin}
              >
                Populate Origin Field
              </Button>
              <Button
                icon={<EnvironmentOutlined />}
                loading={loading}
                onClick={handlePopulateDestination}
              >
                Populate Destination Field
              </Button>
              <Text type="secondary">
                Fill in the origin and destination fields with test data
              </Text>
            </Space>
          </div>

          <Divider />

          {/* Full Search */}
          <div>
            <Title level={4}>Search Execution</Title>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                loading={loading}
                onClick={handleExecuteSearch}
                size="large"
              >
                Execute Full Search
              </Button>
              <Text type="secondary">
                Create new lane, populate fields, and execute search
              </Text>
            </Space>
          </div>
        </Space>
      </Card>

      {/* Debug Info */}
      <Card
        title="Debug Information"
        size="small"
        style={{ marginTop: '24px' }}
        type="inner"
      >
        <Text code>
          This page sends messages to the DAT Test content script through the
          background script. Check the browser console for detailed logs of
          message flow.
        </Text>
        <br />
        <Text type="secondary">
          Make sure DAT is open at: https://power.dat.com/search-loads-ow and
          click the orange "Connect DAT Test" button on that page.
        </Text>
      </Card>
    </div>
  );
};

export default DatTestPage;
