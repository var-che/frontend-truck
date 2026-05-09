import React, { useState, useCallback } from "react";
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

const { Title, Text } = Typography;

const NETLIFY_BASE =
  process.env.REACT_APP_NETLIFY_URL || "https://truckaroosie-dev.netlify.app";

const EXTENSION_ID =
  process.env.REACT_APP_EXTENSION_ID || "obifncifgmneplklobmfbmhjahjfbkpa";

// ---------------------------------------------------------------------------
// Gmail token management (talks to extension)
// ---------------------------------------------------------------------------
function useGmailToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailAddress, setEmailAddress] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await new Promise((resolve, reject) => {
        if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
          reject(new Error("Chrome extension not available"));
          return;
        }
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: "GMAIL_GET_TOKEN" },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          }
        );
      });
      if (res?.success && res?.token) {
        setToken(res.token);
        // Fetch user email for display
        fetch(`${NETLIFY_BASE}/.netlify/functions/get-user-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gmailToken: res.token }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.email) setEmailAddress(data.email);
          })
          .catch(() => {});
      } else {
        antdMessage.error(res?.error || "Failed to get Gmail token.");
      }
    } catch (err: any) {
      antdMessage.error(err?.message || "Extension not available.");
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!token) return;
    try {
      await new Promise<void>((resolve, reject) => {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: "GMAIL_REMOVE_TOKEN", token },
          (response) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve();
          }
        );
      });
    } catch {
      // silently ignore revoke errors
    }
    setToken(null);
    setEmailAddress(null);
    antdMessage.info("Gmail disconnected.");
  }, [token]);

  return { token, loading, emailAddress, connect, disconnect };
}

// ---------------------------------------------------------------------------
// EmailPage
// ---------------------------------------------------------------------------
const EmailPage: React.FC = () => {
  const { token, loading: tokenLoading, emailAddress, connect, disconnect } = useGmailToken();

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
              onClick={disconnect}
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
              loading={tokenLoading}
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
