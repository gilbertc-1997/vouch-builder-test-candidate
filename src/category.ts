import type { Category, NormalizedEvent } from "./types";

export function categoryOf(e: NormalizedEvent): Category {
  const t = `${e.type} ${e.text}`.toLowerCase();
  if (e.type === "compliance" || /immigration|passport|scan/.test(t)) return "compliance";
  if (/leak|water|fire|unwell|ambulance|medical|injur|security|保险箱|safe\b|lockbox/.test(t)) return "safety";
  if (
    ["deposit_issue", "finance_note", "damage_report", "no_show"].includes(e.type) ||
    /deposit|charge|refund|invoice|damage|no-show|sgd|费用/.test(t)
  ) return "financial";
  if (e.type === "maintenance" || /aircon|compressor|repair|out of order/.test(t)) return "maintenance";
  if (e.type === "complaint" || /noise|wifi|breakfast|complain/.test(t)) return "guest_experience";
  return "informational";
}

export function hasDeadline(text: string): boolean {
  return /48 hours|checks? out tomorrow|tomorrow morning|leaving \d|before checkout|deadline|cutoff|赶飞机|flight/i.test(
    text,
  );
}
