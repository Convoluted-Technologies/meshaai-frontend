export function logEvent(
  level: 'INFO' | 'WARN' | 'ERROR',
  event: string,
  data: Record<string, any> = {},
  correlationId?: string
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    event,
    correlationId: correlationId || 'no-correlation-id',
    ...data,
  };
  if (level === 'ERROR') {
    console.error(JSON.stringify(logEntry));
  } else if (level === 'WARN') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}
