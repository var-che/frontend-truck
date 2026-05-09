import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { EmailTemplate } from "../types/email";

const STORAGE_KEY = "email_templates_v1";

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-interest",
    name: "Load Interest",
    subject: "Interested in load: {{origin}} → {{destination}} ({{pickup_date}})",
    body: `Hi {{company}},

I'm interested in covering your load from {{origin}} to {{destination}} on {{pickup_date}}.

Driver: {{driver_name}} — Truck #{{driver_truck}} ({{driver_equipment}})
Current location: {{driver_location}} (~{{dh_miles}} out)

Please let me know if this truck works for you.

{{dispatcher_name}}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl-check-in",
    name: "Driver Check-In",
    subject: "Driver check-in: {{driver_name}} — {{driver_location}}",
    body: `Hi {{company}},

Just checking in on our driver {{driver_name}} (Truck #{{driver_truck}}).

Current location: {{driver_location}}
ETA to pickup: {{eta_to_pickup}}

Please confirm if everything is on schedule for {{pickup_date}}.

{{dispatcher_name}}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl-rate-confirm",
    name: "Rate Confirmation",
    subject: "Rate confirmation: {{origin}} → {{destination}} @ {{rate}}",
    body: `Hi {{company}},

We'd like to confirm the following load:

Route:     {{origin}} → {{destination}}
Pickup:    {{pickup_date}}
Equipment: {{driver_equipment}}
Rate:      {{rate}}
Trip:      {{trip_miles}} miles
DH-O:      {{dh_miles}}

Please send the rate confirmation to this email and we'll dispatch immediately.

{{dispatcher_name}}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function loadFromStorage(): EmailTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as EmailTemplate[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  // First-time: seed with defaults and persist
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
  return DEFAULT_TEMPLATES;
}

function saveToStorage(templates: EmailTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(loadFromStorage);

  const createTemplate = useCallback(
    (data: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">): EmailTemplate => {
      const now = new Date().toISOString();
      const tpl: EmailTemplate = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
      const next = [...templates, tpl];
      setTemplates(next);
      saveToStorage(next);
      return tpl;
    },
    [templates]
  );

  const updateTemplate = useCallback(
    (id: string, data: Partial<Pick<EmailTemplate, "name" | "subject" | "body">>): void => {
      const next = templates.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      );
      setTemplates(next);
      saveToStorage(next);
    },
    [templates]
  );

  const deleteTemplate = useCallback(
    (id: string): void => {
      const next = templates.filter((t) => t.id !== id);
      setTemplates(next);
      saveToStorage(next);
    },
    [templates]
  );

  return { templates, createTemplate, updateTemplate, deleteTemplate };
}
