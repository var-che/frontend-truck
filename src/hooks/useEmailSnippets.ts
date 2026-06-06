import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { EmailSnippet } from "../types/email";
import { useAuth } from "../context/AuthContext";
import * as UserDataService from "../services/UserDataService";

const STORAGE_KEY = "email_snippets_v1";

function loadFromStorage(): EmailSnippet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as EmailSnippet[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveToStorage(snippets: EmailSnippet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
}

export function useEmailSnippets() {
  const { gmailToken } = useAuth();
  const [snippets, setSnippets] = useState<EmailSnippet[]>(loadFromStorage);

  // Cloud sync: load from cloud when token becomes available; migrate localStorage on first use
  useEffect(() => {
    if (!gmailToken) return;
    UserDataService.getSnippets(gmailToken)
      .then((cloudSnippets) => {
        if (cloudSnippets.length > 0) {
          setSnippets(cloudSnippets);
          saveToStorage(cloudSnippets);
        } else {
          const local = loadFromStorage();
          local.forEach((s) => {
            UserDataService.upsertSnippet(gmailToken, s).catch(() => {});
          });
        }
      })
      .catch(() => { /* silently fall back to localStorage */ });
  }, [gmailToken]);

  const createSnippet = useCallback(
    (data: Pick<EmailSnippet, "shortcut" | "body">): EmailSnippet => {
      const now = new Date().toISOString();
      const s: EmailSnippet = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
      const next = [...snippets, s];
      setSnippets(next);
      saveToStorage(next);
      if (gmailToken) UserDataService.upsertSnippet(gmailToken, s).catch(() => {});
      return s;
    },
    [snippets, gmailToken]
  );

  const updateSnippet = useCallback(
    (id: string, data: Partial<Pick<EmailSnippet, "shortcut" | "body">>): void => {
      const next = snippets.map((s) =>
        s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
      );
      setSnippets(next);
      saveToStorage(next);
      if (gmailToken) {
        const updated = next.find((s) => s.id === id);
        if (updated) UserDataService.upsertSnippet(gmailToken, updated).catch(() => {});
      }
    },
    [snippets, gmailToken]
  );

  const deleteSnippet = useCallback(
    (id: string): void => {
      const next = snippets.filter((s) => s.id !== id);
      setSnippets(next);
      saveToStorage(next);
      if (gmailToken) UserDataService.deleteSnippet(gmailToken, id).catch(() => {});
    },
    [snippets, gmailToken]
  );

  return { snippets, createSnippet, updateSnippet, deleteSnippet };
}
