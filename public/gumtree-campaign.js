import { CAMPAIGN, getCampaignPage, getIntent, intents, trackingPayloadFor } from "/gumtree-campaign-data.mjs";

const params = new URLSearchParams(window.location.search);
const sheet = document.body.dataset.sheet || "home";
const page = getCampaignPage(sheet);
const variant = params.get("c") || page.variant;

const state = {
  selectedIntent: "business-it",
};

function track(event, intentId = "") {
  const intent = intentId ? getIntent(intentId) : undefined;
  const payload = trackingPayloadFor({
    event,
    page: { ...page, variant },
    intent,
    path: window.location.pathname + window.location.search,
  });

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    return;
  }
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function renderIntent(intentId) {
  const intent = getIntent(intentId);
  state.selectedIntent = intentId;

  document.querySelectorAll("[data-intent-card]").forEach((card) => {
    card.classList.toggle("selected", card.dataset.intentCard === intentId);
  });
  document.querySelector("[data-picture]").textContent = intent.picture;
  document.querySelector("[data-value-add]").textContent = intent.valueAdd;
  document.querySelector("[data-cta]").textContent = intent.cta;
}

function renderPage() {
  document.title = `${page.title} | ${CAMPAIGN.brand}`;
  document.querySelector("[data-brand]").textContent = CAMPAIGN.brand;
  document.querySelector("[data-promise]").textContent = CAMPAIGN.promise;
  document.querySelector("[data-title]").textContent = page.title;
  document.querySelector("[data-kicker]").textContent = page.kicker;
  document.querySelector("[data-breadcrumb]").textContent = page.breadcrumb;
  document.querySelector("[data-short-url]").textContent = page.shortUrl.replace("https://", "");

  const alreadyHave = document.querySelector("[data-already-have]");
  const tailoredAdds = document.querySelector("[data-tailored-adds]");
  alreadyHave.innerHTML = page.alreadyHave.map((item) => `<li>${item}</li>`).join("");
  tailoredAdds.innerHTML = page.tailoredAdds.map((item) => `<li>${item}</li>`).join("");

  const grid = document.querySelector("[data-intents]");
  grid.innerHTML = Object.values(intents)
    .map(
      (intent) => `
        <button class="intent-card" data-intent-card="${intent.id}" type="button">
          <span>${intent.label}</span>
          <small>${intent.cta}</small>
        </button>
      `,
    )
    .join("");

  grid.querySelectorAll("[data-intent-card]").forEach((card) => {
    card.addEventListener("click", () => {
      const intentId = card.dataset.intentCard;
      renderIntent(intentId);
      track("intent_click", intentId);
    });
  });

  document.querySelector("[data-cta-link]").addEventListener("click", () => {
    track("cta_click", state.selectedIntent);
  });

  renderIntent(state.selectedIntent);
  track(params.has("c") ? "qr_open" : "page_view");
}

renderPage();
