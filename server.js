import { config } from './src/config.js';
import { createApp } from './src/app.js';

const app = createApp();

process.on('unhandledRejection', (error) => {
  console.error(error);
});

process.on('uncaughtException', (error) => {
  console.error(error);
  process.exit(1);
});

const server = app.listen(config.port, () => {
  console.log(`${config.appName} running on ${config.port}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
