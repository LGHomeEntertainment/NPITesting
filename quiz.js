/* ============================================================
   LG TV Quiz — quiz.js
   All question data, scoring logic, SKU data, and UI logic.
   ============================================================ */

"use strict";

// ── TRACKING ──────────────────────────────────────────────────
// Replace TRACKING_ENDPOINT with your real URL when ready.
// All events are fire-and-forget — quiz never waits on this.
const TRACKING_ENDPOINT = null; // e.g. "https://yourserver.com/api/quiz-event"

function track(event, data = {}) {
  const payload = {
    event,
    ts: new Date().toISOString(),
    session: SESSION_ID,
    ...data,
  };
  console.log("[track]", payload); // remove when live
  if (!TRACKING_ENDPOINT) return;
  fetch(TRACKING_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {}); // silently ignore failures
}

// Unique session ID per quiz play
let SESSION_ID = crypto.randomUUID();

// ── QUESTIONS ─────────────────────────────────────────────────
// Each question: id, phase, phaseColor (CSS var name), text,
// hint (optional), multi (bool), answers[]
// Each answer: id, icon, label, sub, note (optional),
//   scores: { oled, mrgb, qned, nu } (optional),
//   next: question id or "result" or "budget-sbm" (optional override)
//   flags: [] (optional string flags e.g. "sbm", "w6-unlock")

const QUESTIONS = [
  {
    id: "q1",
    phase: "Mobility",
    phaseColor: "var(--phase-mobility)",
    text: "Do you need a TV that stays put — or one that moves with you?",
    multi: false,
    answers: [
      {
        id: "q1-fixed",
        icon: "🏠",
        label: "Stays in one place",
        sub: "Wall-mounted or on a console",
        next: "q2",
      },
      {
        id: "q1-mobile",
        icon: "🔄",
        label: "I want to move it around the house",
        sub: "Take it room to room",
        next: "q8-sbm",
        flags: ["sbm"],
      },
      {
        id: "q1-unsure",
        icon: "🤔",
        label: "Not sure yet",
        sub: "I'll figure out placement later",
        next: "q2",
      },
    ],
  },
  {
    id: "q2",
    phase: "Room Size",
    phaseColor: "var(--phase-room)",
    text: "What kind of space will the TV be in?",
    multi: false,
    answers: [
      {
        id: "q2-cosy",
        icon: "🛏️",
        label: "Cosy — bedroom or study",
        sub: "Smaller, more intimate space",
        sizeTier: "small",
      },
      {
        id: "q2-medium",
        icon: "🛋️",
        label: "Medium — standard living room",
        sub: "Typical family or entertainment area",
        sizeTier: "medium",
      },
      {
        id: "q2-large",
        icon: "🏛️",
        label: "Spacious — open plan or entertainment room",
        sub: "Large, generous viewing space",
        sizeTier: "large",
      },
    ],
  },
  {
    id: "q3",
    phase: "Room Size",
    phaseColor: "var(--phase-room)",
    text: "How far away do you usually sit from the TV?",
    multi: false,
    answers: [
      {
        id: "q3-vclose",
        icon: "🪑",
        label: "Very close",
        sub: "Under 1.5 m",
        note: "→ 48–55\" range",
        sizeNudge: "down",
      },
      {
        id: "q3-close",
        icon: "↔️",
        label: "Comfortably close",
        sub: "1.5 – 2.5 m",
        note: "→ 55–65\" range",
        sizeNudge: "none",
      },
      {
        id: "q3-standard",
        icon: "↔️",
        label: "Standard distance",
        sub: "2.5 – 3.5 m",
        note: "→ 65–83\" range",
        sizeNudge: "none",
      },
      {
        id: "q3-far",
        icon: "🏔️",
        label: "Far viewing",
        sub: "3.5 m and above",
        note: "→ 83–100\" range",
        sizeNudge: "up",
      },
    ],
  },
  {
    id: "q4",
    phase: "Usage",
    phaseColor: "var(--phase-usage)",
    text: "How do you mainly use your TV?",
    hint: "Pick up to 2",
    multi: true,
    maxSelect: 2,
    answers: [
      {
        id: "q4-movies",
        icon: "🎬",
        label: "Cinematic movies & streaming",
        sub: "You love rich colours and deep contrast",
        scores: { oled: 3, mrgb: 1, qned: 0, nu: 0 },
        flags: ["copy-hyper-radiant"],
      },
      {
        id: "q4-sports",
        icon: "⚽",
        label: "Sports and live broadcasts",
        sub: "Fast motion, bright stadium action",
        scores: { oled: -1, mrgb: 3, qned: 2, nu: 0 },
        flags: ["copy-motion"],
      },
      {
        id: "q4-gaming",
        icon: "🎮",
        label: "Console or PC gaming",
        sub: "Low latency and high refresh rate matter",
        scores: { oled: 3, mrgb: 2, qned: 0, nu: 0 },
        flags: ["copy-gaming"],
      },
      {
        id: "q4-family",
        icon: "👨‍👩‍👧",
        label: "Family viewing — kids included",
        sub: "LG OLED is certified eye safe for the whole family",
        scores: { oled: 1, mrgb: 0, qned: 2, nu: 2 },
        flags: ["copy-eye-safe"],
      },
      {
        id: "q4-general",
        icon: "📺",
        label: "General everyday use",
        sub: "A reliable screen for a bit of everything",
        scores: { oled: 0, mrgb: 0, qned: 2, nu: 2 },
      },
    ],
  },
  {
    id: "q5",
    phase: "Environment",
    phaseColor: "var(--phase-environment)",
    text: "Which best describes the room the TV will be in?",
    hint: "Helps us understand your typical lighting conditions",
    multi: false,
    answers: [
      {
        id: "q5-media",
        icon: "🎬",
        label: "Dedicated media room or home theatre",
        sub: "Controlled lighting, purpose-built for viewing",
        scores: { oled: 3, mrgb: 1, qned: 0, nu: 0 },
        flags: ["copy-contrast"],
      },
      {
        id: "q5-living",
        icon: "🛋️",
        label: "Living room or common area",
        sub: "Everyday lighting, mix of day and night use",
        scores: { oled: 1, mrgb: 2, qned: 1, nu: 0 },
      },
      {
        id: "q5-bedroom",
        icon: "🛏️",
        label: "Bedroom",
        sub: "Usually dimmer, relaxed viewing environment",
        scores: { oled: 2, mrgb: 1, qned: 0, nu: 0 },
        flags: ["copy-slim"],
      },
      {
        id: "q5-bright",
        icon: "☀️",
        label: "Bright room with lots of natural light",
        sub: "Large windows, hard to control glare",
        scores: { oled: -1, mrgb: 3, qned: 2, nu: 1 },
        flags: ["copy-reflection-free"],
      },
    ],
  },
  {
    id: "q6",
    phase: "Environment",
    phaseColor: "var(--phase-environment)",
    text: "How important is it that your TV looks good — even when switched off?",
    multi: false,
    answers: [
      {
        id: "q6-very",
        icon: "✨",
        label: "Very important — slim, premium design matters a lot",
        sub: "",
        scores: { oled: 2, mrgb: 0, qned: 0, nu: 0 },
        next: "q6a",
        flags: ["copy-slim"],
      },
      {
        id: "q6-somewhat",
        icon: "👍",
        label: "Somewhat — nice to have, but not a priority",
        sub: "",
        scores: { oled: 1, mrgb: 0, qned: 0, nu: 0 },
        next: "q6a",
      },
      {
        id: "q6-no",
        icon: "🔧",
        label: "Not important — performance over looks",
        sub: "",
        scores: { oled: 0, mrgb: 0, qned: 0, nu: 0 },
        next: "q7",
      },
    ],
  },
  {
    id: "q6a",
    phase: "Environment",
    phaseColor: "var(--phase-environment)",
    text: "When you're not watching, what would you like the TV to do?",
    hint: "Only asked if design matters to you",
    multi: false,
    showCallout: true,
    answers: [
      {
        id: "q6a-art",
        icon: "🖼️",
        label: "Display art, a clock, or ambient visuals",
        sub: "Turn it into a living picture frame",
        scores: { oled: 2, mrgb: 0, qned: 0, nu: 0 },
        flags: ["w6-unlock", "copy-gallery"],
      },
      {
        id: "q6a-off",
        icon: "⬛",
        label: "Just turn off — a black screen is fine",
        sub: "I only need it when I'm watching",
        scores: { oled: 0, mrgb: 0, qned: 0, nu: 0 },
      },
    ],
  },
  {
    id: "q7",
    phase: "Budget",
    phaseColor: "var(--phase-budget)",
    text: "How important is price in your decision?",
    multi: false,
    answers: [
      {
        id: "q7-best",
        icon: "💎",
        label: "I want the best — price is secondary",
        sub: "Quality and experience come first",
        budgetTier: "premium",
      },
      {
        id: "q7-stretch",
        icon: "🤔",
        label: "Open to stretching — if it's worth it, I'll consider going higher",
        sub: "Value matters, but I can be convinced",
        budgetTier: "mid-high",
      },
      {
        id: "q7-range",
        icon: "⚖️",
        label: "Price matters — I have a range and want the best within it",
        sub: "Smart spend, no overpaying",
        budgetTier: "mid",
      },
      {
        id: "q7-value",
        icon: "💰",
        label: "Price is the priority — maximum value for money",
        sub: "I want a great TV without breaking the bank",
        budgetTier: "value",
      },
    ],
  },
  // StanbyME path — only reached via q1-mobile
  {
    id: "q8-sbm",
    phase: "Budget",
    phaseColor: "var(--phase-mobility)",
    text: "One last thing — what's your budget for the StanbyME?",
    hint: "LG StanbyME 2026 — 32\" 4K UHD · Wireless · Tilts and rolls wherever you go",
    multi: false,
    isSbmPath: true,
    answers: [
      {
        id: "q8-sbm-low",
        icon: "💰",
        label: "Under $1,500",
        sub: "Exploring entry options",
        next: "result",
        budgetTier: "value",
      },
      {
        id: "q8-sbm-mid",
        icon: "⚖️",
        label: "$1,500 – $2,500",
        sub: "Mid-range flexibility",
        next: "result",
        budgetTier: "mid",
      },
      {
        id: "q8-sbm-high",
        icon: "💎",
        label: "Above $2,500",
        sub: "Premium, no compromise",
        next: "result",
        budgetTier: "premium",
      },
    ],
  },
];

// Normal question order (excludes StanbyME branch)
const QUESTION_ORDER = ["q1", "q2", "q3", "q4", "q5", "q6", "q6a", "q7"];

// ── SKU DATA ──────────────────────────────────────────────────
// ~ prefix = estimated / proxy price. Confirm before event.
// sizes: array of { size (inches), price }

const SKUS = {
  W6: {
    name: "LG OLED W6",
    panel: "OLED",
    tier: "premium",
    tagline: "Wallpaper OLED — hangs like a painting",
    sizes: [
      { size: 65, price: 5699 },
      { size: 77, price: 10499 },
    ],
    features: ["Wireless Zero Connect Box", "Reflection-Free Glass", "Gallery & Art Mode", "Brightness Booster Ultimate"],
    approxPrices: true,
  },
  G6: {
    name: "LG OLED G6",
    panel: "OLED",
    tier: "premium",
    tagline: "Gallery Series — wall-flush design",
    sizes: [
      { size: 55, price: 3999 },
      { size: 65, price: 4999 },
      { size: 77, price: 9499 },
      { size: 83, price: 11999 },
      { size: 97, price: 34999 },
    ],
    features: ["Reflection-Free Glass", "Brightness Booster Ultimate", "Gallery & Art Mode", "Slim wall-mount design"],
    approxPrices: true,
  },
  C6: {
    name: "LG OLED C6",
    panel: "OLED",
    tier: "mid-high",
    tagline: "The benchmark OLED",
    sizes: [
      { size: 42, price: 2299 },
      { size: 48, price: 2499 },
      { size: 55, price: 3399 },
      { size: 65, price: 4399 },
      { size: 77, price: 7999 },
      { size: 83, price: 10499 },
    ],
    features: ["Hyper Radiant Colour (77\"+83\")", "Brightness Booster Max", "4K OLED evo Panel", "WebOS 25"],
    approxPrices: true,
  },
  B6: {
    name: "LG OLED B6",
    panel: "OLED",
    tier: "mid",
    tagline: "Entry OLED — still exceptional",
    sizes: [
      { size: 48, price: 2299 },
      { size: 55, price: 2799 },
      { size: 65, price: 3799 },
      { size: 77, price: 6499 },
      { size: 83, price: 7999 },
    ],
    features: ["Perfect black levels", "Dolby Vision & Atmos", "4K OLED Panel", "WebOS 25"],
    approxPrices: true,
  },
  MRGB: {
    name: "LG MRGB",
    panel: "MRGB",
    tier: "mid-high",
    tagline: "Next-gen brightness tech",
    sizes: [
      { size: 55, price: 2199 },
      { size: 65, price: 2799 },
      { size: 75, price: 3799 },
    ],
    features: ["Mini RGB Backlight", "Extreme peak brightness", "No burn-in concern", "Sports & bright room optimised"],
    approxPrices: true,
  },
  QNED86: {
    name: "LG QNED86",
    panel: "QNED",
    tier: "mid",
    tagline: "Premium QNED with NanoCell",
    sizes: [
      { size: 55, price: 1999 },
      { size: 65, price: 2599 },
      { size: 75, price: 3499 },
      { size: 86, price: 4699 },
      { size: 100, price: 7299 },
    ],
    features: ["NanoCell Colour Technology", "Full Array Local Dimming", "120Hz Panel", "WebOS 25"],
    approxPrices: false,
  },
  QNED80: {
    name: "LG QNED80",
    panel: "QNED",
    tier: "mid",
    tagline: "Great value QNED",
    sizes: [
      { size: 55, price: 1399 },
      { size: 65, price: 1799 },
      { size: 75, price: 2499 },
      { size: 86, price: 3399 },
    ],
    features: ["NanoCell Colour Technology", "4K UHD", "Active HDR", "WebOS 25"],
    approxPrices: false,
  },
  NU85: {
    name: "LG NU85",
    panel: "NanoUHD",
    tier: "value",
    tagline: "Smart 4K value",
    sizes: [
      { size: 43, price: 649 },
      { size: 50, price: 749 },
      { size: 55, price: 849 },
      { size: 65, price: 1049 },
      { size: 75, price: 1649 },
      { size: 86, price: 2499 },
    ],
    features: ["4K UHD", "WebOS 25", "Active HDR", "A5 AI Processor"],
    approxPrices: true,
  },
  SBM: {
    name: "LG StanbyME 2026",
    panel: "StanbyME",
    tier: "any",
    tagline: "32\" 4K · Wireless · Goes wherever you go",
    sizes: [
      { size: 32, price: null }, // TBC 2026
    ],
    features: ["32\" 4K UHD Touchscreen", "Wireless & battery-powered", "Tilts, rotates & rolls", "Built-in speakers"],
    approxPrices: true,
  },
};

// Size tiers → preferred size ranges (inches)
const SIZE_TIERS = {
  small:  [43, 48, 55],
  medium: [55, 65],
  large:  [65, 75, 77, 83],
};

// Budget tier → eligible panel keys (in preference order)
const BUDGET_POOLS = {
  premium:  ["W6", "G6", "C6", "MRGB"],
  "mid-high": ["C6", "B6", "MRGB", "QNED86"],
  mid:      ["B6", "QNED86", "QNED80"],
  value:    ["QNED80", "NU85"],
};

// ── FEATURE COPY ──────────────────────────────────────────────
// Keyed by flag name. Used to build "Why this TV for you" bullets.
const FEATURE_COPY = {
  "copy-hyper-radiant": "Hyper Radiant Colour delivers exceptional vibrancy for movies and streaming",
  "copy-motion":        "Smooth Motion technology keeps fast sports action sharp and blur-free",
  "copy-gaming":        "Low latency gaming mode with high refresh rate for instant response",
  "copy-eye-safe":      "LG OLED Eye Care certification — safer viewing for the whole family",
  "copy-contrast":      "Perfect black levels and infinite contrast ratio built for dark room cinema",
  "copy-slim":          "Ultra-slim profile looks stunning in any room, even when switched off",
  "copy-reflection-free": "Reflection-Free Glass eliminates glare in bright rooms with large windows",
  "copy-gallery":       "Gallery & Art Mode turns your TV into a living piece of art when not in use",
};

// ── STATE ─────────────────────────────────────────────────────
let state = {
  answers: {},         // { questionId: answerId | [answerId] }
  scores:  { oled: 0, mrgb: 0, qned: 0, nu: 0 },
  flags:   new Set(),
  sizeTier: null,
  budgetTier: null,
  isSbm: false,
  history: [],         // stack of question ids for back navigation
  currentQ: null,
  startTime: null,
};

function resetState() {
  SESSION_ID = crypto.randomUUID();
  state = {
    answers: {}, scores: { oled: 0, mrgb: 0, qned: 0, nu: 0 },
    flags: new Set(), sizeTier: null, budgetTier: null,
    isSbm: false, history: [], currentQ: null, startTime: null,
  };
}

// ── IDLE TIMER ────────────────────────────────────────────────
const IDLE_TIMEOUT_MS  = 60_000; // 1 minute
const IDLE_COUNTDOWN_S = 10;     // countdown shown in overlay

let idleTimer   = null;
let countdownTimer = null;
let idleCountdown  = IDLE_COUNTDOWN_S;

function resetIdleTimer() {
  clearTimeout(idleTimer);
  clearInterval(countdownTimer);
  hideIdleOverlay();
  idleTimer = setTimeout(showIdleOverlay, IDLE_TIMEOUT_MS);
}

function showIdleOverlay() {
  // Only show if not on landing screen
  if (document.getElementById("screen-landing").classList.contains("hidden") === false) return;
  idleCountdown = IDLE_COUNTDOWN_S;
  el("idle-count").textContent = idleCountdown;
  el("idle-overlay").classList.add("visible");
  countdownTimer = setInterval(() => {
    idleCountdown--;
    el("idle-count").textContent = idleCountdown;
    if (idleCountdown <= 0) {
      clearInterval(countdownTimer);
      doRestart();
    }
  }, 1000);
}

function hideIdleOverlay() {
  el("idle-overlay").classList.remove("visible");
  clearInterval(countdownTimer);
}

// ── HELPERS ───────────────────────────────────────────────────
const el = (id) => document.getElementById(id);

function showScreen(screenId) {
  ["screen-landing", "screen-question", "screen-result"].forEach((id) => {
    const s = el(id);
    s.classList.add("hidden");
    s.classList.remove("fade-in");
  });
  const target = el(screenId);
  target.classList.remove("hidden");
  // Trigger reflow for animation
  void target.offsetWidth;
  target.classList.add("fade-in");
  target.scrollTop = 0;
}

function getQuestion(id) {
  return QUESTIONS.find((q) => q.id === id);
}

function totalSteps() {
  return state.isSbm ? 2 : QUESTION_ORDER.length; // q1 + q8-sbm = 2
}

function currentStepNum() {
  if (state.isSbm) {
    return state.currentQ === "q1" ? 1 : 2;
  }
  const idx = QUESTION_ORDER.indexOf(state.currentQ);
  return idx >= 0 ? idx + 1 : QUESTION_ORDER.length;
}

// ── SCORING ───────────────────────────────────────────────────
function applyAnswerScores(answer) {
  if (!answer.scores) return;
  for (const [key, val] of Object.entries(answer.scores)) {
    state.scores[key] = (state.scores[key] || 0) + val;
  }
}

function applyAnswerFlags(answer) {
  if (!answer.flags) return;
  for (const f of answer.flags) state.flags.add(f);
}

// ── RECOMMENDATION ENGINE ────────────────────────────────────
function computeRecommendation() {
  if (state.isSbm) {
    return { primary: buildSbmResult(), upsell: null };
  }

  // 1. Pick winning panel by score
  const { oled, mrgb, qned, nu } = state.scores;
  const scored = [
    { key: "oled", score: oled },
    { key: "mrgb", score: mrgb },
    { key: "qned", score: qned },
    { key: "nu",   score: nu },
  ].sort((a, b) => b.score - a.score);

  const winningPanel = scored[0].key;

  // 2. Budget pool determines eligible SKU keys
  const pool = BUDGET_POOLS[state.budgetTier] || BUDGET_POOLS["mid"];

  // 3. Panel → SKU key mapping (prefer higher tier within panel)
  const panelToSkus = {
    oled: ["W6", "G6", "C6", "B6"],
    mrgb: ["MRGB"],
    qned: ["QNED86", "QNED80"],
    nu:   ["NU85"],
  };

  // 4. W6 is only eligible if w6-unlock flag is set
  const eligibleSkuKeys = (panelToSkus[winningPanel] || []).filter((k) => {
    if (k === "W6" && !state.flags.has("w6-unlock")) return false;
    return pool.includes(k);
  });

  // 5. If no match, fall back down budget tiers
  let skuKey = eligibleSkuKeys[0];
  if (!skuKey) {
    // Try adjacent panels by score rank
    for (const { key } of scored.slice(1)) {
      const candidates = (panelToSkus[key] || []).filter((k) => pool.includes(k));
      if (candidates.length) { skuKey = candidates[0]; break; }
    }
  }
  // Last resort fallback
  if (!skuKey) skuKey = pool[pool.length - 1];

  // 6. Pick best size for size tier
  const sku = SKUS[skuKey];
  const preferred = SIZE_TIERS[state.sizeTier] || SIZE_TIERS.medium;
  const pickedSize = pickBestSize(sku, preferred);

  // 7. Upsell: next SKU up if price diff ≤ $500 (skip for W6)
  let upsell = null;
  if (skuKey !== "W6") {
    const allSkus = [...(panelToSkus[winningPanel] || []), ...(panelToSkus.oled || [])];
    const currentIdx = allSkus.indexOf(skuKey);
    if (currentIdx > 0) {
      const upsellKey = allSkus[currentIdx - 1];
      const upsellSku = SKUS[upsellKey];
      if (upsellSku) {
        const upsellSize = pickBestSize(upsellSku, preferred);
        if (upsellSize && pickedSize) {
          const diff = upsellSize.price - pickedSize.price;
          if (diff > 0 && diff <= 500) {
            upsell = buildSkuResult(upsellKey, upsellSize, true);
          }
        }
      }
    }
    // W6 aspirational upsell if flag set
    if (!upsell && state.flags.has("w6-unlock") && skuKey !== "W6") {
      const w6Size = pickBestSize(SKUS.W6, preferred);
      if (w6Size) upsell = buildSkuResult("W6", w6Size, true, true);
    }
  }

  const primary = buildSkuResult(skuKey, pickedSize, false);
  return { primary, upsell };
}

function pickBestSize(sku, preferredSizes) {
  if (!sku || !sku.sizes.length) return null;
  // Try to find an exact preferred size match
  for (const pref of preferredSizes) {
    const match = sku.sizes.find((s) => s.size === pref);
    if (match) return match;
  }
  // Fall back to closest size
  const target = preferredSizes[Math.floor(preferredSizes.length / 2)];
  return sku.sizes.reduce((best, s) =>
    Math.abs(s.size - target) < Math.abs(best.size - target) ? s : best
  );
}

function buildSkuResult(skuKey, sizeObj, isUpsell, isAspirationW6 = false) {
  const sku = SKUS[skuKey];
  if (!sku) return null;
  const price = sizeObj?.price;
  const priceStr = price
    ? `${sku.approxPrices ? "~" : ""}$${price.toLocaleString()}`
    : "Price TBC";

  // Build relevant feature bullets from flags
  const featureBullets = isUpsell ? sku.features.slice(0, 2) :
    buildFeatureBullets(sku);

  return {
    skuKey,
    name: sku.name,
    size: sizeObj?.size ?? null,
    price: priceStr,
    panel: sku.panel,
    tagline: sku.tagline,
    features: featureBullets,
    isAspirationW6,
  };
}

function buildSbmResult() {
  const sku = SKUS.SBM;
  return {
    skuKey: "SBM",
    name: sku.name,
    size: 32,
    price: "Price TBC",
    panel: sku.panel,
    tagline: sku.tagline,
    features: sku.features,
    isAspirationW6: false,
  };
}

function buildFeatureBullets(sku) {
  const bullets = [];
  // Add copy from flags first
  for (const flag of state.flags) {
    if (FEATURE_COPY[flag]) bullets.push(FEATURE_COPY[flag]);
  }
  // Fill remaining from SKU features
  for (const f of sku.features) {
    if (bullets.length >= 4) break;
    if (!bullets.includes(f)) bullets.push(f);
  }
  return bullets.slice(0, 4);
}

// ── RENDER: QUESTION ─────────────────────────────────────────
function renderQuestion(qId) {
  state.currentQ = qId;
  const q = getQuestion(qId);
  if (!q) { console.error("Unknown question:", qId); return; }

  updateProgressBar();
  updateNav(q);

  const container = el("question-container");
  container.innerHTML = "";

  // Header
  const header = document.createElement("div");
  header.className = "q-header";
  header.innerHTML = `
    <div class="q-label" style="color:${q.phaseColor}">${q.phase}</div>
    <div class="q-text">${q.text}</div>
    ${q.hint ? `<div class="q-hint">${q.hint}</div>` : ""}
  `;
  container.appendChild(header);

  if (q.multi) {
    renderMultiAnswers(container, q);
  } else {
    renderSingleAnswers(container, q);
  }

  // W6 callout
  if (q.showCallout) {
    const callout = document.createElement("div");
    callout.className = "callout-box";
    callout.textContent = "💡 Choosing art/ambient may unlock the LG OLED W6 Wallpaper TV — a screen so thin, it becomes part of your wall.";
    container.appendChild(callout);
  }

  // StanbyME callout
  if (q.isSbmPath) {
    const callout = document.createElement("div");
    callout.className = "callout-box";
    callout.style.borderColor = "var(--phase-mobility)";
    callout.style.color = "var(--phase-mobility)";
    callout.style.background = "#F5F0FF";
    callout.textContent = "LG StanbyME 2026 — 32\" 4K UHD · Wireless · Tilts and rolls wherever you go";
    container.appendChild(callout);
  }

  showScreen("screen-question");
  track("question_view", { question: qId });
}

function renderSingleAnswers(container, q) {
  const list = document.createElement("div");
  list.className = "answers";

  q.answers.forEach((a) => {
    const card = document.createElement("div");
    card.className = "answer-card";
    card.style.setProperty("--phase-color", q.phaseColor);
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.innerHTML = `
      <span class="answer-icon">${a.icon}</span>
      <span class="answer-body">
        <span class="answer-label">${a.label}</span>
        ${a.sub ? `<span class="answer-sub">${a.sub}</span>` : ""}
      </span>
      ${a.note ? `<span class="answer-note">${a.note}</span>` : ""}
    `;

    const onSelect = () => {
      resetIdleTimer();
      card.classList.add("selected");
      track("answer_select", { question: q.id, answer: a.id });
      setTimeout(() => handleAnswer(q, a), 180);
    };

    card.addEventListener("click", onSelect);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
    });
    list.appendChild(card);
  });

  container.appendChild(list);
}

function renderMultiAnswers(container, q) {
  const selected = new Set();

  const hint = document.createElement("div");
  hint.className = "multi-hint";
  hint.textContent = `Select up to ${q.maxSelect}`;
  container.appendChild(hint);

  const list = document.createElement("div");
  list.className = "answers";

  const nextBtn = document.createElement("button");
  nextBtn.className = "multi-next-btn";
  nextBtn.textContent = "Next →";
  nextBtn.disabled = true;

  q.answers.forEach((a) => {
    const card = document.createElement("div");
    card.className = "answer-card";
    card.style.setProperty("--phase-color", q.phaseColor);
    card.setAttribute("role", "checkbox");
    card.setAttribute("aria-checked", "false");
    card.setAttribute("tabindex", "0");
    card.innerHTML = `
      <span class="answer-icon">${a.icon}</span>
      <span class="answer-body">
        <span class="answer-label">${a.label}</span>
        ${a.sub ? `<span class="answer-sub">${a.sub}</span>` : ""}
      </span>
      <span class="check-indicator"></span>
    `;
    const check = card.querySelector(".check-indicator");

    const onToggle = () => {
      resetIdleTimer();
      if (selected.has(a.id)) {
        selected.delete(a.id);
        card.classList.remove("multi-selected");
        card.setAttribute("aria-checked", "false");
        check.textContent = "";
      } else {
        if (selected.size >= q.maxSelect) return; // max reached
        selected.add(a.id);
        card.classList.add("multi-selected");
        card.setAttribute("aria-checked", "true");
        check.textContent = "✓";
      }
      nextBtn.disabled = selected.size === 0;
    };

    card.addEventListener("click", onToggle);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); }
    });
    list.appendChild(card);
  });

  nextBtn.addEventListener("click", () => {
    resetIdleTimer();
    const selectedAnswers = q.answers.filter((a) => selected.has(a.id));
    // Apply scores and flags for all selected
    selectedAnswers.forEach((a) => {
      applyAnswerScores(a);
      applyAnswerFlags(a);
    });
    state.answers[q.id] = [...selected];
    track("answer_select", { question: q.id, answers: [...selected] });
    state.history.push(q.id);
    advanceFromQuestion(q, null); // multi always goes to next in order
  });

  container.appendChild(list);
  container.appendChild(nextBtn);
}

// ── ANSWER HANDLING ───────────────────────────────────────────
function handleAnswer(q, answer) {
  applyAnswerScores(answer);
  applyAnswerFlags(answer);
  state.answers[q.id] = answer.id;

  // Capture special state
  if (answer.flags?.includes("sbm")) state.isSbm = true;
  if (answer.sizeTier) state.sizeTier = answer.sizeTier;
  if (answer.sizeNudge) applySizeNudge(answer.sizeNudge);
  if (answer.budgetTier) state.budgetTier = answer.budgetTier;

  state.history.push(q.id);
  advanceFromQuestion(q, answer);
}

function applySizeNudge(nudge) {
  const tiers = ["small", "medium", "large"];
  const current = tiers.indexOf(state.sizeTier);
  if (nudge === "up"   && current < tiers.length - 1) state.sizeTier = tiers[current + 1];
  if (nudge === "down" && current > 0)                state.sizeTier = tiers[current - 1];
}

function advanceFromQuestion(q, answer) {
  // Explicit next override on answer
  if (answer?.next) {
    if (answer.next === "result") {
      showResult();
    } else {
      renderQuestion(answer.next);
    }
    return;
  }

  // Normal sequential flow
  if (q.id === "q7" || (state.isSbm && q.id === "q8-sbm")) {
    showResult();
    return;
  }

  const idx = QUESTION_ORDER.indexOf(q.id);
  if (idx >= 0 && idx < QUESTION_ORDER.length - 1) {
    renderQuestion(QUESTION_ORDER[idx + 1]);
  } else {
    showResult();
  }
}

// ── RENDER: RESULT ────────────────────────────────────────────
function showResult() {
  const { primary, upsell } = computeRecommendation();
  track("result_shown", {
    primary: primary?.skuKey,
    upsell: upsell?.skuKey,
    scores: { ...state.scores },
    flags: [...state.flags],
    sizeTier: state.sizeTier,
    budgetTier: state.budgetTier,
    isSbm: state.isSbm,
    duration_s: state.startTime ? Math.round((Date.now() - state.startTime) / 1000) : null,
  });

  updateProgressBar(true);
  el("top-nav").style.display = "none";

  const r = el("result-container");
  r.innerHTML = "";

  // Heading
  const heading = document.createElement("p");
  heading.className = "result-heading";
  heading.textContent = "Your Recommended Screen";
  r.appendChild(heading);

  // Primary card
  if (primary) r.appendChild(buildPrimaryCard(primary));

  // Upsell card
  if (upsell) r.appendChild(buildUpsellCard(upsell));

  // Actions
  const actions = document.createElement("div");
  actions.className = "result-actions";
  const restartBtn = document.createElement("button");
  restartBtn.className = "btn-restart";
  restartBtn.textContent = "↺  Start Over";
  restartBtn.addEventListener("click", doRestart);
  actions.appendChild(restartBtn);
  r.appendChild(actions);

  // Disclaimer
  const disc = document.createElement("p");
  disc.className = "result-disclaimer";
  disc.textContent = "Prices shown are recommended retail price and may vary. See our team for current promotions.";
  r.appendChild(disc);

  showScreen("screen-result");
}

function buildPrimaryCard(result) {
  const card = document.createElement("div");
  card.className = "result-primary";

  const sizeLabel = result.size ? `${result.size}"` : "";
  const featuresHtml = result.features.map((f) => `
    <div class="result-feature">
      <span class="result-feature-dot"></span>
      <span>${f}</span>
    </div>
  `).join("");

  card.innerHTML = `
    <div class="result-primary-label">⭐ Primary Recommendation</div>
    <div class="result-model">${result.name}</div>
    <div class="result-specs">${sizeLabel}${sizeLabel && result.panel ? " · " : ""}${result.panel} · ${result.tagline}</div>
    <div class="result-why-label">Why this TV for you</div>
    <div class="result-features">${featuresHtml}</div>
    <div class="result-price">${result.price}</div>
  `;
  return card;
}

function buildUpsellCard(result) {
  const card = document.createElement("div");
  card.className = "result-upsell";

  const isW6 = result.isAspirationW6;
  const intro = isW6
    ? "If your wall could be a canvas…"
    : "For just a little more, consider:";
  const copy = isW6
    ? "The LG OLED W6 Wallpaper TV is in a class of its own — wirelessly thin, it disappears into your wall like a work of art."
    : `Step up to the ${result.name} and get ${result.features.slice(0,2).join(" and ")}.`;

  card.innerHTML = `
    <div class="result-upsell-label">${isW6 ? "✨ Aspirational Pick" : "Consider Stepping Up"}</div>
    <div class="result-upsell-model">${result.name}${result.size ? ` ${result.size}"` : ""}</div>
    <div class="result-upsell-copy"><em>${intro}</em> ${copy}</div>
    <div class="result-upsell-price">${result.price}</div>
  `;
  return card;
}

// ── PROGRESS BAR ─────────────────────────────────────────────
function updateProgressBar(complete = false) {
  if (complete) {
    el("progress-bar").style.width = "100%";
    return;
  }
  const step = currentStepNum();
  const total = state.isSbm ? 2 : QUESTION_ORDER.length;
  el("progress-bar").style.width = `${(step / total) * 100}%`;
}

// ── NAV BAR ───────────────────────────────────────────────────
function updateNav(q) {
  el("top-nav").style.display = "";

  const step = currentStepNum();
  const total = state.isSbm ? 2 : QUESTION_ORDER.length;
  el("step-counter").textContent = `${step} of ${total}`;

  // Back button — show if there's history
  const backBtn = el("nav-back");
  backBtn.style.display = state.history.length > 0 ? "" : "none";

  // Home button always visible during quiz
  el("nav-home").style.display = "";
}

// ── NAVIGATION ────────────────────────────────────────────────
function goBack() {
  resetIdleTimer();
  if (state.history.length === 0) return;
  const prev = state.history.pop();

  // Undo scores and flags for the question we're going back from
  undoQuestion(state.currentQ);

  renderQuestion(prev);
  track("nav_back", { from: state.currentQ, to: prev });
}

function undoQuestion(qId) {
  const q = getQuestion(qId);
  if (!q) return;
  const savedAnswer = state.answers[qId];
  if (!savedAnswer) return;

  const answersToUndo = Array.isArray(savedAnswer)
    ? q.answers.filter((a) => savedAnswer.includes(a.id))
    : [q.answers.find((a) => a.id === savedAnswer)].filter(Boolean);

  answersToUndo.forEach((a) => {
    // Reverse scores
    if (a.scores) {
      for (const [key, val] of Object.entries(a.scores)) {
        state.scores[key] -= val;
      }
    }
    // Reverse flags
    if (a.flags) a.flags.forEach((f) => state.flags.delete(f));
    // Reverse size/budget state
    if (a.sizeTier) state.sizeTier = null;
    if (a.budgetTier) state.budgetTier = null;
    if (a.flags?.includes("sbm")) state.isSbm = false;
  });

  delete state.answers[qId];
}

function doRestart() {
  resetIdleTimer();
  track("restart", { from: state.currentQ });
  resetState();
  el("top-nav").style.display = "none";
  el("progress-bar").style.width = "0%";
  showScreen("screen-landing");
}

// ── BOOT ─────────────────────────────────────────────────────
function init() {
  // Wire up nav buttons
  el("nav-back").addEventListener("click", goBack);
  el("nav-home").addEventListener("click", () => {
    resetIdleTimer();
    track("nav_home", { from: state.currentQ });
    resetState();
    el("top-nav").style.display = "none";
    el("progress-bar").style.width = "0%";
    showScreen("screen-landing");
  });

  // Start button
  el("btn-start").addEventListener("click", () => {
    state.startTime = Date.now();
    track("quiz_start");
    resetIdleTimer();
    renderQuestion("q1");
  });

  // Idle overlay buttons
  el("idle-btn-continue").addEventListener("click", () => {
    resetIdleTimer();
  });
  el("idle-btn-restart").addEventListener("click", doRestart);

  // Reset idle on any interaction
  ["click", "touchstart", "keydown"].forEach((evt) => {
    document.addEventListener(evt, resetIdleTimer, { passive: true });
  });

  // Start idle timer
  resetIdleTimer();

  // Show landing
  showScreen("screen-landing");
  el("top-nav").style.display = "none";
}

document.addEventListener("DOMContentLoaded", init);
