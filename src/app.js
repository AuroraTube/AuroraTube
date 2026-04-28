import express from 'express';
import path from 'node:path';
import { apiRouter } from './routes/api.js';
import { config } from './config.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', true);

  app.use((_req, res, next) => {
    next();
  });

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  app.use('/api', apiRouter);
  app.use(express.static(config.publicDir, { extensions: ['html'], index: false, maxAge: '1h' }));

  app.get(['/', '/trending', '/search', '/watch/:slug', '/shorts/:slug', '/channel/:slug'], (_req, res) => {
    res.sendFile(path.join(config.publicDir, 'index.html'));
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  return app;
};
