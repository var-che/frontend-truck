import React, {
  useRef,
  useState,
  useCallback,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { Input } from "antd";
import { EMAIL_VARIABLES } from "../../services/EmailVariableResolver";
import { EmailVariable, EmailSnippet } from "../../types/email";

const { TextArea } = Input;

interface SlashCommandTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
  /** When provided, inserting a variable will use the resolved value instead of {{key}} */
  resolvedValues?: Record<string, string>;
  /** User-defined snippets, matched by shortcut */
  snippets?: EmailSnippet[];
  /** Called when Ctrl+Enter is pressed and the slash-command menu is not open */
  onCtrlEnter?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  load: "Load Details",
  driver: "Driver Info",
  computed: "Computed",
  meta: "Info",
};

/**
 * A textarea that shows a floating dropdown of {{variable}} options
 * whenever the user types "/".  Selecting an option inserts {{key}} at cursor.
 */
const SlashCommandTextarea: React.FC<SlashCommandTextareaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 12,
  style,
  resolvedValues,
  snippets = [],
  onCtrlEnter,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Position where the "/" was typed
  const slashPos = useRef<number>(-1);

  // Menu position (pixels from top-left of container)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const filteredVars: EmailVariable[] = EMAIL_VARIABLES.filter(
    (v) =>
      !filter ||
      v.key.includes(filter.toLowerCase()) ||
      v.label.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredSnippets: EmailSnippet[] = snippets.filter(
    (s) => !filter || s.shortcut.toLowerCase().includes(filter.toLowerCase())
  );

  // Group by category for display
  const grouped = filteredVars.reduce<Record<string, EmailVariable[]>>(
    (acc, v) => {
      if (!acc[v.category]) acc[v.category] = [];
      acc[v.category].push(v);
      return acc;
    },
    {}
  );

  // Build flat list for keyboard navigation: snippets first, then variables
  const flatListVars: EmailVariable[] = Object.values(grouped).flat();
  // Combined flat list index: 0..snippets-1 are snippets, rest are variables
  const totalItems = filteredSnippets.length + flatListVars.length;

  const insertText = useCallback(
    (text: string) => {
      const el = textareaRef.current;
      if (!el || slashPos.current < 0) return;
      const before = value.slice(0, slashPos.current);
      const afterSlash = value.slice(slashPos.current + 1);
      const afterFilter = afterSlash.slice(filter.length);
      const next = before + text + afterFilter;
      onChange(next);
      requestAnimationFrame(() => {
        if (!el) return;
        const pos = (before + text).length;
        el.setSelectionRange(pos, pos);
        el.focus();
      });
      setShowMenu(false);
      setFilter("");
      slashPos.current = -1;
    },
    [value, onChange, filter]
  );

  const insertVariable = useCallback(
    (variable: EmailVariable) => {
      const resolvedVal = resolvedValues?.[variable.key];
      insertText(resolvedVal ? resolvedVal : `{{${variable.key}}}`);
    },
    [insertText, resolvedValues]
  );

  const insertSnippet = useCallback(
    (snippet: EmailSnippet) => { insertText(snippet.body); },
    [insertText]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      onChange(newVal);

      const cursor = e.target.selectionStart ?? newVal.length;
      // Find last "/" before cursor on the same line
      const textBefore = newVal.slice(0, cursor);
      const lastNewline = textBefore.lastIndexOf("\n");
      const lineStart = lastNewline + 1;
      const lineText = textBefore.slice(lineStart);
      const slashIdx = lineText.lastIndexOf("/");

      if (slashIdx !== -1) {
        // The "/" position in the full string
        slashPos.current = lineStart + slashIdx;
        const typed = lineText.slice(slashIdx + 1);
        setFilter(typed);
        setSelectedIndex(0);

        // Calculate approximate pixel position for the menu
        // We use a simple fallback: position relative to the textarea
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect();
          // Rough line height estimation
          const lineHeight = 22;
          const lineCount = (value.slice(0, slashPos.current).match(/\n/g) || []).length;
          setMenuPos({
            top: Math.min(lineHeight * (lineCount + 1), rect.height - 10),
            left: 0,
          });
        }
        setShowMenu(true);
      } else {
        setShowMenu(false);
        setFilter("");
        slashPos.current = -1;
      }
    },
    [onChange, value]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey && e.key === 'Enter' && !showMenu) {
        e.preventDefault();
        onCtrlEnter?.();
        return;
      }
      if (!showMenu || totalItems === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + totalItems) % totalItems);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (selectedIndex < filteredSnippets.length) {
          insertSnippet(filteredSnippets[selectedIndex]);
        } else {
          insertVariable(flatListVars[selectedIndex - filteredSnippets.length]);
        }
      } else if (e.key === "Escape") {
        setShowMenu(false);
      }
    },
    [showMenu, totalItems, filteredSnippets, flatListVars, selectedIndex, insertSnippet, insertVariable, onCtrlEnter]
  );

  return (
    <div style={{ position: "relative", ...style }}>
      <TextArea
        ref={(inst) => {
          // Ant Design exposes the underlying textarea via resizableTextArea
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          textareaRef.current = (inst as any)?.resizableTextArea?.textArea ?? null;
        }}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Type '/' to insert a variable…"}
        rows={rows}
        autoSize={{ minRows: rows, maxRows: rows + 6 }}
      />

      {showMenu && totalItems > 0 && (
        <div
          style={{
            position: "absolute",
            top: menuPos.top + 4,
            left: menuPos.left,
            zIndex: 1000,
            background: "#fff",
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            width: 300,
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {/* Snippets section */}
          {filteredSnippets.length > 0 && (
            <div>
              <div style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#8c8c8c", textTransform: "uppercase", letterSpacing: "0.05em", background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                Snippets
              </div>
              {filteredSnippets.map((s, i) => {
                const isActive = i === selectedIndex;
                return (
                  <div
                    key={s.id}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onMouseDown={(e) => { e.preventDefault(); insertSnippet(s); }}
                    style={{ padding: "6px 12px", cursor: "pointer", background: isActive ? "#e6f4ff" : "transparent", display: "flex", flexDirection: "column" }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 12, color: "#1677ff" }}>/{s.shortcut}</span>
                    <span style={{ fontSize: 11, color: "#595959" }}>{s.body.length > 60 ? s.body.slice(0, 60) + "…" : s.body}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Variables section */}
          {Object.entries(grouped).map(([category, vars]) => (
            <div key={category}>
              <div
                style={{
                  padding: "4px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#8c8c8c",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  background: "#fafafa",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                {CATEGORY_LABELS[category] ?? category}
              </div>
              {vars.map((v) => {
                const globalIdx = filteredSnippets.length + flatListVars.indexOf(v);
                const isActive = globalIdx === selectedIndex;
                return (
                  <div
                    key={v.key}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    onMouseDown={(e) => {
                      e.preventDefault(); // keep focus on textarea
                      insertVariable(v);
                    }}
                    style={{
                      padding: "6px 12px",
                      cursor: "pointer",
                      background: isActive ? "#e6f4ff" : "transparent",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <span style={{ fontWeight: 500, fontSize: 13 }}>
                      {v.label}
                    </span>
                    <span style={{ fontSize: 11, color: resolvedValues?.[v.key] ? "#52c41a" : "#8c8c8c" }}>
                      {resolvedValues?.[v.key] ? `→ "${resolvedValues[v.key]}"` : v.description}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SlashCommandTextarea;
