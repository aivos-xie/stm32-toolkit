export const SNIPPETS = [
  {
    id: "pid", title: "PID Controller",
    description: "Incremental PID controller for motor/sensor control",
    code: `typedef struct {
  float Kp, Ki, Kd;
  float setpoint;
  float integral;
  float prev_error;
  float out_min, out_max;
} PID_Controller;

void PID_Init(PID_Controller *pid, float Kp, float Ki, float Kd, float out_min, float out_max) {
  pid->Kp = Kp; pid->Ki = Ki; pid->Kd = Kd;
  pid->setpoint = 0; pid->integral = 0; pid->prev_error = 0;
  pid->out_min = out_min; pid->out_max = out_max;
}

float PID_Compute(PID_Controller *pid, float measurement, float dt) {
  float error = pid->setpoint - measurement;
  pid->integral += error * dt;
  float derivative = (error - pid->prev_error) / dt;
  float output = pid->Kp * error + pid->Ki * pid->integral + pid->Kd * derivative;
  if (output > pid->out_max) output = pid->out_max;
  if (output < pid->out_min) output = pid->out_min;
  pid->prev_error = error;
  return output;
}`,
  },
  {
    id: "moving_avg", title: "Moving Average Filter",
    description: "Sliding window average for ADC noise reduction",
    code: `#define MA_FILTER_SIZE 16

typedef struct {
  uint16_t buffer[MA_FILTER_SIZE];
  uint8_t index;
  uint32_t sum;
  uint8_t count;
} MovingAvgFilter;

void MAF_Init(MovingAvgFilter *f) { memset(f, 0, sizeof(MovingAvgFilter)); }

uint16_t MAF_Update(MovingAvgFilter *f, uint16_t value) {
  f->sum -= f->buffer[f->index];
  f->buffer[f->index] = value;
  f->sum += value;
  f->index = (f->index + 1) % MA_FILTER_SIZE;
  if (f->count < MA_FILTER_SIZE) f->count++;
  return f->sum / f->count;
}`,
  },
  {
    id: "lowpass", title: "First-Order Low-Pass Filter",
    description: "Simple IIR low-pass for sensor smoothing",
    code: `typedef struct {
  float alpha;
  float output;
} LowPassFilter;

void LPF_Init(LowPassFilter *f, float cutoff_freq, float sample_rate) {
  float dt = 1.0f / sample_rate;
  float rc = 1.0f / (2.0f * 3.14159265359f * cutoff_freq);
  f->alpha = dt / (rc + dt);
  f->output = 0;
}

float LPF_Update(LowPassFilter *f, float input) {
  f->output = f->alpha * input + (1.0f - f->alpha) * f->output;
  return f->output;
}`,
  },
  {
    id: "ringbuf", title: "Ring Buffer",
    description: "Thread-safe circular buffer for UART/sensor data",
    code: `#define RINGBUF_SIZE 256

typedef struct {
  uint8_t buffer[RINGBUF_SIZE];
  volatile uint16_t head;
  volatile uint16_t tail;
} RingBuffer;

void RingBuf_Init(RingBuffer *rb) { rb->head = 0; rb->tail = 0; }

uint16_t RingBuf_Available(RingBuffer *rb) { return (rb->head - rb->tail) % RINGBUF_SIZE; }

uint8_t RingBuf_Put(RingBuffer *rb, uint8_t data) {
  uint16_t next = (rb->head + 1) % RINGBUF_SIZE;
  if (next == rb->tail) return 0;
  rb->buffer[rb->head] = data;
  rb->head = next;
  return 1;
}

uint8_t RingBuf_Get(RingBuffer *rb, uint8_t *data) {
  if (rb->head == rb->tail) return 0;
  *data = rb->buffer[rb->tail];
  rb->tail = (rb->tail + 1) % RINGBUF_SIZE;
  return 1;
}`,
  },
  {
    id: "sw_timer", title: "Software Timer (SysTick)",
    description: "Non-blocking software timer using SysTick",
    code: `#define MAX_SW_TIMERS 16

typedef struct {
  uint32_t period;
  uint32_t last_tick;
  uint8_t oneshot;
  uint8_t running;
  void (*callback)(void);
} SoftTimer;

static SoftTimer timers[MAX_SW_TIMERS];
static volatile uint32_t sys_tick_ms = 0;

void SysTick_Handler(void) { sys_tick_ms++; }
uint32_t SoftTimer_GetTick(void) { return sys_tick_ms; }

int SoftTimer_Create(uint32_t period_ms, uint8_t oneshot, void (*callback)(void)) {
  for (int i = 0; i < MAX_SW_TIMERS; i++) {
    if (timers[i].callback == NULL) {
      timers[i].period = period_ms;
      timers[i].last_tick = sys_tick_ms;
      timers[i].oneshot = oneshot;
      timers[i].running = 1;
      timers[i].callback = callback;
      return i;
    }
  }
  return -1;
}

void SoftTimer_Delete(int id) {
  if (id >= 0 && id < MAX_SW_TIMERS) timers[id].callback = NULL;
}

void SoftTimer_Service(void) {
  for (int i = 0; i < MAX_SW_TIMERS; i++) {
    if (timers[i].callback && timers[i].running) {
      if (sys_tick_ms - timers[i].last_tick >= timers[i].period) {
        timers[i].last_tick = sys_tick_ms;
        timers[i].callback();
        if (timers[i].oneshot) timers[i].running = 0;
      }
    }
  }
}`,
  },
];
