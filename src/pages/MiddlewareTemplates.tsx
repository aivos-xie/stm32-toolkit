import { useState } from "react";
import { generateFreeRTOSTask, generateFreeRTOSQueue, generateShell } from "../lib/codegen";
import CodePreview from "../components/CodePreview";
import { useT } from "../i18n/LanguageContext";

const TEMPLATES = [
  { id: "freertos_task", label: "FreeRTOS Task" },
  { id: "freertos_queue", label: "FreeRTOS Queue" },
  { id: "shell", label: "CLI Shell" },
];

export default function MiddlewareTemplates() {
  const t = useT();
  const [template, setTemplate] = useState("freertos_task");
  const [taskName, setTaskName] = useState("MyTask");
  const [stackSize, setStackSize] = useState(256);
  const [priority, setPriority] = useState(1);
  const [queueName, setQueueName] = useState("MyQueue");
  const [itemSize, setItemSize] = useState(4);
  const [queueLen, setQueueLen] = useState(16);
  const [code, setCode] = useState("");

  const handleGenerate = () => {
    if (template === "freertos_task") {
      setCode(generateFreeRTOSTask(taskName, stackSize, priority));
    } else if (template === "freertos_queue") {
      setCode(generateFreeRTOSQueue(queueName, itemSize, queueLen));
    } else if (template === "shell") {
      setCode(generateShell());
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0 border-r overflow-y-auto p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <h2 className="text-lg font-semibold mb-4">{t("middleware.title")}</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("middleware.template")}</label>
            <select value={template} onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
              {TEMPLATES.map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.label}</option>)}
            </select>
          </div>

          {template === "freertos_task" && (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("middleware.taskName")}</label>
                <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("middleware.stackSize")}</label>
                <input type="number" value={stackSize} onChange={(e) => setStackSize(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("middleware.priority")}</label>
                <input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
            </>
          )}

          {template === "freertos_queue" && (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("middleware.queueName")}</label>
                <input type="text" value={queueName} onChange={(e) => setQueueName(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("middleware.itemSize")}</label>
                <input type="number" value={itemSize} onChange={(e) => setItemSize(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("middleware.queueLen")}</label>
                <input type="number" value={queueLen} onChange={(e) => setQueueLen(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
            </>
          )}

          <button onClick={handleGenerate}
            className="w-full py-2 rounded text-sm font-medium transition-colors"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {t("middleware.generate")}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {code ? (
          <CodePreview code={code} filename={template + ".c"} />
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
            {t("middleware.placeholder")}
          </div>
        )}
      </div>
    </div>
  );
}
