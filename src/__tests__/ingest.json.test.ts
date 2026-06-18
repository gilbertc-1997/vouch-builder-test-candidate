import { describe, it, expect } from "vitest";
import { ingestJson } from "../ingest";
import type { EventsFile } from "../types";

const sample: EventsFile = {
  hotel: { id: "lumen-sg", name: "Lumen", rooms: 40, timezone: "+08:00" },
  events: [
    { id: "evt_0002", timestamp: "2026-05-26T00:20:00+08:00", type: "maintenance",
      room: "112", guest: "Sarah Wong", description: "Aircon not cooling.", status: "unresolved" },
  ],
};

describe("ingestJson", () => {
  it("normalizes a raw event and preserves a source ref", () => {
    const [e] = ingestJson(sample);
    expect(e).toMatchObject({
      id: "evt_0002", source: "json", room: "112", guest: "Sarah Wong",
      type: "maintenance", text: "Aircon not cooling.", status: "unresolved",
      shiftDate: "2026-05-26",
      sourceRef: { source: "json", id: "evt_0002" },
    });
  });
});
