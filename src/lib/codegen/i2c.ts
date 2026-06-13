import { lookupAF, getPort, getPinNum } from "../pinmap";

export function generateI2C(instance: string, sclPin: string, sdaPin: string, speed: string): { h: string; c: string } {
  const name = instance;
  const sclPort = getPort(sclPin); const sclNum = getPinNum(sclPin);
  const sdaPort = getPort(sdaPin); const sdaNum = getPinNum(sdaPin);
  const speedVal = speed === "fast" ? "400000" : "100000";
  const guard = name.toUpperCase() + "_H";
  const sclAF = lookupAF(sclPin, instance, "SCL");
  const sdaAF = lookupAF(sdaPin, instance, "SDA");

  const h = "#ifndef " + guard + "\n#define " + guard + '\n\n#include "stm32f4xx_hal.h"\n\n' +
    "extern I2C_HandleTypeDef h" + name.toLowerCase() + ";\n\n" +
    "void " + name + "_Init(void);\n" +
    "HAL_StatusTypeDef " + name + "_Write(uint8_t devAddr, uint8_t regAddr, const uint8_t *data, uint16_t len);\n" +
    "HAL_StatusTypeDef " + name + "_Read(uint8_t devAddr, uint8_t regAddr, uint8_t *data, uint16_t len);\n" +
    "HAL_StatusTypeDef " + name + "_WriteByte(uint8_t devAddr, uint8_t regAddr, uint8_t value);\n" +
    "uint8_t " + name + "_ReadByte(uint8_t devAddr, uint8_t regAddr);\n" +
    "HAL_StatusTypeDef " + name + "_IsReady(uint8_t devAddr, uint32_t trials);\n\n" +
    "#endif /* " + guard + " */";

  const clkEnables = "  __HAL_RCC_" + sclPort + "_CLK_ENABLE();\n" +
    (sclPort !== sdaPort ? "  __HAL_RCC_" + sdaPort + "_CLK_ENABLE();\n" : "") +
    "  __HAL_RCC_" + instance + "_CLK_ENABLE();\n";

  let gpioInit: string;
  if (sclPort === sdaPort) {
    gpioInit =
      "  GPIO_InitTypeDef GPIO_InitStruct = {0};\n" +
      "  GPIO_InitStruct.Pin = " + sclPort + "_PIN_" + sclNum + " | " + sdaPort + "_PIN_" + sdaNum + ";\n" +
      "  GPIO_InitStruct.Mode = GPIO_MODE_AF_OD;\n" +
      "  GPIO_InitStruct.Pull = GPIO_PULLUP;\n" +
      "  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;\n" +
      "  GPIO_InitStruct.Alternate = " + sclAF + ";\n" +
      "  HAL_GPIO_Init(" + sclPort + ", &GPIO_InitStruct);\n";
  } else {
    gpioInit =
      "  GPIO_InitTypeDef GPIO_InitStruct_Scl = {0};\n" +
      "  GPIO_InitStruct_Scl.Pin = " + sclPort + "_PIN_" + sclNum + ";\n" +
      "  GPIO_InitStruct_Scl.Mode = GPIO_MODE_AF_OD;\n" +
      "  GPIO_InitStruct_Scl.Pull = GPIO_PULLUP;\n" +
      "  GPIO_InitStruct_Scl.Speed = GPIO_SPEED_FREQ_HIGH;\n" +
      "  GPIO_InitStruct_Scl.Alternate = " + sclAF + ";\n" +
      "  HAL_GPIO_Init(" + sclPort + ", &GPIO_InitStruct_Scl);\n\n" +
      "  GPIO_InitTypeDef GPIO_InitStruct_Sda = {0};\n" +
      "  GPIO_InitStruct_Sda.Pin = " + sdaPort + "_PIN_" + sdaNum + ";\n" +
      "  GPIO_InitStruct_Sda.Mode = GPIO_MODE_AF_OD;\n" +
      "  GPIO_InitStruct_Sda.Pull = GPIO_PULLUP;\n" +
      "  GPIO_InitStruct_Sda.Speed = GPIO_SPEED_FREQ_HIGH;\n" +
      "  GPIO_InitStruct_Sda.Alternate = " + sdaAF + ";\n" +
      "  HAL_GPIO_Init(" + sdaPort + ", &GPIO_InitStruct_Sda);\n";
  }

  const c = '#include "' + name.toLowerCase() + '.h"\n\n' +
    "I2C_HandleTypeDef h" + name.toLowerCase() + ";\n\n" +
    "void " + name + "_Init(void) {\n" +
    clkEnables + "\n" +
    gpioInit + "\n" +
    "  h" + name.toLowerCase() + ".Instance = " + instance + ";\n" +
    "  h" + name.toLowerCase() + ".Init.ClockSpeed = " + speedVal + ";\n" +
    "  h" + name.toLowerCase() + ".Init.DutyCycle = I2C_DUTYCYCLE_2;\n" +
    "  h" + name.toLowerCase() + ".Init.OwnAddress1 = 0;\n" +
    "  h" + name.toLowerCase() + ".Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;\n" +
    "  h" + name.toLowerCase() + ".Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;\n" +
    "  h" + name.toLowerCase() + ".Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;\n" +
    "  h" + name.toLowerCase() + ".Init.NoStretchMode = I2C_NOSTRETCH_DISABLE;\n" +
    "  HAL_I2C_Init(&h" + name.toLowerCase() + ");\n}\n\n" +
    "HAL_StatusTypeDef " + name + "_Write(uint8_t devAddr, uint8_t regAddr, const uint8_t *data, uint16_t len) {\n" +
    "  return HAL_I2C_Mem_Write(&h" + name.toLowerCase() + ", devAddr << 1, regAddr, I2C_MEMADD_SIZE_8BIT, (uint8_t *)data, len, HAL_MAX_DELAY);\n}\n\n" +
    "HAL_StatusTypeDef " + name + "_Read(uint8_t devAddr, uint8_t regAddr, uint8_t *data, uint16_t len) {\n" +
    "  return HAL_I2C_Mem_Read(&h" + name.toLowerCase() + ", devAddr << 1, regAddr, I2C_MEMADD_SIZE_8BIT, data, len, HAL_MAX_DELAY);\n}\n\n" +
    "HAL_StatusTypeDef " + name + "_WriteByte(uint8_t devAddr, uint8_t regAddr, uint8_t value) {\n" +
    "  return " + name + "_Write(devAddr, regAddr, &value, 1);\n}\n\n" +
    "uint8_t " + name + "_ReadByte(uint8_t devAddr, uint8_t regAddr) {\n" +
    "  uint8_t value = 0;\n  " + name + "_Read(devAddr, regAddr, &value, 1);\n  return value;\n}\n\n" +
    "HAL_StatusTypeDef " + name + "_IsReady(uint8_t devAddr, uint32_t trials) {\n" +
    "  return HAL_I2C_IsDeviceReady(&h" + name.toLowerCase() + ", devAddr << 1, trials, HAL_MAX_DELAY);\n}";

  return { h, c };
}
