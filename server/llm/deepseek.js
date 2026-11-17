'use strict';
const { FORMAT_INSTRUCTION } = require('./emotion');

async function callDeepseek({ key, model, fetch, signal, system, messages }) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: `${system || ''}\n\n${FORMAT_INSTRUCTION}`.trim() },
        ...messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) })),
      ],
      response_format: { type: 'json_object' },
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`deepseek http ${res.status}`);
  const data = await res.json();
  return data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : '';
}

module.exports = { callDeepseek };
