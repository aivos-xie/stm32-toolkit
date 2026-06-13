export function generateProjectScaffold(projectName: string, mcu: string, includeFreeRTOS: boolean): Record<string, string> {
  const files: Record<string, string> = {};
  const freertosSrc = includeFreeRTOS ? `\\
Middlewares/FreeRTOS/Source/croutine.c \\
Middlewares/FreeRTOS/Source/event_groups.c \\
Middlewares/FreeRTOS/Source/list.c \\
Middlewares/FreeRTOS/Source/queue.c \\
Middlewares/FreeRTOS/Source/stream_buffer.c \\
Middlewares/FreeRTOS/Source/tasks.c \\
Middlewares/FreeRTOS/Source/timers.c \\
Middlewares/FreeRTOS/Source/portable/MemMang/heap_4.c \\
Middlewares/FreeRTOS/Source/portable/GCC/ARM_CM4F/port.c` : "";
  const freertosInc = includeFreeRTOS ? `\\
-IMiddlewares/FreeRTOS/Source/include \\
-IMiddlewares/FreeRTOS/Source/portable/GCC/ARM_CM4F` : "";

  files["Makefile"] = `# ` + projectName + ` - STM32 Makefile
# Target: ` + mcu + `

TARGET = ` + projectName + `
MCU = ` + mcu + `

PREFIX = arm-none-eabi-
CC = $(PREFIX)gcc
CXX = $(PREFIX)g++
AS = $(PREFIX)gcc -x assembler-with-cpp
CP = $(PREFIX)objcopy
SZ = $(PREFIX)size
HEX = $(CP) -O ihex
BIN = $(CP) -O binary -S

C_SOURCES = \\
Core/Src/main.c \\
Core/Src/stm32f4xx_it.c \\
Core/Src/stm32f4xx_hal_msp.c \\
Core/Src/system_stm32f4xx.c` + freertosSrc + `

C_INCLUDES = \\
-ICore/Inc \\
-IDrivers/CMSIS/Include \\
-IDrivers/CMSIS/Device/ST/STM32F4xx/Include \\
-IDrivers/STM32F4xx_HAL_Driver/Inc` + freertosInc + `

CPU = -mcpu=cortex-m4
FPU = -mfpu=fpv4-sp-d16 -mfloat-abi=hard
CFLAGS = $(CPU) -mthumb $(FPU) -Wall -fdata-sections -ffunction-sections
CFLAGS += -DSTM32F407xx -DUSE_HAL_DRIVER
LDFLAGS = $(CPU) -mthumb $(FPU) -specs=nano.specs -T STM32F407VGTx_FLASH.ld -lc -lm -lnosys -Wl,-Map=$(TARGET).map,--cref -Wl,--gc-sections

all: $(TARGET).elf $(TARGET).hex $(TARGET).bin

%.o: %.c
\t$(CC) -c $(CFLAGS) $(C_INCLUDES) $< -o $@

$(TARGET).elf: $(C_SOURCES:.c=.o)
\t$(CC) $^ $(LDFLAGS) -o $@
\t$(SZ) $@

%.hex: %.elf
\t$(HEX) $< $@

%.bin: %.elf
\t$(BIN) $< $@

flash: $(TARGET).bin
\tst-flash write $(TARGET).bin 0x8000000

clean:
\trm -f $(C_SOURCES:.c=.o) $(TARGET).elf $(TARGET).hex $(TARGET).bin $(TARGET).map

.PHONY: all flash clean
`;

  const freertosTask = includeFreeRTOS ? `
static void StartDefaultTask(void *argument) {
  for (;;) {
    HAL_GPIO_TogglePin(GPIOD, GPIO_PIN_12);
    vTaskDelay(pdMS_TO_TICKS(500));
  }
}` : "";

  const freertosMain = includeFreeRTOS
    ? `  xTaskCreate(StartDefaultTask, "DefaultTask", 256, NULL, 1, NULL);
  vTaskStartScheduler();`
    : `  while (1) {
    HAL_GPIO_TogglePin(GPIOD, GPIO_PIN_12);
    HAL_Delay(500);
  }`;

  files["Core/Src/main.c"] = `#include "main.h"
` + (includeFreeRTOS ? '#include "FreeRTOS.h"\n#include "task.h"\n' : "") + `
UART_HandleTypeDef huart2;

void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_USART2_UART_Init(void);
` + (includeFreeRTOS ? "static void StartDefaultTask(void *argument);\n" : "") + `
int main(void) {
  HAL_Init();
  SystemClock_Config();
  MX_GPIO_Init();
  MX_USART2_UART_Init();

` + freertosMain + `
}
` + freertosTask + `

void SystemClock_Config(void) {
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};
  __HAL_RCC_PWR_CLK_ENABLE();
  __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE1);
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE;
  RCC_OscInitStruct.HSEState = RCC_HSE_ON;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
  RCC_OscInitStruct.PLL.PLLM = 8;
  RCC_OscInitStruct.PLL.PLLN = 336;
  RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV2;
  RCC_OscInitStruct.PLL.PLLQ = 7;
  HAL_RCC_OscConfig(&RCC_OscInitStruct);
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK|RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV4;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV2;
  HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_5);
}

static void MX_USART2_UART_Init(void) {
  huart2.Instance = USART2;
  huart2.Init.BaudRate = 115200;
  huart2.Init.WordLength = UART_WORDLENGTH_8B;
  huart2.Init.StopBits = UART_STOPBITS_1;
  huart2.Init.Parity = UART_PARITY_NONE;
  huart2.Init.Mode = UART_MODE_TX_RX;
  huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart2.Init.OverSampling = UART_OVERSAMPLING_16;
  HAL_UART_Init(&huart2);
}

static void MX_GPIO_Init(void) {
  GPIO_InitTypeDef GPIO_InitStruct = {0};
  __HAL_RCC_GPIOD_CLK_ENABLE();
  GPIO_InitStruct.Pin = GPIO_PIN_12|GPIO_PIN_13|GPIO_PIN_14|GPIO_PIN_15;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOD, &GPIO_InitStruct);
}
`;

  files["Core/Inc/main.h"] = `#ifndef __MAIN_H
#define __MAIN_H

#include "stm32f4xx_hal.h"
` + (includeFreeRTOS ? '#include "FreeRTOS.h"\n#include "task.h"\n' : "") + `
void Error_Handler(void);

#endif
`;

  files["README.md"] = `# ` + projectName + `

STM32 project for ` + mcu + `.

## Build
` + "```bash\nmake\n```" + `

## Flash
` + "```bash\nmake flash\n```" + `

## Structure
- Core/ - Application code
- Drivers/ - HAL and CMSIS
` + (includeFreeRTOS ? "- Middlewares/ - FreeRTOS\n" : "");

  return files;
}
