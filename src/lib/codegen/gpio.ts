import { getPort, getPinNum } from "../pinmap";

function headerGuard(name: string): string {
  const guard = name.toUpperCase() + "_H";
  return "#ifndef " + guard + "\n#define " + guard;
}

function headerFooter(name: string): string {
  return "#endif /* " + name.toUpperCase() + "_H */";
}

export function generateGPIO(pin: string, mode: string, pull: string, label: string): { h: string; c: string } {
  const port = getPort(pin);
  const pinNum = getPinNum(pin);
  const name = label || "GPIO_" + pin;
  const modeMap: Record<string, string> = {
    output: "GPIO_MODE_OUTPUT_PP", input: "GPIO_MODE_INPUT",
    analog: "GPIO_MODE_ANALOG", af: "GPIO_MODE_AF_PP",
  };
  const pullMap: Record<string, string> = {
    none: "GPIO_NOPULL", up: "GPIO_PULLUP", down: "GPIO_PULLDOWN",
  };
  const speedMap: Record<string, string> = {
    output: "GPIO_SPEED_FREQ_HIGH", input: "GPIO_SPEED_FREQ_LOW",
    analog: "GPIO_SPEED_FREQ_LOW", af: "GPIO_SPEED_FREQ_HIGH",
  };

  const h = headerGuard(name) + '\n\n#include "stm32f4xx_hal.h"\n\n' +
    "void " + name + "_Init(void);\n" +
    "void " + name + "_Write(GPIO_PinState state);\n" +
    "GPIO_PinState " + name + "_Read(void);\n" +
    "void " + name + "_Toggle(void);\n\n" + headerFooter(name);

  const c = '#include "' + name.toLowerCase() + '.h"\n\n' +
    "void " + name + "_Init(void) {\n" +
    "  __HAL_RCC_" + port + "_CLK_ENABLE();\n" +
    "  GPIO_InitTypeDef GPIO_InitStruct = {0};\n" +
    "  GPIO_InitStruct.Pin = " + port + "_PIN_" + pinNum + ";\n" +
    "  GPIO_InitStruct.Mode = " + (modeMap[mode] || "GPIO_MODE_OUTPUT_PP") + ";\n" +
    "  GPIO_InitStruct.Pull = " + (pullMap[pull] || "GPIO_NOPULL") + ";\n" +
    "  GPIO_InitStruct.Speed = " + (speedMap[mode] || "GPIO_SPEED_FREQ_LOW") + ";\n" +
    "  HAL_GPIO_Init(" + port + ", &GPIO_InitStruct);\n}\n\n" +
    "void " + name + "_Write(GPIO_PinState state) {\n" +
    "  HAL_GPIO_WritePin(" + port + ", " + port + "_PIN_" + pinNum + ", state);\n}\n\n" +
    "GPIO_PinState " + name + "_Read(void) {\n" +
    "  return HAL_GPIO_ReadPin(" + port + ", " + port + "_PIN_" + pinNum + ");\n}\n\n" +
    "void " + name + "_Toggle(void) {\n" +
    "  HAL_GPIO_TogglePin(" + port + ", " + port + "_PIN_" + pinNum + ");\n}";

  return { h, c };
}
