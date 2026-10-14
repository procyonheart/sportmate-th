import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activities.js';
import profileRoutes from './routes/profile.js';

const app = Fastify({
  logger: true,
  bodyLimit: 8 * 1024 * 1024, // allow base64 image payloads during migration window
});

await app.register(cors, {
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

await app.register(rateLimit, {
  global: false, // opt-in per route
  max: 30,
  timeWindow: '1 minute',
});

// stricter limits on auth endpoints (replaces the client-side sm_login_attempts hack)
const authLimit = { config: { rateLimit: { max: 10, timeWindow: '5 minutes' } } };

app.get('/health', async () => ({ ok: true }));

await app.register(async (api) => {
  // apply the stricter limiter to the sensitive auth mutations
  api.addHook('onRoute', (routeOptions) => {
    if (['/login', '/signup', '/resendVerification'].includes(routeOptions.url)) {
      routeOptions.config = { ...(routeOptions.config || {}), ...authLimit.config };
    }
  });
  await api.register(authRoutes);
  await api.register(activityRoutes);
  await api.register(profileRoutes);
}, { prefix: '/api' });

try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`SportMate API listening on ${config.host}:${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
