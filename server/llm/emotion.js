'use strict';
const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'annoyed'];

function normalizeEmotion(value) {
  const e = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return EMOTIONS.includes(e) ? e : 'neutral';
}

// Parse model output into {text, emotion}; returns null when unusable (empty).
function parseModelOutput(raw) {
  if (typeof raw !== 'string') return null;
  let s = raw.trim();
  if (!s) return null;
  const fence = s.match(/^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/);
  if (fence) s = fence[1].trim();
  const candidates = [s];
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a !== -1 && b > a) candidates.push(s.slice(a, b + 1));
  for (const c of candidates) {
    try {
      const obj = JSON.parse(c);
      if (obj && typeof obj === 'object' && typeof obj.reply === 'string') {
        const text = obj.reply.trim();
        if (!text) return null;
        return { text, emotion: normalizeEmotion(obj.emotion) };
      }
    } catch (_) { /* try next */ }
  }
  return { text: s, emotion: 'neutral' };
}

const FORMAT_INSTRUCTION =
  'Respond ONLY with JSON of the form {"reply": "<your in-character reply>", "emotion": "<one of neutral|happy|sad|angry|annoyed>"}.';

module.exports = { EMOTIONS, normalizeEmotion, parseModelOutput, FORMAT_INSTRUCTION };
