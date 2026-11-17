const { createApp } = require('./app');
const { createPool } = require('./db');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required');
  process.exit(1);
}

const port = Number(process.env.PORT) || 3000;
createApp({ pool: createPool() }).listen(port, () => {
  console.log(`Agent Appetite server listening on ${port}`);
});
