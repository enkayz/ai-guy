import { getStore } from "@netlify/blobs";
import { aggregateEvents } from "./_shared/tracking.mjs";

function metricsKeyFrom(req) {
  const url = new URL(req.url);
  return req.headers.get("x-metrics-key") || url.searchParams.get("key") || "";
}

function html(summary) {
  const rows = (title, data) => `
    <section>
      <h2>${title}</h2>
      <table>
        ${Object.entries(data)
          .sort((a, b) => b[1] - a[1])
          .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
          .join("")}
      </table>
    </section>
  `;

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>System 8 Gumtree Metrics</title>
        <style>
          body{font-family:system-ui,sans-serif;margin:32px;color:#142019;background:#f6f8f5}
          h1{margin:0 0 8px} main{max-width:920px}
          section{background:white;border:1px solid #dce5df;border-radius:8px;padding:16px;margin:16px 0}
          table{width:100%;border-collapse:collapse} td{border-top:1px solid #edf2ef;padding:8px}
          td:last-child{text-align:right;font-weight:700}
        </style>
      </head>
      <body>
        <main>
          <h1>System 8 Gumtree Metrics</h1>
          <p>Total light-analytics events: <strong>${summary.total}</strong></p>
          ${rows("Events", summary.byEvent)}
          ${rows("Sheets", summary.bySheet)}
          ${rows("Variants", summary.byVariant)}
          ${rows("Intents", summary.byIntent)}
        </main>
      </body>
    </html>`;
}

export default async (req) => {
  const expected = Netlify.env.get("METRICS_KEY") || process.env.METRICS_KEY;
  if (!expected || metricsKeyFrom(req) !== expected) {
    return new Response("Not found", { status: 404 });
  }

  const store = getStore({ name: "gumtree-events", consistency: "strong" });
  const { blobs } = await store.list({ prefix: "events/" });
  const records = [];
  for (const blob of blobs) {
    const record = await store.get(blob.key, { type: "json" });
    if (record) records.push(record);
  }

  const summary = aggregateEvents(records);
  if (req.headers.get("accept")?.includes("application/json")) {
    return Response.json(summary);
  }
  return new Response(html(summary), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

export const config = {
  path: "/api/metrics",
};
