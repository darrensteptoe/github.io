import { computeAll } from "./winMath.js";
import { fmtInt, clamp, safeNum, daysBetween, downloadJson, readJsonFile } from "./utils.js";
import { loadState, saveState } from "./storage.js";

const els = {
  scenarioName: document.getElementById("scenarioName"),
  raceType: document.getElementById("raceType"),
  electionDate: document.getElementById("electionDate"),
  weeksRemaining: document.getElementById("weeksRemaining"),
  mode: document.getElementById("mode"),

  universeBasis: document.getElementById("universeBasis"),
  universeSize: document.getElementById("universeSize"),
  sourceNote: document.getElementById("sourceNote"),

  turnoutA: document.getElementById("turnoutA"),
  turnoutB: document.getElementById("turnoutB"),
  bandWidth: document.getElementById("bandWidth"),
  turnoutExpected: document.getElementById("turnoutExpected"),
  turnoutBand: document.getElementById("turnoutBand"),
  votesPer1pct: document.getElementById("votesPer1pct"),

  btnAddCandidate: document.getElementById("btnAddCandidate"),
  yourCandidate: document.getElementById("yourCandidate"),
  candTbody: document.getElementById("candTbody"),
  undecidedPct: document.getElementById("undecidedPct"),
  supportTotal: document.getElementById("supportTotal"),
  undecidedMode: document.getElementById("undecidedMode"),
  userSplitWrap: document.getElementById("userSplitWrap"),
  userSplitList: document.getElementById("userSplitList"),
  candWarn: document.getElementById("candWarn"),

  persuasionPct: document.getElementById("persuasionPct"),
  earlyVoteExp: document.getElementById("earlyVoteExp"),

  validationList: document.getElementById("validationList"),

  kpiTurnoutVotes: document.getElementById("kpiTurnoutVotes"),
  kpiTurnoutBand: document.getElementById("kpiTurnoutBand"),
  kpiWinThreshold: document.getElementById("kpiWinThreshold"),
  kpiYourVotes: document.getElementById("kpiYourVotes"),
  kpiYourVotesShare: document.getElementById("kpiYourVotesShare"),
  kpiPersuasionNeed: document.getElementById("kpiPersuasionNeed"),
  kpiPersuasionStatus: document.getElementById("kpiPersuasionStatus"),

  miniEarlyVotes: document.getElementById("miniEarlyVotes"),
  miniEarlyNote: document.getElementById("miniEarlyNote"),
  miniEDVotes: document.getElementById("miniEDVotes"),
  miniPersUniverse: document.getElementById("miniPersUniverse"),
  miniPersCheck: document.getElementById("miniPersCheck"),

  stressBox: document.getElementById("stressBox"),
  explainCard: document.getElementById("explainCard"),

  assumptionsSnapshot: document.getElementById("assumptionsSnapshot"),
  guardrails: document.getElementById("guardrails"),

  btnSaveJson: document.getElementById("btnSaveJson"),
  loadJson: document.getElementById("loadJson"),

  toggleTraining: document.getElementById("toggleTraining"),
  toggleDark: document.getElementById("toggleDark"),
};

const DEFAULTS_BY_TEMPLATE = {
  federal: { bandWidth: 4, persuasionPct: 28, earlyVoteExp: 45 },
  state_leg: { bandWidth: 4, persuasionPct: 30, earlyVoteExp: 38 },
  municipal: { bandWidth: 5, persuasionPct: 35, earlyVoteExp: 35 },
  county: { bandWidth: 4, persuasionPct: 30, earlyVoteExp: 40 },
};

let state = loadState() || makeDefaultState();

function makeDefaultState(){
  return {
    scenarioName: "",
    raceType: "state_leg",
    electionDate: "",
    weeksRemaining: "",
    mode: "persuasion",
    universeBasis: "registered",
    universeSize: "",
    sourceNote: "",
    turnoutA: "",
    turnoutB: "",
    bandWidth: DEFAULTS_BY_TEMPLATE["state_leg"].bandWidth,
    candidates: [
      { id: uid(), name: "Candidate A", supportPct: 35 },
      { id: uid(), name: "Candidate B", supportPct: 35 },
    ],
    undecidedPct: 30,
    yourCandidateId: null,
    undecidedMode: "proportional",
    userSplit: {},
    persuasionPct: DEFAULTS_BY_TEMPLATE["state_leg"].persuasionPct,
    earlyVoteExp: DEFAULTS_BY_TEMPLATE["state_leg"].earlyVoteExp,
    ui: {
      training: false,
      dark: false,
      activeTab: "win",
    }
  };
}

function uid(){
  return Math.random().toString(16).slice(2,10);
}

function applyStateToUI(){
  els.scenarioName.value = state.scenarioName || "";
  els.raceType.value = state.raceType || "state_leg";
  els.electionDate.value = state.electionDate || "";
  els.weeksRemaining.value = state.weeksRemaining || "";
  els.mode.value = state.mode || "persuasion";

  els.universeBasis.value = state.universeBasis || "registered";
  els.universeSize.value = state.universeSize ?? "";
  els.sourceNote.value = state.sourceNote || "";

  els.turnoutA.value = state.turnoutA ?? "";
  els.turnoutB.value = state.turnoutB ?? "";
  els.bandWidth.value = state.bandWidth ?? "";

  els.undecidedPct.value = state.undecidedPct ?? "";
  els.undecidedMode.value = state.undecidedMode || "proportional";

  els.persuasionPct.value = state.persuasionPct ?? "";
  els.earlyVoteExp.value = state.earlyVoteExp ?? "";

  els.toggleTraining.checked = !!state.ui?.training;
  els.toggleDark.checked = !!state.ui?.dark;

  document.body.classList.toggle("training", !!state.ui?.training);
  document.body.classList.toggle("dark", !!state.ui?.dark);
}

function rebuildCandidateTable(){
  els.candTbody.innerHTML = "";

  for (const cand of state.candidates){
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.className = "input input-sm";
    nameInput.value = cand.name || "";
    nameInput.addEventListener("input", () => {
      cand.name = nameInput.value;
      if (!state.userSplit[cand.id]) state.userSplit[cand.id] = 0;
      rebuildYourCandidateSelect();
      rebuildUserSplitInputs();
      render();
      persist();
    });
    tdName.appendChild(nameInput);

    const tdPct = document.createElement("td");
    tdPct.className = "num";
    const pctInput = document.createElement("input");
    pctInput.className = "input input-sm num";
    pctInput.type = "number";
    pctInput.min = "0";
    pctInput.max = "100";
    pctInput.step = "0.1";
    pctInput.value = cand.supportPct ?? "";
    pctInput.addEventListener("input", () => {
      cand.supportPct = safeNum(pctInput.value);
      render();
      persist();
    });
    tdPct.appendChild(pctInput);

    const tdDel = document.createElement("td");
    tdDel.className = "num";
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-sm btn-ghost";
    delBtn.type = "button";
    delBtn.textContent = "Remove";
    delBtn.disabled = state.candidates.length <= 2;
    delBtn.addEventListener("click", () => {
      if (state.candidates.length <= 2) return;
      state.candidates = state.candidates.filter(c => c.id !== cand.id);
      delete state.userSplit[cand.id];
      if (state.yourCandidateId === cand.id){
        state.yourCandidateId = state.candidates[0]?.id || null;
      }
      rebuildCandidateTable();
      rebuildYourCandidateSelect();
      rebuildUserSplitInputs();
      render();
      persist();
    });
    tdDel.appendChild(delBtn);

    tr.appendChild(tdName);
    tr.appendChild(tdPct);
    tr.appendChild(tdDel);
    els.candTbody.appendChild(tr);
  }

  rebuildYourCandidateSelect();
  rebuildUserSplitInputs();
}

function rebuildYourCandidateSelect(){
  els.yourCandidate.innerHTML = "";
  for (const cand of state.candidates){
    const opt = document.createElement("option");
    opt.value = cand.id;
    opt.textContent = cand.name || "Candidate";
    els.yourCandidate.appendChild(opt);
  }
  if (!state.yourCandidateId){
    state.yourCandidateId = state.candidates[0]?.id || null;
  }
  els.yourCandidate.value = state.yourCandidateId || "";
}

function rebuildUserSplitInputs(){
  const isUser = state.undecidedMode === "user_defined";
  els.userSplitWrap.hidden = !isUser;
  if (!isUser) return;

  els.userSplitList.innerHTML = "";
  for (const cand of state.candidates){
    if (state.userSplit[cand.id] == null) state.userSplit[cand.id] = 0;
    const row = document.createElement("div");
    row.className = "grid2";
    row.style.gridTemplateColumns = "1fr 120px";

    const name = document.createElement("div");
    name.className = "label";
    name.style.alignSelf = "center";
    name.textContent = cand.name || "Candidate";

    const inp = document.createElement("input");
    inp.className = "input input-sm num";
    inp.type = "number";
    inp.min = "0";
    inp.max = "100";
    inp.step = "0.1";
    inp.value = state.userSplit[cand.id] ?? 0;
    inp.addEventListener("input", () => {
      state.userSplit[cand.id] = safeNum(inp.value);
      render();
      persist();
    });

    row.appendChild(name);
    row.appendChild(inp);
    els.userSplitList.appendChild(row);
  }
}

function wireEvents(){
  els.scenarioName.addEventListener("input", () => { state.scenarioName = els.scenarioName.value; persist(); });

  els.raceType.addEventListener("change", () => {
    state.raceType = els.raceType.value;
    const defs = DEFAULTS_BY_TEMPLATE[state.raceType] || DEFAULTS_BY_TEMPLATE.state_leg;
    if (!state.bandWidth && state.bandWidth !== 0) state.bandWidth = defs.bandWidth;
    state.bandWidth = state.bandWidth || defs.bandWidth;
    state.persuasionPct = state.persuasionPct || defs.persuasionPct;
    state.earlyVoteExp = state.earlyVoteExp || defs.earlyVoteExp;
    applyStateToUI();
    render();
    persist();
  });

  els.electionDate.addEventListener("change", () => { state.electionDate = els.electionDate.value; render(); persist(); });
  els.weeksRemaining.addEventListener("input", () => { state.weeksRemaining = els.weeksRemaining.value; render(); persist(); });
  els.mode.addEventListener("change", () => { state.mode = els.mode.value; persist(); });

  els.universeBasis.addEventListener("change", () => { state.universeBasis = els.universeBasis.value; persist(); });
  els.universeSize.addEventListener("input", () => { state.universeSize = safeNum(els.universeSize.value); render(); persist(); });
  els.sourceNote.addEventListener("input", () => { state.sourceNote = els.sourceNote.value; persist(); });

  els.turnoutA.addEventListener("input", () => { state.turnoutA = safeNum(els.turnoutA.value); render(); persist(); });
  els.turnoutB.addEventListener("input", () => { state.turnoutB = safeNum(els.turnoutB.value); render(); persist(); });
  els.bandWidth.addEventListener("input", () => { state.bandWidth = safeNum(els.bandWidth.value); render(); persist(); });

  els.btnAddCandidate.addEventListener("click", () => {
    state.candidates.push({ id: uid(), name: `Candidate ${String.fromCharCode(65 + state.candidates.length)}`, supportPct: 0 });
    rebuildCandidateTable();
    render();
    persist();
  });

  els.yourCandidate.addEventListener("change", () => { state.yourCandidateId = els.yourCandidate.value; render(); persist(); });
  els.undecidedPct.addEventListener("input", () => { state.undecidedPct = safeNum(els.undecidedPct.value); render(); persist(); });

  els.undecidedMode.addEventListener("change", () => {
    state.undecidedMode = els.undecidedMode.value;
    rebuildUserSplitInputs();
    render();
    persist();
  });

  els.persuasionPct.addEventListener("input", () => { state.persuasionPct = safeNum(els.persuasionPct.value); render(); persist(); });
  els.earlyVoteExp.addEventListener("input", () => { state.earlyVoteExp = safeNum(els.earlyVoteExp.value); render(); persist(); });

  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      state.ui.activeTab = tab;

      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
      document.getElementById(`tab-${tab}`).classList.add("active");

      persist();
    });
  });

  els.btnSaveJson.addEventListener("click", () => {
    const payload = structuredClone(state);
    downloadJson(payload, (state.scenarioName || "field-path-scenario").trim().replace(/\s+/g,"-") + ".json");
  });

  els.loadJson.addEventListener("change", async () => {
    const file = els.loadJson.files?.[0];
    if (!file) return;
    const loaded = await readJsonFile(file);
    if (!loaded || typeof loaded !== "object") return;
    state = normalizeLoadedState(loaded);
    applyStateToUI();
    rebuildCandidateTable();
    render();
    persist();
    els.loadJson.value = "";
  });

  els.toggleTraining.addEventListener("change", () => {
    state.ui.training = els.toggleTraining.checked;
    document.body.classList.toggle("training", !!state.ui.training);
    els.explainCard.hidden = !state.ui.training;
    persist();
  });

  els.toggleDark.addEventListener("change", () => {
    state.ui.dark = els.toggleDark.checked;
    document.body.classList.toggle("dark", !!state.ui.dark);
    persist();
  });
}

function normalizeLoadedState(s){
  const base = makeDefaultState();
  const out = { ...base, ...s };
  out.candidates = Array.isArray(s.candidates) ? s.candidates : base.candidates;
  out.userSplit = (s.userSplit && typeof s.userSplit === "object") ? s.userSplit : {};
  out.ui = { ...base.ui, ...(s.ui || {}) };

  if (!out.yourCandidateId && out.candidates[0]) out.yourCandidateId = out.candidates[0].id;
  return out;
}

function derivedWeeksRemaining(){
  const override = safeNum(state.weeksRemaining);
  if (override != null && override >= 0) return override;

  const d = state.electionDate;
  if (!d) return null;
  const now = new Date();
  const election = new Date(d + "T00:00:00");
  const days = daysBetween(now, election);
  if (days == null) return null;
  return Math.max(0, Math.ceil(days / 7));
}

function persist(){
  saveState(state);
}

function render(){
  const weeks = derivedWeeksRemaining();

  const modelInput = {
    universeSize: safeNum(state.universeSize),
    turnoutA: safeNum(state.turnoutA),
    turnoutB: safeNum(state.turnoutB),
    bandWidth: safeNum(state.bandWidth),
    candidates: state.candidates.map(c => ({ id: c.id, name: c.name, supportPct: safeNum(c.supportPct) })),
    undecidedPct: safeNum(state.undecidedPct),
    yourCandidateId: state.yourCandidateId,
    undecidedMode: state.undecidedMode,
    userSplit: state.userSplit,
    persuasionPct: safeNum(state.persuasionPct),
    earlyVoteExp: safeNum(state.earlyVoteExp),
  };

  const res = computeAll(modelInput);

  els.turnoutExpected.textContent = res.turnout.expectedPct == null ? "—" : `${res.turnout.expectedPct.toFixed(1)}%`;
  els.turnoutBand.textContent = res.turnout.bestPct == null ? "—" : `${res.turnout.bestPct.toFixed(1)}% / ${res.turnout.worstPct.toFixed(1)}%`;
  els.votesPer1pct.textContent = (res.turnout.votesPer1pct == null) ? "—" : fmtInt(res.turnout.votesPer1pct);

  els.supportTotal.textContent = res.validation.supportTotalPct == null ? "—" : `${res.validation.supportTotalPct.toFixed(1)}%`;

  els.candWarn.hidden = res.validation.candidateTableOk;
  els.candWarn.textContent = res.validation.candidateTableOk ? "" : res.validation.candidateTableMsg;

  els.kpiTurnoutVotes.textContent = res.expected.turnoutVotes == null ? "—" : fmtInt(res.expected.turnoutVotes);
  els.kpiTurnoutBand.textContent = res.turnout.bandVotesText || "—";

  els.kpiWinThreshold.textContent = res.expected.winThreshold == null ? "—" : fmtInt(res.expected.winThreshold);
  els.kpiYourVotes.textContent = res.expected.yourVotes == null ? "—" : fmtInt(res.expected.yourVotes);
  els.kpiYourVotesShare.textContent = res.expected.yourShareText || "—";

  els.kpiPersuasionNeed.textContent = res.expected.persuasionNeed == null ? "—" : fmtInt(res.expected.persuasionNeed);
  els.kpiPersuasionStatus.textContent = res.expected.persuasionStatus || "—";

  els.miniEarlyVotes.textContent = res.expected.earlyVotes == null ? "—" : fmtInt(res.expected.earlyVotes);
  els.miniEDVotes.textContent = res.expected.edVotes == null ? "—" : fmtInt(res.expected.edVotes);
  els.miniEarlyNote.textContent = res.expected.earlyNote || "—";

  els.miniPersUniverse.textContent = res.expected.persuasionUniverse == null ? "—" : fmtInt(res.expected.persuasionUniverse);
  els.miniPersCheck.textContent = res.expected.persuasionUniverseCheck || "—";

  renderStress(res);
  renderValidation(res, weeks);
  renderAssumptions(res, weeks);
  renderGuardrails(res);

  els.explainCard.hidden = !state.ui.training;
}

function renderStress(res){
  const lines = res.stressSummary || [];
  els.stressBox.innerHTML = "";
  if (!lines.length){
    const div = document.createElement("div");
    div.className = "stress-item";
    div.textContent = "—";
    els.stressBox.appendChild(div);
    return;
  }
  for (const s of lines){
    const div = document.createElement("div");
    div.className = "stress-item";
    div.textContent = s;
    els.stressBox.appendChild(div);
  }
}

function renderValidation(res, weeks){
  const items = [];

  const uOk = res.validation.universeOk;
  items.push({
    kind: uOk ? "ok" : "bad",
    text: uOk ? "Universe size set." : "Universe size missing or invalid."
  });

  const turnoutOk = res.validation.turnoutOk;
  items.push({
    kind: turnoutOk ? "ok" : "warn",
    text: turnoutOk ? "Turnout baseline set (2 cycles + band)." : "Turnout baseline incomplete. Add Cycle A and Cycle B turnout %."
  });

  const candOk = res.validation.candidateTableOk;
  items.push({
    kind: candOk ? "ok" : "bad",
    text: candOk ? "Candidate + undecided totals = 100%." : "Candidate + undecided totals must equal 100%."
  });

  const splitOk = res.validation.userSplitOk;
  if (state.undecidedMode === "user_defined"){
    items.push({
      kind: splitOk ? "ok" : "bad",
      text: splitOk ? "User-defined undecided split totals = 100%." : "User-defined undecided split must total 100% across candidates."
    });
  }

  const persOk = res.validation.persuasionOk;
  items.push({
    kind: persOk ? "ok" : "warn",
    text: persOk ? "Persuasion % set." : "Persuasion % missing."
  });

  if (weeks != null){
    items.push({
      kind: "ok",
      text: `Weeks remaining: ${weeks} (reference for later phases).`
    });
  }

  els.validationList.innerHTML = "";
  for (const it of items){
    const li = document.createElement("li");
    li.className = it.kind;
    li.textContent = it.text;
    els.validationList.appendChild(li);
  }
}

function renderAssumptions(res, weeks){
  const blocks = [];

  blocks.push(block("Race & scenario", [
    kv("Scenario", state.scenarioName || "—"),
    kv("Template", labelTemplate(state.raceType)),
    kv("Mode", state.mode === "late_start" ? "Late-start / turnout-heavy" : "Persuasion-first"),
    kv("Election date", state.electionDate || "—"),
    kv("Weeks remaining", weeks == null ? "—" : String(weeks)),
  ]));

  blocks.push(block("Universe & turnout", [
    kv("Universe basis", state.universeBasis === "active" ? "Active (advanced)" : "Registered"),
    kv("Universe size", res.raw.universeSize == null ? "—" : fmtInt(res.raw.universeSize)),
    kv("Turnout cycles", (res.raw.turnoutA == null || res.raw.turnoutB == null) ? "—" : `${res.raw.turnoutA.toFixed(1)}% & ${res.raw.turnoutB.toFixed(1)}%`),
    kv("Expected turnout", res.turnout.expectedPct == null ? "—" : `${res.turnout.expectedPct.toFixed(1)}%`),
    kv("Band width", res.raw.bandWidth == null ? "—" : `±${res.raw.bandWidth.toFixed(1)}%`),
    kv("Votes per 1% turnout", res.turnout.votesPer1pct == null ? "—" : fmtInt(res.turnout.votesPer1pct)),
    kv("Source note", state.sourceNote || "—"),
  ]));

  blocks.push(block("Vote landscape", [
    kv("Candidates", String(state.candidates.length)),
    kv("Undecided break", labelUndecidedMode(state.undecidedMode)),
    kv("You are", getYourName() || "—"),
  ]));

  blocks.push(block("Persuasion & early vote", [
    kv("Persuasion % of universe", res.raw.persuasionPct == null ? "—" : `${res.raw.persuasionPct.toFixed(1)}%`),
    kv("Early vote % (Expected)", res.raw.earlyVoteExp == null ? "—" : `${res.raw.earlyVoteExp.toFixed(1)}%`),
  ]));

  els.assumptionsSnapshot.innerHTML = "";
  for (const b of blocks) els.assumptionsSnapshot.appendChild(b);
}

function renderGuardrails(res){
  const gs = [];
  for (const g of res.guardrails){
    gs.push(block(g.title, g.lines.map(l => kv(l.k, l.v))));
  }
  els.guardrails.innerHTML = "";
  if (!gs.length){
    els.guardrails.textContent = "—";
    return;
  }
  for (const b of gs) els.guardrails.appendChild(b);
}

function block(title, kvs){
  const div = document.createElement("div");
  div.className = "assump-block";
  const t = document.createElement("div");
  t.className = "assump-title";
  t.textContent = title;
  const body = document.createElement("div");
  body.className = "assump-body";
  for (const row of kvs) body.appendChild(row);
  div.appendChild(t);
  div.appendChild(body);
  return div;
}

function kv(k, v){
  const row = document.createElement("div");
  row.className = "kv";
  const dk = document.createElement("div");
  dk.className = "k";
  dk.textContent = k;
  const dv = document.createElement("div");
  dv.className = "v";
  dv.textContent = v;
  row.appendChild(dk);
  row.appendChild(dv);
  return row;
}

function labelTemplate(v){
  if (v === "federal") return "Federal (US House)";
  if (v === "municipal") return "Municipal / ward";
  if (v === "county") return "County / regional";
  return "State legislative";
}

function labelUndecidedMode(v){
  if (v === "user_defined") return "User-defined split";
  if (v === "against") return "Conservative against you";
  if (v === "toward") return "Conservative toward you";
  return "Proportional";
}

function getYourName(){
  const c = state.candidates.find(x => x.id === state.yourCandidateId);
  return c?.name || null;
}

function initTabs(){
  const tab = state.ui?.activeTab || "win";
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.getAttribute("data-tab") === tab));
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
}

function initExplainCard(){
  els.explainCard.hidden = !state.ui?.training;
}

function init(){
  applyStateToUI();
  rebuildCandidateTable();
  initTabs();
  initExplainCard();
  wireEvents();
  render();
  persist();
}

init();
