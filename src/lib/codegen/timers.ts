import { lookupAF, getPort, getPinNum } from "../pinmap";

const APB2_TIMERS = ["TIM1", "TIM8", "TIM9", "TIM10", "TIM11"];

export function generateTimerPWM(tim: string, channel: number, pin: string, frequency: number): { h: string; c: string } {
  const name = tim + "_CH" + channel;
  const port = getPort(pin); const pinNum = getPinNum(pin);
  const chMap: Record<number, string> = { 1: "CHANNEL_1", 2: "CHANNEL_2", 3: "CHANNEL_3", 4: "CHANNEL_4" };
  const guard = name.toUpperCase() + "_H";
  const af = lookupAF(pin, tim, "CH" + channel);
  const isApb2 = APB2_TIMERS.includes(tim);

  const h = "#ifndef " + guard + "\n#define " + guard + '\n\n#include "stm32f4xx_hal.h"\n\n' +
    "extern TIM_HandleTypeDef h" + tim.toLowerCase() + ";\n\n" +
    "void " + name + "_Init(void);\n" +
    "void " + name + "_SetDuty(uint16_t duty);\n" +
    "void " + name + "_Start(void);\n" +
    "void " + name + "_Stop(void);\n\n" +
    "#endif /* " + guard + " */";

  const clkExpr = isApb2
    ? "HAL_RCC_GetPCLK2Freq() * ((RCC->CFGR & RCC_CFGR_PPRE2) == 0 ? 1 : 2)"
    : "HAL_RCC_GetPCLK1Freq() * ((RCC->CFGR & RCC_CFGR_PPRE1) == 0 ? 1 : 2)";

  const c = '#include "' + name.toLowerCase() + '.h"\n\n' +
    "TIM_HandleTypeDef h" + tim.toLowerCase() + ";\n" +
    "static uint32_t period_val = 0;\n\n" +
    "void " + name + "_Init(void) {\n" +
    "  __HAL_RCC_" + port + "_CLK_ENABLE();\n" +
    "  __HAL_RCC_" + tim + "_CLK_ENABLE();\n\n" +
    "  GPIO_InitTypeDef GPIO_InitStruct = {0};\n" +
    "  GPIO_InitStruct.Pin = " + port + "_PIN_" + pinNum + ";\n" +
    "  GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;\n" +
    "  GPIO_InitStruct.Pull = GPIO_NOPULL;\n" +
    "  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;\n" +
    "  GPIO_InitStruct.Alternate = " + af + ";\n" +
    "  HAL_GPIO_Init(" + port + ", &GPIO_InitStruct);\n\n" +
    "  uint32_t tim_clk = " + clkExpr + ";\n" +
    "  period_val = tim_clk / " + frequency + " - 1;\n\n" +
    "  h" + tim.toLowerCase() + ".Instance = " + tim + ";\n" +
    "  h" + tim.toLowerCase() + ".Init.Prescaler = 0;\n" +
    "  h" + tim.toLowerCase() + ".Init.CounterMode = TIM_COUNTERMODE_UP;\n" +
    "  h" + tim.toLowerCase() + ".Init.Period = period_val;\n" +
    "  h" + tim.toLowerCase() + ".Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;\n" +
    "  h" + tim.toLowerCase() + ".Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_ENABLE;\n" +
    "  HAL_TIM_PWM_Init(&h" + tim.toLowerCase() + ");\n\n" +
    "  TIM_OC_InitTypeDef sConfigOC = {0};\n" +
    "  sConfigOC.OCMode = TIM_OCMODE_PWM1;\n" +
    "  sConfigOC.Pulse = 0;\n" +
    "  sConfigOC.OCPolarity = TIM_OCPOLARITY_HIGH;\n" +
    "  sConfigOC.OCFastMode = TIM_OCFAST_DISABLE;\n" +
    "  HAL_TIM_PWM_ConfigChannel(&h" + tim.toLowerCase() + ", &sConfigOC, TIM_" + chMap[channel] + ");\n}\n\n" +
    "void " + name + "_SetDuty(uint16_t duty) {\n" +
    "  uint32_t pulse = (uint32_t)duty * period_val / 1000;\n" +
    "  __HAL_TIM_SET_COMPARE(&h" + tim.toLowerCase() + ", TIM_" + chMap[channel] + ", pulse);\n}\n\n" +
    "void " + name + "_Start(void) {\n" +
    "  HAL_TIM_PWM_Start(&h" + tim.toLowerCase() + ", TIM_" + chMap[channel] + ");\n}\n\n" +
    "void " + name + "_Stop(void) {\n" +
    "  HAL_TIM_PWM_Stop(&h" + tim.toLowerCase() + ", TIM_" + chMap[channel] + ");\n}";

  return { h, c };
}

export function generateADC(adc: string, channel: number, pin: string, useDMA: boolean): { h: string; c: string } {
  const name = adc + "_CH" + channel;
  const port = getPort(pin); const pinNum = getPinNum(pin);
  const guard = name.toUpperCase() + "_H";

  const h = "#ifndef " + guard + "\n#define " + guard + '\n\n#include "stm32f4xx_hal.h"\n\n' +
    "extern ADC_HandleTypeDef h" + adc.toLowerCase() + ";\n" +
    (useDMA ? "extern DMA_HandleTypeDef hdma_" + adc.toLowerCase() + ";\n" : "") +
    "\nvoid " + name + "_Init(void);\n" +
    "uint32_t " + name + "_Read(void);\n" +
    "float " + name + "_ReadVoltage(float vref);\n\n" +
    "#endif /* " + guard + " */";

  const c = '#include "' + name.toLowerCase() + '.h"\n\n' +
    "ADC_HandleTypeDef h" + adc.toLowerCase() + ";\n" +
    (useDMA ? "DMA_HandleTypeDef hdma_" + adc.toLowerCase() + ";\nstatic volatile uint32_t adc_value = 0;\n" : "") +
    "\nvoid " + name + "_Init(void) {\n" +
    "  __HAL_RCC_" + port + "_CLK_ENABLE();\n" +
    "  __HAL_RCC_" + adc + "_CLK_ENABLE();\n" +
    (useDMA ? "  __HAL_RCC_DMA2_CLK_ENABLE();\n" : "") +
    "\n  GPIO_InitTypeDef GPIO_InitStruct = {0};\n" +
    "  GPIO_InitStruct.Pin = " + port + "_PIN_" + pinNum + ";\n" +
    "  GPIO_InitStruct.Mode = GPIO_MODE_ANALOG;\n" +
    "  GPIO_InitStruct.Pull = GPIO_NOPULL;\n" +
    "  HAL_GPIO_Init(" + port + ", &GPIO_InitStruct);\n\n" +
    (useDMA
      ? "  hdma_" + adc.toLowerCase() + ".Instance = DMA2_Stream0;\n" +
        "  hdma_" + adc.toLowerCase() + ".Init.Channel = DMA_CHANNEL_0;\n" +
        "  hdma_" + adc.toLowerCase() + ".Init.Direction = DMA_PERIPH_TO_MEMORY;\n" +
        "  hdma_" + adc.toLowerCase() + ".Init.PeriphInc = DMA_PINC_DISABLE;\n" +
        "  hdma_" + adc.toLowerCase() + ".Init.MemInc = DMA_MINC_DISABLE;\n" +
        "  hdma_" + adc.toLowerCase() + ".Init.PeriphDataAlignment = DMA_PDATAALIGN_WORD;\n" +
        "  hdma_" + adc.toLowerCase() + ".Init.MemDataAlignment = DMA_MDATAALIGN_WORD;\n" +
        "  hdma_" + adc.toLowerCase() + ".Init.Mode = DMA_CIRCULAR;\n" +
        "  hdma_" + adc.toLowerCase() + ".Init.Priority = DMA_PRIORITY_HIGH;\n" +
        "  HAL_DMA_Init(&hdma_" + adc.toLowerCase() + ");\n" +
        "  __HAL_LINKDMA(&h" + adc.toLowerCase() + ", DMA_Handle, hdma_" + adc.toLowerCase() + ");\n\n"
      : "") +
    "  ADC_ChannelConfTypeDef sConfig = {0};\n" +
    "  h" + adc.toLowerCase() + ".Instance = " + adc + ";\n" +
    "  h" + adc.toLowerCase() + ".Init.ClockPrescaler = ADC_CLOCK_SYNC_PCLK_DIV4;\n" +
    "  h" + adc.toLowerCase() + ".Init.Resolution = ADC_RESOLUTION_12B;\n" +
    "  h" + adc.toLowerCase() + ".Init.ScanConvMode = DISABLE;\n" +
    "  h" + adc.toLowerCase() + ".Init.ContinuousConvMode = " + (useDMA ? "ENABLE" : "DISABLE") + ";\n" +
    "  h" + adc.toLowerCase() + ".Init.DiscontinuousConvMode = DISABLE;\n" +
    "  h" + adc.toLowerCase() + ".Init.ExternalTrigConvEdge = ADC_EXTERNALTRIGCONVEDGE_NONE;\n" +
    "  h" + adc.toLowerCase() + ".Init.DataAlign = ADC_DATAALIGN_RIGHT;\n" +
    "  h" + adc.toLowerCase() + ".Init.NbrOfConversion = 1;\n" +
    "  h" + adc.toLowerCase() + ".Init.DMAContinuousRequests = " + (useDMA ? "ENABLE" : "DISABLE") + ";\n" +
    "  h" + adc.toLowerCase() + ".Init.EOCSelection = ADC_EOC_SINGLE_CONV;\n" +
    "  HAL_ADC_Init(&h" + adc.toLowerCase() + ");\n\n" +
    "  sConfig.Channel = ADC_CHANNEL_" + channel + ";\n" +
    "  sConfig.Rank = 1;\n" +
    "  sConfig.SamplingTime = ADC_SAMPLETIME_480CYCLES;\n" +
    "  HAL_ADC_ConfigChannel(&h" + adc.toLowerCase() + ", &sConfig);\n\n" +
    (useDMA ? "  HAL_ADC_Start_DMA(&h" + adc.toLowerCase() + ", (uint32_t *)&adc_value, 1);\n" : "") +
    "}\n\n" +
    "uint32_t " + name + "_Read(void) {\n" +
    (useDMA
      ? "  return adc_value;\n"
      : "  HAL_ADC_Start(&h" + adc.toLowerCase() + ");\n" +
        "  HAL_ADC_PollForConversion(&h" + adc.toLowerCase() + ", HAL_MAX_DELAY);\n" +
        "  return HAL_ADC_GetValue(&h" + adc.toLowerCase() + ");\n") +
    "}\n\n" +
    "float " + name + "_ReadVoltage(float vref) {\n" +
    "  return (float)" + name + "_Read() / 4095.0f * vref;\n}";

  return { h, c };
}

export function generateEXTI(pin: string, edge: string): { h: string; c: string } {
  const port = getPort(pin); const pinNum = getPinNum(pin);
  const name = "EXTI_" + pin;
  const edgeMap: Record<string, string> = { rising: "GPIO_MODE_IT_RISING", falling: "GPIO_MODE_IT_FALLING", both: "GPIO_MODE_IT_RISING_FALLING" };
  const guard = name.toUpperCase() + "_H";

  const h = "#ifndef " + guard + "\n#define " + guard + '\n\n#include "stm32f4xx_hal.h"\n\n' +
    "void " + name + "_Init(void);\n" +
    "void " + name + "_Callback(void);\n\n" +
    "#endif /* " + guard + " */";

  const c = '#include "' + name.toLowerCase() + '.h"\n\n' +
    "void " + name + "_Init(void) {\n" +
    "  __HAL_RCC_" + port + "_CLK_ENABLE();\n" +
    "  __HAL_RCC_SYSCFG_CLK_ENABLE();\n\n" +
    "  GPIO_InitTypeDef GPIO_InitStruct = {0};\n" +
    "  GPIO_InitStruct.Pin = " + port + "_PIN_" + pinNum + ";\n" +
    "  GPIO_InitStruct.Mode = " + (edgeMap[edge] || "GPIO_MODE_IT_FALLING") + ";\n" +
    "  GPIO_InitStruct.Pull = GPIO_PULLUP;\n" +
    "  HAL_GPIO_Init(" + port + ", &GPIO_InitStruct);\n\n" +
    "  HAL_NVIC_SetPriority(EXTI" + pinNum + "_IRQn, 6, 0);\n" +
    "  HAL_NVIC_EnableIRQ(EXTI" + pinNum + "_IRQn);\n}\n\n" +
    "__weak void " + name + "_Callback(void) {\n  /* User: add your interrupt handling code here */\n}\n\n" +
    "void EXTI" + pinNum + "_IRQHandler(void) {\n  HAL_GPIO_EXTI_IRQHandler(" + port + "_PIN_" + pinNum + ");\n}\n\n" +
    "void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin) {\n" +
    "  if (GPIO_Pin == " + port + "_PIN_" + pinNum + ") {\n" +
    "    " + name + "_Callback();\n  }\n}";

  return { h, c };
}
