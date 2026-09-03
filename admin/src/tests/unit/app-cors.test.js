import request from 'supertest';
import { createApp } from '../../app.js';
import { createContainer } from '../../container.js';
import { env } from '../../config/env.js';

describe('App CORS and network headers', () => {
  const baseEnv = {
    corsAllowedOrigins: [...env.corsAllowedOrigins],
    corsAllowNgrok: env.corsAllowNgrok,
    corsAllowedOriginPatterns: [...env.corsAllowedOriginPatterns],
    corsAllowPrivateNetwork: env.corsAllowPrivateNetwork,
  };

  afterEach(() => {
    env.corsAllowedOrigins = [...baseEnv.corsAllowedOrigins];
    env.corsAllowNgrok = baseEnv.corsAllowNgrok;
    env.corsAllowedOriginPatterns = [...baseEnv.corsAllowedOriginPatterns];
    env.corsAllowPrivateNetwork = baseEnv.corsAllowPrivateNetwork;
  });

  function createTestApp() {
    const { logger, controllers } = createContainer();
    return createApp({ logger, controllers });
  }

  test('allows request without origin', async () => {
    const app = createTestApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('allows origin from explicit allow list', async () => {
    env.corsAllowedOrigins = ['https://allowed.example.com'];
    env.corsAllowNgrok = false;
    env.corsAllowedOriginPatterns = [];

    const app = createTestApp();
    const response = await request(app).get('/health').set('Origin', 'https://allowed.example.com');

    expect(response.status).toBe(200);
  });

  test('allows ngrok free app origin when enabled', async () => {
    env.corsAllowedOrigins = [];
    env.corsAllowNgrok = true;
    env.corsAllowedOriginPatterns = [];

    const app = createTestApp();
    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://trini-demo.ngrok-free.app');

    expect(response.status).toBe(200);
  });

  test('allows origin by regex pattern', async () => {
    env.corsAllowedOrigins = [];
    env.corsAllowNgrok = false;
    env.corsAllowedOriginPatterns = [/^https:\/\/preview\.trini\.local$/];

    const app = createTestApp();
    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://preview.trini.local');

    expect(response.status).toBe(200);
  });

  test('rejects disallowed origin', async () => {
    env.corsAllowedOrigins = [];
    env.corsAllowNgrok = false;
    env.corsAllowedOriginPatterns = [];

    const app = createTestApp();
    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://blocked.example.com');

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(response.body.error.message).toBe('Origin not allowed');
  });

  test('sets private network header when request asks for it and feature is enabled', async () => {
    env.corsAllowPrivateNetwork = true;
    env.corsAllowedOrigins = ['https://allowed.example.com'];

    const app = createTestApp();
    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://allowed.example.com')
      .set('Access-Control-Request-Private-Network', 'true');

    expect(response.headers['access-control-allow-private-network']).toBe('true');
  });

  test('does not set private network header when request header is missing', async () => {
    env.corsAllowPrivateNetwork = true;
    env.corsAllowedOrigins = ['https://allowed.example.com'];

    const app = createTestApp();
    const response = await request(app).get('/health').set('Origin', 'https://allowed.example.com');

    expect(response.headers['access-control-allow-private-network']).toBeUndefined();
  });
});
