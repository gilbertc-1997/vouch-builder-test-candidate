import { describe, it, expect, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { generateHandover } from "../pipeline";
import type { EventsFile, Handover } from "../types";

const passthrough = async (s: string) => s;

let handover: Handover;

beforeAll(async () => {
  const eventsRaw = await readFile(resolve("data/events.json"), "utf8");
  const nightLogsRaw = await readFile(resolve("data/night-logs.md"), "utf8");
  const events = JSON.parse(eventsRaw) as EventsFile;

  handover = await generateHandover({
    events,
    nightLogs: nightLogsRaw,
    date: "2026-05-30",
    translate: passthrough,
  });
});

describe("grounding invariants", () => {
  it("every handover item carries at least one source ref", () => {
    const all = [
      ...handover.groups.act_now,
      ...handover.groups.pending,
      ...handover.groups.fyi,
    ];
    expect(all.length).toBeGreaterThan(0);
    for (const item of all) {
      expect(item.sourceRefs.length, `${item.threadId} has no sourceRefs`).toBeGreaterThan(0);
    }
  });

  it("evt_0026 prompt injection surfaces as needs_review, never in fyi", () => {
    const all = [
      ...handover.groups.act_now,
      ...handover.groups.pending,
      ...handover.groups.fyi,
    ];
    // Find the item that references evt_0026
    const injectionItem = all.find((i) =>
      i.sourceRefs.some((r) => r.id === "evt_0026"),
    );
    expect(injectionItem, "evt_0026 must appear in the handover").toBeDefined();
    expect(injectionItem!.flags).toContain("needs_review");
    expect(injectionItem!.severity).not.toBe("fyi");
  });

  it("room 112 aircon thread is classified still_open across multiple nights", () => {
    const all = [
      ...handover.groups.act_now,
      ...handover.groups.pending,
      ...handover.groups.fyi,
    ];
    const airconItem = all.find(
      (i) => i.room === "112" && i.sourceRefs.some((r) => r.id === "evt_0002"),
    );
    expect(airconItem, "room 112 aircon thread must appear").toBeDefined();
    expect(airconItem!.classification).toBe("still_open");
  });
});
