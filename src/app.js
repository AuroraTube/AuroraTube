import express from 'express';
import path from 'node:path';
import { apiRouter } from './routes/api.js';
import { config } from './config.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    next();
  });
  app.use(express.json({ limit: '1kb' }));
  app.use(express.urlencoded({ extended: false, limit: '1kb' }));

  app.use('/api', apiRouter);
  app.use(
    express.static(config.publicDir, {
      extensions: ['html'],
      maxAge: '1h',
      immutable: false,
      index: 'index.html',
    })
  );

  app.get('/', (_req, res) => {
    res.sendFile(path.join(config.publicDir, 'index.html'));
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  return app;
};
