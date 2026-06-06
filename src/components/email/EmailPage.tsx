import React from "react";
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Typography,
  message as antdMessage,
  Alert,
} from "antd";
import {
  MailOutlined,
  CheckCircleOutlined,
  DisconnectOutlined,
} from "@ant-design/icons";
import EmailComposeForm from "./EmailComposeForm";
import EmailTemplateEditor from "./EmailTemplateEditor";
import { useAuth } from "../../context/AuthContext";

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// EmailPage
// ---------------------------------------------------------------------------
const EmailPage: React.FC = () => {
  const { gmailToken: token, userEmail: emailAddress, loading: tokenLoading, isAuthenticated, connect, disconnect } = useAuth();

  const handleDisconnect = async () => {
    await disconnect();
    antdMessage.info("Gmail disconnected.");
  };

  const dispatcherName =
    localStorage.getItem("dispatcher_settings_v1") || "";

  return (
    <div style={{ padding: "24px 32px", maxWidth: 900 }}>
      <Title level={3}>
        <MailOutlined style={{ marginRight: 8 }} />
        Email
      </Title>

      {/* Gmail connection card */}
      <Card
        size="small"
        style={{ marginBottom: 20 }}
        title="Gmail Account"
      >
        {token ? (
          <Space align="center">
            <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
            <Text>
              Connected{emailAddress ? ` as ${emailAddress}` : ""}
            </Text>
            <Button
              size="small"
              danger
              icon={<DisconnectOutlined />}
          onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </Space>
        ) : (
          <Space align="center">
            <Text type="secondary">Not connected</Text>
            <Button
              type="primary"
              size="small"
              loading={tokenLoading && !isAuthenticated}
              onClick={connect}
            >
              Connect Gmail
            </Button>
          </Space>
        )}
      </Card>

      {/* Main content */}
      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card title="Compose" size="small">
            {!token ? (
              <Alert
                type="info"
                showIcon
                message="Connect your Gmail account above to send emails."
              />
            ) : (
              <EmailComposeForm
                gmailToken={token}
                dispatcherName={dispatcherName}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card size="small">
            <EmailTemplateEditor />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmailPage;
