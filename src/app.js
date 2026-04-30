import express from 'express';
import path from 'node:path';
import { apiRouter } from './routes/api.js';
import { settings } from './settings.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  app.use('/api', apiRouter);
  app.use(express.static(settings.publicDir, { extensions: ['html'], index: false, maxAge: '1h' }));

  app.get(['/', '/trending', '/search', '/watch/:slug', '/shorts/:slug', '/channel/:slug'], (_req, res) => {
    res.sendFile(path.join(settings.publicDir, 'index.html'));
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  return app;
};
