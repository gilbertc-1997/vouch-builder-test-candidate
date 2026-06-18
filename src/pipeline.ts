import type { EventsFile, Handover, NormalizedEvent } from "./types";
import { ingestJson, ingestLog } from "./ingest";
import { translateEvents, getTranslator, type TranslateFn } from "./lang";
import { reconcile } from "./reconcile";
import { annotateFlags } from "./flags";
import { buildHandover } from "./render";

export interface PipelineInput {
  events: EventsFile;
  nightLogs?: string;
  date?: string;             // target morning; defaults to latest known shift
  translate?: TranslateFn;   // injectable; defaults to the local model
}

function defaultYear(events: NormalizedEvent[]): number {
  const years = events.map((e) => Number.parseInt(e.shiftDate.slice(0, 4), 10));
  return years.sort((a, b) => b - a)[0] ?? new Date().getUTCFullYear();
}

function latestShift(events: NormalizedEvent[]): string {
  return events.map((e) => e.shiftDate).sort().at(-1) ?? new Date().toISOString().slice(0, 10);
}

export async function generateHandover(input: PipelineInput): Promise<Handover> {
  const jsonEvents = ingestJson(input.events);
  const year = defaultYear(jsonEvents);
  const logEvents = input.nightLogs ? ingestLog(input.nightLogs, year) : [];
  const merged = [...jsonEvents, ...logEvents];

  const translate = input.translate ?? (await getTranslator());
  const translated = await translateEvents(merged, translate);

  const targetDate = input.date ?? latestShift(translated);
  const threads = annotateFlags(reconcile(translated, targetDate), translated);
  return buildHandover(threads, { id: input.events.hotel.id, name: input.events.hotel.name }, targetDate);
}
