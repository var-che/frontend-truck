import React, { useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Progress,
  Row,
  Space,
  Tag,
  Typography,
  message as antdMessage,
} from "antd";
import { RocketOutlined, SaveOutlined, UserOutlined } from "@ant-design/icons";
import EmailTemplateEditor from "./email/EmailTemplateEditor";
import EmailSnippetEditor from "./email/EmailSnippetEditor";
import { useAuth } from "../context/AuthContext";

const { Title, Text } = Typography;

const SETTINGS_KEY = "dispatcher_settings_v1";

const SettingsPage: React.FC = () => {
  const [dispatcherName, setDispatcherName] = useState<string>(
    () => localStorage.getItem(SETTINGS_KEY) || ""
  );
  const {
    isAuthenticated,
    userEmail,
    subscriptionStatus,
    trialDaysLeft,
    emailsRemaining,
    canSendEmail,
  } = useAuth() as any;

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, dispatcherName.trim());
    antdMessage.success("Settings saved.");
  };

  const planTagColor =
    subscriptionStatus === "active"
      ? "green"
      : canSendEmail
      ? "blue"
      : "red";
  const planTagLabel =
    subscriptionStatus === "active"
      ? "Pro"
      : canSendEmail
      ? "Trial"
      : "Trial Expired";

  return (
    <div style={{ padding: "24px 32px", maxWidth: 600 }}>
      <Title level={3}>Settings</Title>

      {/* Plan & Usage */}
      <Card
        title={
          <span>
            <RocketOutlined style={{ marginRight: 6 }} />
            Plan &amp; Usage
          </span>
        }
        size="small"
        style={{ marginBottom: 20 }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Space align="center">
            <Text strong>Plan:</Text>
            <Tag color={planTagColor}>{planTagLabel}</Tag>
            {isAuthenticated && userEmail && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {userEmail}
              </Text>
            )}
          </Space>

          {subscriptionStatus !== "active" && (
            <>
              <div>
                <Text style={{ fontSize: 12 }}>
                  Trial days remaining: <strong>{trialDaysLeft}</strong> / 14
                </Text>
                <Progress
                  percent={Math.round((trialDaysLeft / 14) * 100)}
                  size="small"
                  status={trialDaysLeft <= 3 ? "exception" : "normal"}
                  showInfo={false}
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <Text style={{ fontSize: 12 }}>
                  Free emails remaining: <strong>{emailsRemaining}</strong> / 50
                </Text>
                <Progress
                  percent={Math.round((emailsRemaining / 50) * 100)}
                  size="small"
                  status={emailsRemaining <= 5 ? "exception" : "normal"}
                  showInfo={false}
                  style={{ marginTop: 4 }}
                />
              </div>
            </>
          )}

          <Button
            type="primary"
            icon={<RocketOutlined />}
            disabled
            style={{ alignSelf: "flex-start" }}
          >
            Upgrade to Pro (coming soon)
          </Button>
        </Space>
      </Card>

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
            Extension ID: {process.env.REACT_APP_EXTENSION_ID || "dglpcheabojkebkoninofbpgnilkaeek"}
          </Text>
        </Space>
      </Card>

      <Card title="Email Templates" size="small" style={{ marginTop: 20 }}>
        <EmailTemplateEditor />
      </Card>

      <Card title="Email Snippets" size="small" style={{ marginTop: 20 }}>
        <EmailSnippetEditor />
      </Card>
    </div>
  );
};

export default SettingsPage;
