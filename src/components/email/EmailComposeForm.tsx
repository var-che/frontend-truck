import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Typography,
  Divider,
  message as antdMessage,
} from "antd";
import { ClockCircleOutlined, SendOutlined, ReloadOutlined } from "@ant-design/icons";
import { SylectusLoad } from "../../types/sylectus";
import { Driver } from "../../types/driver";
import { EmailTemplate } from "../../types/email";
import {
  EMAIL_VARIABLES,
  buildContext,
  resolveTemplate,
} from "../../services/EmailVariableResolver";
import { useEmailTemplates } from "../../hooks/useEmailTemplates";
import { useEmailSnippets } from "../../hooks/useEmailSnippets";
import SlashCommandTextarea from "./SlashCommandTextarea";
import { useAuth } from "../../context/AuthContext";

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
  const { snippets } = useEmailSnippets();
  const { canSendEmail, emailsRemaining, subscriptionStatus, refreshStatus, connect } = useAuth();
  const [form] = Form.useForm();

  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);

  // Draft persistence keyed by load id
  const draftKey = `email_draft_${load?.id ?? 'default'}`;
  const draftLoadedRef = useRef(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);

  // Restore draft on mount
  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const draft = JSON.parse(saved);
      if (draft.to) setTo(draft.to);
      if (draft.cc) setCc(draft.cc);
      if (draft.subject) setSubject(draft.subject);
      if (draft.body) setBody(draft.body);
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save draft (debounced 1 s)
  useEffect(() => {
    if (!to && !subject && !body) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ to, cc, subject, body }));
      setDraftSavedAt(new Date());
    }, 1000);
    return () => clearTimeout(timeout);
  }, [to, cc, subject, body, draftKey]);

  // Clear tokenExpired flag whenever a fresh token arrives
  useEffect(() => {
    if (gmailToken) setTokenExpired(false);
  }, [gmailToken]);

  // Scheduled follow-up state
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpBody, setFollowUpBody] = useState("");
  const [followUpDelay, setFollowUpDelay] = useState(5);
  const [pendingFollowUp, setPendingFollowUp] = useState(false);
  const followUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track mount state so we can guard against state updates after unmount
  // NOTE: we intentionally do NOT cancel the follow-up timer on unmount — the
  // Drawer's destroyOnClose would otherwise kill the timer before it fires.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const ctx = useMemo(() => buildContext({ load, driver, dhMiles, dispatcherName }), [load, driver, dhMiles, dispatcherName]);

  const resolvedSubject = resolveTemplate(subject, ctx);
  const resolvedBody    = resolveTemplate(body, ctx);

  // Build resolved values map for the slash-command menu (shows live values, inserts them on select)
  const resolvedValues = useMemo((): Record<string, string> => {
    const { load: l, driver: d } = ctx;
    return {
      origin:           l?.origin ?? "",
      destination:      l?.destination ?? "",
      pickup_date:      l?.pickUp ?? "",
      equipment_type:   l?.eq ?? "",
      load_weight:      l?.weight != null ? `${l.weight.toLocaleString()} lbs` : "",
      load_length:      l?.length ?? "",
      rate:             l?.rate ?? "",
      trip_miles:       l?.trip != null ? `${l.trip} mi` : "",
      company:          l?.company ?? "",
      driver_name:      d?.name ?? "",
      driver_truck:     d?.truckNumber ?? "",
      driver_location:  d ? `${d.currentLocation.city}, ${d.currentLocation.state}` : "",
      driver_phone:     d?.contactInfo.phone ?? "",
      driver_equipment: d ? `${d.truckEquipment.type} – ${d.truckEquipment.length}` : "",
      dh_miles:         ctx.dhMiles != null ? `${Math.round(ctx.dhMiles)} mi` : "",
      eta_to_pickup:    ctx.etaToPickup ?? "",
      dispatcher_name:  ctx.dispatcherName ?? "",
      today:            ctx.today,
    };
  }, [ctx]);

  // Apply a template — resolve variables immediately so what you see is what gets sent
  const applyTemplate = useCallback(
    (template: EmailTemplate) => {
      setSubject(resolveTemplate(template.subject, ctx));
      setBody(resolveTemplate(template.body, ctx));
    },
    [ctx]
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
        if (res.status === 401) {
          setTokenExpired(true);
        } else {
          antdMessage.error(data.error || "Failed to send email.");
        }
        return;
      }

      antdMessage.success("Email sent successfully!");
      localStorage.removeItem(draftKey);
      setDraftSavedAt(null);
      refreshStatus(); // update trial counters after each initial send
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

      // Schedule follow-up if requested
      if (scheduleFollowUp && followUpBody.trim()) {
        const sentThreadId  = data.threadId;
        const sentMessageId = data.messageId;
        setPendingFollowUp(true);
        antdMessage.info(`Follow-up scheduled in ${followUpDelay} min.`);
        followUpTimerRef.current = setTimeout(async () => {
          try {
            await fetch(`${NETLIFY_BASE}/.netlify/functions/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                gmailToken,
                to: to.trim(),
                subject: resolvedSubject,
                body: followUpBody,
                threadId: sentThreadId,
                inReplyTo: sentMessageId,
                references: sentMessageId ? `<${sentMessageId}>` : undefined,
              }),
            });
            antdMessage.success("Follow-up email sent!");
          } catch {
            antdMessage.error("Follow-up email failed to send.");
          } finally {
            if (mountedRef.current) setPendingFollowUp(false);
          }
        }, followUpDelay * 60 * 1000);
      }

      onDone?.();
    } catch (err) {
      console.error("Send error:", err);
      antdMessage.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }, [gmailToken, canSendEmail, refreshStatus, draftKey, to, cc, resolvedSubject, resolvedBody, scheduleFollowUp, followUpBody, followUpDelay, onDone]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Token-expired inline reconnect */}
      {tokenExpired && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={
            <Space>
              <span>Gmail session expired.</span>
              <Button
                size="small"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => connect()}
              >
                Reconnect Gmail
              </Button>
            </Space>
          }
        />
      )}

      {/* Draft saved indicator */}
      {draftSavedAt && (
        <div style={{ marginBottom: 8, fontSize: 11, color: '#8c8c8c' }}>
          Draft saved at {draftSavedAt.toLocaleTimeString()}
        </div>
      )}

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

      {/* Body — type "/" to insert a variable (value is inserted directly, no separate preview) */}
      <div style={{ marginBottom: 4 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Body</Text>
        <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
          (type <code>/</code> to insert a real value — what you see is what gets sent)
        </Text>
      </div>
      <SlashCommandTextarea
        value={body}
        onChange={setBody}
        rows={10}
        resolvedValues={resolvedValues}
        snippets={snippets}
        onCtrlEnter={handleSend}
      />

      {/* Schedule follow-up */}
      <Divider style={{ margin: "12px 0 8px" }} />
      <div style={{ marginBottom: 12 }}>
        <Checkbox
          checked={scheduleFollowUp}
          onChange={(e) => setScheduleFollowUp(e.target.checked)}
        >
          <span style={{ fontSize: 13 }}>Schedule follow-up email</span>
        </Checkbox>

        {scheduleFollowUp && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: "#f0f5ff", borderRadius: 6, border: "1px solid #adc6ff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <ClockCircleOutlined style={{ color: "#1677ff" }} />
              <Text style={{ fontSize: 13 }}>Send</Text>
              <InputNumber
                min={1}
                max={60}
                value={followUpDelay}
                onChange={(v) => setFollowUpDelay(v ?? 5)}
                size="small"
                style={{ width: 60 }}
              />
              <Text style={{ fontSize: 13 }}>min after initial send</Text>
            </div>
            <Input.TextArea
              value={followUpBody}
              onChange={(e) => setFollowUpBody(e.target.value)}
              rows={4}
              placeholder="Follow-up message body…"
              style={{ fontSize: 12 }}
            />
          </div>
        )}

        {pendingFollowUp && (
          <div style={{ marginTop: 8, color: "#1677ff", fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            Follow-up pending…
          </div>
        )}
      </div>

      {/* Trial quota warnings — hidden while limit is off for testing */}
      {false && !canSendEmail && (
        <Alert
          type="error"
          message="Trial limit reached. Please upgrade to send more emails."
          showIcon
          style={{ marginBottom: 12 }}
        />
      )}
      {false && canSendEmail && subscriptionStatus !== "active" && emailsRemaining <= 5 && (
        <Alert
          type="warning"
          message={`Only ${emailsRemaining} free email${emailsRemaining === 1 ? "" : "s"} remaining in your trial.`}
          showIcon
          style={{ marginBottom: 12 }}
        />
      )}

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
