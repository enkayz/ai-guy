import test from "node:test";
import assert from "node:assert/strict";

import {
  CAMPAIGN,
  getCampaignPage,
  getIntent,
  trackingPayloadFor,
} from "../public/gumtree-campaign-data.mjs";

test("defines the Gumtree campaign pages with tracked System 8 breadcrumbs", () => {
  assert.equal(CAMPAIGN.name, "gumtree");

  const home = getCampaignPage("home");
  assert.equal(home.path, "/g/home");
  assert.equal(home.sheet, "home");
  assert.equal(home.variant, "gt-home-a");
  assert.match(home.shortUrl, /agent\.system8\.com\.au\/g\/home\?c=gt-home-a/);
  assert.match(home.breadcrumb, /free System 8 audit/i);

  const ai = getCampaignPage("ai");
  assert.equal(ai.path, "/g/ai");
  assert.equal(ai.sheet, "ai");
  assert.equal(ai.variant, "gt-ai-a");
  assert.match(ai.shortUrl, /agent\.system8\.com\.au\/g\/ai\?c=gt-ai-a/);
  assert.match(ai.breadcrumb, /free System 8 audit/i);
});

test("maps the five intent cards to soft-closer copy", () => {
  const intents = [
    "messy-setup",
    "better-prompts",
    "repeat-admin",
    "private-ai",
    "business-it",
  ];

  for (const id of intents) {
    const intent = getIntent(id);
    assert.equal(intent.id, id);
    assert.ok(intent.label.length > 10);
    assert.ok(intent.picture.length > 30);
    assert.ok(intent.valueAdd.length > 30);
    assert.ok(intent.cta.length > 8);
  }
});

test("builds light analytics payloads without personal data fields", () => {
  const payload = trackingPayloadFor({
    event: "intent_click",
    page: getCampaignPage("ai"),
    intent: getIntent("better-prompts"),
    path: "/g/ai?c=gt-ai-a",
  });

  assert.deepEqual(Object.keys(payload).sort(), [
    "campaign",
    "event",
    "intent",
    "path",
    "sheet",
    "timestamp",
    "variant",
  ]);
  assert.equal(payload.campaign, "gumtree");
  assert.equal(payload.sheet, "ai");
  assert.equal(payload.variant, "gt-ai-a");
  assert.equal(payload.intent, "better-prompts");
  assert.equal(payload.event, "intent_click");
  assert.ok(!("ip" in payload));
  assert.ok(!("name" in payload));
  assert.ok(!("phone" in payload));
  assert.ok(!("message" in payload));
});
