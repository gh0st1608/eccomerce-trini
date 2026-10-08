// Minimal pino-compatible logger used only while telemetry boots. It must NOT import pino:
// instrumentation-pino can only patch pino if pino is first loaded after NodeSDK.start(),
// otherwise application logs are never exported to New Relic.
const LEVELS = { error: 50, warn: 40 };

const write =
  (level, { appName, environment }) =>
  (fields, msg) =>
    process.stderr.write(
      `${JSON.stringify({
        level: LEVELS[level],
        time: new Date().toISOString(),
        service: appName,
        environment,
        ...fields,
        ...(fields?.err instanceof Error
          ? { err: { type: fields.err.name, message: fields.err.message, stack: fields.err.stack } }
          : {}),
        msg,
      })}\n`,
    );

export const createBootstrapLogger = (base) => ({
  error: write('error', base),
  warn: write('warn', base),
});
