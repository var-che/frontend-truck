import { useCallback, useState } from "react";
import { SylectusLoad } from "../types/sylectus";
import { EmailMessage, EmailThread } from "../types/email";

const STORAGE_KEY = "email_threads_v1";

type ThreadsMap = Record<string, EmailThread>;

function loadFromStorage(): ThreadsMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveToStorage(map: ThreadsMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Decode base64url to a UTF-8 string */
function decodeBase64Url(encoded: string): string {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
  } catch {
    return encoded;
  }
}

/** Extract plain-text body from a Gmail message payload */
function extractBody(payload: any): string {
  if (!payload) return "";

  // Prefer text/plain parts
  const findPlainText = (part: any): string | null => {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    if (part.parts) {
      for (const sub of part.parts) {
        const result = findPlainText(sub);
        if (result) return result;
      }
    }
    return null;
  };

  return findPlainText(payload) || payload.body?.data
    ? decodeBase64Url(payload.body?.data || "")
    : "";
}

/** Get a header value from a Gmail message */
function getHeader(headers: any[], name: string): string {
  return headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

/**
 * Fetch the full Gmail thread and parse into EmailMessage[].
 * This is done browser-side — Gmail API supports CORS with OAuth tokens.
 */
async function fetchGmailThread(
  gmailThreadId: string,
  gmailToken: string,
  userEmail: string
): Promise<EmailMessage[]> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${gmailThreadId}?format=full`,
    { headers: { Authorization: `Bearer ${gmailToken}` } }
  );
  if (!res.ok) throw new Error(`Gmail thread fetch failed: ${res.status}`);

  const data = await res.json();
  const messages: EmailMessage[] = (data.messages || []).map((msg: any) => {
    const headers = msg.payload?.headers || [];
    const from = getHeader(headers, "from");
    const to = getHeader(headers, "to");
    const subject = getHeader(headers, "subject");
    const date = getHeader(headers, "date");
    const body = extractBody(msg.payload);
    const direction: "sent" | "received" = from.toLowerCase().includes(userEmail.toLowerCase())
      ? "sent"
      : "received";

    return {
      messageId: msg.id,
      gmailThreadId,
      direction,
      subject,
      snippet: msg.snippet || "",
      body,
      from,
      to,
      sentAt: date ? new Date(date).toISOString() : new Date().toISOString(),
    } satisfies EmailMessage;
  });

  return messages;
}

export function useEmailThreads() {
  const [threads, setThreads] = useState<ThreadsMap>(loadFromStorage);

  const persist = useCallback((updated: ThreadsMap) => {
    setThreads(updated);
    saveToStorage(updated);
  }, []);

  /** Get the thread for a specific load, if any */
  const getThread = useCallback(
    (loadId: string): EmailThread | undefined => threads[loadId],
    [threads]
  );

  /**
   * Save the very first email sent for a load.
   * Called after EmailComposeForm reports a successful send.
   */
  const saveInitialThread = useCallback(
    (
      load: SylectusLoad,
      gmailThreadId: string,
      messageId: string,
      subject: string,
      body: string,
      to: string,
      from: string,
      sentAt: string
    ) => {
      const existing = loadFromStorage();
      const firstMessage: EmailMessage = {
        messageId,
        gmailThreadId,
        direction: "sent",
        subject,
        snippet: body.slice(0, 120),
        body,
        from,
        to,
        sentAt,
      };
      const thread: EmailThread = {
        loadId: load.id,
        loadSnapshot: {
          origin: load.origin || "",
          destination: load.destination || "",
          company: load.company || "",
          rate: load.rate || "",
        },
        gmailThreadId,
        messages: [firstMessage],
        recipientEmail: to,
        lastFetchedAt: sentAt,
      };
      persist({ ...existing, [load.id]: thread });
    },
    [persist]
  );

  /**
   * Re-fetch the Gmail thread and update stored messages.
   * Pass userEmail so we can determine direction (sent vs received).
   */
  const refreshThread = useCallback(
    async (loadId: string, gmailToken: string, userEmail: string): Promise<void> => {
      const existing = loadFromStorage();
      const thread = existing[loadId];
      if (!thread) throw new Error("Thread not found for loadId: " + loadId);

      const messages = await fetchGmailThread(thread.gmailThreadId, gmailToken, userEmail);

      const updated: EmailThread = {
        ...thread,
        messages,
        lastFetchedAt: new Date().toISOString(),
      };
      persist({ ...existing, [loadId]: updated });
    },
    [persist]
  );

  /**
   * Append a locally-constructed reply message to the thread
   * (called immediately after a reply is sent, before the next refresh).
   */
  const addReplyToThread = useCallback(
    (
      loadId: string,
      messageId: string,
      gmailThreadId: string,
      body: string,
      to: string,
      from: string,
      sentAt: string
    ) => {
      const existing = loadFromStorage();
      const thread = existing[loadId];
      if (!thread) return;

      const replyMsg: EmailMessage = {
        messageId,
        gmailThreadId,
        direction: "sent",
        subject: `Re: ${thread.messages[0]?.subject || ""}`,
        snippet: body.slice(0, 120),
        body,
        from,
        to,
        sentAt,
      };

      const updated: EmailThread = {
        ...thread,
        messages: [...thread.messages, replyMsg],
        lastFetchedAt: sentAt,
      };
      persist({ ...existing, [loadId]: updated });
    },
    [persist]
  );

  return { threads, getThread, saveInitialThread, refreshThread, addReplyToThread };
}
