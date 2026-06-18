import type { Category, Handover, HandoverItem, Hotel, IssueThread, Severity } from "./types";
import { severityOf } from "./score";

const CATEGORY_PRIORITY: Record<Category, number> = {
  compliance: 0, safety: 1, financial: 2, maintenance: 3, guest_experience: 4, informational: 5,
};

function toItem(t: IssueThread): HandoverItem {
  const { severity, severityReason } = severityOf(t);
  const latest = t.events[t.events.length - 1]!;
  const summary = latest.translatedText
    ? `${latest.translatedText}  ·  [original] ${latest.text}`
    : latest.text;
  return {
    threadId: t.threadId,
    severity,
    severityReason,
    classification: t.classification,
    summary: t.room ? `Room ${t.room}: ${summary}` : summary,
    room: t.room,
    sourceRefs: t.events.map((e) => e.sourceRef),
    flags: t.flags,
  };
}

function sortItems(items: HandoverItem[], threadsById: Map<string, IssueThread>): HandoverItem[] {
  return [...items].sort((a, b) => {
    const ca = CATEGORY_PRIORITY[threadsById.get(a.threadId)!.category];
    const cb = CATEGORY_PRIORITY[threadsById.get(b.threadId)!.category];
    return ca - cb;
  });
}

export function buildHandover(threads: IssueThread[], hotel: Hotel, date: string): Handover {
  const byId = new Map(threads.map((t) => [t.threadId, t]));
  const items = threads.map(toItem);
  const bucket = (s: Severity) => sortItems(items.filter((i) => i.severity === s), byId);

  const groups = { act_now: bucket("act_now"), pending: bucket("pending"), fyi: bucket("fyi") };
  const flagCount = items.filter((i) => i.flags.length > 0).length;

  return {
    hotel,
    date,
    generatedAt: new Date().toISOString(),
    counts: {
      act_now: groups.act_now.length,
      pending: groups.pending.length,
      fyi: groups.fyi.length,
      flags: flagCount,
    },
    groups,
  };
}
