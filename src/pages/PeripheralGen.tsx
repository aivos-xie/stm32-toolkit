import { useState } from "react";
import { generateGPIO, generateUART, generateSPI, generateI2C, generateTimerPWM, generateADC, generateEXTI } from "../lib/codegen";
import CodePreview from "../components/CodePreview";
import { useT } from "../i18n/LanguageContext";

const PINS = ["PA0","PA1","PA2","PA3","PA4","PA5","PA6","PA7","PA8","PA9","PA10","PA11","PA12","PA13","PA14","PA15",
  "PB0","PB1","PB2","PB3","PB4","PB5","PB6","PB7","PB8","PB9","PB10","PB11","PB12","PB13","PB14","PB15",
  "PC0","PC1","PC2","PC3","PC4","PC5","PC6","PC7","PC8","PC9","PC10","PC11","PC12","PC13","PC14","PC15",
  "PD0","PD1","PD2","PD3","PD4","PD5","PD6","PD7","PD8","PD9","PD10","PD11","PD12","PD13","PD14","PD15"];

const PERIPHERALS = [
  { id: "gpio", label: "GPIO" },
  { id: "uart", label: "UART" },
  { id: "spi", label: "SPI" },
  { id: "i2c", label: "I2C" },
  { id: "pwm", label: "TIM PWM" },
  { id: "adc", label: "ADC" },
  { id: "exti", label: "EXTI" },
];

const UART_INSTANCES = ["USART1", "USART2", "USART3"];
const SPI_INSTANCES = ["SPI1", "SPI2"];
const I2C_INSTANCES = ["I2C1", "I2C2"];
const TIM_INSTANCES = ["TIM2", "TIM3", "TIM4", "TIM5"];
const ADC_INSTANCES = ["ADC1", "ADC2", "ADC3"];

type CodeResult = { h: string; c: string } | null;

export default function PeripheralGen() {
  const t = useT();
  const [peripheral, setPeripheral] = useState("gpio");
  const [code, setCode] = useState<CodeResult>(null);
  const [codeFilename, setCodeFilename] = useState("");

  // GPIO
  const [gpioPin, setGpioPin] = useState("PA0");
  const [gpioMode, setGpioMode] = useState("output");
  const [gpioPull, setGpioPull] = useState("none");
  const [gpioLabel, setGpioLabel] = useState("");

  // UART
  const [uartInstance, setUartInstance] = useState("USART1");
  const [uartTxPin, setUartTxPin] = useState("PA9");
  const [uartRxPin, setUartRxPin] = useState("PA10");
  const [uartBaud, setUartBaud] = useState(115200);
  const [uartDma, setUartDma] = useState(false);

  // SPI
  const [spiInstance, setSpiInstance] = useState("SPI1");
  const [spiSck, setSpiSck] = useState("PA5");
  const [spiMiso, setSpiMiso] = useState("PA6");
  const [spiMosi, setSpiMosi] = useState("PA7");
  const [spiMode, setSpiMode] = useState(0);

  // I2C
  const [i2cInstance, setI2cInstance] = useState("I2C1");
  const [i2cScl, setI2cScl] = useState("PB6");
  const [i2cSda, setI2cSda] = useState("PB7");
  const [i2cSpeed, setI2cSpeed] = useState("standard");

  // PWM
  const [pwmTim, setPwmTim] = useState("TIM2");
  const [pwmChannel, setPwmChannel] = useState(1);
  const [pwmPin, setPwmPin] = useState("PA0");
  const [pwmFreq, setPwmFreq] = useState(1000);

  // ADC
  const [adcInstance, setAdcInstance] = useState("ADC1");
  const [adcChannel, setAdcChannel] = useState(0);
  const [adcPin, setAdcPin] = useState("PA0");
  const [adcDma, setAdcDma] = useState(false);

  // EXTI
  const [extiPin, setExtiPin] = useState("PA0");
  const [extiEdge, setExtiEdge] = useState("falling");

  const handleGenerate = () => {
    let result: CodeResult = null;
    let fname = "";

    switch (peripheral) {
      case "gpio":
        result = generateGPIO(gpioPin, gpioMode, gpioPull, gpioLabel);
        fname = "gpio";
        break;
      case "uart":
        result = generateUART(uartInstance, uartTxPin, uartRxPin, uartBaud, uartDma);
        fname = uartInstance.toLowerCase();
        break;
      case "spi":
        result = generateSPI(spiInstance, spiSck, spiMiso, spiMosi, spiMode);
        fname = spiInstance.toLowerCase();
        break;
      case "i2c":
        result = generateI2C(i2cInstance, i2cScl, i2cSda, i2cSpeed);
        fname = i2cInstance.toLowerCase();
        break;
      case "pwm":
        result = generateTimerPWM(pwmTim, pwmChannel, pwmPin, pwmFreq);
        fname = pwmTim.toLowerCase() + "_ch" + pwmChannel;
        break;
      case "adc":
        result = generateADC(adcInstance, adcChannel, adcPin, adcDma);
        fname = adcInstance.toLowerCase() + "_ch" + adcChannel;
        break;
      case "exti":
        result = generateEXTI(extiPin, extiEdge);
        fname = "exti_" + extiPin.toLowerCase();
        break;
    }

    if (result) {
      setCode(result);
      setCodeFilename(fname);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0 border-r overflow-y-auto p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <h2 className="text-lg font-semibold mb-4">{t("peripheral.title")}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.type")}</label>
            <select value={peripheral} onChange={(e) => setPeripheral(e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
              {PERIPHERALS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>

          {/* GPIO */}
          {peripheral === "gpio" && (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.pin")}</label>
                <select value={gpioPin} onChange={(e) => setGpioPin(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {PINS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.mode")}</label>
                <select value={gpioMode} onChange={(e) => setGpioMode(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  <option value="output">{t("peripheral.mode.output")}</option>
                  <option value="input">{t("peripheral.mode.input")}</option>
                  <option value="analog">{t("peripheral.mode.analog")}</option>
                  <option value="af">{t("peripheral.mode.af")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.pull")}</label>
                <select value={gpioPull} onChange={(e) => setGpioPull(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  <option value="none">{t("peripheral.pull.none")}</option>
                  <option value="up">{t("peripheral.pull.up")}</option>
                  <option value="down">{t("peripheral.pull.down")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.label")}</label>
                <input type="text" value={gpioLabel} onChange={(e) => setGpioLabel(e.target.value)} placeholder="e.g. LED"
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
            </>
          )}

          {/* UART */}
          {peripheral === "uart" && (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.instance")}</label>
                <select value={uartInstance} onChange={(e) => setUartInstance(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {UART_INSTANCES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.txpin")}</label>
                <select value={uartTxPin} onChange={(e) => setUartTxPin(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {PINS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.rxpin")}</label>
                <select value={uartRxPin} onChange={(e) => setUartRxPin(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {PINS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.baudrate")}</label>
                <select value={uartBaud} onChange={(e) => setUartBaud(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {[9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={uartDma} onChange={(e) => setUartDma(e.target.checked)} />
                {t("peripheral.usedma")}
              </label>
            </>
          )}

          {/* SPI */}
          {peripheral === "spi" && (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.instance")}</label>
                <select value={spiInstance} onChange={(e) => setSpiInstance(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {SPI_INSTANCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>SCK</label>
                <select value={spiSck} onChange={(e) => setSpiSck(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {PINS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>MISO</label>
                <select value={spiMiso} onChange={(e) => setSpiMiso(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {PINS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>MOSI</label>
                <select value={spiMosi} onChange={(e) => setSpiMosi(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {PINS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.spimode")}</label>
                <select value={spiMode} onChange={(e) => setSpiMode(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  <option value={0}>Mode 0 (CPOL=0, CPHA=0)</option>
                  <option value={1}>Mode 1 (CPOL=0, CPHA=1)</option>
                  <option value={2}>Mode 2 (CPOL=1, CPHA=0)</option>
                  <option value={3}>Mode 3 (CPOL=1, CPHA=1)</option>
                </select>
              </div>
            </>
          )}

          {/* I2C */}
          {peripheral === "i2c" && (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.instance")}</label>
                <select value={i2cInstance} onChange={(e) => setI2cInstance(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {I2C_INSTANCES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>SCL</label>
                <select value={i2cScl} onChange={(e) => setI2cScl(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {PINS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>SDA</label>
                <select value={i2cSda} onChange={(e) => setI2cSda(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {PINS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.speed")}</label>
                <select value={i2cSpeed} onChange={(e) => setI2cSpeed(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  <option value="standard">Standard (100kHz)</option>
                  <option value="fast">Fast (400kHz)</option>
                </select>
              </div>
            </>
          )}

          {/* PWM */}
          {peripheral === "pwm" && (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.timer")}</label>
                <select value={pwmTim} onChange={(e) => setPwmTim(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {TIM_INSTANCES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.channel")}</label>
                <select value={pwmChannel} onChange={(e) => setPwmChannel(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  <option value={1}>CH1</option>
                  <option value={2}>CH2</option>
                  <option value={3}>CH3</option>
                  <option value={4}>CH4</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.pin")}</label>
                <select value={pwmPin} onChange={(e) => setPwmPin(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {PINS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.frequency")} (Hz)</label>
                <input type="number" value={pwmFreq} onChange={(e) => setPwmFreq(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
            </>
          )}

          {/* ADC */}
          {peripheral === "adc" && (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.instance")}</label>
                <select value={adcInstance} onChange={(e) => setAdcInstance(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {ADC_INSTANCES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.channel")}</label>
                <select value={adcChannel} onChange={(e) => setAdcChannel(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {Array.from({ length: 16 }, (_, i) => i).map((ch) => <option key={ch} value={ch}>CH{ch}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.pin")}</label>
                <select value={adcPin} onChange={(e) => setAdcPin(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {PINS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={adcDma} onChange={(e) => setAdcDma(e.target.checked)} />
                {t("peripheral.usedma")}
              </label>
            </>
          )}

          {/* EXTI */}
          {peripheral === "exti" && (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.pin")}</label>
                <select value={extiPin} onChange={(e) => setExtiPin(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {PINS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("peripheral.edge")}</label>
                <select value={extiEdge} onChange={(e) => setExtiEdge(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  <option value="rising">{t("peripheral.edge.rising")}</option>
                  <option value="falling">{t("peripheral.edge.falling")}</option>
                  <option value="both">{t("peripheral.edge.both")}</option>
                </select>
              </div>
            </>
          )}

          <button onClick={handleGenerate}
            className="w-full py-2 rounded text-sm font-medium transition-colors"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {t("peripheral.generate")}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {code ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <CodePreview code={code.h} filename={codeFilename + ".h"} />
            </div>
            <div className="flex-1 border-t" style={{ borderColor: "var(--border-color)" }}>
              <CodePreview code={code.c} filename={codeFilename + ".c"} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
            {t("peripheral.placeholder")}
          </div>
        )}
      </div>
    </div>
  );
}
