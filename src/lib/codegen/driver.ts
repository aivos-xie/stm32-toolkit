export function generateDriver(name: string, bus: string, addr: string, registers: { name: string; addr: string; rw: string; description: string }[]): { h: string; c: string } {
  const nameUpper = name.toUpperCase();
  const guard = nameUpper + "_H";

  const regDefs = registers.map((r) => "#define " + nameUpper + "_REG_" + r.name.toUpperCase() + " 0x" + r.addr).join("\n");

  const funcDeclsR = registers.filter((r) => r.rw.includes("r")).map((r) => "uint8_t " + name + "_Read" + r.name + "(void);").join("\n");
  const funcDeclsW = registers.filter((r) => r.rw.includes("w")).map((r) => "void " + name + "_Write" + r.name + "(uint8_t value);").join("\n");

  const h = "#ifndef " + guard + "\n#define " + guard + '\n\n#include "stm32f4xx_hal.h"\n#include <stdint.h>\n\n' +
    "#define " + nameUpper + "_ADDR 0x" + addr + "\n\n" +
    "/* Register Map */\n" + regDefs + "\n\n" +
    "/* API */\n" +
    "HAL_StatusTypeDef " + name + "_Init(void);\n" +
    "uint8_t " + name + "_ReadReg(uint8_t reg);\n" +
    "void " + name + "_WriteReg(uint8_t reg, uint8_t value);\n" +
    funcDeclsR + "\n" + funcDeclsW + "\n\n" +
    "#endif /* " + guard + " */";

  const busInit = bus === "i2c"
    ? "  if (HAL_I2C_IsDeviceReady(&hi2c1, " + nameUpper + "_ADDR << 1, 10, HAL_MAX_DELAY) != HAL_OK) {\n    return HAL_ERROR;\n  }"
    : bus === "spi" ? "  /* Initialize SPI (call your SPI init first) */" : "  /* Initialize UART (call your UART init first) */";

  const busRead = bus === "i2c"
    ? "HAL_I2C_Mem_Read(&hi2c1, " + nameUpper + "_ADDR << 1, reg, I2C_MEMADD_SIZE_8BIT, &value, 1, HAL_MAX_DELAY)"
    : bus === "spi"
    ? "/* SPI read: send reg | 0x80, read response */\n  uint8_t tx = reg | 0x80;\n  HAL_SPI_TransmitReceive(&hspi1, &tx, &value, 1, HAL_MAX_DELAY)"
    : "/* UART read: send command, read response */";

  const busWrite = bus === "i2c"
    ? "HAL_I2C_Mem_Write(&hi2c1, " + nameUpper + "_ADDR << 1, reg, I2C_MEMADD_SIZE_8BIT, &value, 1, HAL_MAX_DELAY)"
    : bus === "spi"
    ? "/* SPI write: send reg & ~0x80, then value */\n  uint8_t tx[2] = { reg & 0x7F, value };\n  HAL_SPI_Transmit(&hspi1, tx, 2, HAL_MAX_DELAY)"
    : "/* UART write: send command + data */";

  const regImpls = registers.map((r) => {
    if (r.rw.includes("r")) return "uint8_t " + name + "_Read" + r.name + "(void) {\n  return " + name + "_ReadReg(" + nameUpper + "_REG_" + r.name.toUpperCase() + ");\n}";
    return "";
  }).concat(registers.map((r) => {
    if (r.rw.includes("w")) return "void " + name + "_Write" + r.name + "(uint8_t value) {\n  " + name + "_WriteReg(" + nameUpper + "_REG_" + r.name.toUpperCase() + ", value);\n}";
    return "";
  })).filter(Boolean).join("\n\n");

  const c = '#include "' + name.toLowerCase() + '.h"\n\n' +
    "HAL_StatusTypeDef " + name + "_Init(void) {\n" + busInit + "\n  return HAL_OK;\n}\n\n" +
    "uint8_t " + name + "_ReadReg(uint8_t reg) {\n  uint8_t value = 0;\n  " + busRead + ";\n  return value;\n}\n\n" +
    "void " + name + "_WriteReg(uint8_t reg, uint8_t value) {\n  " + busWrite + ";\n}\n\n" + regImpls;

  return { h, c };
}

export function generateFreeRTOSTask(taskName: string, stackSize: number, priority: number): string {
  return '/* FreeRTOS Task: ' + taskName + ' */\n#include "FreeRTOS.h"\n#include "task.h"\n\n' +
    "static TaskHandle_t " + taskName + "Handle = NULL;\n\n" +
    "static void " + taskName + "_Task(void *argument) {\n" +
    "  for (;;) {\n    /* Task logic here */\n    vTaskDelay(pdMS_TO_TICKS(100));\n  }\n}\n\n" +
    "void " + taskName + "_Init(void) {\n" +
    "  xTaskCreate(" + taskName + "_Task, \"" + taskName + "\", " + stackSize + ", NULL, " + priority + ", &" + taskName + "Handle);\n}";
}

export function generateFreeRTOSQueue(queueName: string, itemSize: number, length: number): string {
  return '/* FreeRTOS Queue: ' + queueName + ' */\n#include "FreeRTOS.h"\n#include "queue.h"\n\n' +
    "static QueueHandle_t " + queueName + "Queue = NULL;\n\n" +
    "void " + queueName + "_Init(void) {\n  " + queueName + "Queue = xQueueCreate(" + length + ", " + itemSize + ");\n}\n\n" +
    "BaseType_t " + queueName + "_Send(const void *item, TickType_t timeout) {\n  return xQueueSend(" + queueName + "Queue, item, timeout);\n}\n\n" +
    "BaseType_t " + queueName + "_Receive(void *item, TickType_t timeout) {\n  return xQueueReceive(" + queueName + "Queue, item, timeout);\n}";
}

export function generateShell(): string {
  return `/* Simple Command-Line Shell for STM32 */
#include <string.h>
#include <stdio.h>

#define SHELL_MAX_ARGS    8
#define SHELL_MAX_CMDS    32
#define SHELL_BUF_SIZE    128
#define SHELL_PROMPT      "> "

typedef struct {
  const char *name;
  void (*func)(int argc, char *argv[]);
  const char *help;
} ShellCommand;

static ShellCommand cmd_table[SHELL_MAX_CMDS];
static int cmd_count = 0;
static char shell_buf[SHELL_BUF_SIZE];
static int shell_idx = 0;

extern void UART_SendString(const char *str);

void Shell_Register(const char *name, void (*func)(int, char**), const char *help) {
  if (cmd_count < SHELL_MAX_CMDS) {
    cmd_table[cmd_count].name = name;
    cmd_table[cmd_count].func = func;
    cmd_table[cmd_count].help = help;
    cmd_count++;
  }
}

static void Shell_Help(int argc, char *argv[]) {
  (void)argc; (void)argv;
  UART_SendString("Available commands:\\r\\n");
  for (int i = 0; i < cmd_count; i++) {
    char buf[64];
    snprintf(buf, sizeof(buf), "  %-12s - %s\\r\\n", cmd_table[i].name, cmd_table[i].help);
    UART_SendString(buf);
  }
}

void Shell_Init(void) {
  Shell_Register("help", Shell_Help, "Show this help");
}

void Shell_Process(char c) {
  if (c == '\\r' || c == '\\n') {
    UART_SendString("\\r\\n");
    if (shell_idx > 0) {
      shell_buf[shell_idx] = '\\0';
      char *argv[SHELL_MAX_ARGS];
      int argc = 0;
      char *token = strtok(shell_buf, " ");
      while (token && argc < SHELL_MAX_ARGS) {
        argv[argc++] = token;
        token = strtok(NULL, " ");
      }
      if (argc > 0) {
        int found = 0;
        for (int i = 0; i < cmd_count; i++) {
          if (strcmp(argv[0], cmd_table[i].name) == 0) {
            cmd_table[i].func(argc, argv);
            found = 1;
            break;
          }
        }
        if (!found) UART_SendString("Unknown command. Type 'help' for list.\\r\\n");
      }
      shell_idx = 0;
    }
    UART_SendString(SHELL_PROMPT);
  } else if (c == '\\b' || c == 127) {
    if (shell_idx > 0) { shell_idx--; UART_SendString("\\b \\b"); }
  } else if (shell_idx < SHELL_BUF_SIZE - 1) {
    shell_buf[shell_idx++] = c;
    char echo[2] = {c, '\\0'};
    UART_SendString(echo);
  }
}`;
}
