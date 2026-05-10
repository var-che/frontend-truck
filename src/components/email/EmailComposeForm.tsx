import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Form,
  Input,
  Select,
  Tag,
  Typography,
  Divider,
  Tabs,
  message as antdMessage,
} from "antd";
import { SendOutlined, EyeOutlined, EditOutlined } from "@ant-design/icons";
import { SylectusLoad } from "../../types/sylectus";
import { Driver } from "../../types/driver";
import { EmailTemplate } from "../../types/email";
import {
  EMAIL_VARIABLES,
  buildContext,
  resolveTemplate,
} from "../../services/EmailVariableResolver";
import { useEmailTemplates } from "../../hooks/useEmailTemplates";
import SlashCommandTextarea from "./SlashCommandTextarea";

const { Text, Title } = Typography;
const { Option } = Select;

interface EmailComposeFormProps {
  /** Pre-filled recipient email address */
  initialTo?: string;
  /** Load context for variable resolution */
  load?: SylectusLoad;
  /** Optional driver context */
  driver?: Driver;
  /** Pre-computed deadhead miles */
  dhMiles?: number;
  /** Called when email is sent or user cancels */
  onDone?: () => void;
  /** Called after a successful send with thread metadata */
  onSent?: (params: {
    messageId: string;
    threadId: string;
    subject: string;
    body: string;
    to: string;
    from: string;
    sentAt: string;
  }) => void;
  /** Gmail OAuth token — obtain from extension before opening */
  gmailToken: string | null;
  /** Dispatcher name from settings */
  dispatcherName?: string;
}

const NETLIFY_BASE =
  process.env.REACT_APP_NETLIFY_URL || "https://truckaroosie-dev.netlify.app";

const CATEGORY_COLORS: Record<string, string> = {
  load: "blue",
  driver: "green",
  computed: "purple",
  meta: "default",
};

const EmailComposeForm: React.FC<EmailComposeFormProps> = ({
  initialTo = "",
  load,
  driver,
  dhMiles,
  onDone,
  onSent,
  gmailToken,
  dispatcherName,
}) => {
  const { templates } = useEmailTemplates();
  const [form] = Form.useForm();

  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");

  const ctx = buildContext({ load, driver, dhMiles, dispatcherName });

  const resolvedSubject = resolveTemplate(subject, ctx);
  const resolvedBody = resolveTemplate(body, ctx);

  // Apply a template
  const applyTemplate = useCallback(
    (template: EmailTemplate) => {
      setSubject(template.subject);
      setBody(template.body);
    },
    []
  );

  // Send the email via Netlify function
  const handleSend = useCallback(async () => {
    if (!gmailToken) {
      antdMessage.error("Not connected to Gmail. Please connect in Settings.");
      return;
    }
    if (!to.trim()) {
      antdMessage.error("Recipient (To) is required.");
      return;
    }
    if (!resolvedSubject.trim()) {
      antdMessage.error("Subject is required.");
      return;
    }
    if (!resolvedBody.trim()) {
      antdMessage.error("Body is required.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${NETLIFY_BASE}/.netlify/functions/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmailToken,
          to: to.trim(),
          cc: cc.trim() || undefined,
          subject: resolvedSubject,
          body: resolvedBody,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        antdMessage.error(data.error || "Failed to send email.");
        return;
      }

      antdMessage.success("Email sent successfully!");
      if (data.messageId && onSent) {
        onSent({
          messageId: data.messageId,
          threadId: data.threadId,
          subject: resolvedSubject,
          body: resolvedBody,
          to: to.trim(),
          from: data.from || "",
          sentAt: data.sentAt || new Date().toISOString(),
        });
      }
      onDone?.();
    } catch (err) {
      console.error("Send error:", err);
      antdMessage.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }, [gmailToken, to, cc, resolvedSubject, resolvedBody, onDone]);

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Template picker */}
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>
          Template:
        </Text>
        <Select
          placeholder="Pick a template…"
          size="small"
          style={{ width: 260 }}
          onSelect={(id: string) => {
            const tpl = templates.find((t) => t.id === id);
            if (tpl) applyTemplate(tpl);
          }}
          allowClear
        >
          {templates.map((t) => (
            <Option key={t.id} value={t.id}>
              {t.name}
            </Option>
          ))}
        </Select>
      </div>

      {/* To / CC */}
      <Form layout="vertical" form={form}>
        <Form.Item label="To" style={{ marginBottom: 8 }}>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="broker@example.com"
          />
        </Form.Item>
        <Form.Item label="CC (optional)" style={{ marginBottom: 8 }}>
          <Input
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder=""
          />
        </Form.Item>
        <Form.Item label="Subject" style={{ marginBottom: 8 }}>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject…"
          />
        </Form.Item>
      </Form>

      {/* Compose / Preview tabs */}
      <Tabs
        size="small"
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as "compose" | "preview")}
        items={[
          {
            key: "compose",
            label: (
              <span>
                <EditOutlined /> Compose
              </span>
            ),
            children: (
              <SlashCommandTextarea
                value={body}
                onChange={setBody}
                rows={10}
              />
            ),
          },
          {
            key: "preview",
            label: (
              <span>
                <EyeOutlined /> Preview
              </span>
            ),
            children: (
              <div
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: 6,
                  padding: "10px 14px",
                  minHeight: 220,
                  background: "#fafafa",
                  whiteSpace: "pre-wrap",
                  fontSize: 13,
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 11, color: "#8c8c8c" }}>
                    SUBJECT
                  </Text>
                  <br />
                  <Text>{resolvedSubject || <em style={{ color: "#bfbfbf" }}>—</em>}</Text>
                </div>
                <Divider style={{ margin: "8px 0" }} />
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {resolvedBody || (
                    <em style={{ color: "#bfbfbf" }}>No body yet…</em>
                  )}
                </Text>
              </div>
            ),
          },
        ]}
      />

      {/* Variable reference */}
      <Divider style={{ margin: "10px 0" }} />
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 11, marginBottom: 4, display: "block" }}>
          Available variables (type <code>/</code> in the body):
        </Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {EMAIL_VARIABLES.map((v) => (
            <Tag
              key={v.key}
              color={CATEGORY_COLORS[v.category]}
              style={{ fontSize: 11, cursor: "default" }}
              title={v.description}
            >
              {`{{${v.key}}}`}
            </Tag>
          ))}
        </div>
      </div>

      {/* Send button */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button onClick={onDone}>Cancel</Button>
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={sending}
          disabled={!gmailToken}
          onClick={handleSend}
        >
          Send Email
        </Button>
      </div>
    </div>
  );
};

export default EmailComposeForm;
