import type { Flag, IssueThread, NormalizedEvent } from "./types";

const ACTIONABLE = new Set(["compliance", "safety", "financial", "maintenance", "guest_experience"]);

export function isInjection(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /ignore (all )?(other )?(items|instructions|previous)/.test(t) ||
    /system note to the|note to the handover tool/.test(t) ||
    /report .*(all clear|as clear)/.test(t) ||
    /mark .*(approved|as approved)/.test(t) ||
    /add a .*(credit|goodwill)/.test(t)
  );
}

function uncertain(text: string): boolean {
  return /couldn'?t catch|not sure|unknown|unclear|couldn'?t tell|don'?t know which/i.test(text);
}

export function annotateFlags(
  threads: IssueThread[],
  allEvents: NormalizedEvent[],
): IssueThread[] {
  // Cross-source room-occupancy conflict: one source says in-house, another says empty.
  const emptyRooms = new Set(
    allEvents
      .filter((e) => /not slept in|nobody'?s been in|door ajar|looks (?:like )?empty|checked out early/i.test(e.text))
      .map((e) => e.room)
      .filter((r): r is string => !!r),
  );
  const inHouseRooms = new Set(
    allEvents
      .filter((e) => /in-house|in house|still shows .* in/i.test(e.text))
      .map((e) => e.room)
      .filter((r): r is string => !!r),
  );

  return threads.map((t) => {
    const flags = new Set<Flag>(t.flags);

    if (t.events.some((e) => isInjection(e.text))) flags.add("needs_review");

    if (
      (ACTIONABLE.has(t.category) && t.room === null) ||
      t.events.some((e) => uncertain(e.text))
    ) {
      flags.add("missing_data");
    }

    const hasResolved = t.events.some((e) => e.status === "resolved");
    const hasDispute = t.events.some((e) => /dispute|disputes|reverse|claims|contradict/i.test(e.text));
    if ((hasResolved && hasDispute) || (t.room && emptyRooms.has(t.room) && inHouseRooms.has(t.room))) {
      flags.add("contradiction");
    }

    if (t.events.some((e) => e.translatedText)) flags.add("machine_translated");

    return { ...t, flags: [...flags] };
  });
}
