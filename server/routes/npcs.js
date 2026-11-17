const express = require('express');

function createNpcsRouter({ pool }) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      const result = await pool.query('SELECT slug, name, role FROM npc ORDER BY npc_id');
      res.json({ npcs: result.rows.map((r) => ({ id: r.slug, name: r.name, role: r.role })) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createNpcsRouter };
