import React, { useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Typography,
  message as antdMessage,
} from "antd";
import { SaveOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const SETTINGS_KEY = "dispatcher_settings_v1";

const SettingsPage: React.FC = () => {
  const [dispatcherName, setDispatcherName] = useState<string>(
    () => localStorage.getItem(SETTINGS_KEY) || ""
  );

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, dispatcherName.trim());
    antdMessage.success("Settings saved.");
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 600 }}>
      <Title level={3}>Settings</Title>

      <Card title="Dispatcher Profile" size="small" style={{ marginBottom: 20 }}>
        <Form layout="vertical" onFinish={handleSave}>
          <Form.Item
            label="Your Name"
            help="Used in email templates as {{dispatcher_name}}"
          >
            <Input
              prefix={<UserOutlined />}
              value={dispatcherName}
              onChange={(e) => setDispatcherName(e.target.value)}
              placeholder="e.g. John Smith"
              style={{ maxWidth: 320 }}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
            >
              Save
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="About" size="small">
        <Space direction="vertical" size={2}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Truckarooskie — Load board assistant
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Extension ID: {process.env.REACT_APP_EXTENSION_ID || "obifncifgmneplklobmfbmhjahjfbkpa"}
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default SettingsPage;
