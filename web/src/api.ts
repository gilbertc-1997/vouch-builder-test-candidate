export interface SourceRef { source: "json" | "log"; id: string; line?: number; }
export interface HandoverItem {
  threadId: string;
  severity: "act_now" | "pending" | "fyi";
  severityReason: string[];
  classification: "still_open" | "newly_resolved" | "new_tonight";
  summary: string;
  room: string | null;
  sourceRefs: SourceRef[];
  flags: string[];
}
export interface Handover {
  hotel: { id: string; name: string };
  date: string;
  generatedAt: string;
  counts: { act_now: number; pending: number; fyi: number; flags: number };
  groups: { act_now: HandoverItem[]; pending: HandoverItem[]; fyi: HandoverItem[] };
}

export async function fetchHandover(date?: string): Promise<Handover> {
  const res = await fetch(`/handover${date ? `?date=${date}` : ""}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
