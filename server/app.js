const path = require('path');
const express = require('express');
const { createAuthRouter } = require('./routes/auth');
const { createNpcsRouter } = require('./routes/npcs');
const { requireAuth } = require('./auth');
const { createMemoryRouter } = require('./routes/memory');

// Other routes (talk, memories) can be mounted by passing `extraRoutes`:
// a function (app, { pool, requireAuth }) called before the 404 handler.
function createApp({ pool, extraRoutes, llm } = {}) {
  const app = express();
  app.use((req, res, next) => {
    const allowed = (process.env.CORS_ORIGIN || '*').trim();
    res.set('Access-Control-Allow-Origin', allowed);
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use(express.json());
  app.use('/src', express.static(path.join(__dirname, '..', 'src')));
  app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

  app.use('/api', createAuthRouter({ pool }));
  app.use('/api/npcs', requireAuth, createNpcsRouter({ pool }));
  if (llm) app.use('/api', createMemoryRouter({ pool, requireAuth, llm }));
  if (extraRoutes) extraRoutes(app, { pool, requireAuth });

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

module.exports = { createApp };
