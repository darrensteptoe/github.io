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
    // Phase 2 — conversion + capacity
    goalSupportIds: "",
    supportRatePct: 55,
    contactRatePct: 22,
    doorsPerHour: 30,
    hoursPerShift: 3,
    shiftsPerVolunteerPerWeek: 2,


  // Phase 2 — conversion + capacity
  goalSupportIds: document.getElementById("goalSupportIds"),
  supportRatePct: document.getElementById("supportRatePct"),
  contactRatePct: document.getElementById("contactRatePct"),
  doorsPerHour: document.getElementById("doorsPerHour"),
  hoursPerShift: document.getElementById("hoursPerShift"),
  shiftsPerVolunteerPerWeek: document.getElementById("shiftsPerVolunteerPerWeek"),

  outConversationsNeeded: document.getElementById("outConversationsNeeded"),
  outDoorsNeeded: document.getElementById("outDoorsNeeded"),
  outDoorsPerShift: document.getElementById("outDoorsPerShift"),
  outTotalShifts: document.getElementById("outTotalShifts"),
  outShiftsPerWeek: document.getElementById("outShiftsPerWeek"),
  outVolunteersNeeded: document.getElementById("outVolunteersNeeded"),
  convFeasBanner: document.getElementById("convFeasBanner"),

  // Phase 3 — execution + risk
  orgCount: document.getElementById("orgCount"),
  orgHoursPerWeek: document.getElementById("orgHoursPerWeek"),
  volunteerMultBase: document.getElementById("volunteerMultBase"),
  channelDoorPct: document.getElementById("channelDoorPct"),
  doorsPerHour3: document.getElementById("doorsPerHour3"),
  callsPerHour3: document.getElementById("callsPerHour3"),

  p3Weeks: document.getElementById("p3Weeks"),
  p3CapContacts: document.getElementById("p3CapContacts"),
  p3GapContacts: document.getElementById("p3GapContacts"),
  p3GapNote: document.getElementById("p3GapNote"),

  mcMode: document.getElementById("mcMode"),
  mcSeed: document.getElementById("mcSeed"),
  mcRun: document.getElementById("mcRun"),
  mcStale: document.getElementById("mcStale"),
  mcBasic: document.getElementById("mcBasic"),
  mcAdvanced: document.getElementById("mcAdvanced"),
  mcVolatility: document.getElementById("mcVolatility"),
  turnoutReliabilityPct: document.getElementById("turnoutReliabilityPct"),

  mcContactMin: document.getElementById("mcContactMin"),
  mcContactMode: document.getElementById("mcContactMode"),
  mcContactMax: document.getElementById("mcContactMax"),
  mcPersMin: document.getElementById("mcPersMin"),
  mcPersMode: document.getElementById("mcPersMode"),
  mcPersMax: document.getElementById("mcPersMax"),
  mcReliMin: document.getElementById("mcReliMin"),
  mcReliMode: document.getElementById("mcReliMode"),
  mcReliMax: document.getElementById("mcReliMax"),
  mcDphMin: document.getElementById("mcDphMin"),
  mcDphMode: document.getElementById("mcDphMode"),
  mcDphMax: document.getElementById("mcDphMax"),
  mcCphMin: document.getElementById("mcCphMin"),
  mcCphMode: document.getElementById("mcCphMode"),
  mcCphMax: document.getElementById("mcCphMax"),
  mcVolMin: document.getElementById("mcVolMin"),
  mcVolMode: document.getElementById("mcVolMode"),
  mcVolMax: document.getElementById("mcVolMax"),

  mcWinProb: document.getElementById("mcWinProb"),
  mcMedian: document.getElementById("mcMedian"),
  mcP5: document.getElementById("mcP5"),
  mcP95: document.getElementById("mcP95"),
  mcRiskLabel: document.getElementById("mcRiskLabel"),
  mcSensitivity: document.getElementById("mcSensitivity"),

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

    // Phase 2 — conversion + contact math
    goalSupportIds: "",
    supportRatePct: 55,
    contactRatePct: 22,
    doorsPerHour: 30,
    hoursPerShift: 3,
    shiftsPerVolunteerPerWeek: 2,

    // Phase 3 — execution + risk (capacity + Monte Carlo)
    orgCount: 2,
    orgHoursPerWeek: 40,
    volunteerMultBase: 1.0,
    channelDoorPct: 70,
    doorsPerHour3: 30,
    callsPerHour3: 20,
    turnoutReliabilityPct: 80,

    mcMode: "basic",
    mcVolatility: "med",
    mcSeed: "",

    mcContactMin: "",
    mcContactMode: "",
    mcContactMax: "",
    mcPersMin: "",
    mcPersMode: "",
    mcPersMax: "",
    mcReliMin: "",
    mcReliMode: "",
    mcReliMax: "",
    mcDphMin: "",
    mcDphMode: "",
    mcDphMax: "",
    mcCphMin: "",
    mcCphMode: "",
    mcCphMax: "",
    mcVolMin: "",
    mcVolMode: "",
    mcVolMax: "",

    mcLast: null,
    mcLastHash: "",
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

  // Phase 2 — conversion + capacity
  if (els.goalSupportIds) els.goalSupportIds.value = state.goalSupportIds ?? "";
  if (els.supportRatePct) els.supportRatePct.value = state.supportRatePct ?? "";
  if (els.contactRatePct) els.contactRatePct.value = state.contactRatePct ?? "";
  if (els.doorsPerHour) els.doorsPerHour.value = state.doorsPerHour ?? "";
  if (els.hoursPerShift) els.hoursPerShift.value = state.hoursPerShift ?? "";
  if (els.shiftsPerVolunteerPerWeek) els.shiftsPerVolunteerPerWeek.value = state.shiftsPerVolunteerPerWeek ?? "";

  // Phase 3 — execution + risk
  if (els.orgCount) els.orgCount.value = state.orgCount ?? "";
  if (els.orgHoursPerWeek) els.orgHoursPerWeek.value = state.orgHoursPerWeek ?? "";
  if (els.volunteerMultBase) els.volunteerMultBase.value = state.volunteerMultBase ?? "";
  if (els.channelDoorPct) els.channelDoorPct.value = state.channelDoorPct ?? "";
  if (els.doorsPerHour3) els.doorsPerHour3.value = state.doorsPerHour3 ?? "";
  if (els.callsPerHour3) els.callsPerHour3.value = state.callsPerHour3 ?? "";
  if (els.turnoutReliabilityPct) els.turnoutReliabilityPct.value = state.turnoutReliabilityPct ?? "";

  if (els.mcMode) els.mcMode.value = state.mcMode || "basic";
  if (els.mcVolatility) els.mcVolatility.value = state.mcVolatility || "med";
  if (els.mcSeed) els.mcSeed.value = state.mcSeed || "";

  // Advanced ranges
  const setIf = (el, v) => { if (el) el.value = v ?? ""; };
  setIf(els.mcContactMin, state.mcContactMin);
  setIf(els.mcContactMode, state.mcContactMode);
  setIf(els.mcContactMax, state.mcContactMax);
  setIf(els.mcPersMin, state.mcPersMin);
  setIf(els.mcPersMode, state.mcPersMode);
  setIf(els.mcPersMax, state.mcPersMax);
  setIf(els.mcReliMin, state.mcReliMin);
  setIf(els.mcReliMode, state.mcReliMode);
  setIf(els.mcReliMax, state.mcReliMax);
  setIf(els.mcDphMin, state.mcDphMin);
  setIf(els.mcDphMode, state.mcDphMode);
  setIf(els.mcDphMax, state.mcDphMax);
  setIf(els.mcCphMin, state.mcCphMin);
  setIf(els.mcCphMode, state.mcCphMode);
  setIf(els.mcCphMax, state.mcCphMax);
  setIf(els.mcVolMin, state.mcVolMin);
  setIf(els.mcVolMode, state.mcVolMode);
  setIf(els.mcVolMax, state.mcVolMax);

  syncMcModeUI();

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

  // Phase 2 — conversion + capacity
  if (els.goalSupportIds) els.goalSupportIds.addEventListener("input", () => { state.goalSupportIds = els.goalSupportIds.value; markMcStale(); render(); persist(); });
  if (els.supportRatePct) els.supportRatePct.addEventListener("input", () => { state.supportRatePct = safeNum(els.supportRatePct.value); markMcStale(); render(); persist(); });
  if (els.contactRatePct) els.contactRatePct.addEventListener("input", () => { state.contactRatePct = safeNum(els.contactRatePct.value); markMcStale(); render(); persist(); });
  if (els.doorsPerHour) els.doorsPerHour.addEventListener("input", () => { state.doorsPerHour = safeNum(els.doorsPerHour.value); render(); persist(); });
  if (els.hoursPerShift) els.hoursPerShift.addEventListener("input", () => { state.hoursPerShift = safeNum(els.hoursPerShift.value); render(); persist(); });
  if (els.shiftsPerVolunteerPerWeek) els.shiftsPerVolunteerPerWeek.addEventListener("input", () => { state.shiftsPerVolunteerPerWeek = safeNum(els.shiftsPerVolunteerPerWeek.value); render(); persist(); });

  // Phase 3 — execution + risk
  if (els.orgCount) els.orgCount.addEventListener("input", () => { state.orgCount = safeNum(els.orgCount.value); markMcStale(); render(); persist(); });
  if (els.orgHoursPerWeek) els.orgHoursPerWeek.addEventListener("input", () => { state.orgHoursPerWeek = safeNum(els.orgHoursPerWeek.value); markMcStale(); render(); persist(); });
  if (els.volunteerMultBase) els.volunteerMultBase.addEventListener("input", () => { state.volunteerMultBase = safeNum(els.volunteerMultBase.value); markMcStale(); render(); persist(); });
  if (els.channelDoorPct) els.channelDoorPct.addEventListener("input", () => { state.channelDoorPct = safeNum(els.channelDoorPct.value); markMcStale(); render(); persist(); });
  if (els.doorsPerHour3) els.doorsPerHour3.addEventListener("input", () => { state.doorsPerHour3 = safeNum(els.doorsPerHour3.value); markMcStale(); render(); persist(); });
  if (els.callsPerHour3) els.callsPerHour3.addEventListener("input", () => { state.callsPerHour3 = safeNum(els.callsPerHour3.value); markMcStale(); render(); persist(); });
  if (els.turnoutReliabilityPct) els.turnoutReliabilityPct.addEventListener("input", () => { state.turnoutReliabilityPct = safeNum(els.turnoutReliabilityPct.value); markMcStale(); render(); persist(); });

  if (els.mcMode) els.mcMode.addEventListener("change", () => { state.mcMode = els.mcMode.value; syncMcModeUI(); markMcStale(); persist(); });
  if (els.mcVolatility) els.mcVolatility.addEventListener("change", () => { state.mcVolatility = els.mcVolatility.value; markMcStale(); persist(); });
  if (els.mcSeed) els.mcSeed.addEventListener("input", () => { state.mcSeed = els.mcSeed.value; markMcStale(); persist(); });

  const advWatch = (el, key) => {
    if (!el) return;
    el.addEventListener("input", () => {
      state[key] = safeNum(el.value);
      markMcStale();
      persist();
    });
  };
  advWatch(els.mcContactMin, "mcContactMin");
  advWatch(els.mcContactMode, "mcContactMode");
  advWatch(els.mcContactMax, "mcContactMax");
  advWatch(els.mcPersMin, "mcPersMin");
  advWatch(els.mcPersMode, "mcPersMode");
  advWatch(els.mcPersMax, "mcPersMax");
  advWatch(els.mcReliMin, "mcReliMin");
  advWatch(els.mcReliMode, "mcReliMode");
  advWatch(els.mcReliMax, "mcReliMax");
  advWatch(els.mcDphMin, "mcDphMin");
  advWatch(els.mcDphMode, "mcDphMode");
  advWatch(els.mcDphMax, "mcDphMax");
  advWatch(els.mcCphMin, "mcCphMin");
  advWatch(els.mcCphMode, "mcCphMode");
  advWatch(els.mcCphMax, "mcCphMax");
  advWatch(els.mcVolMin, "mcVolMin");
  advWatch(els.mcVolMode, "mcVolMode");
  advWatch(els.mcVolMax, "mcVolMax");

  if (els.mcRun) els.mcRun.addEventListener("click", () => runMonteCarloNow());

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
  renderConversion(res, weeks);

  els.explainCard.hidden = !state.ui.training;
}


function renderConversion(res, weeks){
  // If Phase 2 panel isn't present, fail silently.
  if (!els.outConversationsNeeded) return;

  const rawGoal = safeNum(state.goalSupportIds);
  const autoGoal = safeNum(res?.expected?.persuasionNeed);
  const goal = (rawGoal != null && rawGoal >= 0) ? rawGoal : (autoGoal != null && autoGoal > 0 ? autoGoal : 0);

  const srPct = safeNum(state.supportRatePct);
  const crPct = safeNum(state.contactRatePct);
  const sr = (srPct != null) ? clamp(srPct, 0, 100) / 100 : null;
  const cr = (crPct != null) ? clamp(crPct, 0, 100) / 100 : null;

  const dph = safeNum(state.doorsPerHour);
  const hps = safeNum(state.hoursPerShift);
  const spv = safeNum(state.shiftsPerVolunteerPerWeek);

  const doorsPerShift = (dph != null && hps != null) ? dph * hps : null;

  const convosNeeded = (sr && sr > 0) ? goal / sr : null;
  const doorsNeeded = (convosNeeded != null && cr && cr > 0) ? convosNeeded / cr : null;

  const totalShifts = (doorsNeeded != null && doorsPerShift && doorsPerShift > 0) ? doorsNeeded / doorsPerShift : null;
  const shiftsPerWeek = (totalShifts != null && weeks && weeks > 0) ? totalShifts / weeks : null;
  const volsNeeded = (shiftsPerWeek != null && spv && spv > 0) ? shiftsPerWeek / spv : null;

  // Conservative rounding (ceil) for planning.
  const fmtMaybe = (v) => (v == null || !isFinite(v)) ? "—" : fmtInt(Math.ceil(v));
  els.outConversationsNeeded.textContent = fmtMaybe(convosNeeded);
  els.outDoorsNeeded.textContent = fmtMaybe(doorsNeeded);
  els.outDoorsPerShift.textContent = (doorsPerShift == null || !isFinite(doorsPerShift)) ? "—" : fmtInt(Math.round(doorsPerShift));
  els.outTotalShifts.textContent = fmtMaybe(totalShifts);
  els.outShiftsPerWeek.textContent = fmtMaybe(shiftsPerWeek);
  els.outVolunteersNeeded.textContent = fmtMaybe(volsNeeded);

  // Feasibility banner
  if (!els.convFeasBanner) return;

  let msg = "";
  let cls = "";
  let show = true;

  if (goal <= 0){
    msg = "Capacity check: Under current assumptions, no additional support IDs are required (goal = 0).";
    cls = "ok";
  } else if (weeks == null || weeks <= 0){
    msg = "Capacity check: Set an election date (or weeks remaining) to compute per-week requirements.";
    cls = "warn";
  } else if (sr == null || sr <= 0 || cr == null || cr <= 0 || doorsPerShift == null || doorsPerShift <= 0){
    msg = "Capacity check: Enter Support rate, Contact rate, Doors/hour, and Hours/shift to compute workload.";
    cls = "warn";
  } else if (volsNeeded == null || !isFinite(volsNeeded)){
    msg = "Capacity check: Enter Shifts per volunteer/week to estimate active volunteer requirement.";
    cls = "warn";
  } else {
    const v = Math.ceil(volsNeeded);
    if (v <= 25){
      msg = `Capacity check: Looks feasible (≈ ${fmtInt(v)} active volunteers at your stated cadence).`;
      cls = "ok";
    } else if (v <= 60){
      msg = `Capacity check: Ambitious (≈ ${fmtInt(v)} active volunteers). Consider higher efficiency, longer shifts, or supplementing with paid/phones/texts.`;
      cls = "warn";
    } else {
      msg = `Capacity check: High risk (≈ ${fmtInt(v)} active volunteers). You likely need multi-channel + paid volume, or revise assumptions.`;
      cls = "bad";
    }
  }

  els.convFeasBanner.hidden = !show;
  els.convFeasBanner.className = `banner ${cls}`.trim();
  els.convFeasBanner.textContent = msg;
  renderPhase3(res, weeks);
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

/* =========================
   Phase 3 — Execution + Risk
   ========================= */

function syncMcModeUI(){
  if (!els.mcBasic || !els.mcAdvanced || !els.mcMode) return;
  const mode = els.mcMode.value || "basic";
  els.mcBasic.classList.toggle("active", mode === "basic");
  els.mcAdvanced.classList.toggle("active", mode === "advanced");
}

function markMcStale(){
  // Mark results stale if there is a prior run.
  if (!els.mcStale) return;
  if (state.mcLast){
    els.mcStale.hidden = false;
  }
}

function clearMcStale(){
  if (!els.mcStale) return;
  els.mcStale.hidden = true;
  els.mcStale.classList.remove("warn","ok");
  els.mcStale.classList.add("warn");
}

function hashMcInputs(res, weeks){
  const needVotes = deriveNeedVotes(res);
  const payload = {
    weeks,
    needVotes,
    // Capacity
    orgCount: safeNum(state.orgCount),
    orgHoursPerWeek: safeNum(state.orgHoursPerWeek),
    volunteerMultBase: safeNum(state.volunteerMultBase),
    channelDoorPct: safeNum(state.channelDoorPct),
    doorsPerHour3: safeNum(state.doorsPerHour3),
    callsPerHour3: safeNum(state.callsPerHour3),
    // Base rates (Phase 2 + p3)
    contactRatePct: safeNum(state.contactRatePct),
    supportRatePct: safeNum(state.supportRatePct),
    turnoutReliabilityPct: safeNum(state.turnoutReliabilityPct),
    // MC config
    mcMode: state.mcMode || "basic",
    mcVolatility: state.mcVolatility || "med",
    mcSeed: state.mcSeed || "",
    // Advanced ranges
    mcContactMin: safeNum(state.mcContactMin),
    mcContactMode: safeNum(state.mcContactMode),
    mcContactMax: safeNum(state.mcContactMax),
    mcPersMin: safeNum(state.mcPersMin),
    mcPersMode: safeNum(state.mcPersMode),
    mcPersMax: safeNum(state.mcPersMax),
    mcReliMin: safeNum(state.mcReliMin),
    mcReliMode: safeNum(state.mcReliMode),
    mcReliMax: safeNum(state.mcReliMax),
    mcDphMin: safeNum(state.mcDphMin),
    mcDphMode: safeNum(state.mcDphMode),
    mcDphMax: safeNum(state.mcDphMax),
    mcCphMin: safeNum(state.mcCphMin),
    mcCphMode: safeNum(state.mcCphMode),
    mcCphMax: safeNum(state.mcCphMax),
    mcVolMin: safeNum(state.mcVolMin),
    mcVolMode: safeNum(state.mcVolMode),
    mcVolMax: safeNum(state.mcVolMax),
  };
  return JSON.stringify(payload);
}

function deriveNeedVotes(res){
  const rawGoal = safeNum(state.goalSupportIds);
  const autoGoal = safeNum(res?.expected?.persuasionNeed);
  const goal = (rawGoal != null && rawGoal >= 0) ? rawGoal : (autoGoal != null && autoGoal > 0 ? autoGoal : 0);
  return goal;
}

function renderPhase3(res, weeks){
  // Phase 3 panel isn't present, fail silently.
  if (!els.p3CapContacts) return;

  const w = (weeks != null && weeks >= 0) ? weeks : null;
  els.p3Weeks.textContent = w == null ? "—" : fmtInt(w);

  // Base rates (from Phase 2 + p3)
  const crPct = safeNum(state.contactRatePct);
  const prPct = safeNum(state.supportRatePct);
  const rrPct = safeNum(state.turnoutReliabilityPct);

  const cr = (crPct != null) ? clamp(crPct, 0, 100) / 100 : null;
  const pr = (prPct != null) ? clamp(prPct, 0, 100) / 100 : null;
  const rr = (rrPct != null) ? clamp(rrPct, 0, 100) / 100 : null;

  // Capacity inputs
  const orgCount = safeNum(state.orgCount);
  const orgHrs = safeNum(state.orgHoursPerWeek);
  const volMult = safeNum(state.volunteerMultBase);
  const doorSharePct = safeNum(state.channelDoorPct);
  const doorShare = (doorSharePct != null) ? clamp(doorSharePct, 0, 100) / 100 : null;

  const dph = safeNum(state.doorsPerHour3) ?? safeNum(state.doorsPerHour);
  const cph = safeNum(state.callsPerHour3);

  const capContacts = computeCapacityContacts({
    weeks: w,
    orgCount,
    orgHoursPerWeek: orgHrs,
    volunteerMult: volMult,
    doorShare,
    doorsPerHour: dph,
    callsPerHour: cph,
  });

  els.p3CapContacts.textContent = (capContacts == null) ? "—" : fmtInt(Math.floor(capContacts));

  // Required contacts under base rates (using persuasion need)
  const needVotes = deriveNeedVotes(res);

  let reqContacts = null;
  if (needVotes > 0 && cr && cr > 0 && pr && pr > 0 && rr && rr > 0){
    const reqSupports = needVotes / rr;
    const reqConvos = reqSupports / pr;
    reqContacts = reqConvos / cr;
  }

  // Gap
  if (capContacts == null || reqContacts == null){
    els.p3GapContacts.textContent = "—";
    els.p3GapNote.textContent = "Enter Phase 2 rates + Phase 3 capacity to compute.";
  } else {
    const gap = capContacts - reqContacts;
    const sign = gap >= 0 ? "+" : "−";
    els.p3GapContacts.textContent = `${sign}${fmtInt(Math.ceil(Math.abs(gap)))}`;
    if (gap >= 0){
      els.p3GapNote.textContent = `Capacity ≥ requirement (base rates).`;
    } else {
      els.p3GapNote.textContent = `Shortfall vs requirement (base rates).`;
    }
  }

  // Stale indicator
  if (state.mcLast && els.mcStale){
    const h = hashMcInputs(res, w);
    const stale = (state.mcLastHash && state.mcLastHash !== h);
    els.mcStale.hidden = !stale;
  }

  // Render last MC results if present
  if (state.mcLast){
    renderMcResults(state.mcLast);
  }
}

function computeCapacityContacts({ weeks, orgCount, orgHoursPerWeek, volunteerMult, doorShare, doorsPerHour, callsPerHour }){
  if (weeks == null || weeks <= 0) return null;
  if (orgCount == null || orgCount <= 0) return null;
  if (orgHoursPerWeek == null || orgHoursPerWeek <= 0) return null;
  if (volunteerMult == null || volunteerMult <= 0) return null;
  if (doorShare == null) return null;
  if (doorsPerHour == null || doorsPerHour < 0) return null;
  if (callsPerHour == null || callsPerHour < 0) return null;

  const blended = doorShare * doorsPerHour + (1 - doorShare) * callsPerHour;
  if (!isFinite(blended) || blended <= 0) return null;

  return weeks * orgCount * orgHoursPerWeek * blended * volunteerMult;
}

/* ---- Monte Carlo ---- */

function runMonteCarloNow(){
  // Need render context for persuasion need.
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

  const w = (weeks != null && weeks >= 0) ? weeks : null;
  const needVotes = deriveNeedVotes(res);

  const h = hashMcInputs(res, w);

  const sim = runMonteCarloSim({ res, weeks: w, needVotes, runs: 10000, seed: state.mcSeed || "" });

  state.mcLast = sim.summary;
  state.mcLastHash = h;

  persist();
  clearMcStale();
  renderMcResults(sim.summary);
}

function runMonteCarloSim({ res, weeks, needVotes, runs, seed }){
  const mode = state.mcMode || "basic";

  // Base rates
  const baseCr = pctToUnit(safeNum(state.contactRatePct), 0.22);
  const basePr = pctToUnit(safeNum(state.supportRatePct), 0.55);
  const baseRr = pctToUnit(safeNum(state.turnoutReliabilityPct), 0.80);

  // Capacity bases
  const orgCount = safeNum(state.orgCount) ?? 2;
  const orgHrs = safeNum(state.orgHoursPerWeek) ?? 40;
  const doorShare = pctToUnit(safeNum(state.channelDoorPct), 0.70);
  const baseDph = safeNum(state.doorsPerHour3) ?? safeNum(state.doorsPerHour) ?? 30;
  const baseCph = safeNum(state.callsPerHour3) ?? 20;
  const baseVol = safeNum(state.volunteerMultBase) ?? 1.0;

  const rng = makeRng(seed);

  const specs = (mode === "advanced")
    ? buildAdvancedSpecs({ baseCr, basePr, baseRr, baseDph, baseCph, baseVol })
    : buildBasicSpecs({ baseCr, basePr, baseRr, baseDph, baseCph, baseVol });

  const margins = new Array(runs);
  const wins = new Array(runs);

  // Track sampled variables for sensitivity.
  const samples = {
    contactRate: new Array(runs),
    persuasionRate: new Array(runs),
    turnoutReliability: new Array(runs),
    doorsPerHour: new Array(runs),
    callsPerHour: new Array(runs),
    volunteerMult: new Array(runs),
  };

  for (let i=0;i<runs;i++){
    const cr = triSample(specs.contactRate.min, specs.contactRate.mode, specs.contactRate.max, rng);
    const pr = triSample(specs.persuasionRate.min, specs.persuasionRate.mode, specs.persuasionRate.max, rng);
    const rr = triSample(specs.turnoutReliability.min, specs.turnoutReliability.mode, specs.turnoutReliability.max, rng);
    const dph = triSample(specs.doorsPerHour.min, specs.doorsPerHour.mode, specs.doorsPerHour.max, rng);
    const cph = triSample(specs.callsPerHour.min, specs.callsPerHour.mode, specs.callsPerHour.max, rng);
    const vm = triSample(specs.volunteerMult.min, specs.volunteerMult.mode, specs.volunteerMult.max, rng);

    const capContacts = computeCapacityContacts({
      weeks,
      orgCount,
      orgHoursPerWeek: orgHrs,
      volunteerMult: vm,
      doorShare,
      doorsPerHour: dph,
      callsPerHour: cph,
    });

    let votes = 0;
    if (capContacts != null && capContacts > 0){
      const convos = capContacts * cr;
      const supports = convos * pr;
      votes = supports * rr;
    }

    const margin = votes - needVotes;

    margins[i] = margin;
    wins[i] = (margin >= 0) ? 1 : 0;

    samples.contactRate[i] = cr;
    samples.persuasionRate[i] = pr;
    samples.turnoutReliability[i] = rr;
    samples.doorsPerHour[i] = dph;
    samples.callsPerHour[i] = cph;
    samples.volunteerMult[i] = vm;
  }

  const winProb = sum(wins) / runs;

  const sorted = margins.slice().sort((a,b)=>a-b);
  const median = quantileSorted(sorted, 0.50);
  const p5 = quantileSorted(sorted, 0.05);
  const p95 = quantileSorted(sorted, 0.95);

  const sens = computeSensitivity(samples, margins);

  const summary = {
    runs,
    winProb,
    median,
    p5,
    p95,
    sensitivity: sens,
    riskLabel: riskLabelFromWinProb(winProb),
    needVotes,
  };

  return { summary };
}

function buildBasicSpecs({ baseCr, basePr, baseRr, baseDph, baseCph, baseVol }){
  const v = (state.mcVolatility || "med");
  const w = (v === "low") ? 0.10 : (v === "high") ? 0.30 : 0.20;

  return {
    contactRate: spread(baseCr, w, 0, 1),
    persuasionRate: spread(basePr, w, 0, 1),
    turnoutReliability: spread(baseRr, w, 0, 1),
    doorsPerHour: spread(baseDph, w, 0.01, Infinity),
    callsPerHour: spread(baseCph, w, 0.01, Infinity),
    volunteerMult: spread(baseVol, w, 0.01, Infinity),
  };
}

function buildAdvancedSpecs({ baseCr, basePr, baseRr, baseDph, baseCph, baseVol }){
  // Inputs are in % for rates and raw for productivity/multiplier.
  const cr = triFromPctInputs(state.mcContactMin, state.mcContactMode, state.mcContactMax, baseCr);
  const pr = triFromPctInputs(state.mcPersMin, state.mcPersMode, state.mcPersMax, basePr);
  const rr = triFromPctInputs(state.mcReliMin, state.mcReliMode, state.mcReliMax, baseRr);

  const dph = triFromNumInputs(state.mcDphMin, state.mcDphMode, state.mcDphMax, baseDph, 0.01);
  const cph = triFromNumInputs(state.mcCphMin, state.mcCphMode, state.mcCphMax, baseCph, 0.01);
  const vm = triFromNumInputs(state.mcVolMin, state.mcVolMode, state.mcVolMax, baseVol, 0.01);

  return {
    contactRate: cr,
    persuasionRate: pr,
    turnoutReliability: rr,
    doorsPerHour: dph,
    callsPerHour: cph,
    volunteerMult: vm,
  };
}

function renderMcResults(summary){
  if (!els.mcWinProb) return;

  els.mcWinProb.textContent = `${(summary.winProb * 100).toFixed(1)}%`;
  els.mcMedian.textContent = fmtSigned(summary.median);
  els.mcP5.textContent = fmtSigned(summary.p5);
  els.mcP95.textContent = fmtSigned(summary.p95);

  if (els.mcRiskLabel){
    els.mcRiskLabel.textContent = `${summary.riskLabel} — Need: ${fmtInt(Math.round(summary.needVotes))} net persuasion votes.`;
  }

  if (els.mcSensitivity){
    els.mcSensitivity.innerHTML = "";
    summary.sensitivity.forEach(row => {
      const tr = document.createElement("tr");
      const tdA = document.createElement("td");
      tdA.textContent = row.label;
      const tdB = document.createElement("td");
      tdB.className = "num";
      tdB.textContent = row.impact == null ? "—" : row.impact.toFixed(2);
      tr.appendChild(tdA);
      tr.appendChild(tdB);
      els.mcSensitivity.appendChild(tr);
    });
  }
}

function riskLabelFromWinProb(p){
  if (p >= 0.85) return "Strong structural position";
  if (p >= 0.65) return "Favored but fragile";
  if (p >= 0.50) return "Toss-up";
  return "Structural underdog";
}

function pctToUnit(v, fallback){
  if (v == null || !isFinite(v)) return fallback;
  return clamp(v, 0, 100) / 100;
}

function spread(base, w, minClamp, maxClamp){
  const mode = base;
  const min = clamp(base * (1 - w), minClamp, maxClamp);
  const max = clamp(base * (1 + w), minClamp, maxClamp);
  return normalizeTri({ min, mode, max });
}

function triFromPctInputs(minIn, modeIn, maxIn, baseUnit){
  const fallbackMode = baseUnit;
  const minV = safeNum(minIn);
  const modeV = safeNum(modeIn);
  const maxV = safeNum(maxIn);

  const mode = (modeV != null) ? clamp(modeV, 0, 100) / 100 : fallbackMode;
  const min = (minV != null) ? clamp(minV, 0, 100) / 100 : clamp(mode * 0.8, 0, 1);
  const max = (maxV != null) ? clamp(maxV, 0, 100) / 100 : clamp(mode * 1.2, 0, 1);

  return normalizeTri({ min, mode, max });
}

function triFromNumInputs(minIn, modeIn, maxIn, base, floor){
  const minV = safeNum(minIn);
  const modeV = safeNum(modeIn);
  const maxV = safeNum(maxIn);

  const mode = (modeV != null && modeV > 0) ? modeV : base;
  const min = (minV != null && minV > 0) ? minV : Math.max(floor, mode * 0.8);
  const max = (maxV != null && maxV > 0) ? maxV : Math.max(min + floor, mode * 1.2);

  return normalizeTri({ min, mode, max });
}

function normalizeTri({ min, mode, max }){
  let a = min, b = mode, c = max;
  if (!isFinite(a)) a = 0;
  if (!isFinite(b)) b = 0;
  if (!isFinite(c)) c = 0;

  // Enforce ordering
  const lo = Math.min(a, b, c);
  const hi = Math.max(a, b, c);
  // keep mode inside
  b = clamp(b, lo, hi);
  return { min: lo, mode: b, max: hi };
}

function triSample(min, mode, max, rng){
  // Triangular distribution sampling
  const u = rng();
  const c = (mode - min) / (max - min || 1);
  if (u < c){
    return min + Math.sqrt(u * (max - min) * (mode - min));
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

function makeRng(seedStr){
  if (!seedStr) return Math.random;
  const seed = xmur3(seedStr)();
  return mulberry32(seed);
}

// Hash function for seed strings
function xmur3(str){
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++){
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function(){
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= (h >>> 16)) >>> 0;
  };
}

function mulberry32(a){
  return function(){
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function quantileSorted(sorted, q){
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] == null) return sorted[base];
  return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
}

function sum(arr){
  let s = 0;
  for (let i=0;i<arr.length;i++) s += arr[i];
  return s;
}

function fmtSigned(v){
  if (v == null || !isFinite(v)) return "—";
  const n = Math.round(v);
  const sign = n >= 0 ? "+" : "−";
  return `${sign}${fmtInt(Math.abs(n))}`;
}

function computeSensitivity(samples, margins){
  // Pearson correlation between each variable and margin; return absolute impact.
  const out = [];

  const vars = [
    ["Turnout reliability", samples.turnoutReliability],
    ["Persuasion rate", samples.persuasionRate],
    ["Organizer productivity (doors/hr)", samples.doorsPerHour],
    ["Organizer productivity (calls/hr)", samples.callsPerHour],
    ["Contact rate", samples.contactRate],
    ["Volunteer multiplier", samples.volunteerMult],
  ];

  for (const [label, xs] of vars){
    const r = pearson(xs, margins);
    out.push({ label, impact: (r == null) ? null : Math.abs(r) });
  }

  out.sort((a,b) => (b.impact ?? -1) - (a.impact ?? -1));
  return out;
}

function pearson(xs, ys){
  const n = xs.length;
  if (!n || ys.length !== n) return null;

  let sumX=0, sumY=0;
  for (let i=0;i<n;i++){ sumX += xs[i]; sumY += ys[i]; }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num=0, denX=0, denY=0;
  for (let i=0;i<n;i++){
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  if (!isFinite(den) || den === 0) return null;
  return num / den;
}
