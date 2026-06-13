import { useState } from "react";
import { generateProjectScaffold } from "../lib/codegen";
import { MCU_SERIES } from "../lib/pinmap";
import { Download, FolderOpen } from "lucide-react";
import { useT } from "../i18n/LanguageContext";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function ProjectScaffold() {
  const t = useT();
  const [projectName, setProjectName] = useState("my_stm32_project");
  const [mcu, setMcu] = useState("STM32F407");
  const [includeFreeRTOS, setIncludeFreeRTOS] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    const files = generateProjectScaffold(projectName, mcu, includeFreeRTOS);
    const zip = new JSZip();
    const root = zip.folder(projectName)!;
    for (const [path, content] of Object.entries(files)) {
      root.file(path, content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, projectName + ".zip");
    setGenerating(false);
  };

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0 border-r overflow-y-auto p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <h2 className="text-lg font-semibold mb-4">{t("scaffold.title")}</h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>{t("scaffold.desc")}</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("scaffold.name")}</label>
            <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("scaffold.mcu")}</label>
            <select value={mcu} onChange={(e) => setMcu(e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
              {MCU_SERIES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={includeFreeRTOS} onChange={(e) => setIncludeFreeRTOS(e.target.checked)} />
            {t("scaffold.freertos")}
          </label>

          <button onClick={handleGenerate} disabled={generating || !projectName}
            className="w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}>
            <Download size={14} /> {generating ? t("scaffold.generating") : t("scaffold.generate")}
          </button>
        </div>

        <div className="mt-6 p-3 rounded" style={{ background: "var(--bg-tertiary)" }}>
          <div className="flex items-center gap-1.5 mb-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            <FolderOpen size={14} /> {t("scaffold.structure")}
          </div>
          <pre className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
{projectName}/
{"\u251C\u2500\u2500"} Makefile
{"\u251C\u2500\u2500"} README.md
{"\u2514\u2500\u2500"} Core/
    {"\u251C\u2500\u2500"} Inc/
    {"\u2502   \u2514\u2500\u2500"} main.h
    {"\u2514\u2500\u2500"} Src/
        {"\u2514\u2500\u2500"} main.c
{includeFreeRTOS ? "\nMiddlewares/\n\u2514\u2500\u2500 FreeRTOS/" : ""}
          </pre>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8" style={{ color: "var(--text-secondary)" }}>
        <div className="text-center max-w-md">
          <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>{t("scaffold.hero.title")}</h3>
          <p className="text-sm leading-relaxed">{t("scaffold.hero.desc")}</p>
        </div>
      </div>
    </div>
  );
}
