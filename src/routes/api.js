import express from 'express';
import { resolveStream, buildInternalGooglevideoPayload, buildFinalPlaybackPayload, streamDashCombined } from '../services/streamService.js';

export const apiRouter = express.Router();

const getInput = (req) => String(req.query.input || req.query.id || req.query.url || '').trim();

apiRouter.get('/internal/googlevideo', async (req, res) => {
  try {
    const input = getInput(req);
    if (!input) {
      return res.status(400).json({ error: 'input required' });
    }

    const resolved = await resolveStream(input);
    const payload = buildInternalGooglevideoPayload(resolved);
    return res.json(payload);
  } catch (error) {
    const statusCode = Number(error?.statusCode || 500);
    console.error('Unexpected error in /api/internal/googlevideo', error);
    return res.status(statusCode).json({ error: error?.message || 'internal error' });
  }
});

apiRouter.get('/stream', async (req, res) => {
  try {
    const input = getInput(req);
    if (!input) {
      return res.status(400).json({ error: 'input required' });
    }

    const resolved = await resolveStream(input);
    return streamDashCombined(res, resolved);
  } catch (error) {
    const statusCode = Number(error?.statusCode || 500);
    console.error('Unexpected error in /api/stream', error);
    return res.status(statusCode).json({ error: error?.message || 'internal error' });
  }
});

apiRouter.get('/play-url', async (req, res) => {
  try {
    const input = getInput(req);
    if (!input) {
      return res.status(400).json({ error: 'input required' });
    }

    const resolved = await resolveStream(input);
    const payload = buildFinalPlaybackPayload(resolved, req);
    return res.json(payload);
  } catch (error) {
    const statusCode = Number(error?.statusCode || 500);
    console.error('Unexpected error in /api/play-url', error);
    return res.status(statusCode).json({ error: error?.message || 'internal error' });
  }
});
