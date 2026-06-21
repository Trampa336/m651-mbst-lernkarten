"use strict";

// Datendateien (eine pro Prüfungsbereich). Reihenfolge = Anzeigereihenfolge.
const DATA_FILES = [
  "data/01-bio-mikrosysteme.json",
  "data/02-laser.json",
  "data/03-laserschutz.json",
  "data/04-ki-maschinelles-lernen.json",
];

const STORAGE_KEY = "mbst-klotzbach-lernkarten-status-v1";

const TYPE_LABEL = { open: "Offen", mc: "Multiple Choice", flashcard: "Karteikarte" };
const STATUS_LABEL = { sicher: "✓ sicher", nicht: "✗ nicht gewusst" };

let allCards = [];      // alle geladenen Karten
let deck = [];          // aktuell gefilterte/sortierte Karten
let index = 0;          // Position im deck
let revealed = false;   // Antwort sichtbar?
let status = loadStatus(); // { cardId: "sicher" | "nicht" }

// ---------- Markup (leichtes Markdown für Antworten) ----------
// Unterstützt **fett**, Aufzählungen (Zeilen mit "- "), nummerierte Listen
// ("1. "), Leerzeilen als Absatztrenner.
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inlineFmt(s) {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
function renderMarkup(text) {
  const lines = (text || "").split("\n");
  let html = "", i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*-\s+/.test(line)) {
      html += "<ul>";
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        html += "<li>" + inlineFmt(lines[i].replace(/^\s*-\s+/, "")) + "</li>";
        i++;
      }
      html += "</ul>";
    } else if (/^\s*\d+\.\s+/.test(line)) {
      html += "<ol>";
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        html += "<li>" + inlineFmt(lines[i].replace(/^\s*\d+\.\s+/, "")) + "</li>";
        i++;
      }
      html += "</ol>";
    } else if (line.trim() === "") {
      i++;
    } else {
      html += "<p>" + inlineFmt(line) + "</p>";
      i++;
    }
  }
  return html;
}

// ---------- Persistenz ----------
function loadStatus() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveStatus() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
}

// ---------- Laden ----------
async function loadAll() {
  const results = await Promise.all(DATA_FILES.map(async (file) => {
    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      console.warn("Konnte " + file + " nicht laden:", e);
      return [];
    }
  }));
  allCards = results.flat();
  initTopicFilter();
  applyFilters();
}

function initTopicFilter() {
  const topics = [...new Set(allCards.map(c => c.topic))];
  const sel = document.getElementById("filter-topic");
  for (const t of topics) {
    const opt = document.createElement("option");
    opt.value = t; opt.textContent = t;
    sel.appendChild(opt);
  }
}

// ---------- Filter & Deck ----------
function applyFilters() {
  const topic = document.getElementById("filter-topic").value;
  const prio = document.getElementById("filter-priority").value;
  const type = document.getElementById("filter-type").value;
  const reviewOnly = document.getElementById("filter-review").checked;

  deck = allCards.filter(c => {
    if (topic !== "all" && c.topic !== topic) return false;
    if (prio !== "all" && c.priority !== prio) return false;
    if (type !== "all" && c.type !== type) return false;
    if (reviewOnly && status[c.id] === "sicher") return false; // nur offen + nicht gewusst
    return true;
  });

  index = 0;
  renderStats();
  render();
}

function shuffle() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  index = 0;
  render();
}

// ---------- Rendering ----------
function render() {
  const area = document.getElementById("card-area");
  const empty = document.getElementById("empty-state");
  if (deck.length === 0) {
    area.hidden = true; empty.hidden = false;
    return;
  }
  area.hidden = false; empty.hidden = true;

  if (index >= deck.length) index = deck.length - 1;
  if (index < 0) index = 0;
  const card = deck[index];
  revealed = false;

  document.getElementById("card-topic").textContent = card.topic;
  document.getElementById("card-subtopic").textContent = card.subtopic || "";
  document.getElementById("card-subtopic").hidden = !card.subtopic;

  const prioEl = document.getElementById("card-priority");
  prioEl.textContent = card.priority + "-Wissen";
  prioEl.className = "badge prio " + card.priority;

  document.getElementById("card-type").textContent = TYPE_LABEL[card.type] || card.type;

  const st = status[card.id];
  const statusEl = document.getElementById("card-status");
  if (st) { statusEl.hidden = false; statusEl.textContent = STATUS_LABEL[st]; statusEl.className = "badge status " + st; }
  else { statusEl.hidden = true; }

  document.getElementById("card-question").textContent = card.question;

  // MC-Optionen
  const mc = document.getElementById("mc-options");
  mc.innerHTML = "";
  if (card.type === "mc" && Array.isArray(card.options)) {
    mc.hidden = false;
    card.options.forEach((opt, i) => {
      const li = document.createElement("li");
      li.textContent = opt;
      li.dataset.i = i;
      li.addEventListener("click", () => selectMc(li, card));
      mc.appendChild(li);
    });
  } else {
    mc.hidden = true;
  }

  // Antwort verstecken
  const ans = document.getElementById("card-answer");
  ans.hidden = true;
  document.getElementById("card-answer-text").innerHTML = renderMarkup(card.answer || "");
  const img = document.getElementById("card-answer-img");
  if (card.image) { img.src = card.image; img.hidden = false; }
  else { img.hidden = true; img.removeAttribute("src"); }

  document.getElementById("btn-reveal").hidden = false;
  document.getElementById("rate-buttons").hidden = true;
  document.getElementById("progress-text").textContent = (index + 1) + " / " + deck.length;
}

function selectMc(li, card) {
  if (revealed) return;
  document.querySelectorAll("#mc-options li").forEach(el => el.classList.remove("selected"));
  li.classList.add("selected");
}

function reveal() {
  if (deck.length === 0 || revealed) return;
  revealed = true;
  const card = deck[index];

  if (card.type === "mc" && typeof card.answerIndex === "number") {
    document.querySelectorAll("#mc-options li").forEach(el => {
      el.classList.add("disabled");
      const i = Number(el.dataset.i);
      if (i === card.answerIndex) el.classList.add("correct");
      else if (el.classList.contains("selected")) el.classList.add("wrong");
    });
  }

  document.getElementById("card-answer").hidden = false;
  document.getElementById("btn-reveal").hidden = true;
  document.getElementById("rate-buttons").hidden = false;
}

function rate(value) {
  if (deck.length === 0) return;
  if (!revealed) { reveal(); return; }
  const card = deck[index];
  status[card.id] = value;
  saveStatus();
  renderStats();
  next();
}

function next() {
  if (index < deck.length - 1) { index++; render(); }
  else { render(); } // bleibt auf letzter Karte
}
function prev() {
  if (index > 0) { index--; render(); }
}

// ---------- Statistik ----------
function renderStats() {
  const total = deck.length;
  let sicher = 0, nicht = 0;
  for (const c of deck) {
    if (status[c.id] === "sicher") sicher++;
    else if (status[c.id] === "nicht") nicht++;
  }
  const offen = total - sicher - nicht;
  document.getElementById("count-sicher").textContent = sicher;
  document.getElementById("count-nicht").textContent = nicht;
  document.getElementById("count-offen").textContent = offen;
  document.getElementById("count-total").textContent = total + " Karten";
  document.getElementById("bar-sicher").style.width = total ? (sicher / total * 100) + "%" : "0";
  document.getElementById("bar-nicht").style.width = total ? (nicht / total * 100) + "%" : "0";
}

function resetProgress() {
  if (!confirm("Gesamten Lernfortschritt wirklich zurücksetzen?")) return;
  status = {};
  saveStatus();
  renderStats();
  render();
}

// ---------- Events ----------
function bind() {
  document.getElementById("filter-topic").addEventListener("change", applyFilters);
  document.getElementById("filter-priority").addEventListener("change", applyFilters);
  document.getElementById("filter-type").addEventListener("change", applyFilters);
  document.getElementById("filter-review").addEventListener("change", applyFilters);
  document.getElementById("btn-shuffle").addEventListener("click", shuffle);
  document.getElementById("btn-reset").addEventListener("click", resetProgress);
  document.getElementById("btn-reveal").addEventListener("click", reveal);
  document.getElementById("btn-sicher").addEventListener("click", () => rate("sicher"));
  document.getElementById("btn-nicht").addEventListener("click", () => rate("nicht"));
  document.getElementById("btn-next").addEventListener("click", next);
  document.getElementById("btn-prev").addEventListener("click", prev);

  document.addEventListener("keydown", (e) => {
    if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
    if (e.code === "Space") { e.preventDefault(); revealed ? null : reveal(); }
    else if (e.key === "ArrowRight") { revealed ? rate("sicher") : reveal(); }
    else if (e.key === "ArrowLeft") { revealed ? rate("nicht") : reveal(); }
    else if (e.key.toLowerCase() === "n") next();
    else if (e.key.toLowerCase() === "p") prev();
  });
}

bind();
loadAll();
