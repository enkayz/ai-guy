import test from "node:test";
import assert from "node:assert/strict";

import {
  allowedEvents,
  aggregateEvents,
  createTrackingRecord,
  metricKey,
  sanitizeTrackingInput,
} from "../netlify/functions/_shared/tracking.mjs";

test("sanitizes tracking input to light analytics only", () => {
  const record = sanitizeTrackingInput(
    {
      event: "intent_click",
      sheet: "ai",
      variant: "gt-ai-a",
      intent: "private-ai",
      campaign: "gumtree",
      path: "/g/ai?c=gt-ai-a",
      name: "Jade",
      phone: "0400000000",
      message: "private Gumtree message",
      ip: "203.0.113.9",
    },
    {
      city: "Perth",
      country: { code: "AU" },
      subdivision: { code: "WA" },
    },
  );

  assert.equal(record.event, "intent_click");
  assert.equal(record.sheet, "ai");
  assert.equal(record.intent, "private-ai");
  assert.equal(record.geo.city, "Perth");
  assert.equal(record.geo.country, "AU");
  assert.equal(record.geo.subdivision, "WA");
  assert.ok(!("name" in record));
  assert.ok(!("phone" in record));
  assert.ok(!("message" in record));
  assert.ok(!("ip" in record));
});

test("rejects unknown events and normalizes invalid optional fields", () => {
  assert.deepEqual([...allowedEvents].sort(), [
    "cta_click",
    "intent_click",
    "page_view",
    "qr_open",
  ]);

  assert.throws(
    () => sanitizeTrackingInput({ event: "lead_submit" }),
    /Unsupported tracking event/,
  );

  const record = sanitizeTrackingInput({ event: "page_view", intent: "not-real" });
  assert.equal(record.intent, "");
  assert.equal(record.sheet, "unknown");
  assert.equal(record.variant, "unknown");
  assert.equal(record.campaign, "gumtree");
});

test("creates stable blob keys and aggregates dashboard counts", () => {
  const record = createTrackingRecord(
    { event: "cta_click", sheet: "home", variant: "gt-home-a", intent: "messy-setup", path: "/g/home" },
    { requestId: "req-123", timestamp: "2026-04-25T10:00:00.000Z" },
  );

  assert.equal(metricKey(record), "events/2026-04-25/req-123.json");

  const summary = aggregateEvents([
    record,
    createTrackingRecord(
      { event: "page_view", sheet: "home", variant: "gt-home-a", path: "/g/home" },
      { requestId: "req-124", timestamp: "2026-04-25T10:01:00.000Z" },
    ),
    createTrackingRecord(
      { event: "intent_click", sheet: "ai", variant: "gt-ai-a", intent: "better-prompts", path: "/g/ai" },
      { requestId: "req-125", timestamp: "2026-04-25T10:02:00.000Z" },
    ),
  ]);

  assert.equal(summary.total, 3);
  assert.equal(summary.byEvent.cta_click, 1);
  assert.equal(summary.byEvent.page_view, 1);
  assert.equal(summary.bySheet.home, 2);
  assert.equal(summary.byVariant["gt-ai-a"], 1);
  assert.equal(summary.byIntent["messy-setup"], 1);
});
