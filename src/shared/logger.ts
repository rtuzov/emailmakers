import pino from 'pino';

const base = {
  level: process.env.LOG_LEVEL || 'info',
  redact: ['password', 'apiKey'],
};

export const logger = pino(base);

export function getLogger(context: Record<string, unknown> = {}) {
  return process.env.USE_PINO === 'true' ? logger.child(context) : console;
}

if (process.env.USE_PINO === 'true') {
  // monkey-patch console to route through pino
  const methods: (keyof Console)[] = ['log', 'info', 'warn', 'error', 'debug'];
  methods.forEach(m => {
    // @ts-ignore
    console[m] = (...args: any[]) => {
      // @ts-ignore
      logger[m](...args);
    };
  });
} 