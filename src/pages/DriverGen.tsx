import { useState } from "react";
import { generateDriver } from "../lib/codegen";
import CodePreview from "../components/CodePreview";
import { Plus, Trash2, Zap } from "lucide-react";
import { useT } from "../i18n/LanguageContext";

interface Register {
  name: string;
  addr: string;
  rw: string;
  description: string;
}

interface SensorPreset {
  name: string;
  label: string;
  bus: string;
  addr: string;
  registers: Register[];
}

const SENSOR_PRESETS: SensorPreset[] = [
  {
    name: "bmp280", label: "BMP280 气压/温度", bus: "i2c", addr: "76",
    registers: [
      { name: "CHIP_ID", addr: "D0", rw: "r", description: "芯片 ID (0x58)" },
      { name: "RESET", addr: "E0", rw: "w", description: "软复位 (写 0xB6)" },
      { name: "STATUS", addr: "F3", rw: "r", description: "状态寄存器" },
      { name: "CTRL_MEAS", addr: "F4", rw: "rw", description: "控制温度/气压测量" },
      { name: "CONFIG", addr: "F5", rw: "rw", description: "配置采样/滤波/待机" },
      { name: "PRESS_MSB", addr: "F7", rw: "r", description: "气压数据高字节" },
      { name: "TEMP_MSB", addr: "FA", rw: "r", description: "温度数据高字节" },
    ],
  },
  {
    name: "mpu6050", label: "MPU6050 六轴加速度计", bus: "i2c", addr: "68",
    registers: [
      { name: "WHO_AM_I", addr: "75", rw: "r", description: "设备 ID (0x68)" },
      { name: "PWR_MGMT_1", addr: "6B", rw: "rw", description: "电源管理" },
      { name: "SMPLRT_DIV", addr: "19", rw: "rw", description: "采样率分频" },
      { name: "CONFIG", addr: "1A", rw: "rw", description: "配置寄存器" },
      { name: "GYRO_CONFIG", addr: "1B", rw: "rw", description: "陀螺仪配置" },
      { name: "ACCEL_CONFIG", addr: "1C", rw: "rw", description: "加速度计配置" },
      { name: "ACCEL_XOUT_H", addr: "3B", rw: "r", description: "加速度 X 高字节" },
      { name: "TEMP_OUT_H", addr: "41", rw: "r", description: "温度高字节" },
    ],
  },
  {
    name: "ssd1306", label: "SSD1306 OLED 显示屏", bus: "i2c", addr: "3C",
    registers: [
      { name: "COL_LOW", addr: "00", rw: "w", description: "列地址低 4 位" },
      { name: "COL_HIGH", addr: "10", rw: "w", description: "列地址高 4 位" },
      { name: "PAGE_ADDR", addr: "22", rw: "w", description: "页地址" },
      { name: "CHARGE_PUMP", addr: "8D", rw: "w", description: "充电泵使能" },
      { name: "MEM_MODE", addr: "20", rw: "w", description: "内存寻址模式" },
      { name: "DISPLAY_ON", addr: "AF", rw: "w", description: "显示开启" },
    ],
  },
  {
    name: "dht11", label: "DHT11 温湿度", bus: "gpio", addr: "00",
    registers: [
      { name: "HUMIDITY_INT", addr: "00", rw: "r", description: "湿度整数部分" },
      { name: "HUMIDITY_DEC", addr: "01", rw: "r", description: "湿度小数部分" },
      { name: "TEMP_INT", addr: "02", rw: "r", description: "温度整数部分" },
      { name: "TEMP_DEC", addr: "03", rw: "r", description: "温度小数部分" },
      { name: "CHECKSUM", addr: "04", rw: "r", description: "校验和" },
    ],
  },
];

export default function DriverGen() {
  const t = useT();
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [name, setName] = useState("");
  const [bus, setBus] = useState("i2c");
  const [addr, setAddr] = useState("");
  const [registers, setRegisters] = useState<Register[]>([]);
  const [newReg, setNewReg] = useState<Register>({ name: "", addr: "", rw: "rw", description: "" });
  const [code, setCode] = useState<{ h: string; c: string } | null>(null);

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    if (!presetName) return;
    const preset = SENSOR_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      setName(preset.name);
      setBus(preset.bus);
      setAddr(preset.addr);
      setRegisters([...preset.registers]);
    }
  };

  const addRegister = () => {
    if (!newReg.name || !newReg.addr) return;
    setRegisters([...registers, { ...newReg }]);
    setNewReg({ name: "", addr: "", rw: "rw", description: "" });
  };

  const removeRegister = (idx: number) => {
    setRegisters(registers.filter((_, i) => i !== idx));
  };

  const handleGenerate = () => {
    if (!name || !addr || registers.length === 0) return;
    setCode(generateDriver(name, bus, addr, registers));
  };

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0 border-r overflow-y-auto p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <h2 className="text-lg font-semibold mb-4">{t("driver.title")}</h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>{t("driver.desc")}</p>

        <div className="space-y-3">
          {/* 快捷预设 */}
          <div className="p-3 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap size={14} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-medium">{t("driver.preset")}</span>
            </div>
            <select value={selectedPreset} onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
              <option value="">{t("driver.preset.select")}</option>
              {SENSOR_PRESETS.map((p) => <option key={p.name} value={p.name}>{p.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("driver.name")}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. bmp280"
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("driver.bus")}</label>
            <select value={bus} onChange={(e) => setBus(e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
              <option value="i2c">I2C</option>
              <option value="spi">SPI</option>
              <option value="uart">UART</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("driver.addr")}</label>
            <input type="text" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="e.g. 76"
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
          </div>

          <div className="border-t pt-3" style={{ borderColor: "var(--border-color)" }}>
            <div className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>{t("driver.registers")} ({registers.length})</div>

            {registers.map((reg, idx) => (
              <div key={idx} className="flex items-center gap-1 mb-1 p-1.5 rounded text-xs" style={{ background: "var(--bg-tertiary)" }}>
                <span className="flex-1 truncate" style={{ color: "var(--text-primary)" }}>{reg.name}</span>
                <span className="font-mono" style={{ color: "var(--accent)" }}>0x{reg.addr}</span>
                <span className="text-xs px-1 rounded" style={{ background: reg.rw === "r" ? "var(--success)" : reg.rw === "w" ? "var(--warning)" : "var(--accent)", color: reg.rw === "w" ? "#000" : "#fff", fontSize: "10px" }}>{reg.rw}</span>
                <button onClick={() => removeRegister(idx)} style={{ color: "var(--error)" }}><Trash2 size={12} /></button>
              </div>
            ))}

            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                <input type="text" value={newReg.name} onChange={(e) => setNewReg({ ...newReg, name: e.target.value })}
                  placeholder="Name" className="flex-1 px-2 py-1 rounded border text-xs" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
                <input type="text" value={newReg.addr} onChange={(e) => setNewReg({ ...newReg, addr: e.target.value })}
                  placeholder="Addr" className="w-16 px-2 py-1 rounded border text-xs" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
                <select value={newReg.rw} onChange={(e) => setNewReg({ ...newReg, rw: e.target.value })}
                  className="w-16 px-1 py-1 rounded border text-xs" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  <option value="r">R</option>
                  <option value="w">W</option>
                  <option value="rw">R/W</option>
                </select>
              </div>
              <button onClick={addRegister}
                className="w-full flex items-center justify-center gap-1 py-1 rounded text-xs"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                <Plus size={12} /> {t("driver.addRegister")}
              </button>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={!name || !addr || registers.length === 0}
            className="w-full py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {t("driver.generate")}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {code ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <CodePreview code={code.h} filename={name.toLowerCase() + ".h"} />
            </div>
            <div className="flex-1 border-t" style={{ borderColor: "var(--border-color)" }}>
              <CodePreview code={code.c} filename={name.toLowerCase() + ".c"} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
            {t("driver.placeholder")}
          </div>
        )}
      </div>
    </div>
  );
}
