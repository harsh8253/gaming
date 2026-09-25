// Vercel serverless entry: serves the compiled NestJS API (dist/, built by `nest build`) under /api/*.
const { NestFactory } = require('@nestjs/core');

// The API ships development fallbacks for these; a public deployment must never run on them.
const REQUIRED_ENV = ['JWT_SECRET', 'BOOTSTRAP_PASSWORD'];

let serverPromise;

async function bootstrap() {
  const { AppModule } = require('../dist/app.module');
  const { configureApp } = require('../dist/configure-app');
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  configureApp(app);
  await app.init();
  return app.getHttpAdapter().getInstance();
}

module.exports = async (req, res) => {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: `API is not configured. Set ${missing.join(', ')} in the Vercel project settings.` }));
    return;
  }

  // The desk calls /api/auth/login and friends; Nest's routes live at /auth/login.
  req.url = req.url.replace(/^\/api(?=\/|\?|$)/, '') || '/';

  serverPromise ??= bootstrap().catch((error) => {
    serverPromise = undefined;
    throw error;
  });
  const server = await serverPromise;
  server(req, res);
};
