const { createApp } = require('./app');
const { createPool } = require('./db');
const { createLlmClientFromEnv } = require('./llm');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required');
  process.exit(1);
}

const port = Number(process.env.PORT) || 3000;
createApp({ pool: createPool(), llm: createLlmClientFromEnv() }).listen(port, () => {
  console.log(`Agent Appetite server listening on ${port}`);
});
