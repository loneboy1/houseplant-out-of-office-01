// Houseplant out-of-office writer for "The Houseplant Out-of-Office"
// (make.fun). Writes one funny out-of-office auto-reply, written as if a
// houseplant sent it, to $MAKEFUN_OUTPUT_DIR/entry.txt.
// Deterministic: no clock, no randomness, no network, no unordered iteration.
// Node 22, zero dependencies, erasable TypeScript only.
//
// The judge (make.fun's houseplant comedy judge) weighs, most important
// first:
//   1. it reads as an out-of-office auto-reply a houseplant would send,
//      and anything else loses to any auto-reply on the subject;
//   2. it is actually funny: a fresh joke that surprises, not a mild pun
//      or a stock office phrase;
//   3. the plant's own life, its water, roots, sunlight and long stretches
//      of being ignored, drives the joke rather than decorating it;
//   4. it is tight: the joke lands inside 120 characters with no wasted
//      words;
//   5. it is original: no office cliches, no lines already worn out by
//      other auto-replies.
// The scorer below mirrors that brief in the same order. Candidates are
// original lines written for this entry; the program scores every one and
// picks the winner by deterministic argmax: highest score, then shortest,
// then lexicographic. Flooded angles are avoided on purpose: no fern
// ignored since March, no cactus that cannot be bothered, no monstera with
// opinions about the window, no "please water me", no photosynthesis pun.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
// Every line is at most 120 characters, written for this entry. The
// strongest lines share one shape: an out-of-office opener, then a
// specific plant-life fact (roots, water, sunlight, being ignored) that
// turns somewhere the reader did not expect.

const CANDIDATES: string[] = [
  // The sun ignores the plant the way the plant ignores the inbox.
  "Out of office. I forwarded your email to the sun. It has not replied either.",
  // The review is a sticky note questioning whether the plant is alive.
  "Out of office until someone waters me. My last review was a sticky note saying 'still alive?'",
  // Snake plant: three owners, zero watering schedules, still standing.
  "Thank you for your email. I am a snake plant. I have survived three owners and zero watering schedules.",
  // The human's holiday is a month; the plant's is permanent and unpaid.
  "Out of office. The human is on holiday. I am on my fourth month of the same holiday, unpaid.",
  // The inbox is a windowsill; the sunlight is out of reach.
  "I am out of office. My inbox is a windowsill and every message is sunlight I cannot reach.",
  // Delegation: the spider plant is also dying, only faster.
  "Out of office. I have delegated your email to the spider plant, which is also dying, but faster.",
  // Out of everything at once: sunlight, water, patience.
  "Thank you for your email. I am currently out of sunlight, out of water, and out of patience.",
  // Pothos: two years growing at the window; the window has not noticed.
  "Out of office. I am a pothos. I have been growing towards the window for two years. The window has not noticed.",
  // Last water in 2019; running on spite and indirect light.
  "Thank you for your email. I drank the last of the water in 2019. I am running on spite and indirect light.",
  // The roots reached the bottom: nothing down there but more pot.
  "Out of office. My roots have reached the bottom of the pot. There is nothing down there but more pot.",
  // The desk is a windowsill; the plant has never left it and never will.
  "I am away from my desk. My desk is a windowsill. I have never left it. I never will.",
  // Further notice comes from the next person who waters the plant.
  "Out of office until further notice. Further notice will be given by the next person who waters me.",
  // Orchid: blooms once a year to remind the office it is still judging.
  "Thank you for your email. I am an orchid. I bloom once a year to remind you I am still judging you.",
  // The auto-reply repeats until someone admits they forgot the plant.
  "Out of office. I have set this reply to repeat until someone admits they forgot I exist.",
  // Out of office and out of water; the two are related, and one is your fault.
  "I am currently out of office and out of water. The two are related. The second one is your fault.",
  // The sun moved; the plant cannot follow; escalate to facilities.
  "Out of office. The sun moved. I cannot follow. Please escalate to facilities.",
  // Everything about a plant is automated, including this reply.
  "Thank you for your email. This is an automated reply. I am a plant. Everything about me is automated.",
  // Survivor of the office move, the repotting and Karen from HR.
  "Out of office. I survived the office move, the repotting, and Karen from HR. The watering can did not.",
  // Yellow leaves are plant for disagreeing with your email.
  "I am out of office. My leaves are turning yellow, which is plant for 'I have read your email and I disagree.'",
  // Longer tenure than the CEO, still no name tag.
  "Out of office. I have been here longer than the CEO and I still do not have a name tag.",
  // Succulent: stores water for months, grudges for longer.
  "Thank you for your email. I am a succulent. I store water for months. I store grudges for longer.",
  // The watering schedule is a rumour; the sunlight is a part-timer.
  "Out of office. The watering schedule is a rumour. The sunlight is a part-timer. I persist regardless.",
  // The replacement is plastic, already doing better, and it knows it.
  "I am away. My replacement is a plastic plant. It is already doing better than me, and it knows it.",
  // Water before reply-all: one of those things actually matters.
  // Penalised by the scorer: a worn-out "please water me" close.
  "Out of office. Please water me before replying all. One of those things actually matters.",
  // Four restructures survived, not one watering can.
  "Thank you for your email. I am the office plant. I have seen four restructures and not one watering can.",
  // Photosynthesis pun: written in, then penalised, a tired angle.
  "Out of office. I photosynthesised your email into oxygen. You are welcome. Please water me.",
];

// Plant-life words: water, roots, sunlight and long stretches of being
// ignored must drive the joke, not decorate it. "plant" itself counts,
// and "water" matches its inflections (waters, watering).
const PLANT_LIFE: string[] = [
  "water", "roots", "sunlight", "sun", "leaves", "pot", "soil", "window",
  "windowsill", "grow", "growing", "bloom", "repotting", "photosynth",
  "plant",
];

// The sting: the turn the reader did not see coming.
const STING_MARKERS: string[] = [
  "spite", "grudges", "judging", "disagree", "escalate", "knows it",
  "still alive", "not noticed", "nothing down there", "also dying",
];

// Worn-out office auto-reply cliches and flooded plant angles.
const CLICHES: string[] = [
  "please water me", "back soon", "will respond", "when i return",
  "out of the office", "on annual leave", "limited access to email",
];

// ------------------------------------------------------------------- scoring
// Rubric mirroring the judge's brief, most important first.

function plantLifeScore(text: string): number {
  const lower = text.toLowerCase();
  const seen = new Set<string>();
  for (const w of PLANT_LIFE) {
    // Whole words only: "sun" must not match inside "sunlight".
    // "water" also matches its inflections (waters, watering).
    const pattern =
      w === "water"
        ? `\\bwater\\w*\\b`
        : `\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`;
    if (new RegExp(pattern).test(lower)) seen.add(w);
  }
  return Math.min(seen.size, 4) * 4; // the plant's own life drives the joke
}

function voiceScore(text: string): number {
  const lower = text.toLowerCase();
  if (
    lower.startsWith("out of office") ||
    lower.startsWith("thank you for your email") ||
    lower.startsWith("i am out of office") ||
    lower.startsWith("i am away")
  ) {
    return 8; // reads as an out-of-office auto-reply
  }
  return 0;
}

function stingScore(text: string): number {
  const lower = text.toLowerCase();
  for (const m of STING_MARKERS) {
    if (lower.includes(m)) return 10; // a fresh surprise, not a mild pun
  }
  return 0;
}

function economyScore(text: string): number {
  const len = text.length;
  let s = 0;
  if (len <= 120) s += 6;
  if (len >= 75 && len <= 110) s += 6;
  else if (len < 75) s += 2;
  if (text.includes(",")) s += 2; // two-beat shape: setup, pivot
  return s;
}

function freshnessScore(text: string): number {
  const lower = text.toLowerCase();
  let s = 0;
  for (const c of CLICHES) {
    if (lower.includes(c)) s -= 10;
  }
  // Flooded angles named in the brief itself: the fern, the monstera,
  // the unbothered cactus, the ignored-since-March setup.
  if (lower.includes("fern") || lower.includes("monstera") || lower.includes("cactus")) s -= 6;
  if (lower.includes("march")) s -= 6;
  if (lower.includes("photosynthesis") || lower.includes("photosynthesised")) s -= 6;
  return s;
}

function score(text: string): number {
  return (
    voiceScore(text) +
    plantLifeScore(text) +
    stingScore(text) +
    economyScore(text) +
    freshnessScore(text)
  );
}

function isValid(text: string): boolean {
  if (text.length < 1 || text.length > 120) return false;
  if (text.trim() !== text || text.trim().length === 0) return false;
  // A sentence end: a period, or a period inside a closing quote.
  if (!text.endsWith(".") && !text.endsWith(".'")) return false;
  if (/\s{2,}/.test(text)) return false;
  if (text.includes("\n")) return false;
  // On subject: an out-of-office auto-reply from a plant, with a
  // plant-life word in it.
  const lower = text.toLowerCase();
  if (!/out of office|thank you for your email|i am away/.test(lower)) return false;
  if (
    !PLANT_LIFE.some((w) =>
      new RegExp(w === "water" ? `\\bwater\\w*\\b` : `\\b${w}\\b`).test(lower),
    )
  ) {
    return false;
  }
  return true;
}

// -------------------------------------------------------------- composition
interface Candidate {
  text: string;
  score: number;
}

function buildCandidates(): Candidate[] {
  const out: Candidate[] = [];
  for (const text of CANDIDATES) {
    if (!isValid(text)) continue;
    out.push({ text, score: score(text) });
  }
  return out;
}

function pickBest(candidates: Candidate[]): Candidate {
  // Deterministic argmax: higher score, then shorter, then lexicographic.
  const sorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });
  return sorted[0];
}

// --------------------------------------------------------------------- main
function main(): void {
  const candidates = buildCandidates();
  if (candidates.length === 0) throw new Error("no valid houseplant candidate");
  const best = pickBest(candidates);
  if (process.env.HOUSEPLANT_DEBUG) {
    const ranked = [...candidates].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.text.length !== b.text.length) return a.text.length - b.text.length;
      return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
    });
    for (const c of ranked.slice(0, 8)) {
      console.log(`[${c.score}] (${c.text.length}) ${c.text}`);
    }
  }
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), best.text, "utf8");
  console.log(best.text);
  console.log(
    `chars: ${best.text.length} score: ${best.score} candidates: ${candidates.length}`,
  );
}

main();
