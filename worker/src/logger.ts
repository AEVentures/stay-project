export type LogLevel = 'info' | 'warn' | 'error';

export type LogFields = Record<string, string | number | boolean | null | undefined>;

/**
 * Structured JSON logs with a correlation id. Message content is never
 * logged; only shapes, statuses, and timings.
 */
export class Logger {
  constructor(private readonly requestId: string, private readonly sink: Pick<Console, 'log'> = console) {}

  info(event: string, fields: LogFields = {}): void {
    this.write('info', event, fields);
  }

  warn(event: string, fields: LogFields = {}): void {
    this.write('warn', event, fields);
  }

  error(event: string, fields: LogFields = {}): void {
    this.write('error', event, fields);
  }

  private write(level: LogLevel, event: string, fields: LogFields): void {
    this.sink.log(
      JSON.stringify({ ts: new Date().toISOString(), level, event, requestId: this.requestId, ...fields })
    );
  }
}

export function requestIdFrom(request: Request): string {
  return request.headers.get('cf-ray') ?? crypto.randomUUID();
}
