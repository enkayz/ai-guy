export const CAMPAIGN = {
  name: "gumtree",
  brand: "SYSTEM 8",
  promise: "Practical AI, automation and home-office systems",
  auditPath: "/g/audit",
};

export const campaignPages = {
  home: {
    key: "home",
    sheet: "home",
    variant: "gt-home-a",
    path: "/g/home",
    title: "Map your home office setup",
    kicker: "You already have the checklist. Now turn it into a setup map.",
    shortUrl: "https://agent.system8.com.au/g/home?c=gt-home-a",
    breadcrumb: "Want your setup mapped? Start with the free System 8 audit.",
    alreadyHave: [
      "A practical checklist for router, Wi-Fi, printer, backup and password manager setup.",
      "A cable label sheet to make the physical setup easier to understand.",
      "A simple way to record what is plugged in where before something breaks.",
    ],
    tailoredAdds: [
      "A room-by-room map of weak spots, risk points and quick wins.",
      "A prioritized list of what to fix first without buying unnecessary gear.",
      "A handover note you can keep for future troubleshooting.",
    ],
  },
  ai: {
    key: "ai",
    sheet: "ai",
    variant: "gt-ai-a",
    path: "/g/ai",
    title: "Turn the AI worksheet into your own workflow",
    kicker: "You already have the prompt sheet. Now shape it around a real task.",
    shortUrl: "https://agent.system8.com.au/g/ai?c=gt-ai-a",
    breadcrumb: "Want this turned into your own workflow? Start with the free System 8 audit.",
    alreadyHave: [
      "A prompt structure for better answers from AI tools.",
      "A worksheet for turning rough ideas into repeatable steps.",
      "Privacy checks to keep sensitive details out of casual AI use.",
    ],
    tailoredAdds: [
      "A first workflow prompt written for your exact use case.",
      "A review checklist so AI output stays useful and low-risk.",
      "A short path from one manual task to a repeatable automation.",
    ],
  },
};

export const intents = {
  "messy-setup": {
    id: "messy-setup",
    label: "My home office setup is messy",
    picture: "Imagine knowing which cable, account and device matters before the next outage.",
    valueAdd: "A setup map makes the hidden mess visible, then sorts it into easy wins and later upgrades.",
    cta: "Map my setup",
  },
  "better-prompts": {
    id: "better-prompts",
    label: "I want better AI prompts",
    picture: "Imagine asking once and getting a usable draft, checklist or plan instead of vague advice.",
    valueAdd: "A prompt pattern matched to your work gives you better answers without sharing private details.",
    cta: "Show me the first prompt",
  },
  "repeat-admin": {
    id: "repeat-admin",
    label: "I want to automate repeat admin",
    picture: "Imagine one recurring task becoming a clear input, review step and finished output.",
    valueAdd: "A small automation map shows what can be safely delegated and what still needs your judgement.",
    cta: "Show me the first automation",
  },
  "private-ai": {
    id: "private-ai",
    label: "I want private/offline AI",
    picture: "Imagine useful AI help without casually sending sensitive notes to a public tool.",
    valueAdd: "A privacy-first AI setup starts with data boundaries, hardware reality and a clear use case.",
    cta: "Plan private AI",
  },
  "business-it": {
    id: "business-it",
    label: "I need small-business IT help",
    picture: "Imagine your devices, accounts, backups and automations working as one boring reliable system.",
    valueAdd: "A light audit turns scattered issues into a practical support plan with the highest-value fix first.",
    cta: "Get the free audit",
  },
};

export function getCampaignPage(key) {
  const page = campaignPages[key];
  if (!page) throw new Error(`Unknown campaign page: ${key}`);
  return page;
}

export function getIntent(id) {
  const intent = intents[id];
  if (!intent) throw new Error(`Unknown intent: ${id}`);
  return intent;
}

export function trackingPayloadFor({ event, page, intent, path }) {
  return {
    event,
    campaign: CAMPAIGN.name,
    sheet: page.sheet,
    variant: page.variant,
    intent: intent?.id ?? "",
    path,
    timestamp: new Date().toISOString(),
  };
}
