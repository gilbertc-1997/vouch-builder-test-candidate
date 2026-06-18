import { useEffect, useState } from "react";
import { fetchHandover, type Handover, type HandoverItem } from "./api";

const BUCKETS: Array<{ key: "act_now" | "pending" | "fyi"; label: string }> = [
  { key: "act_now", label: "🔥 Act now" },
  { key: "pending", label: "⏳ Pending" },
  { key: "fyi", label: "ℹ️ FYI" },
];

function Item({ item }: { item: HandoverItem }) {
  return (
    <li className={`item ${item.severity}`}>
      <div className="summary">{item.summary}</div>
      <div className="meta">
        <span className="tag">{item.classification}</span>
        {item.flags.map((f) => (
          <span key={f} className="flag">{f}</span>
        ))}
        {item.sourceRefs.map((r) => (
          <span key={r.id} className="ref">{r.id}</span>
        ))}
      </div>
      {item.severityReason.length > 0 && (
        <div className="why">why: {item.severityReason.join("; ")}</div>
      )}
    </li>
  );
}

export function App() {
  const [date, setDate] = useState("2026-05-30");
  const [data, setData] = useState<Handover | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    fetchHandover(date).then(setData).catch((e) => setError(String(e)));
  }, [date]);

  return (
    <main>
      <h1>Night-Shift Handover</h1>
      <label>
        Morning of{" "}
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      {!data && !error && <p>Loading…</p>}
      {data && (
        <>
          <p className="hotel">
            {data.hotel.name} — {data.counts.act_now} urgent · {data.counts.pending} pending ·{" "}
            {data.counts.fyi} FYI · {data.counts.flags} flagged
          </p>
          {BUCKETS.map(({ key, label }) => (
            <section key={key}>
              <h2>
                {label} ({data.groups[key].length})
              </h2>
              <ul>
                {data.groups[key].map((i) => (
                  <Item key={i.threadId} item={i} />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
