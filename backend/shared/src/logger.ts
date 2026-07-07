import pino from 'pino';

/**
 * Create a structured logger for a named service.
 * In production, outputs JSON. In development, uses pino-pretty.
 */
export function createLogger(name: string): pino.Logger {
  const isDev = process.env.NODE_ENV !== 'production';

  return pino({
    name,
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    ...(isDev && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    }),
  });
}
