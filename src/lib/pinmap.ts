export interface PinFunction {
  pin: string;
  af: string;
  function: string;
}

export interface PeripheralPins {
  [peripheral: string]: PinFunction[];
}

export const STM32F4_PINS: PeripheralPins = {
  USART1_TX: [
    { pin: "PA9", af: "AF7", function: "USART1_TX" },
    { pin: "PB6", af: "AF7", function: "USART1_TX" },
  ],
  USART1_RX: [
    { pin: "PA10", af: "AF7", function: "USART1_RX" },
    { pin: "PB7", af: "AF7", function: "USART1_RX" },
  ],
  USART2_TX: [
    { pin: "PA2", af: "AF7", function: "USART2_TX" },
    { pin: "PD5", af: "AF7", function: "USART2_TX" },
  ],
  USART2_RX: [
    { pin: "PA3", af: "AF7", function: "USART2_RX" },
    { pin: "PD6", af: "AF7", function: "USART2_RX" },
  ],
  USART3_TX: [
    { pin: "PB10", af: "AF7", function: "USART3_TX" },
    { pin: "PC10", af: "AF7", function: "USART3_TX" },
  ],
  USART3_RX: [
    { pin: "PB11", af: "AF7", function: "USART3_RX" },
    { pin: "PC11", af: "AF7", function: "USART3_RX" },
  ],
  SPI1_SCK: [
    { pin: "PA5", af: "AF5", function: "SPI1_SCK" },
    { pin: "PB3", af: "AF5", function: "SPI1_SCK" },
  ],
  SPI1_MISO: [
    { pin: "PA6", af: "AF5", function: "SPI1_MISO" },
    { pin: "PB4", af: "AF5", function: "SPI1_MISO" },
  ],
  SPI1_MOSI: [
    { pin: "PA7", af: "AF5", function: "SPI1_MOSI" },
    { pin: "PB5", af: "AF5", function: "SPI1_MOSI" },
  ],
  SPI2_SCK: [{ pin: "PB13", af: "AF5", function: "SPI2_SCK" }],
  SPI2_MISO: [{ pin: "PB14", af: "AF5", function: "SPI2_MISO" }],
  SPI2_MOSI: [{ pin: "PB15", af: "AF5", function: "SPI2_MOSI" }],
  I2C1_SCL: [
    { pin: "PB6", af: "AF4", function: "I2C1_SCL" },
    { pin: "PB8", af: "AF4", function: "I2C1_SCL" },
  ],
  I2C1_SDA: [
    { pin: "PB7", af: "AF4", function: "I2C1_SDA" },
    { pin: "PB9", af: "AF4", function: "I2C1_SDA" },
  ],
  I2C2_SCL: [{ pin: "PB10", af: "AF4", function: "I2C2_SCL" }],
  I2C2_SDA: [{ pin: "PB11", af: "AF4", function: "I2C2_SDA" }],
  TIM2_CH1: [{ pin: "PA0", af: "AF1", function: "TIM2_CH1" }, { pin: "PA5", af: "AF1", function: "TIM2_CH1" }, { pin: "PA15", af: "AF1", function: "TIM2_CH1" }],
  TIM2_CH2: [{ pin: "PA1", af: "AF1", function: "TIM2_CH2" }, { pin: "PB3", af: "AF1", function: "TIM2_CH2" }],
  TIM2_CH3: [{ pin: "PA2", af: "AF1", function: "TIM2_CH3" }, { pin: "PB10", af: "AF1", function: "TIM2_CH3" }],
  TIM2_CH4: [{ pin: "PA3", af: "AF1", function: "TIM2_CH4" }, { pin: "PB11", af: "AF1", function: "TIM2_CH4" }],
  TIM3_CH1: [{ pin: "PA6", af: "AF2", function: "TIM3_CH1" }, { pin: "PB4", af: "AF2", function: "TIM3_CH1" }, { pin: "PC6", af: "AF2", function: "TIM3_CH1" }],
  TIM3_CH2: [{ pin: "PA7", af: "AF2", function: "TIM3_CH2" }, { pin: "PB5", af: "AF2", function: "TIM3_CH2" }, { pin: "PC7", af: "AF2", function: "TIM3_CH2" }],
  TIM3_CH3: [{ pin: "PB0", af: "AF2", function: "TIM3_CH3" }, { pin: "PC8", af: "AF2", function: "TIM3_CH3" }],
  TIM3_CH4: [{ pin: "PB1", af: "AF2", function: "TIM3_CH4" }, { pin: "PC9", af: "AF2", function: "TIM3_CH4" }],
  TIM4_CH1: [{ pin: "PB6", af: "AF2", function: "TIM4_CH1" }],
  TIM4_CH2: [{ pin: "PB7", af: "AF2", function: "TIM4_CH2" }],
  TIM4_CH3: [{ pin: "PB8", af: "AF2", function: "TIM4_CH3" }],
  TIM4_CH4: [{ pin: "PB9", af: "AF2", function: "TIM4_CH4" }],
  TIM5_CH1: [{ pin: "PA0", af: "AF2", function: "TIM5_CH1" }],
  TIM5_CH2: [{ pin: "PA1", af: "AF2", function: "TIM5_CH2" }],
  TIM5_CH3: [{ pin: "PA2", af: "AF2", function: "TIM5_CH3" }],
  TIM5_CH4: [{ pin: "PA3", af: "AF2", function: "TIM5_CH4" }],
};

export const UART_DMA_MAP: Record<string, { rxStream: string; rxChannel: string; txStream: string; txChannel: string }> = {
  USART1: { rxStream: "DMA2_Stream2", rxChannel: "DMA_CHANNEL_4", txStream: "DMA2_Stream7", txChannel: "DMA_CHANNEL_4" },
  USART2: { rxStream: "DMA1_Stream5", rxChannel: "DMA_CHANNEL_4", txStream: "DMA1_Stream6", txChannel: "DMA_CHANNEL_4" },
  USART3: { rxStream: "DMA1_Stream1", rxChannel: "DMA_CHANNEL_4", txStream: "DMA1_Stream3", txChannel: "DMA_CHANNEL_4" },
};

export function getAF(pin: string, functionKey: string): string {
  const entries = STM32F4_PINS[functionKey];
  if (!entries) return "AF0";
  const match = entries.find((e) => e.pin === pin);
  return match ? match.af : "AF0";
}

export function lookupAF(pin: string, instance: string, signal: string): string {
  const key = instance + "_" + signal;
  return getAF(pin, key);
}

export function getPort(pin: string): string {
  return pin.slice(0, 2);
}

export function getPinNum(pin: string): string {
  return pin.slice(2);
}

export const MCU_SERIES = [
  "STM32F103", "STM32F407", "STM32F429", "STM32F746",
  "STM32G070", "STM32G431", "STM32H743", "STM32L476",
];

export const MCU_FAMILIES = ["STM32F1", "STM32F4", "STM32G0", "STM32G4", "STM32H7", "STM32L4"];
