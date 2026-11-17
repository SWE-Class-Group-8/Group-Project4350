'use strict';
const { FORMAT_INSTRUCTION } = require('./emotion');

async function callGemini({ key, model, fetch, signal, system, messages }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: `${system || ''}\n\n${FORMAT_INSTRUCTION}`.trim() }] },
      contents: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content) }],
      })),
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(`gemini http ${res.status}`);
  const data = await res.json();
  const parts = data && data.candidates && data.candidates[0] && data.candidates[0].content
    && data.candidates[0].content.parts;
  return Array.isArray(parts) ? parts.map((p) => p.text || '').join('') : '';
}

module.exports = { callGemini };
