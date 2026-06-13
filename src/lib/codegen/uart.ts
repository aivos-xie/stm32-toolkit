import { UART_DMA_MAP, lookupAF, getPort, getPinNum } from "../pinmap";

export function generateUART(instance: string, txPin: string, rxPin: string, baudRate: number, useDMA: boolean): { h: string; c: string } {
  const name = instance;
  const txPort = getPort(txPin);
  const txNum = getPinNum(txPin);
  const rxPort = getPort(rxPin);
  const rxNum = getPinNum(rxPin);
  const guard = name.toUpperCase() + "_H";
  const txAF = lookupAF(txPin, instance, "TX");
  const rxAF = lookupAF(rxPin, instance, "RX");
  const dma = UART_DMA_MAP[instance] || UART_DMA_MAP.USART1;

  const h = "#ifndef " + guard + "\n#define " + guard + '\n\n#include "stm32f4xx_hal.h"\n#include <stdio.h>\n#include <string.h>\n\n' +
    "#define " + name + "_RX_BUF_SIZE 256\n\n" +
    "extern UART_HandleTypeDef h" + name.toLowerCase() + ";\n" +
    (useDMA ? "extern DMA_HandleTypeDef hdma_" + name.toLowerCase() + "_rx;\nextern DMA_HandleTypeDef hdma_" + name.toLowerCase() + "_tx;\n" : "") +
    "\nvoid " + name + "_Init(void);\n" +
    "void " + name + "_Send(const uint8_t *data, uint16_t len);\n" +
    "void " + name + "_SendString(const char *str);\n" +
    "void " + name + "_Printf(const char *fmt, ...);\n" +
    "uint16_t " + name + "_Available(void);\n" +
    "uint8_t " + name + "_Read(void);\n" +
    "void " + name + "_RxCallback(uint8_t data);\n\n" +
    "#endif /* " + guard + " */";

  const txClk = txPort !== rxPort ? "  __HAL_RCC_" + txPort + "_CLK_ENABLE();\n" : "";
  const txInit = txPort !== rxPort
    ? "  GPIO_InitTypeDef GPIO_InitStruct_Tx = {0};\n" +
      "  GPIO_InitStruct_Tx.Pin = " + txPort + "_PIN_" + txNum + ";\n" +
      "  GPIO_InitStruct_Tx.Mode = GPIO_MODE_AF_PP;\n" +
      "  GPIO_InitStruct_Tx.Pull = GPIO_PULLUP;\n" +
      "  GPIO_InitStruct_Tx.Speed = GPIO_SPEED_FREQ_HIGH;\n" +
      "  GPIO_InitStruct_Tx.Alternate = " + txAF + ";\n" +
      "  HAL_GPIO_Init(" + txPort + ", &GPIO_InitStruct_Tx);\n"
    : "";

  const dmaInit = useDMA ? `
static void ` + name + `_DMA_Init(void) {
  __HAL_RCC_DMA2_CLK_ENABLE();
  hdma_` + name.toLowerCase() + `_rx.Instance = ` + dma.rxStream + `;
  hdma_` + name.toLowerCase() + `_rx.Init.Channel = ` + dma.rxChannel + `;
  hdma_` + name.toLowerCase() + `_rx.Init.Direction = DMA_PERIPH_TO_MEMORY;
  hdma_` + name.toLowerCase() + `_rx.Init.PeriphInc = DMA_PINC_DISABLE;
  hdma_` + name.toLowerCase() + `_rx.Init.MemInc = DMA_MINC_ENABLE;
  hdma_` + name.toLowerCase() + `_rx.Init.PeriphDataAlignment = DMA_PDATAALIGN_BYTE;
  hdma_` + name.toLowerCase() + `_rx.Init.MemDataAlignment = DMA_MDATAALIGN_BYTE;
  hdma_` + name.toLowerCase() + `_rx.Init.Mode = DMA_CIRCULAR;
  hdma_` + name.toLowerCase() + `_rx.Init.Priority = DMA_PRIORITY_HIGH;
  HAL_DMA_Init(&hdma_` + name.toLowerCase() + `_rx);
  __HAL_LINKDMA(&h` + name.toLowerCase() + `, hdmarx, hdma_` + name.toLowerCase() + `_rx);

  hdma_` + name.toLowerCase() + `_tx.Instance = ` + dma.txStream + `;
  hdma_` + name.toLowerCase() + `_tx.Init.Channel = ` + dma.txChannel + `;
  hdma_` + name.toLowerCase() + `_tx.Init.Direction = DMA_MEMORY_TO_PERIPH;
  hdma_` + name.toLowerCase() + `_tx.Init.PeriphInc = DMA_PINC_DISABLE;
  hdma_` + name.toLowerCase() + `_tx.Init.MemInc = DMA_MINC_ENABLE;
  hdma_` + name.toLowerCase() + `_tx.Init.PeriphDataAlignment = DMA_PDATAALIGN_BYTE;
  hdma_` + name.toLowerCase() + `_tx.Init.MemDataAlignment = DMA_MDATAALIGN_BYTE;
  hdma_` + name.toLowerCase() + `_tx.Init.Mode = DMA_NORMAL;
  hdma_` + name.toLowerCase() + `_tx.Init.Priority = DMA_PRIORITY_HIGH;
  HAL_DMA_Init(&hdma_` + name.toLowerCase() + `_tx);
  __HAL_LINKDMA(&h` + name.toLowerCase() + `, hdmatx, hdma_` + name.toLowerCase() + `_tx);
}` : "";

  const c = '#include "' + name.toLowerCase() + '.h"\n#include <stdarg.h>\n\n' +
    "UART_HandleTypeDef h" + name.toLowerCase() + ";\n" +
    (useDMA ? "DMA_HandleTypeDef hdma_" + name.toLowerCase() + "_rx;\nDMA_HandleTypeDef hdma_" + name.toLowerCase() + "_tx;\n" : "") +
    "\nstatic uint8_t rx_buf[" + name + "_RX_BUF_SIZE];\n" +
    "static volatile uint16_t rx_head = 0;\n" +
    "static volatile uint16_t rx_tail = 0;\n\n" +
    "void " + name + "_Init(void) {\n" +
    "  __HAL_RCC_" + txPort + "_CLK_ENABLE();\n" +
    txClk +
    "  __HAL_RCC_" + instance + "_CLK_ENABLE();\n\n" +
    "  GPIO_InitTypeDef GPIO_InitStruct = {0};\n" +
    "  GPIO_InitStruct.Pin = " + txPort + "_PIN_" + txNum + (txPort === rxPort ? " | " + rxPort + "_PIN_" + rxNum : "") + ";\n" +
    "  GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;\n" +
    "  GPIO_InitStruct.Pull = GPIO_PULLUP;\n" +
    "  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;\n" +
    "  GPIO_InitStruct.Alternate = " + txAF + ";\n" +
    "  HAL_GPIO_Init(" + txPort + ", &GPIO_InitStruct);\n" +
    txInit +
    (txPort === rxPort ? "" :
      "  GPIO_InitTypeDef GPIO_InitStruct_Rx = {0};\n" +
      "  GPIO_InitStruct_Rx.Pin = " + rxPort + "_PIN_" + rxNum + ";\n" +
      "  GPIO_InitStruct_Rx.Mode = GPIO_MODE_AF_PP;\n" +
      "  GPIO_InitStruct_Rx.Pull = GPIO_PULLUP;\n" +
      "  GPIO_InitStruct_Rx.Speed = GPIO_SPEED_FREQ_HIGH;\n" +
      "  GPIO_InitStruct_Rx.Alternate = " + rxAF + ";\n" +
      "  HAL_GPIO_Init(" + rxPort + ", &GPIO_InitStruct_Rx);\n") +
    "\n" +
    (useDMA ? "  " + name + "_DMA_Init();\n\n" : "") +
    "  h" + name.toLowerCase() + ".Instance = " + instance + ";\n" +
    "  h" + name.toLowerCase() + ".Init.BaudRate = " + baudRate + ";\n" +
    "  h" + name.toLowerCase() + ".Init.WordLength = UART_WORDLENGTH_8B;\n" +
    "  h" + name.toLowerCase() + ".Init.StopBits = UART_STOPBITS_1;\n" +
    "  h" + name.toLowerCase() + ".Init.Parity = UART_PARITY_NONE;\n" +
    "  h" + name.toLowerCase() + ".Init.Mode = UART_MODE_TX_RX;\n" +
    "  h" + name.toLowerCase() + ".Init.HwFlowCtl = UART_HWCONTROL_NONE;\n" +
    "  h" + name.toLowerCase() + ".Init.OverSampling = UART_OVERSAMPLING_16;\n" +
    "  HAL_UART_Init(&h" + name.toLowerCase() + ");\n\n" +
    (useDMA
      ? "  HAL_UART_Receive_DMA(&h" + name.toLowerCase() + ", rx_buf, " + name + "_RX_BUF_SIZE);\n"
      : "  __HAL_UART_ENABLE_IT(&h" + name.toLowerCase() + ", UART_IT_RXNE);\n") +
    "}\n" + dmaInit + "\n" +
    "void " + name + "_Send(const uint8_t *data, uint16_t len) {\n" +
    (useDMA
      ? "  HAL_UART_Transmit_DMA(&h" + name.toLowerCase() + ", (uint8_t *)data, len);\n"
      : "  HAL_UART_Transmit(&h" + name.toLowerCase() + ", (uint8_t *)data, len, HAL_MAX_DELAY);\n") +
    "}\n\n" +
    "void " + name + "_SendString(const char *str) {\n  " + name + "_Send((const uint8_t *)str, strlen(str));\n}\n\n" +
    "void " + name + "_Printf(const char *fmt, ...) {\n" +
    "  char buf[256];\n  va_list args;\n  va_start(args, fmt);\n" +
    "  vsnprintf(buf, sizeof(buf), fmt, args);\n  va_end(args);\n" +
    "  " + name + "_SendString(buf);\n}\n\n" +
    "uint16_t " + name + "_Available(void) {\n  return (rx_head - rx_tail) % " + name + "_RX_BUF_SIZE;\n}\n\n" +
    "uint8_t " + name + "_Read(void) {\n  while (rx_head == rx_tail);\n" +
    "  uint8_t data = rx_buf[rx_tail];\n  rx_tail = (rx_tail + 1) % " + name + "_RX_BUF_SIZE;\n  return data;\n}\n\n" +
    "__weak void " + name + "_RxCallback(uint8_t data) { (void)data; }\n\n" +
    "void " + instance + "_IRQHandler(void) {\n  HAL_UART_IRQHandler(&h" + name.toLowerCase() + ");\n}\n\n" +
    "void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart) {\n" +
    "  if (huart->Instance == " + instance + ") {\n" +
    "    " + name + "_RxCallback(rx_buf[(rx_head + " + name + "_RX_BUF_SIZE - 1) % " + name + "_RX_BUF_SIZE]);\n" +
    "    rx_head = (rx_head + 1) % " + name + "_RX_BUF_SIZE;\n" +
    (useDMA ? "" : "    HAL_UART_Receive_IT(&h" + name.toLowerCase() + ", &rx_buf[rx_head], 1);\n") +
    "  }\n}\n\n" +
    "#ifdef __GNUC__\nint _write(int file, char *ptr, int len) {\n" +
    "  " + name + "_Send((uint8_t *)ptr, len);\n  return len;\n}\n#endif";

  return { h, c };
}
