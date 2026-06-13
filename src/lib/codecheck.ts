export type Severity = "error" | "warning" | "info";

export interface CodeIssue {
  file: string;
  line: number;
  severity: Severity;
  rule: string;
  message: string;
}

export interface FileEntry {
  name: string;
  content: string;
}

const RULES: { id: string; severity: Severity; check: (files: FileEntry[]) => CodeIssue[] }[] = [
  {
    id: "missing-clk-enable",
    severity: "error",
    check(files) {
      const issues: CodeIssue[] = [];
      for (const f of files) {
        if (!f.name.endsWith(".c")) continue;
        const lines = f.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const initMatch = line.match(/HAL_(\w+)_Init\s*\(/);
          if (initMatch) {
            const peripheral = initMatch[1];
            const clkUsed = /__HAL_RCC_\w+_CLK_ENABLE/.test(line);
            let foundClk = clkUsed;
            if (!foundClk) {
              for (let j = Math.max(0, i - 20); j < i; j++) {
                if (/__HAL_RCC_\w+_CLK_ENABLE/.test(lines[j])) {
                  foundClk = true;
                  break;
                }
              }
            }
            if (!foundClk) {
              issues.push({
                file: f.name, line: i + 1, severity: "error",
                rule: "missing-clk-enable",
                message: `HAL_${peripheral}_Init() may be called without enabling ${peripheral} clock (__HAL_RCC_*_CLK_ENABLE)`,
              });
            }
          }
        }
      }
      return issues;
    },
  },
  {
    id: "nvic-no-priority",
    severity: "warning",
    check(files) {
      const issues: CodeIssue[] = [];
      for (const f of files) {
        if (!f.name.endsWith(".c")) continue;
        const lines = f.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (/HAL_NVIC_EnableIRQ\s*\(/.test(lines[i])) {
            let foundPriority = false;
            for (let j = Math.max(0, i - 5); j < i; j++) {
              if (/HAL_NVIC_SetPriority\s*\(/.test(lines[j])) {
                foundPriority = true;
                break;
              }
            }
            if (!foundPriority) {
              issues.push({
                file: f.name, line: i + 1, severity: "warning",
                rule: "nvic-no-priority",
                message: "HAL_NVIC_EnableIRQ() called without prior HAL_NVIC_SetPriority()",
              });
            }
          }
        }
      }
      return issues;
    },
  },
  {
    id: "unhandled-return",
    severity: "warning",
    check(files) {
      const issues: CodeIssue[] = [];
      const halFuncs = [
        "HAL_UART_Transmit", "HAL_UART_Receive", "HAL_UART_Transmit_DMA", "HAL_UART_Receive_DMA",
        "HAL_SPI_Transmit", "HAL_SPI_Receive", "HAL_SPI_TransmitReceive",
        "HAL_I2C_Mem_Write", "HAL_I2C_Mem_Read", "HAL_I2C_Master_Transmit", "HAL_I2C_Master_Receive",
        "HAL_ADC_Start", "HAL_ADC_Start_DMA",
        "HAL_TIM_PWM_Start", "HAL_TIM_PWM_Stop",
        "HAL_GPIO_Init", "HAL_RCC_OscConfig", "HAL_RCC_ClockConfig",
        "HAL_NVIC_SetPriority", "HAL_NVIC_EnableIRQ",
        "HAL_DMA_Init", "HAL_UART_Init", "HAL_SPI_Init", "HAL_I2C_Init", "HAL_ADC_Init", "HAL_TIM_PWM_Init",
      ];
      for (const f of files) {
        if (!f.name.endsWith(".c")) continue;
        const lines = f.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          for (const func of halFuncs) {
            if (line.includes(func + "(") && !line.startsWith("//") && !line.startsWith("*")) {
              const hasRet = /HAL_StatusTypeDef|!= HAL_OK|== HAL_OK|if\s*\(|return\s/.test(line);
              const prevLine = i > 0 ? lines[i - 1].trim() : "";
              const hasRetPrev = /HAL_StatusTypeDef|!= HAL_OK|== HAL_OK/.test(prevLine);
              if (!hasRet && !hasRetPrev && !line.includes("=")) {
                issues.push({
                  file: f.name, line: i + 1, severity: "info",
                  rule: "unhandled-return",
                  message: `Return value of ${func}() is not checked`,
                });
                break;
              }
            }
          }
        }
      }
      return issues;
    },
  },
  {
    id: "missing-error-handler",
    severity: "warning",
    check(files) {
      const issues: CodeIssue[] = [];
      for (const f of files) {
        if (f.name.endsWith(".c") && f.name.includes("main")) {
          if (!f.content.includes("Error_Handler")) {
            issues.push({
              file: f.name, line: 1, severity: "warning",
              rule: "missing-error-handler",
              message: "No Error_Handler() function found in main.c",
            });
          }
        }
      }
      return issues;
    },
  },
  {
    id: "gpio-without-clock",
    severity: "error",
    check(files) {
      const issues: CodeIssue[] = [];
      for (const f of files) {
        if (!f.name.endsWith(".c")) continue;
        const lines = f.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (/HAL_GPIO_Init\s*\(/.test(lines[i])) {
            const portMatch = lines[i].match(/HAL_GPIO_Init\s*\(\s*(\w+)/);
            if (portMatch) {
              const port = portMatch[1];
              let foundClk = false;
              for (let j = Math.max(0, i - 15); j < i; j++) {
                if (lines[j].includes("__HAL_RCC_" + port + "_CLK_ENABLE")) {
                  foundClk = true;
                  break;
                }
              }
              if (!foundClk) {
                issues.push({
                  file: f.name, line: i + 1, severity: "error",
                  rule: "gpio-without-clock",
                  message: `HAL_GPIO_Init(${port}) called without __HAL_RCC_${port}_CLK_ENABLE()`,
                });
              }
            }
          }
        }
      }
      return issues;
    },
  },
  {
    id: "dma-not-initialized",
    severity: "error",
    check(files) {
      const issues: CodeIssue[] = [];
      for (const f of files) {
        if (!f.name.endsWith(".c")) continue;
        const lines = f.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (/__HAL_LINKDMA\s*\(/.test(lines[i])) {
            let foundInit = false;
            for (let j = Math.max(0, i - 20); j < i; j++) {
              if (/HAL_DMA_Init\s*\(/.test(lines[j])) {
                foundInit = true;
                break;
              }
            }
            if (!foundInit) {
              issues.push({
                file: f.name, line: i + 1, severity: "error",
                rule: "dma-not-initialized",
                message: "__HAL_LINKDMA() called without prior HAL_DMA_Init()",
              });
            }
          }
        }
      }
      return issues;
    },
  },
  {
    id: "missing-volatile",
    severity: "info",
    check(files) {
      const issues: CodeIssue[] = [];
      for (const f of files) {
        if (!f.name.endsWith(".c") && !f.name.endsWith(".h")) continue;
        const lines = f.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (/uint\d+_t\s+\w+\s*=/.test(line) && !line.includes("volatile") && !line.includes("static")) {
            const varMatch = line.match(/uint\d+_t\s+(\w+)/);
            if (varMatch) {
              const varName = varMatch[1];
              const isIsr = f.content.includes("IRQHandler") || f.content.includes("_Callback");
              if (isIsr) {
                issues.push({
                  file: f.name, line: i + 1, severity: "info",
                  rule: "missing-volatile",
                  message: `Variable '${varName}' in ISR context should be declared volatile`,
                });
              }
            }
          }
        }
      }
      return issues;
    },
  },
  {
    id: "hardcoded-magic",
    severity: "info",
    check(files) {
      const issues: CodeIssue[] = [];
      for (const f of files) {
        if (!f.name.endsWith(".c")) continue;
        const lines = f.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.match(/\.Init\.\w+\s*=\s*\d{4,}/) && !line.includes("BaudRate") && !line.includes("ClockSpeed")) {
            issues.push({
              file: f.name, line: i + 1, severity: "info",
              rule: "hardcoded-magic",
              message: "Large magic number in peripheral config — consider using a #define",
            });
          }
        }
      }
      return issues;
    },
  },
  {
    id: "missing-include",
    severity: "warning",
    check(files) {
      const issues: CodeIssue[] = [];
      for (const f of files) {
        if (!f.name.endsWith(".c")) continue;
        const content = f.content;
        if (content.includes("va_list") || content.includes("va_start") || content.includes("vsnprintf")) {
          if (!content.includes("#include <stdarg.h>")) {
            issues.push({
              file: f.name, line: 1, severity: "warning",
              rule: "missing-include",
              message: "Uses va_list/vsnprintf but missing #include <stdarg.h>",
            });
          }
        }
        if (content.includes("memset") || content.includes("memcpy") || content.includes("strlen") || content.includes("strcmp")) {
          if (!content.includes("#include <string.h>")) {
            issues.push({
              file: f.name, line: 1, severity: "warning",
              rule: "missing-include",
              message: "Uses string functions but missing #include <string.h>",
            });
          }
        }
        if (content.includes("printf") || content.includes("snprintf") || content.includes("sscanf")) {
          if (!content.includes("#include <stdio.h>")) {
            issues.push({
              file: f.name, line: 1, severity: "warning",
              rule: "missing-include",
              message: "Uses printf/snprintf but missing #include <stdio.h>",
            });
          }
        }
      }
      return issues;
    },
  },
  {
    id: "multi-callback-conflict",
    severity: "warning",
    check(files) {
      const issues: CodeIssue[] = [];
      const callbackNames = [
        "HAL_UART_RxCpltCallback", "HAL_UART_TxCpltCallback",
        "HAL_SPI_RxCpltCallback", "HAL_SPI_TxCpltCallback",
        "HAL_I2C_MasterTxCpltCallback", "HAL_I2C_MasterRxCpltCallback",
        "HAL_ADC_ConvCpltCallback", "HAL_GPIO_EXTI_Callback",
      ];
      for (const cb of callbackNames) {
        const filesWithCb = files.filter((f) => f.name.endsWith(".c") && f.content.includes(cb));
        if (filesWithCb.length > 1) {
          for (const f of filesWithCb) {
            issues.push({
              file: f.name, line: 1, severity: "warning",
              rule: "multi-callback-conflict",
              message: `${cb} defined in multiple files — only one will be linked. Add Instance check inside.`,
            });
          }
        }
      }
      return issues;
    },
  },
  {
    id: "unsafe-buffer",
    severity: "warning",
    check(files) {
      const issues: CodeIssue[] = [];
      for (const f of files) {
        if (!f.name.endsWith(".c")) continue;
        const lines = f.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const bufMatch = line.match(/(?:char|uint8_t)\s+(\w+)\s*\[(\d+)\]/);
          if (bufMatch) {
            const bufName = bufMatch[1];
            const bufSize = parseInt(bufMatch[2]);
            if (bufSize <= 32) {
              const hasStrcpy = lines.some((l) => l.includes("strcpy(" + bufName));
              const hasSprintf = lines.some((l) => l.includes("sprintf(" + bufName));
              const hasGets = lines.some((l) => l.includes("gets(" + bufName));
              if (hasStrcpy || hasSprintf || hasGets) {
                issues.push({
                  file: f.name, line: i + 1, severity: "warning",
                  rule: "unsafe-buffer",
                  message: `Small buffer '${bufName}[${bufSize}]' used with unsafe string function — use snprintf/strncpy`,
                });
              }
            }
          }
        }
      }
      return issues;
    },
  },
  {
    id: "empty-while-loop",
    severity: "info",
    check(files) {
      const issues: CodeIssue[] = [];
      for (const f of files) {
        if (!f.name.endsWith(".c")) continue;
        const lines = f.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line === "while(1);" || line === "while (1);") {
            issues.push({
              file: f.name, line: i + 1, severity: "info",
              rule: "empty-while-loop",
              message: "Empty while(1) loop — consider adding WFI or __WFI() for low-power",
            });
          }
        }
      }
      return issues;
    },
  },
];

export function analyzeCode(files: FileEntry[]): CodeIssue[] {
  const allIssues: CodeIssue[] = [];
  for (const rule of RULES) {
    allIssues.push(...rule.check(files));
  }
  allIssues.sort((a, b) => {
    const sev: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
    if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });
  return allIssues;
}

export function getRuleDescription(ruleId: string): string {
  const descs: Record<string, string> = {
    "missing-clk-enable": "Peripheral init without clock enable",
    "nvic-no-priority": "IRQ enabled without priority set",
    "unhandled-return": "HAL return value not checked",
    "missing-error-handler": "No Error_Handler in main.c",
    "gpio-without-clock": "GPIO init without port clock",
    "dma-not-initialized": "DMA linked but not initialized",
    "missing-volatile": "Variable in ISR should be volatile",
    "hardcoded-magic": "Hardcoded magic number",
    "missing-include": "Missing required #include",
    "multi-callback-conflict": "Callback defined in multiple files",
    "unsafe-buffer": "Unsafe buffer usage",
    "empty-while-loop": "Empty infinite loop",
  };
  return descs[ruleId] || ruleId;
}
