import express from 'express';
import path from 'node:path';
import { apiRouter } from './routes/api.js';
import { config } from './config.js';
import { isSpaRoute } from './lib/spaRoutes.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  app.use('/api', apiRouter);
  app.use(express.static(config.publicDir, { extensions: ['html'], index: false, maxAge: '1h' }));

  app.get('*', (req, res, next) => {
    if (!isSpaRoute(req.path)) {
      next();
      return;
    }
    res.sendFile(path.join(config.publicDir, 'index.html'));
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  return app;
};
