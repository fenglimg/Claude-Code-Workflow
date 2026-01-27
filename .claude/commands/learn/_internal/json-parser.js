/**
 * Extract the last valid JSON object from arbitrary command output.
 *
 * Why: CLI commands may emit noisy output (warnings, banners). Agents/docs should avoid
 * brittle `JSON.parse(Bash(...))` patterns and instead parse the last JSON-looking payload.
 *
 * Behavior:
 * - Throws on empty/whitespace-only input
 * - Scans lines backwards; returns the last line that JSON.parse() accepts
 * - Fallback: supports code-fenced JSON blocks (```json ... ```)
 *
 * @param {string} text - Raw stdout (possibly noisy).
 * @returns {any} Parsed JSON object.
 */
export function lastJsonObjectFromText(text) {
  const raw = String(text ?? '').trim();
  if (!raw) throw new Error('Empty command output');

  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      // keep scanning
    }
  }

  const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) return JSON.parse(m[1].trim());

  throw new Error('Failed to parse JSON from command output');
}
