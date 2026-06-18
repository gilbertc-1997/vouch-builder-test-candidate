import type { NormalizedEvent } from "./types";

export type TranslateFn = (text: string) => Promise<string>;

export function containsCJK(text: string): boolean {
  return /[一-鿿]/.test(text);
}

export async function translateEvents(
  events: NormalizedEvent[],
  translate: TranslateFn,
): Promise<NormalizedEvent[]> {
  const out: NormalizedEvent[] = [];
  for (const e of events) {
    if (containsCJK(e.text)) {
      const translatedText = (await translate(e.text)).trim();
      out.push({ ...e, translatedText });
    } else {
      out.push(e);
    }
  }
  return out;
}

// Lazy real translator (loaded only at runtime, never in unit tests).
// Set SKIP_TRANSLATION=true to use a passthrough instead (avoids the ~25 s ONNX cold start
// on constrained hosts like Render free tier where the proxy times out before the model loads).
let _pipe: Promise<(text: string) => Promise<string>> | null = null;
export function getTranslator(): Promise<(text: string) => Promise<string>> {
  if (process.env.SKIP_TRANSLATION === "true") {
    return Promise.resolve(async (text: string) => text);
  }
  if (!_pipe) {
    _pipe = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      const translator = await pipeline("translation", "Xenova/opus-mt-zh-en");
      return async (text: string) => {
        const res = (await translator(text)) as Array<{ translation_text: string }>;
        return res[0]?.translation_text ?? text;
      };
    })();
  }
  return _pipe;
}
