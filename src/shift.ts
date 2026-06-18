// Uses the wall-clock time as written in the ISO string (the hotel's own offset),
// so we never depend on the server's local timezone.
export function shiftMorning(iso: string): string {
  const datePart = iso.slice(0, 10);            // YYYY-MM-DD
  const hour = Number.parseInt(iso.slice(11, 13), 10);
  if (Number.isNaN(hour)) {
    throw new Error(`shiftMorning: cannot parse hour from "${iso}"`);
  }
  if (hour < 12) return datePart;
  const d = new Date(`${datePart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
