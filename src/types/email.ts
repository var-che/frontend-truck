import { SylectusLoad } from "./sylectus";
import { Driver } from "./driver";

export type EmailVariableCategory = "load" | "driver" | "computed" | "meta";

export interface EmailVariable {
  key: string; // e.g. "origin"
  label: string; // e.g. "Origin City/State"
  description: string; // shown in tooltip / picker
  category: EmailVariableCategory;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface EmailSnippet {
  id: string;
  /** Shortcut without the leading slash, e.g. "mc123" */
  shortcut: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailContext {
  load?: SylectusLoad;
  driver?: Driver;
  /** Deadhead miles origin → pickup (pre-computed from DH-O column) */
  dhMiles?: number;
  /** Human-readable ETA string e.g. "~3h 20m" */
  etaToPickup?: string;
  /** Dispatcher's name (from settings) */
  dispatcherName?: string;
  today: string; // e.g. "Monday, June 16, 2025"
}

export interface UserEmailStatus {
  email: string;
  name: string;
}

// ── Email Thread Tracking ─────────────────────────────────────────────────────

export type EmailMessageDirection = "sent" | "received";

export interface EmailMessage {
  messageId: string;
  gmailThreadId: string;
  direction: EmailMessageDirection;
  subject: string;
  snippet: string;
  /** Plain-text body (decoded from Gmail payload) */
  body: string;
  from: string;
  to: string;
  sentAt: string; // ISO string
}

export interface EmailThread {
  loadId: string;
  /** Snapshot of load details at time of first email */
  loadSnapshot: {
    origin: string;
    destination: string;
    company: string;
    rate: string;
  };
  gmailThreadId: string;
  messages: EmailMessage[];
  recipientEmail: string;
  lastFetchedAt: string; // ISO string
}
