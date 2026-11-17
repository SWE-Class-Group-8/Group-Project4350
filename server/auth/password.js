const bcrypt = require('bcryptjs');

const ROUNDS = 10;

function hashPassword(password) {
  return bcrypt.hash(password, ROUNDS);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, verifyPassword };
