import { getStore } from "@netlify/blobs";
import { createTrackingRecord, metricKey } from "./_shared/tracking.mjs";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const input = await req.json();
    const record = createTrackingRecord(input, {
      geo: context.geo,
      requestId: context.requestId,
    });
    const store = getStore({ name: "gumtree-events" });
    await store.setJSON(metricKey(record), record);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Invalid tracking event" },
      { status: 400 },
    );
  }
};

export const config = {
  path: "/api/track",
};
