import { useState, useRef } from "react";
import { Play, Square, Trash2, Download } from "lucide-react";
import { useT } from "../i18n/LanguageContext";

export default function SerialMonitor() {
  const t = useT();
  const [port, setPort] = useState<SerialPort | null>(null);
  const [connected, setConnected] = useState(false);
  const [baudRate, setBaudRate] = useState(115200);
  const [dataBits, setDataBits] = useState(8);
  const [stopBits, setStopBits] = useState(1);
  const [parity, setParity] = useState<"none" | "even" | "odd">("none");
  const [viewMode, setViewMode] = useState<"ascii" | "hex">("ascii");
  const [rxData, setRxData] = useState("");
  const [txData, setTxData] = useState("");
  const [timestamp, setTimestamp] = useState(false);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);

  const handleConnect = async () => {
    try {
      const p = await navigator.serial.requestPort();
      await p.open({ baudRate, dataBits, stopBits: stopBits as 1 | 2, parity });
      setPort(p);
      setConnected(true);

      const reader = p.readable!.getReader();
      readerRef.current = reader;
      const writer = p.writable!.getWriter();
      writerRef.current = writer;

      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              setRxData((prev) => {
                const ts = timestamp ? "[" + new Date().toLocaleTimeString() + "] " : "";
                if (viewMode === "hex") {
                  const hex = Array.from(value).map((b: number) => b.toString(16).padStart(2, "0")).join(" ");
                  return prev + ts + hex + "\n";
                }
                return prev + ts + new TextDecoder().decode(value);
              });
            }
          }
        } catch { /* stop reading loop */ }
      };
      readLoop();
    } catch (e) {
      alert("Serial connection failed: " + (e as Error).message);
    }
  };

  const handleDisconnect = async () => {
    try {
      readerRef.current?.cancel();
      writerRef.current?.close();
      await port?.close();
    } catch { /* ignore disconnect errors */ }
    setConnected(false);
    setPort(null);
  };

  const handleSend = async () => {
    if (!writerRef.current || !txData) return;
    const encoder = new TextEncoder();
    if (viewMode === "hex") {
      const bytes = txData.split(/[\s,]+/).filter(Boolean).map((h) => parseInt(h, 16));
      await writerRef.current.write(new Uint8Array(bytes));
    } else {
      await writerRef.current.write(encoder.encode(txData));
    }
  };

  const handleExport = () => {
    const blob = new Blob([rxData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "serial_log_" + new Date().toISOString().slice(0, 10) + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full">
      <div className="w-72 flex-shrink-0 border-r overflow-y-auto p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <h2 className="text-lg font-semibold mb-4">{t("serial.title")}</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("serial.baud")}</label>
            <select value={baudRate} onChange={(e) => setBaudRate(Number(e.target.value))}
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
              {[9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("serial.databits")}</label>
              <select value={dataBits} onChange={(e) => setDataBits(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                <option value={7}>7</option>
                <option value={8}>8</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("serial.stopbits")}</label>
              <select value={stopBits} onChange={(e) => setStopBits(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("serial.parity")}</label>
            <select value={parity} onChange={(e) => setParity(e.target.value as "none" | "even" | "odd")}
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
              <option value="none">{t("serial.parity.none")}</option>
              <option value="even">{t("serial.parity.even")}</option>
              <option value="odd">{t("serial.parity.odd")}</option>
            </select>
          </div>

          <button onClick={connected ? handleDisconnect : handleConnect}
            className="w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-colors"
            style={{ background: connected ? "var(--error)" : "var(--accent)", color: "#fff" }}>
            {connected ? <><Square size={14} /> {t("serial.disconnect")}</> : <><Play size={14} /> {t("serial.connect")}</>}
          </button>

          {connected && <div className="text-xs text-center" style={{ color: "var(--success)" }}>{t("serial.connected")}</div>}

          <div className="border-t pt-3" style={{ borderColor: "var(--border-color)" }}>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("serial.viewmode")}</label>
            <div className="flex gap-1">
              <button onClick={() => setViewMode("ascii")}
                className="flex-1 py-1.5 rounded text-xs" style={{ background: viewMode === "ascii" ? "var(--accent)" : "var(--bg-tertiary)", color: viewMode === "ascii" ? "#fff" : "var(--text-secondary)" }}>{t("serial.ascii")}</button>
              <button onClick={() => setViewMode("hex")}
                className="flex-1 py-1.5 rounded text-xs" style={{ background: viewMode === "hex" ? "var(--accent)" : "var(--bg-tertiary)", color: viewMode === "hex" ? "#fff" : "var(--text-secondary)" }}>{t("serial.hex")}</button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={timestamp} onChange={(e) => setTimestamp(e.target.checked)} />
            {t("serial.timestamp")}
          </label>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4 font-mono text-sm" style={{ background: "var(--bg-primary)" }}>
          <pre className="whitespace-pre-wrap break-all">{rxData || t("serial.waiting")}</pre>
        </div>

        <div className="border-t p-3 flex gap-2" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
          <input type="text" value={txData} onChange={(e) => setTxData(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={viewMode === "hex" ? t("serial.placeholder.hex") : t("serial.placeholder.ascii")}
            className="flex-1 px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
          <button onClick={handleSend} disabled={!connected}
            className="px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}>{t("serial.send")}</button>
          <button onClick={() => setRxData("")}
            className="px-3 py-2 rounded text-sm transition-colors"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }} title="Clear">
            <Trash2 size={14} />
          </button>
          <button onClick={handleExport}
            className="px-3 py-2 rounded text-sm transition-colors"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }} title={t("serial.export")}>
            <Download size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
