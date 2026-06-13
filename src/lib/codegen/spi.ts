import { lookupAF, getPort, getPinNum } from "../pinmap";

export function generateSPI(instance: string, sckPin: string, misoPin: string, mosiPin: string, mode: number): { h: string; c: string } {
  const name = instance;
  const sckPort = getPort(sckPin); const sckNum = getPinNum(sckPin);
  const misoPort = getPort(misoPin); const misoNum = getPinNum(misoPin);
  const mosiPort = getPort(mosiPin); const mosiNum = getPinNum(mosiPin);
  const cpol = mode >= 2 ? "SPI_POLARITY_HIGH" : "SPI_POLARITY_LOW";
  const cpha = mode % 2 === 1 ? "SPI_PHASE_2EDGE" : "SPI_PHASE_1EDGE";
  const guard = name.toUpperCase() + "_H";
  const sckAF = lookupAF(sckPin, instance, "SCK");
  const misoAF = lookupAF(misoPin, instance, "MISO");
  const mosiAF = lookupAF(mosiPin, instance, "MOSI");

  const h = "#ifndef " + guard + "\n#define " + guard + '\n\n#include "stm32f4xx_hal.h"\n\n' +
    "extern SPI_HandleTypeDef h" + name.toLowerCase() + ";\n\n" +
    "void " + name + "_Init(void);\n" +
    "uint8_t " + name + "_Transfer(uint8_t txData);\n" +
    "void " + name + "_Transmit(const uint8_t *data, uint16_t len);\n" +
    "void " + name + "_Receive(uint8_t *data, uint16_t len);\n" +
    "void " + name + "_TransmitReceive(const uint8_t *txData, uint8_t *rxData, uint16_t len);\n\n" +
    "#endif /* " + guard + " */";

  const ports = [sckPort, misoPort, mosiPort];
  const uniquePorts = [...new Set(ports)];
  const clkEnables = uniquePorts.map((p) => "  __HAL_RCC_" + p + "_CLK_ENABLE();").join("\n");
  const pinDefs = [
    { port: sckPort, num: sckNum, af: sckAF },
    { port: misoPort, num: misoNum, af: misoAF },
    { port: mosiPort, num: mosiNum, af: mosiAF },
  ];

  const samePort = uniquePorts.length === 1;
  let gpioInit: string;
  if (samePort) {
    gpioInit =
      "  GPIO_InitTypeDef GPIO_InitStruct = {0};\n" +
      "  GPIO_InitStruct.Pin = " + sckPort + "_PIN_" + sckNum + " | " + misoPort + "_PIN_" + misoNum + " | " + mosiPort + "_PIN_" + mosiNum + ";\n" +
      "  GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;\n" +
      "  GPIO_InitStruct.Pull = GPIO_NOPULL;\n" +
      "  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;\n" +
      "  GPIO_InitStruct.Alternate = " + sckAF + ";\n" +
      "  HAL_GPIO_Init(" + sckPort + ", &GPIO_InitStruct);\n";
  } else {
    gpioInit = pinDefs.map((p, i) =>
      "  GPIO_InitTypeDef GPIO_InitStruct_" + i + " = {0};\n" +
      "  GPIO_InitStruct_" + i + ".Pin = " + p.port + "_PIN_" + p.num + ";\n" +
      "  GPIO_InitStruct_" + i + ".Mode = GPIO_MODE_AF_PP;\n" +
      "  GPIO_InitStruct_" + i + ".Pull = GPIO_NOPULL;\n" +
      "  GPIO_InitStruct_" + i + ".Speed = GPIO_SPEED_FREQ_HIGH;\n" +
      "  GPIO_InitStruct_" + i + ".Alternate = " + p.af + ";\n" +
      "  HAL_GPIO_Init(" + p.port + ", &GPIO_InitStruct_" + i + ");\n"
    ).join("\n");
  }

  const c = '#include "' + name.toLowerCase() + '.h"\n\n' +
    "SPI_HandleTypeDef h" + name.toLowerCase() + ";\n\n" +
    "void " + name + "_Init(void) {\n" +
    clkEnables + "\n" +
    "  __HAL_RCC_" + instance + "_CLK_ENABLE();\n\n" +
    gpioInit + "\n" +
    "  h" + name.toLowerCase() + ".Instance = " + instance + ";\n" +
    "  h" + name.toLowerCase() + ".Init.Mode = SPI_MODE_MASTER;\n" +
    "  h" + name.toLowerCase() + ".Init.Direction = SPI_DIRECTION_2LINES;\n" +
    "  h" + name.toLowerCase() + ".Init.DataSize = SPI_DATASIZE_8BIT;\n" +
    "  h" + name.toLowerCase() + ".Init.CLKPolarity = " + cpol + ";\n" +
    "  h" + name.toLowerCase() + ".Init.CLKPhase = " + cpha + ";\n" +
    "  h" + name.toLowerCase() + ".Init.NSS = SPI_NSS_SOFT;\n" +
    "  h" + name.toLowerCase() + ".Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_16;\n" +
    "  h" + name.toLowerCase() + ".Init.FirstBit = SPI_FIRSTBIT_MSB;\n" +
    "  h" + name.toLowerCase() + ".Init.TIMode = SPI_TIMODE_DISABLE;\n" +
    "  h" + name.toLowerCase() + ".Init.CRCCalculation = SPI_CRCCALCULATION_DISABLE;\n" +
    "  HAL_SPI_Init(&h" + name.toLowerCase() + ");\n}\n\n" +
    "uint8_t " + name + "_Transfer(uint8_t txData) {\n" +
    "  uint8_t rxData;\n" +
    "  HAL_SPI_TransmitReceive(&h" + name.toLowerCase() + ", &txData, &rxData, 1, HAL_MAX_DELAY);\n" +
    "  return rxData;\n}\n\n" +
    "void " + name + "_Transmit(const uint8_t *data, uint16_t len) {\n" +
    "  HAL_SPI_Transmit(&h" + name.toLowerCase() + ", (uint8_t *)data, len, HAL_MAX_DELAY);\n}\n\n" +
    "void " + name + "_Receive(uint8_t *data, uint16_t len) {\n" +
    "  HAL_SPI_Receive(&h" + name.toLowerCase() + ", data, len, HAL_MAX_DELAY);\n}\n\n" +
    "void " + name + "_TransmitReceive(const uint8_t *txData, uint8_t *rxData, uint16_t len) {\n" +
    "  HAL_SPI_TransmitReceive(&h" + name.toLowerCase() + ", (uint8_t *)txData, rxData, len, HAL_MAX_DELAY);\n}";

  return { h, c };
}
