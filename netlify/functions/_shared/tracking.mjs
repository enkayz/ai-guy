export const allowedEvents = new Set(["page_view", "qr_open", "intent_click", "cta_click"]);

const allowedSheets = new Set(["home", "ai", "audit", "unknown"]);
const allowedIntents = new Set([
  "",
  "audit",
  "messy-setup",
  "better-prompts",
  "repeat-admin",
  "private-ai",
  "business-it",
]);

function cleanToken(value, fallback = "unknown") {
  if (typeof value !== "string") return fallback;
  const clean = value.trim().toLowerCase();
  return /^[a-z0-9_-]{1,48}$/.test(clean) ? clean : fallback;
}

function cleanPath(value) {
  if (typeof value !== "string") return "";
  return value.startsWith("/") ? value.slice(0, 240) : "";
}

export function sanitizeTrackingInput(input = {}, geo = {}) {
  const event = cleanToken(input.event, "");
  if (!allowedEvents.has(event)) {
    throw new Error(`Unsupported tracking event: ${input.event ?? ""}`);
  }

  const sheet = cleanToken(input.sheet);
  const intent = cleanToken(input.intent, "");
  const record = {
    event,
    campaign: "gumtree",
    sheet: allowedSheets.has(sheet) ? sheet : "unknown",
    variant: cleanToken(input.variant),
    intent: allowedIntents.has(intent) ? intent : "",
    path: cleanPath(input.path),
    timestamp: typeof input.timestamp === "string" ? input.timestamp : new Date().toISOString(),
  };

  const coarseGeo = {};
  if (typeof geo.city === "string") coarseGeo.city = geo.city;
  if (typeof geo.country?.code === "string") coarseGeo.country = geo.country.code;
  if (typeof geo.subdivision?.code === "string") coarseGeo.subdivision = geo.subdivision.code;
  if (Object.keys(coarseGeo).length > 0) record.geo = coarseGeo;

  return record;
}

export function createTrackingRecord(input, options = {}) {
  return {
    ...sanitizeTrackingInput(input, options.geo),
    requestId: options.requestId || crypto.randomUUID(),
    timestamp: options.timestamp || input.timestamp || new Date().toISOString(),
  };
}

export function metricKey(record) {
  const day = record.timestamp.slice(0, 10);
  return `events/${day}/${record.requestId}.json`;
}

function increment(bucket, key) {
  const safeKey = key || "none";
  bucket[safeKey] = (bucket[safeKey] || 0) + 1;
}

export function aggregateEvents(records) {
  const summary = {
    total: records.length,
    byEvent: {},
    bySheet: {},
    byVariant: {},
    byIntent: {},
  };

  for (const record of records) {
    increment(summary.byEvent, record.event);
    increment(summary.bySheet, record.sheet);
    increment(summary.byVariant, record.variant);
    if (record.intent) increment(summary.byIntent, record.intent);
  }

  return summary;
}
