import type { Classification, IssueThread, NormalizedEvent, RawStatus } from "./types";
import { categoryOf } from "./category";

function threadKey(e: NormalizedEvent): string {
  const category = categoryOf(e);
  return e.room ? `${e.room}|${category}` : `noroom|${category}`;
}

function classify(events: NormalizedEvent[], targetDate: string): Classification {
  const status = events[events.length - 1]!.status;
  const lastShift = events[events.length - 1]!.shiftDate;
  const firstShift = events[0]!.shiftDate;
  if (status === "resolved") return "newly_resolved";
  if (firstShift === targetDate && lastShift === targetDate) return "new_tonight";
  return "still_open";
}

export function reconcile(events: NormalizedEvent[], targetDate: string): IssueThread[] {
  const known = events
    .filter((e) => e.shiftDate <= targetDate)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const groups = new Map<string, NormalizedEvent[]>();
  for (const e of known) {
    const key = threadKey(e);
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }

  const threads: IssueThread[] = [];
  for (const [key, evs] of groups) {
    const currentStatus: RawStatus = evs[evs.length - 1]!.status;
    const lastShift = evs[evs.length - 1]!.shiftDate;

    // Don't re-report items closed on an earlier morning.
    if (currentStatus === "resolved" && lastShift !== targetDate) continue;

    threads.push({
      threadId: key,
      room: evs[0]!.room,
      category: categoryOf(evs[0]!),
      events: evs,
      currentStatus,
      classification: classify(evs, targetDate),
      flags: [],
    });
  }
  return threads;
}
