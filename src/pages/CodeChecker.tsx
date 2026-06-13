import { useState, useCallback } from "react";
import { Upload, FileCode2, AlertTriangle, AlertCircle, Info, X, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useT } from "../i18n/LanguageContext";
import { analyzeCode, getRuleDescription, type FileEntry, type CodeIssue, type Severity } from "../lib/codecheck";

const SEVERITY_CONFIG: Record<Severity, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  error: { icon: AlertCircle, color: "#ef4444", bg: "#fef2f2" },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "#fffbeb" },
  info: { icon: Info, color: "#3b82f6", bg: "#eff6ff" },
};

export default function CodeChecker() {
  const t = useT();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [issues, setIssues] = useState<CodeIssue[] | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [highlightLine, setHighlightLine] = useState<{ file: string; line: number } | null>(null);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    const entries: FileEntry[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.name.endsWith(".c") || file.name.endsWith(".h")) {
        const content = await file.text();
        entries.push({ name: file.name, content });
      }
    }
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      const newEntries = entries.filter((e) => !names.has(e.name));
      return [...prev, ...newEntries];
    });
    setIssues(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  }, [handleFiles]);

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setIssues(null);
  };

  const runAnalysis = () => {
    if (files.length === 0) return;
    const result = analyzeCode(files);
    setIssues(result);
    setExpandedFiles(new Set(files.map((f) => f.name)));
  };

  const toggleFile = (name: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const issueCounts = issues
    ? { error: issues.filter((i) => i.severity === "error").length, warning: issues.filter((i) => i.severity === "warning").length, info: issues.filter((i) => i.severity === "info").length }
    : null;

  const getIssuesForFile = (fileName: string) => issues?.filter((i) => i.file === fileName) || [];

  const renderFileContent = (file: FileEntry, fileIssues: CodeIssue[]) => {
    const lines = file.content.split("\n");
    const issueLines = new Map(fileIssues.map((i) => [i.line, i]));
    return (
      <div className="text-xs font-mono leading-5">
        {lines.map((line, idx) => {
          const issue = issueLines.get(idx + 1);
          const isHighlighted = highlightLine?.file === file.name && highlightLine?.line === idx + 1;
          return (
            <div
              key={idx}
              className="flex px-3 cursor-pointer transition-colors"
              style={{
                background: isHighlighted ? "var(--bg-tertiary)" : issue ? SEVERITY_CONFIG[issue.severity].bg + "33" : "transparent",
                borderLeft: issue ? `3px solid ${SEVERITY_CONFIG[issue.severity].color}` : "3px solid transparent",
              }}
              onMouseEnter={() => issue && setHighlightLine({ file: file.name, line: idx + 1 })}
              onMouseLeave={() => setHighlightLine(null)}
              title={issue?.message}
            >
              <span className="w-10 text-right pr-3 select-none" style={{ color: "var(--text-secondary)", opacity: 0.5 }}>
                {idx + 1}
              </span>
              <span className="flex-1 whitespace-pre" style={{ color: "var(--text-primary)" }}>{line}</span>
              {issue && (
                <span className="ml-2 flex-shrink-0" style={{ color: SEVERITY_CONFIG[issue.severity].color }}>
                  {issue.severity === "error" ? <AlertCircle size={12} /> : issue.severity === "warning" ? <AlertTriangle size={12} /> : <Info size={12} />}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0 border-r overflow-y-auto p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <h2 className="text-lg font-semibold mb-2">{t("checker.title")}</h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>{t("checker.desc")}</p>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-[var(--accent)]"
          style={{ borderColor: "var(--border-color)" }}
          onClick={() => document.getElementById("checker-upload")?.click()}
        >
          <Upload size={28} className="mx-auto mb-2" style={{ color: "var(--text-secondary)" }} />
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("checker.drop")}</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-secondary)", opacity: 0.6 }}>.c / .h</div>
          <input id="checker-upload" type="file" multiple accept=".c,.h" className="hidden" onChange={handleInputChange} />
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-1">
            {files.map((f) => (
              <div key={f.name} className="flex items-center justify-between px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-tertiary)" }}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileCode2 size={12} style={{ color: "var(--accent)" }} />
                  <span className="truncate" style={{ color: "var(--text-primary)" }}>{f.name}</span>
                </div>
                <button onClick={() => removeFile(f.name)} className="ml-1 p-0.5 rounded hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={runAnalysis}
          disabled={files.length === 0}
          className="w-full mt-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {t("checker.analyze")}
        </button>

        {issueCounts && (
          <div className="mt-4 p-3 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
            <div className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>{t("checker.summary")}</div>
            <div className="flex gap-3">
              {issueCounts.error > 0 && (
                <div className="flex items-center gap-1 text-xs" style={{ color: "#ef4444" }}>
                  <AlertCircle size={12} /> {issueCounts.error} {t("checker.errors")}
                </div>
              )}
              {issueCounts.warning > 0 && (
                <div className="flex items-center gap-1 text-xs" style={{ color: "#f59e0b" }}>
                  <AlertTriangle size={12} /> {issueCounts.warning} {t("checker.warnings")}
                </div>
              )}
              {issueCounts.info > 0 && (
                <div className="flex items-center gap-1 text-xs" style={{ color: "#3b82f6" }}>
                  <Info size={12} /> {issueCounts.info} {t("checker.infos")}
                </div>
              )}
              {issueCounts.error === 0 && issueCounts.warning === 0 && issueCounts.info === 0 && (
                <div className="flex items-center gap-1 text-xs" style={{ color: "#22c55e" }}>
                  <CheckCircle size={12} /> {t("checker.clean")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {issues !== null ? (
          <div className="flex-1 overflow-auto">
            {files.map((file) => {
              const fileIssues = getIssuesForFile(file.name);
              const isExpanded = expandedFiles.has(file.name);
              return (
                <div key={file.name} className="border-b" style={{ borderColor: "var(--border-color)" }}>
                  <button
                    onClick={() => toggleFile(file.name)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <FileCode2 size={14} style={{ color: "var(--accent)" }} />
                    <span>{file.name}</span>
                    {fileIssues.length > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{
                        background: fileIssues.some((i) => i.severity === "error") ? "#fef2f2" : fileIssues.some((i) => i.severity === "warning") ? "#fffbeb" : "#eff6ff",
                        color: fileIssues.some((i) => i.severity === "error") ? "#ef4444" : fileIssues.some((i) => i.severity === "warning") ? "#f59e0b" : "#3b82f6",
                      }}>
                        {fileIssues.length}
                      </span>
                    )}
                  </button>
                  {isExpanded && (
                    <div>
                      {fileIssues.length > 0 && (
                        <div className="px-4 py-2 space-y-1" style={{ background: "var(--bg-primary)" }}>
                          {fileIssues.map((issue, idx) => {
                            const cfg = SEVERITY_CONFIG[issue.severity];
                            const Icon = cfg.icon;
                            return (
                              <div
                                key={idx}
                                className="flex items-start gap-2 px-3 py-1.5 rounded text-xs cursor-pointer transition-colors hover:opacity-80"
                                style={{ background: cfg.bg + "66" }}
                                onMouseEnter={() => setHighlightLine({ file: issue.file, line: issue.line })}
                                onMouseLeave={() => setHighlightLine(null)}
                              >
                                <Icon size={12} className="mt-0.5 flex-shrink-0" style={{ color: cfg.color }} />
                                <div className="min-w-0">
                                  <span className="font-medium" style={{ color: cfg.color }}>L{issue.line}</span>
                                  <span className="ml-2" style={{ color: "var(--text-secondary)" }}>[{getRuleDescription(issue.rule)}]</span>
                                  <div style={{ color: "var(--text-primary)" }}>{issue.message}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <pre className="overflow-auto text-xs" style={{ background: "var(--bg-primary)", maxHeight: "400px" }}>
                        {renderFileContent(file, fileIssues)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
            {t("checker.placeholder")}
          </div>
        )}
      </div>
    </div>
  );
}
