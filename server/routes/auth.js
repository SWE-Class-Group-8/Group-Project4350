const express = require('express');
const { hashPassword, verifyPassword, signToken } = require('../auth');

const USERNAME_RE = /^[A-Za-z0-9_]{3,30}$/;
const BAD_LOGIN = 'Incorrect username or password';

function validate(body) {
  const { username, password } = body || {};
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return 'Username must be 3-30 characters: letters, numbers, underscore';
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return 'Password must be 8-128 characters';
  }
  return null;
}

function createAuthRouter({ pool }) {
  const router = express.Router();

  router.post('/register', async (req, res, next) => {
    try {
      const problem = validate(req.body);
      if (problem) return res.status(400).json({ error: problem });
      const { username, password } = req.body;
      const hash = await hashPassword(password);
      let result;
      try {
        result = await pool.query(
          'INSERT INTO player (username, password_hash) VALUES ($1, $2) RETURNING player_id, username',
          [username, hash]
        );
      } catch (err) {
        if (err && err.code === '23505') {
          return res.status(409).json({ error: 'Username already taken' });
        }
        throw err;
      }
      const player = result.rows[0];
      return res.status(201).json({ token: signToken(player), username: player.username });
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const { username, password } = req.body || {};
      if (typeof username !== 'string' || typeof password !== 'string' || password.length > 128) {
        return res.status(401).json({ error: BAD_LOGIN });
      }
      const result = await pool.query(
        'SELECT player_id, username, password_hash FROM player WHERE username = $1',
        [username]
      );
      const player = result.rows[0];
      const ok = player && (await verifyPassword(password, player.password_hash));
      if (!ok) return res.status(401).json({ error: BAD_LOGIN });
      return res.json({ token: signToken(player), username: player.username });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAuthRouter };
