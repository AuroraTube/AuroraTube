import { config } from './src/config.js';
import { createApp } from './src/app.js';
import { settings } from './src/settings.js';

const app = createApp();

process.on('unhandledRejection', (error) => {
  console.error(error);
});

process.on('uncaughtException', (error) => {
  console.error(error);
  process.exit(1);
});

const server = app.listen(config.port, () => {
  console.log(`${settings.appName} running on ${config.port}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
