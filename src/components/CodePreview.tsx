import { useState } from "react";
import { Copy, Download, Check } from "lucide-react";
import { useT } from "../i18n/LanguageContext";

interface Props {
  code: string;
  filename?: string;
}

export default function CodePreview({ code, filename }: Props) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "output.c";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{filename || "Generated Code"}</span>
        <div className="flex gap-1">
          <button onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:opacity-80"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }} title={t("preview.copy")}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? t("preview.copied") : t("preview.copy")}
          </button>
          <button onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:opacity-80"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }} title={t("preview.download")}>
            <Download size={12} /> {t("preview.download")}
          </button>
        </div>
      </div>
      <pre className="flex-1 overflow-auto p-4 text-sm leading-relaxed" style={{ background: "var(--bg-primary)" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
