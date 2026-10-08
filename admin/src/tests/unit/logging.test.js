import { Writable } from 'node:stream';
import { jest } from '@jest/globals';
import { createLogger } from '../../observability/logger/create-logger.js';
import { createBootstrapLogger } from '../../observability/telemetry/bootstrap-logger.js';
import {
  requestLogLevel,
  requestLogMessage,
} from '../../infrastructure/middlewares/logger.middleware.js';

describe('Logging', () => {
  test('logger redacts credentials before they are written or exported', () => {
    const chunks = [];
    const destination = new Writable({
      write(chunk, _encoding, done) {
        chunks.push(String(chunk));
        done();
      },
    });
    const logger = createLogger({
      appName: 'test',
      environment: 'test',
      level: 'info',
      destination,
    });

    logger.info(
      {
        req: { headers: { authorization: 'Bearer secret-token', cookie: 'sid=1', host: 'x' } },
        body: { password: 'p4ss', token: 't0k' },
      },
      'request',
    );

    const output = chunks.join('');
    expect(output).not.toContain('secret-token');
    expect(output).not.toContain('sid=1');
    expect(output).not.toContain('p4ss');
    expect(output).not.toContain('t0k');
    expect(output).toContain('[REDACTED]');
    expect(output).toContain('"host":"x"');
  });

  test('request log level follows the response status', () => {
    expect(requestLogLevel({}, { statusCode: 200 })).toBe('info');
    expect(requestLogLevel({}, { statusCode: 404 })).toBe('warn');
    expect(requestLogLevel({}, { statusCode: 503 })).toBe('error');
    expect(requestLogLevel({}, { statusCode: 200 }, new Error('x'))).toBe('error');
  });

  test('request log message treats sent headers as completed (serverless-http)', () => {
    expect(requestLogMessage({}, { writableEnded: true })).toBe('request completed');
    expect(requestLogMessage({}, { writableEnded: false, headersSent: true })).toBe(
      'request completed',
    );
    expect(requestLogMessage({}, { writableEnded: false, headersSent: false })).toBe(
      'request aborted',
    );
  });

  test('bootstrap logger writes structured JSON to stderr without pino', () => {
    const spy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const logger = createBootstrapLogger({ appName: 'svc', environment: 'test' });

    logger.error({ err: new Error('boom') }, 'Telemetry flush failed');
    logger.warn({}, 'careful');

    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed).toMatchObject({ level: 50, service: 'svc', msg: 'Telemetry flush failed' });
    expect(parsed.err.message).toBe('boom');
    expect(JSON.parse(spy.mock.calls[1][0]).level).toBe(40);
    spy.mockRestore();
  });
});
