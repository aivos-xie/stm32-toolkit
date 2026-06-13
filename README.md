# STM32 Toolkit

嵌入式开发工具箱 — 一站式 STM32 代码生成、媒体取模、调试助手。

## 功能模块

### 代码生成
| 模块 | 说明 |
|------|------|
| **项目脚手架** | 生成完整 STM32 项目目录（Makefile + HAL + 可选 FreeRTOS） |
| **外设代码** | GPIO / UART / SPI / I2C / TIM PWM / ADC / EXTI 初始化代码生成 |
| **驱动生成器** | 定义传感器寄存器映射，自动生成 I2C/SPI/UART HAL 驱动 |
| **中间件模板** | FreeRTOS Task / Queue / CLI Shell 模板代码 |
| **代码片段** | PID 控制器、滤波器、环形缓冲区、软件定时器等常用代码 |

### 媒体转换
| 模块 | 说明 |
|------|------|
| **图片取模** | 图片 → C 数组（MONO / GRAY / RGB565 / RGB888） |
| **视频取模** | 视频/GIF → 帧数据数组（MONO / RGB565） |
| **字模提取** | TTF/OTF 字体 → 字模点阵数据 |

### 调试工具
| 模块 | 说明 |
|------|------|
| **串口助手** | Web Serial API 实现，支持 ASCII/HEX 查看、时间戳、日志导出 |
| **蓝牙助手** | Web Bluetooth API 实现，扫描/连接 BLE 设备，读写特征值 |

## 技术栈

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Web Serial API / Web Bluetooth API

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 项目结构

```
src/
├── pages/          # 各功能模块页面
├── components/     # 公共组件
├── lib/
│   ├── codegen/    # 代码生成逻辑
│   └── pinmap.ts   # STM32 引脚映射
├── i18n/           # 中英文国际化
└── types/          # TypeScript 类型定义
```

## License

MIT
