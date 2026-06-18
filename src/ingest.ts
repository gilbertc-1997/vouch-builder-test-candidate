import type { EventsFile, NormalizedEvent, RawStatus } from "./types";
import { shiftMorning } from "./shift";

export function ingestJson(file: EventsFile): NormalizedEvent[] {
  return file.events.map((e) => ({
    id: e.id,
    source: "json" as const,
    timestamp: e.timestamp,
    shiftDate: shiftMorning(e.timestamp),
    room: e.room,
    guest: e.guest,
    type: e.type,
    text: e.description,
    status: e.status,
    sourceRef: { source: "json" as const, id: e.id },
  }));
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

// "morning Thu 28 May" -> "2026-05-28"
export function parseLogMorning(text: string, year: number): string | null {
  const m = text.match(/morning\s+\w+\s+(\d{1,2})\s+([A-Za-z]{3,})/i);
  if (!m) return null;
  const day = Number.parseInt(m[1]!, 10);
  const month = MONTHS[m[2]!.slice(0, 3).toLowerCase()];
  if (!month) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function inferStatus(text: string): RawStatus {
  const t = text.toLowerCase();
  if (/resolved|sorted itself|settle|fixed|收了.*费用了|already charged/.test(t)) return "resolved";
  if (/still|not fixed|not settled|chase|no one came|never came|please/.test(t)) return "unresolved";
  return "unresolved"; // fail-safe default: surface, do not hide
}

export function ingestLog(markdown: string, year: number): NormalizedEvent[] {
  const lines = markdown.split(/\r?\n/);
  let morning: string | null = null;
  let counter = 0;
  const events: NormalizedEvent[] = [];

  lines.forEach((line, idx) => {
    const headerMorning = parseLogMorning(line, year);
    if (headerMorning) morning = headerMorning;

    const bullet = line.match(/^\s*-\s+(.*)$/);
    if (!bullet) return;
    const body = bullet[1]!.trim();
    if (!body) return;

    counter += 1;
    const roomMatch = body.match(/\b(\d{3})\b/);
    const shiftDate = morning ?? `${year}-01-01`;
    const id = `log_${shiftDate}_${counter}`;
    events.push({
      id,
      source: "log",
      timestamp: `${shiftDate}T07:00:00+08:00`,
      shiftDate,
      room: roomMatch ? roomMatch[1]! : null,
      guest: null,
      type: "log_note",
      text: body,
      status: inferStatus(body),
      sourceRef: { source: "log", id, line: idx + 1 },
    });
  });

  return events;
}
