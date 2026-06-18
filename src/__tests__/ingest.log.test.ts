import { describe, it, expect } from "vitest";
import { ingestLog } from "../ingest";

const log = `# Night logs

## Night of Wed 27 May -> morning Thu 28 May (relief cover)

Intro line, not a bullet.

- Room 112 aircon — compressor needs ordering, stays out of order for now.
- 312 那个 no-show — 我已经按 booking terms 帮他收了一晚的费用了，这件事 settle 了。
- Someone called about wifi dropping, couldn't catch which room it was.
`;

describe("ingestLog", () => {
  const events = ingestLog(log, 2026);

  it("creates one event per bullet, skipping prose", () => {
    expect(events).toHaveLength(3);
  });
  it("derives the shift morning from the header", () => {
    expect(events.every((e) => e.shiftDate === "2026-05-28")).toBe(true);
  });
  it("extracts a room when present and leaves it null otherwise", () => {
    expect(events[0].room).toBe("112");
    expect(events[2].room).toBeNull();
  });
  it("keeps original text verbatim and tags source", () => {
    expect(events[1].text).toContain("我已经按 booking terms");
    expect(events[1].source).toBe("log");
    expect(events[1].sourceRef.source).toBe("log");
  });
});
