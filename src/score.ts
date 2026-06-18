import type { IssueThread, Severity } from "./types";
import { hasDeadline } from "./category";

export interface Scored { severity: Severity; severityReason: string[]; }

export function severityOf(t: IssueThread): Scored {
  const reasons: string[] = [];
  const resolved = t.currentStatus === "resolved";
  const open = !resolved;
  const deadline = t.events.some((e) => hasDeadline(`${e.text} ${e.translatedText ?? ""}`));
  const blockingFlag =
    t.flags.includes("contradiction") ||
    t.flags.includes("needs_review") ||
    t.flags.includes("missing_data");

  if (resolved && t.classification === "newly_resolved") {
    return { severity: "fyi", severityReason: ["resolved overnight — confirmation only"] };
  }

  let severity: Severity;
  if (open && (t.category === "compliance" || t.category === "safety")) {
    severity = "act_now";
    reasons.push(`${t.category} issue still open`);
  } else if (open && t.category === "financial" && deadline) {
    severity = "act_now";
    reasons.push("money at risk with a deadline");
  } else if (open && deadline) {
    severity = "act_now";
    reasons.push("explicit deadline not yet met");
  } else if (open) {
    severity = "pending";
    reasons.push(t.classification === "still_open" ? "carried over, still open" : "open, no imminent deadline");
  } else {
    severity = "fyi";
    reasons.push("informational");
  }

  // Fail safe: never bury something we could not fully trust while it is open.
  if (severity === "fyi" && open && blockingFlag) {
    severity = "pending";
    reasons.push("flagged for review — kept visible");
  }
  if (blockingFlag) reasons.push(`flags: ${t.flags.join(", ")}`);

  return { severity, severityReason: reasons };
}
