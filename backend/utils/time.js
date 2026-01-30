// backend/utils/time.js
export function minutesFromNow(mins = 60) {
  const m = parseInt(String(mins), 10)
  const safe = Number.isFinite(m) ? m : 60
  return new Date(Date.now() + safe * 60_000)  // ← devuelve Date válido
}
