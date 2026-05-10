import { Handler } from "@netlify/functions";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Encode a string to base64url (URL-safe base64, no padding) */
function toBase64Url(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Build an RFC 2822 email message and return it base64url-encoded */
function buildRfc2822(
  to: string,
  cc: string | undefined,
  subject: string,
  body: string,
  fromEmail: string,
  inReplyTo?: string,
  references?: string
): string {
  const lines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    ...(cc ? [`Cc: ${cc}`] : []),
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    ...(inReplyTo ? [`In-Reply-To: <${inReplyTo}>`] : []),
    ...(references ? [`References: ${references}`] : []),
    "",
    body,
  ];
  return toBase64Url(lines.join("\r\n"));
}

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS_HEADERS, body: "Method Not Allowed" };
  }

  let gmailToken: string;
  let to: string;
  let subject: string;
  let body: string;
  let cc: string | undefined;
  let threadId: string | undefined;
  let inReplyTo: string | undefined;
  let references: string | undefined;

  try {
    ({ gmailToken, to, subject, body, cc, threadId, inReplyTo, references } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  if (!gmailToken || !to || !subject || !body) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "gmailToken, to, subject, and body are required" }),
    };
  }

  // Step 1 — verify Google identity
  const infoRes = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${gmailToken}`
  );
  if (!infoRes.ok) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid or expired Gmail token" }),
    };
  }
  const googleUser = await infoRes.json();
  const { email: fromEmail } = googleUser;
  if (!fromEmail) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Could not identify Google account" }),
    };
  }

  // Step 2 — send via Gmail API using the user's own token
  const raw = buildRfc2822(to, cc, subject, body, fromEmail, inReplyTo, references);
  const sendPayload: Record<string, string> = { raw };
  if (threadId) sendPayload.threadId = threadId;

  const gmailRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gmailToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendPayload),
    }
  );

  if (!gmailRes.ok) {
    const gmailError = await gmailRes.json().catch(() => ({}));
    console.error("Gmail API error:", gmailError);
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: `Gmail API error: ${gmailError?.error?.message || gmailRes.statusText}`,
      }),
    };
  }

  const { id: messageId, threadId: returnedThreadId } = await gmailRes.json();

  // Step 3 — fetch the threadId if not already returned (Gmail send always returns it)
  const resolvedThreadId: string = returnedThreadId || threadId || messageId;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    body: JSON.stringify({
      success: true,
      messageId,
      threadId: resolvedThreadId,
      sentAt: new Date().toISOString(),
      from: fromEmail,
    }),
  };
};
