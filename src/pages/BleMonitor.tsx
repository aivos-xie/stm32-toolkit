import { useState, useRef } from "react";
import { Play, Square, Search, Download } from "lucide-react";
import { useT } from "../i18n/LanguageContext";

interface BLEDevice {
  name: string;
  id: string;
  rssi?: number;
}

interface BLEService {
  uuid: string;
  characteristics: BLECharacteristic[];
}

interface BLECharacteristic {
  uuid: string;
  properties: string[];
  value?: DataView;
}

export default function BleMonitor() {
  const t = useT();
  const [device, setDevice] = useState<BLEDevice | null>(null);
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [services, setServices] = useState<BLEService[]>([]);
  const [writeValue, setWriteValue] = useState("");
  const [log, setLog] = useState("");
  const serverRef = useRef<BluetoothRemoteGATTServer | null>(null);

  const addLog = (msg: string) => {
    const ts = "[" + new Date().toLocaleTimeString() + "] ";
    setLog((prev) => prev + ts + msg + "\n");
  };

  const handleScan = async () => {
    setScanning(true);
    setDevices([]);
    try {
      const dev = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service", "device_information"],
      });
      setDevices([{ name: dev.name || "Unknown", id: dev.id }]);
      addLog("Found: " + (dev.name || "Unknown"));
    } catch {
      addLog("Scan cancelled or failed");
    }
    setScanning(false);
  };

  const handleConnect = async () => {
    if (devices.length === 0) return;
    try {
      const dev = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service", "device_information"],
      });
      const server = await dev.gatt!.connect();
      serverRef.current = server;
      setDevice({ name: dev.name || "Unknown", id: dev.id });
      setConnected(true);
      addLog("Connected to " + (dev.name || "Unknown"));

      const svcs = await server.getPrimaryServices();
      const svcList: BLEService[] = [];
      for (const svc of svcs) {
        const chars = await svc.getCharacteristics();
        const charList: BLECharacteristic[] = [];
        for (const ch of chars) {
          const props: string[] = [];
          if (ch.properties.read) props.push("read");
          if (ch.properties.write) props.push("write");
          if (ch.properties.writeWithoutResponse) props.push("writeWoResp");
          if (ch.properties.notify) props.push("notify");
          if (ch.properties.indicate) props.push("indicate");
          let value: DataView | undefined;
          if (ch.properties.read) {
            try { value = await ch.readValue(); } catch { /* ignore read errors */ }
          }
          charList.push({ uuid: ch.uuid, properties: props, value });
        }
        svcList.push({ uuid: svc.uuid, characteristics: charList });
      }
      setServices(svcList);
      addLog("Discovered " + svcList.length + " services");
    } catch (e) {
      addLog("Connection failed: " + (e as Error).message);
    }
  };

  const handleDisconnect = async () => {
    serverRef.current?.disconnect();
    setConnected(false);
    setDevice(null);
    setServices([]);
    addLog("Disconnected");
  };

  const handleRead = async (char: BLECharacteristic) => {
    try {
      const svc = services.find((s) => s.characteristics.some((c) => c.uuid === char.uuid));
      if (!svc) return;
      const gattSvc = await serverRef.current!.getPrimaryService(svc.uuid);
      const gattChar = await gattSvc.getCharacteristic(char.uuid);
      const val = await gattChar.readValue();
      const bytes = new Uint8Array(val.buffer);
      const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(" ");
      addLog("Read " + char.uuid.slice(0, 8) + "...: " + hex);
    } catch (e) {
      addLog("Read failed: " + (e as Error).message);
    }
  };

  const handleWrite = async (char: BLECharacteristic) => {
    try {
      const svc = services.find((s) => s.characteristics.some((c) => c.uuid === char.uuid));
      if (!svc) return;
      const gattSvc = await serverRef.current!.getPrimaryService(svc.uuid);
      const gattChar = await gattSvc.getCharacteristic(char.uuid);
      const bytes = writeValue.split(/[\s,]+/).filter(Boolean).map((h) => parseInt(h, 16));
      await gattChar.writeValue(new Uint8Array(bytes));
      addLog("Write " + char.uuid.slice(0, 8) + "...: " + writeValue);
    } catch (e) {
      addLog("Write failed: " + (e as Error).message);
    }
  };

  const handleNotify = async (char: BLECharacteristic) => {
    try {
      const svc = services.find((s) => s.characteristics.some((c) => c.uuid === char.uuid));
      if (!svc) return;
      const gattSvc = await serverRef.current!.getPrimaryService(svc.uuid);
      const gattChar = await gattSvc.getCharacteristic(char.uuid);
      await gattChar.startNotifications();
      gattChar.addEventListener("characteristicvaluechanged", (e: Event) => {
        const val = (e.target as BluetoothRemoteGATTCharacteristic).value;
        if (val) {
          const bytes = new Uint8Array(val.buffer);
          const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(" ");
          addLog("Notify " + char.uuid.slice(0, 8) + "...: " + hex);
        }
      });
      addLog("Started notifications on " + char.uuid.slice(0, 8) + "...");
    } catch (e) {
      addLog("Notify failed: " + (e as Error).message);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-72 flex-shrink-0 border-r overflow-y-auto p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <h2 className="text-lg font-semibold mb-4">{t("ble.title")}</h2>

        <div className="space-y-3">
          <button onClick={handleScan} disabled={scanning || connected}
            className="w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}>
            <Search size={14} /> {scanning ? t("ble.scanning") : t("ble.scan")}
          </button>

          {devices.length > 0 && !connected && (
            <button onClick={handleConnect}
              className="w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-colors"
              style={{ background: "var(--success)", color: "#fff" }}>
              <Play size={14} /> {t("ble.connect")}
            </button>
          )}

          {connected && (
            <button onClick={handleDisconnect}
              className="w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-colors"
              style={{ background: "var(--error)", color: "#fff" }}>
              <Square size={14} /> {t("ble.disconnect")}
            </button>
          )}

          {connected && <div className="text-xs text-center" style={{ color: "var(--success)" }}>{t("ble.connected")} {device?.name}</div>}

          {services.length > 0 && (
            <div className="border-t pt-3" style={{ borderColor: "var(--border-color)" }}>
              <div className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>{t("ble.services")}</div>
              {services.map((svc) => (
                <div key={svc.uuid} className="mb-2">
                  <div className="text-xs font-mono truncate" style={{ color: "var(--accent)" }}>{svc.uuid.slice(0, 8)}...</div>
                  {svc.characteristics.map((ch) => (
                    <div key={ch.uuid} className="ml-2 mt-1 p-1.5 rounded text-xs" style={{ background: "var(--bg-tertiary)" }}>
                      <div className="font-mono truncate" style={{ color: "var(--text-secondary)" }}>{ch.uuid.slice(0, 8)}...</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ch.properties.includes("read") && <button onClick={() => handleRead(ch)} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--accent)", color: "#fff" }}>Read</button>}
                        {(ch.properties.includes("write") || ch.properties.includes("writeWoResp")) && <button onClick={() => handleWrite(ch)} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--warning)", color: "#000" }}>Write</button>}
                        {ch.properties.includes("notify") && <button onClick={() => handleNotify(ch)} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--success)", color: "#fff" }}>Notify</button>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {connected && (
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("ble.write.label")}</label>
              <input type="text" value={writeValue} onChange={(e) => setWriteValue(e.target.value)}
                placeholder={t("ble.write.placeholder")}
                className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4 font-mono text-sm" style={{ background: "var(--bg-primary)" }}>
          <pre className="whitespace-pre-wrap break-all">{log || t("ble.placeholder")}</pre>
        </div>
        <div className="border-t p-2 flex justify-end" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
          <button onClick={() => { const blob = new Blob([log], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "ble_log.txt"; a.click(); URL.revokeObjectURL(url); }}
            className="px-3 py-1.5 rounded text-xs flex items-center gap-1" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
            <Download size={12} /> {t("ble.export")}
          </button>
        </div>
      </div>
    </div>
  );
}
