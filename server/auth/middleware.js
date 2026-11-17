const { verifyToken } = require('./token');

// Sets req.player = { id, username } or responds 401.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) return res.status(401).json({ error: 'Missing or invalid token' });
  try {
    const payload = verifyToken(match[1]);
    req.player = { id: Number(payload.sub), username: payload.username };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
}

module.exports = { requireAuth };
