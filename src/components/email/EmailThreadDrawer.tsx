import React, { useState, useCallback } from "react";
import {
  Drawer,
  Button,
  Input,
  Typography,
  Tag,
  Spin,
  Tooltip,
  message as antdMessage,
  Divider,
  Space,
} from "antd";
import {
  ReloadOutlined,
  SendOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { EmailThread, EmailMessage } from "../../types/email";

const { Text, Title } = Typography;
const { TextArea } = Input;

const NETLIFY_BASE =
  process.env.REACT_APP_NETLIFY_URL || "https://truckaroosie-dev.netlify.app";

interface EmailThreadDrawerProps {
  thread: EmailThread;
  gmailToken: string;
  userEmail: string;
  open: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onReplySent: (
    messageId: string,
    gmailThreadId: string,
    body: string,
    to: string,
    from: string,
    sentAt: string
  ) => void;
}

// ── Message Bubble ────────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ msg: EmailMessage }> = ({ msg }) => {
  const [expanded, setExpanded] = useState(false);
  const isSent = msg.direction === "sent";

  const bubbleStyle: React.CSSProperties = {
    maxWidth: "80%",
    padding: "10px 14px",
    borderRadius: isSent ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
    background: isSent ? "#1677ff" : "#f0f0f0",
    color: isSent ? "#fff" : "#141414",
    fontSize: 13,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    cursor: msg.body.length > 200 ? "pointer" : "default",
  };

  const displayText =
    !expanded && msg.body.length > 200
      ? msg.body.slice(0, 200) + "…"
      : msg.body || msg.snippet;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isSent ? "flex-end" : "flex-start",
        marginBottom: 16,
      }}
    >
      {/* Sender / time row */}
      <div style={{ marginBottom: 4, display: "flex", gap: 6, alignItems: "center" }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {isSent ? "You" : msg.from.replace(/<.*>/, "").trim()}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          ·{" "}
          {new Date(msg.sentAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>
        {msg.direction === "received" && (
          <Tag color="green" style={{ fontSize: 10, lineHeight: "16px" }}>
            Reply
          </Tag>
        )}
      </div>

      {/* Bubble */}
      <div
        style={bubbleStyle}
        onClick={() => msg.body.length > 200 && setExpanded((e) => !e)}
      >
        {displayText}
        {msg.body.length > 200 && (
          <div style={{ marginTop: 4, opacity: 0.7, fontSize: 11 }}>
            {expanded ? "Click to collapse" : "Click to expand"}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Drawer ───────────────────────────────────────────────────────────────

const EmailThreadDrawer: React.FC<EmailThreadDrawerProps> = ({
  thread,
  gmailToken,
  userEmail,
  open,
  onClose,
  onRefresh,
  onReplySent,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const lastMessage = thread.messages[thread.messages.length - 1];
  const receivedCount = thread.messages.filter((m) => m.direction === "received").length;

  // ── Refresh ─────────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      antdMessage.success("Thread refreshed.");
    } catch (err: any) {
      antdMessage.error(err?.message || "Failed to refresh thread.");
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  // ── Send Reply ───────────────────────────────────────────────────────────────
  const handleSendReply = useCallback(async () => {
    if (!replyBody.trim()) {
      antdMessage.warning("Reply body cannot be empty.");
      return;
    }

    // Build References header from all message IDs in thread
    const references = thread.messages
      .map((m) => `<${m.messageId}>`)
      .join(" ");

    setSending(true);
    try {
      const res = await fetch(`${NETLIFY_BASE}/.netlify/functions/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmailToken,
          to: thread.recipientEmail,
          subject: `Re: ${thread.messages[0]?.subject || ""}`,
          body: replyBody,
          threadId: thread.gmailThreadId,
          inReplyTo: lastMessage?.messageId,
          references,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        antdMessage.error(data.error || "Failed to send reply.");
        return;
      }

      antdMessage.success("Reply sent!");
      onReplySent(
        data.messageId,
        data.threadId,
        replyBody,
        thread.recipientEmail,
        userEmail,
        data.sentAt
      );
      setReplyBody("");
    } catch (err) {
      console.error("Reply error:", err);
      antdMessage.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }, [replyBody, thread, gmailToken, lastMessage, userEmail, onReplySent]);

  // ── Drawer Header ─────────────────────────────────────────────────────────
  const drawerTitle = (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Title level={5} style={{ margin: 0 }}>
          {thread.loadSnapshot.company}
        </Title>
        <Tag color={receivedCount > 0 ? "success" : "blue"}>
          {thread.messages.length} {thread.messages.length === 1 ? "message" : "messages"}
        </Tag>
        {receivedCount > 0 && (
          <Tag color="green">{receivedCount} {receivedCount === 1 ? "reply" : "replies"} received</Tag>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {thread.loadSnapshot.origin}
        </Text>
        <ArrowRightOutlined style={{ fontSize: 10, color: "#8c8c8c" }} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {thread.loadSnapshot.destination}
        </Text>
        {thread.loadSnapshot.rate && thread.loadSnapshot.rate !== "N/A" && (
          <>
            <Text type="secondary" style={{ fontSize: 12 }}>·</Text>
            <Text style={{ fontSize: 12, color: "#52c41a" }}>{thread.loadSnapshot.rate}</Text>
          </>
        )}
      </div>
      <Text type="secondary" style={{ fontSize: 11 }}>
        To: {thread.recipientEmail}
      </Text>
    </div>
  );

  return (
    <Drawer
      title={drawerTitle}
      open={open}
      onClose={onClose}
      width={480}
      placement="right"
      extra={
        <Tooltip title="Fetch latest replies from Gmail">
          <Button
            icon={<ReloadOutlined spin={refreshing} />}
            size="small"
            onClick={handleRefresh}
            loading={refreshing}
          >
            Refresh
          </Button>
        </Tooltip>
      }
      styles={{ body: { display: "flex", flexDirection: "column", padding: "16px 20px", height: "100%" } }}
    >
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
        {thread.messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : (
          thread.messages.map((msg) => (
            <MessageBubble key={msg.messageId} msg={msg} />
          ))
        )}
        <Text type="secondary" style={{ fontSize: 10, display: "block", textAlign: "center", marginTop: 8 }}>
          Last fetched: {new Date(thread.lastFetchedAt).toLocaleString()}
        </Text>
      </div>

      {/* Reply Box */}
      <Divider style={{ margin: "12px 0" }} />
      <div>
        <Text type="secondary" style={{ fontSize: 12, marginBottom: 6, display: "block" }}>
          Reply to {thread.recipientEmail}
        </Text>
        <TextArea
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          rows={4}
          placeholder="Type your reply…"
          style={{ marginBottom: 8, resize: "vertical" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={sending}
            onClick={handleSendReply}
            disabled={!replyBody.trim()}
          >
            Send Reply
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default EmailThreadDrawer;
