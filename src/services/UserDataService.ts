import { EmailSnippet, EmailTemplate } from "../types/email";

const NETLIFY_BASE =
  process.env.REACT_APP_NETLIFY_URL || "https://truckaroosie-dev.netlify.app";

const FUNC_URL = `${NETLIFY_BASE}/.netlify/functions/user-data`;

async function post(body: object): Promise<any> {
  const res = await fetch(FUNC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Templates ────────────────────────────────────────────────

export async function getTemplates(gmailToken: string): Promise<EmailTemplate[]> {
  const data = await post({ gmailToken, operation: "get", type: "templates" });
  return (data.items || []).map(rowToTemplate);
}

export async function upsertTemplate(
  gmailToken: string,
  template: EmailTemplate
): Promise<void> {
  await post({
    gmailToken,
    operation: "upsert",
    type: "templates",
    data: templateToRow(template),
  });
}

export async function deleteTemplate(
  gmailToken: string,
  id: string
): Promise<void> {
  await post({ gmailToken, operation: "delete", type: "templates", id });
}

// ── Snippets ─────────────────────────────────────────────────

export async function getSnippets(gmailToken: string): Promise<EmailSnippet[]> {
  const data = await post({ gmailToken, operation: "get", type: "snippets" });
  return (data.items || []).map(rowToSnippet);
}

export async function upsertSnippet(
  gmailToken: string,
  snippet: EmailSnippet
): Promise<void> {
  await post({
    gmailToken,
    operation: "upsert",
    type: "snippets",
    data: snippetToRow(snippet),
  });
}

export async function deleteSnippet(
  gmailToken: string,
  id: string
): Promise<void> {
  await post({ gmailToken, operation: "delete", type: "snippets", id });
}

// ── Row converters ────────────────────────────────────────────

function rowToTemplate(row: any): EmailTemplate {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject || "",
    body: row.body || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function templateToRow(t: EmailTemplate): object {
  return {
    id: t.id,
    name: t.name,
    subject: t.subject,
    body: t.body,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

function rowToSnippet(row: any): EmailSnippet {
  return {
    id: row.id,
    shortcut: row.shortcut,
    body: row.body || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function snippetToRow(s: EmailSnippet): object {
  return {
    id: s.id,
    shortcut: s.shortcut,
    body: s.body,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}
