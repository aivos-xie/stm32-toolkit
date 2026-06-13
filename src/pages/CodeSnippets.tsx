import { useState } from "react";
import { SNIPPETS } from "../lib/codegen";
import CodePreview from "../components/CodePreview";
import { Search } from "lucide-react";
import { useT } from "../i18n/LanguageContext";

export default function CodeSnippets() {
  const t = useT();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = SNIPPETS.filter(
    (s) => s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
  );

  const selectedSnippet = SNIPPETS.find((s) => s.id === selected);

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0 border-r overflow-y-auto p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <h2 className="text-lg font-semibold mb-4">{t("snippets.title")}</h2>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-2.5 top-2.5" style={{ color: "var(--text-secondary)" }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("snippets.search")}
            className="w-full pl-8 pr-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
        </div>

        <div className="space-y-1">
          {filtered.map((snippet) => (
            <button key={snippet.id} onClick={() => setSelected(snippet.id)}
              className="w-full text-left p-3 rounded transition-colors"
              style={{ background: selected === snippet.id ? "var(--bg-tertiary)" : "transparent" }}>
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{snippet.title}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{snippet.description}</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-xs text-center py-4" style={{ color: "var(--text-secondary)" }}>{t("snippets.empty")}</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedSnippet ? (
          <CodePreview code={selectedSnippet.code} filename={selectedSnippet.id + ".c"} />
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
            {t("snippets.placeholder")}
          </div>
        )}
      </div>
    </div>
  );
}
