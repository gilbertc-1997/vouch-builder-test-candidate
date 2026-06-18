export type Source = "json" | "log";
export type RawStatus = "resolved" | "unresolved" | "pending";
export type Classification = "still_open" | "newly_resolved" | "new_tonight";
export type Severity = "act_now" | "pending" | "fyi";
export type Flag = "contradiction" | "missing_data" | "needs_review" | "machine_translated";
export type Category =
  | "compliance" | "safety" | "financial"
  | "maintenance" | "guest_experience" | "informational";

export interface SourceRef {
  source: Source;
  id: string;        // event id (json) or synthesized log id
  line?: number;     // 1-based line in night-logs.md, for log entries
}

export interface NormalizedEvent {
  id: string;
  source: Source;
  timestamp: string;       // ISO 8601 with offset
  shiftDate: string;       // YYYY-MM-DD — the morning the shift ends on
  room: string | null;
  guest: string | null;
  type: string;
  text: string;            // original text, verbatim
  translatedText?: string; // machine translation, when source is non-English
  status: RawStatus;
  sourceRef: SourceRef;
}

export interface IssueThread {
  threadId: string;
  room: string | null;
  category: Category;
  events: NormalizedEvent[];   // known up to target morning, sorted asc by timestamp
  currentStatus: RawStatus;
  classification: Classification;
  flags: Flag[];
}

export interface HandoverItem {
  threadId: string;
  severity: Severity;
  severityReason: string[];
  classification: Classification;
  summary: string;
  room: string | null;
  sourceRefs: SourceRef[];
  flags: Flag[];
}

export interface Hotel { id: string; name: string; }

export interface Handover {
  hotel: Hotel;
  date: string;              // target morning, YYYY-MM-DD
  generatedAt: string;       // ISO timestamp
  counts: { act_now: number; pending: number; fyi: number; flags: number };
  groups: {
    act_now: HandoverItem[];
    pending: HandoverItem[];
    fyi: HandoverItem[];
  };
}

// Raw shapes for ingest
export interface RawEvent {
  id: string;
  timestamp: string;
  type: string;
  room: string | null;
  guest: string | null;
  description: string;
  status: RawStatus;
}
export interface EventsFile {
  hotel: { id: string; name: string; rooms: number; timezone: string };
  note?: string;
  events: RawEvent[];
}
