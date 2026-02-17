import { computeAll } from "./winMath.js";
import { fmtInt, clamp, safeNum, daysBetween, downloadJson, readJsonFile } from "./utils.js";
import { loadState, saveState } from "./storage.js";
import { computeRoiRows, buildOptimizationTactics } from "./budget.js";
import { optimizeMixBudget, optimizeMixCapacity } from "./optimize.js";

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
    // Phase 4 — budget + ROI
    roiDoorsEnabled: document.getElementById("roiDoorsEnabled"),
    roiDoorsCpa: document.getElementById("roiDoorsCpa"),
    roiDoorsCr: document.getElementById("roiDoorsCr"),
    roiDoorsSr: document.getElementById("roiDoorsSr"),
    roiPhonesEnabled: document.getElementById("roiPhonesEnabled"),
    roiPhonesCpa: document.getElementById("roiPhonesCpa"),
    roiPhonesCr: document.getElementById("roiPhonesCr"),
    roiPhonesSr: document.getElementById("roiPhonesSr"),
    roiTextsEnabled: document.getElementById("roiTextsEnabled"),
    roiTextsCpa: document.getElementById("roiTextsCpa"),
    roiTextsCr: document.getElementById("roiTextsCr"),
    roiTextsSr: document.getElementById("roiTextsSr"),
    roiOverheadAmount: document.getElementById("roiOverheadAmount"),
    roiIncludeOverhead: document.getElementById("roiIncludeOverhead"),
    roiRefresh: document.getElementById("roiRefresh"),
    roiTbody: document.getElementById("roiTbody"),
    roiBanner: document.getElementById("roiBanner"),

  // Phase 5 — optimization
  optMode: document.getElementById("optMode"),
  optBudget: document.getElementById("optBudget"),
  optCapacity: document.getElementById("optCapacity"),
  optStep: document.getElementById("optStep"),
  optUseDecay: document.getElementById("optUseDecay"),
  optRun: document.getElementById("optRun"),
  optTbody: document.getElementById("optTbody"),
  optBanner: document.getElementById("optBanner"),
  optTotalAttempts: document.getElementById("optTotalAttempts"),
  optTotalCost: document.getElementById("optTotalCost"),
  optPersVotes: document.getElementById("optPersVotes"),
  optTurnVotes: document.getElementById("optTurnVotes"),
  optTotalVotes: document.getElementById("optTotalVotes"),
  optBinding: document.getElementById("optBinding"),
  optGapContext: document.getElementById("optGapContext"),

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

  // Phase 6 — Turnout & Mobilization (GOTV)
  gotvBasePct: document.getElementById("gotvBasePct"),
  gotvBaseTurnoutPct: document.getElementById("gotvBaseTurnoutPct"),
  gotvCeilingVotes: document.getElementById("gotvCeilingVotes"),
  gotvDoorsEnabled: document.getElementById("gotvDoorsEnabled"),
  gotvDoorsLiftPct: document.getElementById("gotvDoorsLiftPct"),
  gotvPhonesEnabled: document.getElementById("gotvPhonesEnabled"),
  gotvPhonesLiftPct: document.getElementById("gotvPhonesLiftPct"),
  gotvTextsEnabled: document.getElementById("gotvTextsEnabled"),
  gotvTextsLiftPct: document.getElementById("gotvTextsLiftPct"),
  gotvBanner: document.getElementById("gotvBanner"),

  // Phase 7 — Timeline & pacing
  tlEnabled: document.getElementById("tlEnabled"),
  tlPersCompression: document.getElementById("tlPersCompression"),
  tlCutoff: document.getElementById("tlCutoff"),
  tlGoalWeek: document.getElementById("tlGoalWeek"),
  tlPersAfter: document.getElementById("tlPersAfter"),
  tlBanner: document.getElementById("tlBanner"),
  tlTbody: document.getElementById("tlTbody"),

  // Phase 8 — Hiring simulation
  hireWeeklyCost: document.getElementById("hireWeeklyCost"),
  hireWeek: document.getElementById("hireWeek"),
  hireEndWeek: document.getElementById("hireEndWeek"),
  hireSim: document.getElementById("hireSim"),
  hireTbody: document.getElementById("hireTbody"),
  hireBanner: document.getElementById("hireBanner"),

  // Dev-only integrity harness
  btnSelfTest: document.getElementById("btnSelfTest"),
  selfTestCard: document.getElementById("selfTestCard"),
  selfTestStatus: document.getElementById("selfTestStatus"),
  selfTestSummary: document.getElementById("selfTestSummary"),
  selfTestList: document.getElementById("selfTestList"),
};

// Dev mode (enables integrity harness)
const DEV = (() => {
  try {
    const qs = new URLSearchParams(location.search);
    if (qs.get("dev") === "1") return true;
    return localStorage.getItem("fpe_dev") === "1";
  } catch {
    return false;
  }
})();

if (DEV) document.body.classList.add("dev");

const DEFAULTS_BY_TEMPLATE = {
  federal: { bandWidth: 4, persuasionPct: 28, earlyVoteExp: 45 },
  state_leg: { bandWidth: 4, persuasionPct: 30, earlyVoteExp: 38 },
  municipal: { bandWidth: 5, persuasionPct: 35, earlyVoteExp: 35 },
  county: { bandWidth: 4, persuasionPct: 30, earlyVoteExp: 40 },
};

let state = loadState() || makeDefaultState();

// Non-persisted caches (derived each render)
let lastOptSnapshot = null; // { totals, persVotes, turnVotes, totalAttempts, totalNetVotes, netVotesPerAttempt }
let lastRoiRows = null;

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

        // Phase 4 — budget + ROI (attempt-based; Phase 4A: shared CR/SR across tactics)
        budget: {
          overheadAmount: 0,
          includeOverhead: false,
          tactics: {
            doors: { enabled: true, cpa: 0.18 },
            phones: { enabled: true, cpa: 0.03 },
            texts: { enabled: false, cpa: 0.02 },
          },
          optimize: {
            mode: "budget",
            budgetAmount: 10000,
            capacityAttempts: "",
            step: 25,
            useDecay: false,
          }
        },

    // Phase 6 — GOTV (separate attempt pool)
    gotv: {
      basePct: 40,
      baseTurnoutPct: 60,
      tactics: {
        doors: { enabled: true, liftPct: 6 },
        phones: { enabled: true, liftPct: 3 },
        texts: { enabled: false, liftPct: 1.5 },
      }
    },

    // Phase 7 — Timeline & pacing (sequences totals; does not change totals)
    timeline: {
      enabled: true,
      persCompression: 0.60,
    },

    // Phase 8 — Hiring simulation (button-triggered)
    hiring: {
      weeklyCost: "",
      hireWeek: 1,
      endWeek: "",
    },

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


    // Phase 4 — budget + ROI
    if (els.roiDoorsEnabled) els.roiDoorsEnabled.checked = !!state.budget?.tactics?.doors?.enabled;
    if (els.roiDoorsCpa) els.roiDoorsCpa.value = state.budget?.tactics?.doors?.cpa ?? "";
    if (els.roiDoorsCr) els.roiDoorsCr.value = state.budget?.tactics?.doors?.crPct ?? "";
    if (els.roiDoorsSr) els.roiDoorsSr.value = state.budget?.tactics?.doors?.srPct ?? "";
    if (els.roiPhonesEnabled) els.roiPhonesEnabled.checked = !!state.budget?.tactics?.phones?.enabled;
    if (els.roiPhonesCpa) els.roiPhonesCpa.value = state.budget?.tactics?.phones?.cpa ?? "";
    if (els.roiPhonesCr) els.roiPhonesCr.value = state.budget?.tactics?.phones?.crPct ?? "";
    if (els.roiPhonesSr) els.roiPhonesSr.value = state.budget?.tactics?.phones?.srPct ?? "";
    if (els.roiTextsEnabled) els.roiTextsEnabled.checked = !!state.budget?.tactics?.texts?.enabled;
    if (els.roiTextsCpa) els.roiTextsCpa.value = state.budget?.tactics?.texts?.cpa ?? "";
    if (els.roiTextsCr) els.roiTextsCr.value = state.budget?.tactics?.texts?.crPct ?? "";
    if (els.roiTextsSr) els.roiTextsSr.value = state.budget?.tactics?.texts?.srPct ?? "";
    if (els.roiOverheadAmount) els.roiOverheadAmount.value = state.budget?.overheadAmount ?? "";
    if (els.roiIncludeOverhead) els.roiIncludeOverhead.checked = !!state.budget?.includeOverhead;

  // Phase 5 — optimization
  if (els.optMode) els.optMode.value = state.budget?.optimize?.mode || "budget";
  if (els.optBudget) els.optBudget.value = state.budget?.optimize?.budgetAmount ?? "";
  if (els.optCapacity) els.optCapacity.value = state.budget?.optimize?.capacityAttempts ?? "";
  if (els.optStep) els.optStep.value = state.budget?.optimize?.step ?? 25;
  if (els.optUseDecay) els.optUseDecay.checked = !!state.budget?.optimize?.useDecay;

  // Phase 6 — GOTV
  if (els.gotvBasePct) els.gotvBasePct.value = state.gotv?.basePct ?? "";
  if (els.gotvBaseTurnoutPct) els.gotvBaseTurnoutPct.value = state.gotv?.baseTurnoutPct ?? "";

  if (els.gotvDoorsEnabled) els.gotvDoorsEnabled.checked = !!state.gotv?.tactics?.doors?.enabled;
  if (els.gotvDoorsLiftPct) els.gotvDoorsLiftPct.value = state.gotv?.tactics?.doors?.liftPct ?? "";

  if (els.gotvPhonesEnabled) els.gotvPhonesEnabled.checked = !!state.gotv?.tactics?.phones?.enabled;
  if (els.gotvPhonesLiftPct) els.gotvPhonesLiftPct.value = state.gotv?.tactics?.phones?.liftPct ?? "";

  if (els.gotvTextsEnabled) els.gotvTextsEnabled.checked = !!state.gotv?.tactics?.texts?.enabled;
  if (els.gotvTextsLiftPct) els.gotvTextsLiftPct.value = state.gotv?.tactics?.texts?.liftPct ?? "";

  // Phase 7 — timeline
  if (els.tlEnabled) els.tlEnabled.checked = (state.timeline?.enabled ?? true);
  if (els.tlPersCompression) els.tlPersCompression.value = state.timeline?.persCompression ?? 0.60;

  // Phase 8 — hiring inputs
  if (els.hireWeeklyCost) els.hireWeeklyCost.value = state.hiring?.weeklyCost ?? "";
  if (els.hireWeek) els.hireWeek.value = state.hiring?.hireWeek ?? 1;
  if (els.hireEndWeek) els.hireEndWeek.value = state.hiring?.endWeek ?? "";


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


    // Phase 4 — ROI inputs
    const ensureBudget = () => {
      if (!state.budget) state.budget = { overheadAmount: 0, includeOverhead: false, tactics: { doors:{enabled:true,cpa:0,crPct:null,srPct:null}, phones:{enabled:true,cpa:0,crPct:null,srPct:null}, texts:{enabled:false,cpa:0,crPct:null,srPct:null} }, optimize: { mode:"budget", budgetAmount:10000, capacityAttempts:"", step:25, useDecay:false } };


    // Phase 6 — GOTV inputs (separate from persuasion)
    const ensureGotv = () => {
      if (!state.gotv) state.gotv = { basePct: 40, baseTurnoutPct: 60, tactics: { doors:{enabled:true,liftPct:6}, phones:{enabled:true,liftPct:3}, texts:{enabled:false,liftPct:1.5} } };
      if (!state.gotv.tactics) state.gotv.tactics = { doors:{enabled:true,liftPct:6}, phones:{enabled:true,liftPct:3}, texts:{enabled:false,liftPct:1.5} };
      if (!state.gotv.tactics.doors) state.gotv.tactics.doors = { enabled:true, liftPct:6 };
      if (!state.gotv.tactics.phones) state.gotv.tactics.phones = { enabled:true, liftPct:3 };
      if (!state.gotv.tactics.texts) state.gotv.tactics.texts = { enabled:false, liftPct:1.5 };
    };

      if (!state.budget.tactics) state.budget.tactics = { doors:{enabled:true,cpa:0,crPct:null,srPct:null}, phones:{enabled:true,cpa:0,crPct:null,srPct:null}, texts:{enabled:false,cpa:0,crPct:null,srPct:null} };
      if (!state.budget.optimize) state.budget.optimize = { mode:"budget", budgetAmount:10000, capacityAttempts:"", step:25, useDecay:false };
      if (!state.budget.tactics.doors) state.budget.tactics.doors = { enabled:true, cpa:0, crPct:null, srPct:null };
      if (!state.budget.tactics.phones) state.budget.tactics.phones = { enabled:true, cpa:0, crPct:null, srPct:null };
      if (!state.budget.tactics.texts) state.budget.tactics.texts = { enabled:false, cpa:0, crPct:null, srPct:null };
    };

    const watchBool = (el, fn) => {
      if (!el) return;
      el.addEventListener("change", () => { ensureBudget(); fn(); render(); persist(); });
    };
    const watchNum = (el, fn) => {
      if (!el) return;
      el.addEventListener("input", () => { ensureBudget(); fn(); render(); persist(); });
    };


    const watchGotvBool = (el, fn) => {
      if (!el) return;
      el.addEventListener("change", () => { ensureGotv(); fn(); render(); persist(); });
    };
    const watchGotvNum = (el, fn) => {
      if (!el) return;
      el.addEventListener("input", () => { ensureGotv(); fn(); render(); persist(); });
    };

    // Phase 7 — timeline controls
    const ensureTimeline = () => {
      if (!state.timeline) state.timeline = { enabled: true, persCompression: 0.60 };
      if (state.timeline.enabled == null) state.timeline.enabled = true;
      if (state.timeline.persCompression == null) state.timeline.persCompression = 0.60;
    };

    const watchTimelineBool = (el, fn) => {
      if (!el) return;
      el.addEventListener("change", () => { ensureTimeline(); fn(); render(); persist(); });
    };
    const watchTimelineNum = (el, fn) => {
      if (!el) return;
      el.addEventListener("input", () => { ensureTimeline(); fn(); render(); persist(); });
    };

    // Phase 8 — hiring controls (do not auto-run simulation)
    const ensureHiring = () => {
      if (!state.hiring) state.hiring = { weeklyCost: "", hireWeek: 1, endWeek: "" };
      if (state.hiring.hireWeek == null) state.hiring.hireWeek = 1;
    };
    const watchHiringNum = (el, fn) => {
      if (!el) return;
      el.addEventListener("input", () => { ensureHiring(); fn(); persist(); });
    };


    watchBool(els.roiDoorsEnabled, () => state.budget.tactics.doors.enabled = !!els.roiDoorsEnabled.checked);
    watchNum(els.roiDoorsCpa, () => state.budget.tactics.doors.cpa = safeNum(els.roiDoorsCpa.value) ?? 0);
    watchNum(els.roiDoorsCr, () => state.budget.tactics.doors.crPct = safeNum(els.roiDoorsCr.value));
    watchNum(els.roiDoorsSr, () => state.budget.tactics.doors.srPct = safeNum(els.roiDoorsSr.value));


    watchBool(els.roiPhonesEnabled, () => state.budget.tactics.phones.enabled = !!els.roiPhonesEnabled.checked);
    watchNum(els.roiPhonesCpa, () => state.budget.tactics.phones.cpa = safeNum(els.roiPhonesCpa.value) ?? 0);
    watchNum(els.roiPhonesCr, () => state.budget.tactics.phones.crPct = safeNum(els.roiPhonesCr.value));
    watchNum(els.roiPhonesSr, () => state.budget.tactics.phones.srPct = safeNum(els.roiPhonesSr.value));


    watchBool(els.roiTextsEnabled, () => state.budget.tactics.texts.enabled = !!els.roiTextsEnabled.checked);
    watchNum(els.roiTextsCpa, () => state.budget.tactics.texts.cpa = safeNum(els.roiTextsCpa.value) ?? 0);
    watchNum(els.roiTextsCr, () => state.budget.tactics.texts.crPct = safeNum(els.roiTextsCr.value));
    watchNum(els.roiTextsSr, () => state.budget.tactics.texts.srPct = safeNum(els.roiTextsSr.value));


    watchNum(els.roiOverheadAmount, () => state.budget.overheadAmount = safeNum(els.roiOverheadAmount.value) ?? 0);
    watchBool(els.roiIncludeOverhead, () => state.budget.includeOverhead = !!els.roiIncludeOverhead.checked);

    



    // Phase 6 — GOTV controls
    watchGotvNum(els.gotvBasePct, () => state.gotv.basePct = safeNum(els.gotvBasePct.value));
    watchGotvNum(els.gotvBaseTurnoutPct, () => state.gotv.baseTurnoutPct = safeNum(els.gotvBaseTurnoutPct.value));

    watchGotvBool(els.gotvDoorsEnabled, () => state.gotv.tactics.doors.enabled = !!els.gotvDoorsEnabled.checked);
    watchGotvNum(els.gotvDoorsLiftPct, () => state.gotv.tactics.doors.liftPct = safeNum(els.gotvDoorsLiftPct.value));

    watchGotvBool(els.gotvPhonesEnabled, () => state.gotv.tactics.phones.enabled = !!els.gotvPhonesEnabled.checked);
    watchGotvNum(els.gotvPhonesLiftPct, () => state.gotv.tactics.phones.liftPct = safeNum(els.gotvPhonesLiftPct.value));

    watchGotvBool(els.gotvTextsEnabled, () => state.gotv.tactics.texts.enabled = !!els.gotvTextsEnabled.checked);
    watchGotvNum(els.gotvTextsLiftPct, () => state.gotv.tactics.texts.liftPct = safeNum(els.gotvTextsLiftPct.value));

    // Phase 7 — timeline
    watchTimelineBool(els.tlEnabled, () => state.timeline.enabled = !!els.tlEnabled.checked);
    watchTimelineNum(els.tlPersCompression, () => state.timeline.persCompression = safeNum(els.tlPersCompression.value));

    // Phase 8 — hiring inputs (stored; simulation runs on click)
    watchHiringNum(els.hireWeeklyCost, () => state.hiring.weeklyCost = els.hireWeeklyCost.value ?? "");
    watchHiringNum(els.hireWeek, () => state.hiring.hireWeek = safeNum(els.hireWeek.value) ?? 1);
    watchHiringNum(els.hireEndWeek, () => state.hiring.endWeek = els.hireEndWeek.value ?? "");

// Phase 5 — optimization controls (top-layer only; does not change Phase 1–4 math)
const watchOpt = (el, fn, evt="input") => {
  if (!el) return;
  el.addEventListener(evt, () => { ensureBudget(); fn(); render(); persist(); });
};

watchOpt(els.optMode, () => state.budget.optimize.mode = els.optMode.value, "change");
watchOpt(els.optBudget, () => state.budget.optimize.budgetAmount = safeNum(els.optBudget.value) ?? 0);
watchOpt(els.optCapacity, () => state.budget.optimize.capacityAttempts = els.optCapacity.value ?? "");
watchOpt(els.optStep, () => state.budget.optimize.step = safeNum(els.optStep.value) ?? 25);
watchOpt(els.optUseDecay, () => state.budget.optimize.useDecay = !!els.optUseDecay.checked, "change");

if (els.optRun) els.optRun.addEventListener("click", () => { render(); });
if (els.roiRefresh) els.roiRefresh.addEventListener("click", () => { render(); });

  // Phase 8 — hiring simulation (explicit trigger)
  if (els.hireSim) els.hireSim.addEventListener("click", () => { runHiringSim(); });

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

  // Dev-only: integrity self-test
  if (els.btnSelfTest){
    els.btnSelfTest.addEventListener("click", () => {
      if (els.selfTestCard) els.selfTestCard.hidden = false;
      runSelfTest();
    });
  }

  // Dev-only: toggle dev mode with Ctrl/Cmd + Shift + D
  document.addEventListener("keydown", (e) => {
    const key = String(e.key || "").toLowerCase();
    if (key !== "d") return;
    if (!(e.shiftKey && (e.ctrlKey || e.metaKey))) return;
    try {
      const next = document.body.classList.toggle("dev");
      localStorage.setItem("fpe_dev", next ? "1" : "0");
      if (els.selfTestCard) els.selfTestCard.hidden = !next;
    } catch {}
  });
}

/* ---- Integrity Harness (Dev-only) ---- */

function runSelfTest(){
  const startedAt = Date.now();
  const results = [];
  const add = (ok, label, detail="") => results.push({ ok: !!ok, label, detail });
  const setStatus = (txt) => { if (els.selfTestStatus) els.selfTestStatus.textContent = txt; };

  const showSummary = (kind, text) => {
    if (!els.selfTestSummary) return;
    els.selfTestSummary.hidden = false;
    els.selfTestSummary.className = `banner ${kind}`;
    els.selfTestSummary.textContent = text;
  };
  const clearSummary = () => {
    if (!els.selfTestSummary) return;
    els.selfTestSummary.hidden = true;
    els.selfTestSummary.textContent = "";
    els.selfTestSummary.className = "banner";
  };
  const renderList = () => {
    if (!els.selfTestList) return;
    els.selfTestList.innerHTML = "";
    for (const r of results){
      const li = document.createElement("li");
      li.className = r.ok ? "ok" : "bad";
      li.textContent = r.detail ? `${r.label} — ${r.detail}` : r.label;
      els.selfTestList.appendChild(li);
    }
  };

  const parseNum = (v) => {
    if (v == null) return null;
    const t = String(v).replace(/[$,%\s]/g, "").replace(/,/g, "");
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };

  const uiHasBadNumbers = () => {
    // Catch NaN/Infinity leaks in rendered UI quickly.
    try {
      const text = (document.body?.innerText || "").toLowerCase();
      return text.includes("nan") || text.includes("infinity") || text.includes("∞");
    } catch {
      return false;
    }
  };

  const getResFromState = () => {
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
    return computeAll(modelInput);
  };

  const computeGotvLens = () => {
    const U = safeNum(state.universeSize);
    const basePct = safeNum(state.gotv?.basePct);
    const baseTurn = safeNum(state.gotv?.baseTurnoutPct);
    if (U == null || basePct == null || baseTurn == null) return { baseUniverse: null, nonVoterShare: null };
    const baseUniverse = U * Math.max(0, Math.min(100, basePct)) / 100;
    const nonVoterShare = Math.max(0, Math.min(1, 1 - (Math.max(0, Math.min(100, baseTurn)) / 100)));
    return { baseUniverse, nonVoterShare };
  };

  const runInvariantSuite = ({ scenarioName, expectOpt=true, expectTimeline=true, expectHiring=true, allowBadValidation=false } = {}) => {
    const res = getResFromState();

    // Global UI sanity
    add(!uiHasBadNumbers(), `${scenarioName}: Global — no NaN/Infinity visible`);

    // Phase 1
    const st = res.validation?.supportTotalPct;
    add(st != null && Number.isFinite(st) && Math.abs(st - 100) < 0.25, `${scenarioName}: Phase 1 — support totals ≈ 100%`, st == null ? "missing" : `${st.toFixed(2)}%`);
    const wt = res.expected?.winThreshold;
    add(wt != null && Number.isFinite(wt) && wt > 0, `${scenarioName}: Phase 1 — win threshold numeric`, wt == null ? "missing" : fmtInt(Math.round(wt)));
    const pn = res.expected?.persuasionNeed;
    add(pn != null && Number.isFinite(pn) && pn >= 0, `${scenarioName}: Phase 1 — persuasion need non-negative`, pn == null ? "missing" : fmtInt(Math.round(pn)));

    // Phase 2 (guard division-by-zero)
    const cr = safeNum(state.contactRatePct);
    const sr = safeNum(state.supportRatePct);
    const conv = parseNum(els.outConversationsNeeded?.textContent);
    const doors = parseNum(els.outDoorsNeeded?.textContent);
    if ((pn != null && pn > 0) && cr != null && sr != null && cr > 0 && sr > 0) {
      add(conv != null && conv >= 0, `${scenarioName}: Phase 2 — conversations computed`, conv == null ? "missing" : fmtInt(Math.round(conv)));
      add(doors != null && doors >= 0, `${scenarioName}: Phase 2 — doors needed computed`, doors == null ? "missing" : fmtInt(Math.round(doors)));
    } else {
      // if CR/SR invalid, we just ensure we didn't crash or emit NaN
      add(true, `${scenarioName}: Phase 2 — CR/SR edge handled`);
    }

    // Phase 3: capacity ceiling numeric
    const cap = parseNum(els.p3CapContacts?.textContent);
    add(cap == null || cap >= 0, `${scenarioName}: Phase 3 — capacity ceiling numeric`, cap == null ? "missing/ok" : fmtInt(Math.round(cap)));

    // Phase 4: ROI sanity when enabled
    const roiEnabled = !!(state.budget?.tactics?.doors?.enabled || state.budget?.tactics?.phones?.enabled || state.budget?.tactics?.texts?.enabled);
    if (roiEnabled) {
      const baseRates = {
        cr: (safeNum(state.contactRatePct) != null) ? clamp(safeNum(state.contactRatePct)/100, 0, 1) : null,
        sr: (safeNum(state.supportRatePct) != null) ? clamp(safeNum(state.supportRatePct)/100, 0, 1) : null,
        tr: (safeNum(state.turnoutReliabilityPct) != null) ? clamp(safeNum(state.turnoutReliabilityPct)/100, 0, 1) : null,
      };
      const roi = computeRoiRows({
        goalNetVotes: pn,
        baseRates,
        tactics: state.budget.tactics,
        overheadAmount: safeNum(state.budget.overheadAmount) ?? 0,
        includeOverhead: !!state.budget.includeOverhead,
        caps: null,
        mcLast: null,
      });
      add(Array.isArray(roi.rows) && roi.rows.length > 0, `${scenarioName}: Phase 4 — ROI rows computed`, `${roi.rows?.length || 0} row(s)`);
      // If rates valid and gap>0, enabled rows should have numeric CPA lenses
      if (pn != null && pn > 0 && baseRates.cr && baseRates.sr && baseRates.tr) {
        const anyNumeric = roi.rows.some(r => r.costPerNetVote != null && Number.isFinite(r.costPerNetVote));
        add(anyNumeric, `${scenarioName}: Phase 4 — ROI numeric outputs exist`);
      }
    } else {
      add(true, `${scenarioName}: Phase 4 — no tactics enabled (ok)`);
    }

    // Phase 5/6: optimization snapshot
    if (expectOpt) {
      add(!!lastOptSnapshot && Number.isFinite(lastOptSnapshot.totalNetVotes) && lastOptSnapshot.totalNetVotes >= 0, `${scenarioName}: Phase 5/6 — optimization snapshot exists`, lastOptSnapshot ? `${fmtInt(Math.round(lastOptSnapshot.totalNetVotes))} votes` : "missing");
      if (lastOptSnapshot) {
        add(Number.isFinite(lastOptSnapshot.totalCost) && lastOptSnapshot.totalCost >= 0, `${scenarioName}: Phase 5/6 — total cost numeric`, `$${fmtInt(Math.round(lastOptSnapshot.totalCost))}`);
        add(Number.isFinite(lastOptSnapshot.totalAttempts) && lastOptSnapshot.totalAttempts >= 0, `${scenarioName}: Phase 5/6 — total attempts numeric`, fmtInt(Math.round(lastOptSnapshot.totalAttempts)));
      }
    } else {
      add(true, `${scenarioName}: Phase 5/6 — optimization not expected`);
    }

    // Phase 7: timeline reconciliation
    if (expectTimeline && state.timeline?.enabled && lastOptSnapshot && els.tlTbody) {
      const W = derivedWeeksRemaining();
      const rows = Array.from(els.tlTbody.querySelectorAll("tr"));
      add(W == null || rows.length === W, `${scenarioName}: Phase 7 — timeline rows match weeks`, `${rows.length}/${W ?? "?"}`);
      let sum = 0;
      let lastCum = 0;
      let monotone = true;
      for (const tr of rows) {
        const tds = tr.querySelectorAll("td");
        const total = parseNum(tds?.[4]?.textContent);
        const cum = parseNum(tds?.[5]?.textContent);
        if (total != null) sum += total;
        if (cum != null) {
          if (cum + 1e-9 < lastCum) monotone = false;
          lastCum = cum;
        }
      }
      add(monotone, `${scenarioName}: Phase 7 — cumulative monotone`);
      const optTotal = lastOptSnapshot.totalNetVotes;
      const tol = Math.max(3, optTotal * 0.02);
      add(Math.abs(sum - optTotal) <= tol, `${scenarioName}: Phase 7 — sum ≈ optimized total`, `timeline ${fmtInt(Math.round(sum))} vs opt ${fmtInt(Math.round(optTotal))}`);
      add(Math.abs(lastCum - sum) <= tol, `${scenarioName}: Phase 7 — final cumulative ≈ sum`, `cum ${fmtInt(Math.round(lastCum))} vs sum ${fmtInt(Math.round(sum))}`);
    } else {
      add(true, `${scenarioName}: Phase 7 — timeline not expected/disabled`);
    }

    // Phase 8: hiring sim (+1/+2/+3), explicit trigger
    if (expectHiring) {
      runHiringSim();
      const trs = els.hireTbody ? Array.from(els.hireTbody.querySelectorAll("tr")) : [];
      const real = trs.filter(tr => (tr.textContent || "").trim() && !(tr.textContent || "").includes("—"));
      add(real.length === 3, `${scenarioName}: Phase 8 — hiring rows (+1/+2/+3)`, `${real.length} row(s)`);
      const deltas = real.map(tr => parseNum(tr.querySelectorAll("td")?.[1]?.textContent)).filter(v => v != null);
      const deltasNonNeg = deltas.length === 3 && deltas.every(v => v >= 0);
      add(deltasNonNeg, `${scenarioName}: Phase 8 — hiring deltas non-negative`, deltasNonNeg ? "ok" : "unexpected");
    } else {
      add(true, `${scenarioName}: Phase 8 — hiring not expected`);
    }

    // Validation list global: allow warnings, but optionally disallow BADs.
    const bads = els.validationList ? els.validationList.querySelectorAll("li.bad").length : 0;
    if (!allowBadValidation) {
      add(bads === 0, `${scenarioName}: Guardrails — no BAD validations`, `${bads} bad`);
    } else {
      add(true, `${scenarioName}: Guardrails — bad validations allowed`);
    }
  };

  // Preserve current state and restore after matrix.
  const saved = structuredClone(state);
  const savedLastOpt = lastOptSnapshot ? { ...lastOptSnapshot } : null;

  const scenarios = [
    {
      name: "1) Baseline",
      setup: (s) => {
        s.scenarioName = "SCN1";
        s.weeksRemaining = 12;
        s.universeSize = 100000;
        s.turnoutA = 42; s.turnoutB = 46; s.bandWidth = 4;
        s.candidates = [
          { id: uid(), name: "You", supportPct: 40 },
          { id: uid(), name: "Opp", supportPct: 45 },
        ];
        s.yourCandidateId = s.candidates[0].id;
        s.undecidedPct = 15; s.undecidedMode = "proportional";
        s.persuasionPct = 30; s.earlyVoteExp = 40;
        s.supportRatePct = 55; s.contactRatePct = 22;
        s.orgCount = 2; s.orgHoursPerWeek = 40; s.volunteerMultBase = 1.0;
        s.channelDoorPct = 70; s.doorsPerHour3 = 30; s.callsPerHour3 = 20;
        s.turnoutReliabilityPct = 80;
        s.budget.tactics.doors.enabled = true;
        s.budget.tactics.phones.enabled = true;
        s.budget.tactics.texts.enabled = false;
        s.budget.optimize.mode = "budget";
        s.budget.optimize.budgetAmount = 10000;
        s.budget.optimize.step = 50;
        s.budget.optimize.useDecay = false;
        s.gotv.basePct = 40; s.gotv.baseTurnoutPct = 60;
        s.gotv.tactics.doors.enabled = true; s.gotv.tactics.doors.liftPct = 6;
        s.gotv.tactics.phones.enabled = true; s.gotv.tactics.phones.liftPct = 3;
        s.gotv.tactics.texts.enabled = false;
        s.timeline.enabled = true; s.timeline.persCompression = 0.60;
        s.hiring.weeklyCost = 1200; s.hiring.hireWeek = 1; s.hiring.endWeek = "";
      },
      expectOpt: true, expectTimeline: true, expectHiring: true,
    },
    {
      name: "2) Multi-candidate",
      setup: (s) => {
        s.scenarioName = "SCN2";
        s.weeksRemaining = 14;
        s.universeSize = 80000;
        s.turnoutA = 35; s.turnoutB = 40; s.bandWidth = 5;
        s.candidates = [
          { id: uid(), name: "You", supportPct: 28 },
          { id: uid(), name: "Opp1", supportPct: 26 },
          { id: uid(), name: "Opp2", supportPct: 22 },
        ];
        s.yourCandidateId = s.candidates[0].id;
        s.undecidedPct = 24; s.undecidedMode = "proportional";
        s.persuasionPct = 35; s.earlyVoteExp = 25;
        s.supportRatePct = 50; s.contactRatePct = 18;
        s.orgCount = 1; s.orgHoursPerWeek = 35;
        s.channelDoorPct = 60; s.doorsPerHour3 = 28; s.callsPerHour3 = 18;
        s.turnoutReliabilityPct = 78;
        s.budget.tactics.doors.enabled = true;
        s.budget.tactics.phones.enabled = true;
        s.budget.tactics.texts.enabled = true;
        s.budget.optimize.mode = "budget";
        s.budget.optimize.budgetAmount = 12000;
        s.budget.optimize.step = 50;
        s.gotv.basePct = 35; s.gotv.baseTurnoutPct = 58;
        s.gotv.tactics.doors.enabled = true; s.gotv.tactics.doors.liftPct = 5;
        s.timeline.enabled = true; s.timeline.persCompression = 0.60;
        s.hiring.weeklyCost = 1000; s.hiring.hireWeek = 2;
      },
      expectOpt: true, expectTimeline: true, expectHiring: true,
    },
    {
      name: "3) Already winning",
      setup: (s) => {
        s.scenarioName = "SCN3";
        s.weeksRemaining = 10;
        s.universeSize = 60000;
        s.turnoutA = 45; s.turnoutB = 48; s.bandWidth = 3;
        s.candidates = [
          { id: uid(), name: "You", supportPct: 54 },
          { id: uid(), name: "Opp", supportPct: 38 },
        ];
        s.yourCandidateId = s.candidates[0].id;
        s.undecidedPct = 8; s.undecidedMode = "proportional";
        s.persuasionPct = 20; s.earlyVoteExp = 35;
        s.supportRatePct = 55; s.contactRatePct = 20;
        s.orgCount = 1; s.orgHoursPerWeek = 25;
        s.channelDoorPct = 70; s.doorsPerHour3 = 30; s.callsPerHour3 = 20;
        s.turnoutReliabilityPct = 85;
        s.budget.tactics.doors.enabled = true;
        s.budget.tactics.phones.enabled = false;
        s.budget.tactics.texts.enabled = false;
        s.budget.optimize.mode = "budget";
        s.budget.optimize.budgetAmount = 2000;
        s.budget.optimize.step = 50;
        s.gotv.basePct = 30; s.gotv.baseTurnoutPct = 65;
        s.gotv.tactics.doors.enabled = true; s.gotv.tactics.doors.liftPct = 4;
        s.timeline.enabled = true;
        s.hiring.weeklyCost = 800; s.hiring.hireWeek = 1;
      },
      expectOpt: true, expectTimeline: true, expectHiring: true,
    },
    {
      name: "4) High early vote (60%)",
      setup: (s) => {
        s.scenarioName = "SCN4";
        s.weeksRemaining = 12;
        s.universeSize = 120000;
        s.turnoutA = 38; s.turnoutB = 44; s.bandWidth = 6;
        s.candidates = [
          { id: uid(), name: "You", supportPct: 36 },
          { id: uid(), name: "Opp", supportPct: 48 },
        ];
        s.yourCandidateId = s.candidates[0].id;
        s.undecidedPct = 16; s.undecidedMode = "proportional";
        s.persuasionPct = 35; s.earlyVoteExp = 60;
        s.supportRatePct = 52; s.contactRatePct = 20;
        s.orgCount = 2; s.orgHoursPerWeek = 35;
        s.channelDoorPct = 65; s.doorsPerHour3 = 28; s.callsPerHour3 = 18;
        s.turnoutReliabilityPct = 78;
        s.budget.tactics.doors.enabled = true;
        s.budget.tactics.phones.enabled = true;
        s.budget.optimize.mode = "budget";
        s.budget.optimize.budgetAmount = 15000;
        s.budget.optimize.step = 50;
        s.gotv.basePct = 45; s.gotv.baseTurnoutPct = 58;
        s.gotv.tactics.doors.enabled = true; s.gotv.tactics.doors.liftPct = 6;
        s.timeline.enabled = true; s.timeline.persCompression = 0.60;
        s.hiring.weeklyCost = 1400; s.hiring.hireWeek = 1;
      },
      expectOpt: true, expectTimeline: true, expectHiring: true,
    },
    {
      name: "5) W=2 weeks remaining",
      setup: (s) => {
        s.scenarioName = "SCN5";
        s.weeksRemaining = 2;
        s.universeSize = 40000;
        s.turnoutA = 35; s.turnoutB = 38; s.bandWidth = 3;
        s.candidates = [
          { id: uid(), name: "You", supportPct: 40 },
          { id: uid(), name: "Opp", supportPct: 46 },
        ];
        s.yourCandidateId = s.candidates[0].id;
        s.undecidedPct = 14; s.undecidedMode = "proportional";
        s.persuasionPct = 30; s.earlyVoteExp = 30;
        s.supportRatePct = 55; s.contactRatePct = 22;
        s.orgCount = 1; s.orgHoursPerWeek = 30;
        s.channelDoorPct = 70; s.doorsPerHour3 = 30; s.callsPerHour3 = 20;
        s.turnoutReliabilityPct = 80;
        s.budget.tactics.doors.enabled = true;
        s.budget.optimize.mode = "capacity";
        s.budget.optimize.capacityAmount = 5000;
        s.budget.optimize.step = 50;
        s.gotv.basePct = 35; s.gotv.baseTurnoutPct = 55;
        s.gotv.tactics.doors.enabled = true; s.gotv.tactics.doors.liftPct = 6;
        s.timeline.enabled = true;
        s.hiring.weeklyCost = 1000; s.hiring.hireWeek = 1;
      },
      expectOpt: true, expectTimeline: true, expectHiring: true,
    },
    {
      name: "6) No tactics enabled",
      setup: (s) => {
        s.scenarioName = "SCN6";
        s.weeksRemaining = 10;
        s.universeSize = 80000;
        s.turnoutA = 40; s.turnoutB = 44; s.bandWidth = 4;
        s.candidates = [
          { id: uid(), name: "You", supportPct: 38 },
          { id: uid(), name: "Opp", supportPct: 48 },
        ];
        s.yourCandidateId = s.candidates[0].id;
        s.undecidedPct = 14; s.undecidedMode = "proportional";
        s.persuasionPct = 30; s.earlyVoteExp = 40;
        s.supportRatePct = 55; s.contactRatePct = 22;
        s.orgCount = 1; s.orgHoursPerWeek = 30;
        s.turnoutReliabilityPct = 80;
        // all tactics disabled
        s.budget.tactics.doors.enabled = false;
        s.budget.tactics.phones.enabled = false;
        s.budget.tactics.texts.enabled = false;
        s.budget.optimize.mode = "budget";
        s.budget.optimize.budgetAmount = 10000;
        // timeline enabled but opt not expected
        s.timeline.enabled = true;
        s.hiring.weeklyCost = 1000; s.hiring.hireWeek = 1;
      },
      expectOpt: false, expectTimeline: false, expectHiring: false, allowBadValidation: true,
    },
    {
      name: "7) Capacity-constrained (tight)",
      setup: (s) => {
        s.scenarioName = "SCN7";
        s.weeksRemaining = 6;
        s.universeSize = 90000;
        s.turnoutA = 35; s.turnoutB = 40; s.bandWidth = 5;
        s.candidates = [
          { id: uid(), name: "You", supportPct: 34 },
          { id: uid(), name: "Opp", supportPct: 52 },
        ];
        s.yourCandidateId = s.candidates[0].id;
        s.undecidedPct = 14; s.undecidedMode = "proportional";
        s.persuasionPct = 40; s.earlyVoteExp = 30;
        s.supportRatePct = 45; s.contactRatePct = 15;
        s.orgCount = 1; s.orgHoursPerWeek = 20;
        s.channelDoorPct = 80; s.doorsPerHour3 = 25; s.callsPerHour3 = 15;
        s.turnoutReliabilityPct = 75;
        s.budget.tactics.doors.enabled = true;
        s.budget.tactics.phones.enabled = true;
        s.budget.optimize.mode = "capacity";
        s.budget.optimize.capacityAmount = 1500;
        s.budget.optimize.step = 50;
        s.timeline.enabled = true;
        s.hiring.weeklyCost = 1200; s.hiring.hireWeek = 3;
      },
      expectOpt: true, expectTimeline: true, expectHiring: true,
    },
    {
      name: "8) GOTV-heavy",
      setup: (s) => {
        s.scenarioName = "SCN8";
        s.weeksRemaining = 10;
        s.universeSize = 110000;
        s.turnoutA = 40; s.turnoutB = 45; s.bandWidth = 5;
        s.candidates = [
          { id: uid(), name: "You", supportPct: 41 },
          { id: uid(), name: "Opp", supportPct: 44 },
        ];
        s.yourCandidateId = s.candidates[0].id;
        s.undecidedPct = 15; s.undecidedMode = "proportional";
        s.persuasionPct = 20; s.earlyVoteExp = 50;
        s.supportRatePct = 50; s.contactRatePct = 20;
        s.orgCount = 2; s.orgHoursPerWeek = 35;
        s.turnoutReliabilityPct = 80;
        s.budget.tactics.doors.enabled = true;
        s.budget.tactics.phones.enabled = true;
        s.budget.optimize.mode = "budget";
        s.budget.optimize.budgetAmount = 8000;
        s.gotv.basePct = 55; s.gotv.baseTurnoutPct = 50;
        s.gotv.tactics.doors.enabled = true; s.gotv.tactics.doors.liftPct = 7;
        s.gotv.tactics.phones.enabled = true; s.gotv.tactics.phones.liftPct = 4;
        s.timeline.enabled = true;
        s.hiring.weeklyCost = 1500; s.hiring.hireWeek = 1;
      },
      expectOpt: true, expectTimeline: true, expectHiring: true,
    },
    {
      name: "9) CR=0 edge case",
      setup: (s) => {
        s.scenarioName = "SCN9";
        s.weeksRemaining = 10;
        s.universeSize = 70000;
        s.turnoutA = 38; s.turnoutB = 42; s.bandWidth = 4;
        s.candidates = [
          { id: uid(), name: "You", supportPct: 38 },
          { id: uid(), name: "Opp", supportPct: 50 },
        ];
        s.yourCandidateId = s.candidates[0].id;
        s.undecidedPct = 12; s.undecidedMode = "proportional";
        s.persuasionPct = 35; s.earlyVoteExp = 40;
        s.supportRatePct = 55; s.contactRatePct = 0;
        s.orgCount = 1; s.orgHoursPerWeek = 30;
        s.turnoutReliabilityPct = 80;
        s.budget.tactics.doors.enabled = true;
        s.budget.optimize.mode = "budget";
        s.budget.optimize.budgetAmount = 5000;
        s.timeline.enabled = true;
      },
      // Expect opt may exist but netVotesPerAttempt will be 0; still should not crash.
      expectOpt: true, expectTimeline: false, expectHiring: false, allowBadValidation: true,
    },
    {
      name: "10) Overhead enabled",
      setup: (s) => {
        s.scenarioName = "SCN10";
        s.weeksRemaining = 12;
        s.universeSize = 100000;
        s.turnoutA = 42; s.turnoutB = 46; s.bandWidth = 4;
        s.candidates = [
          { id: uid(), name: "You", supportPct: 40 },
          { id: uid(), name: "Opp", supportPct: 45 },
        ];
        s.yourCandidateId = s.candidates[0].id;
        s.undecidedPct = 15; s.undecidedMode = "proportional";
        s.persuasionPct = 30; s.earlyVoteExp = 40;
        s.supportRatePct = 55; s.contactRatePct = 22;
        s.orgCount = 2; s.orgHoursPerWeek = 40;
        s.channelDoorPct = 70; s.doorsPerHour3 = 30; s.callsPerHour3 = 20;
        s.turnoutReliabilityPct = 80;
        s.budget.tactics.doors.enabled = true;
        s.budget.tactics.phones.enabled = true;
        s.budget.overheadAmount = 2500;
        s.budget.includeOverhead = true;
        s.budget.optimize.mode = "budget";
        s.budget.optimize.budgetAmount = 10000;
        s.timeline.enabled = true;
        s.hiring.weeklyCost = 1200; s.hiring.hireWeek = 1;
      },
      expectOpt: true, expectTimeline: true, expectHiring: true,
    },
  ];

  try {
    setStatus("Running…");
    clearSummary();

    // Ensure dev card is visible while testing
    if (els.selfTestCard) els.selfTestCard.hidden = false;

    for (const scn of scenarios){
      // Reset snapshot between scenarios
      lastOptSnapshot = null;

      state = makeDefaultState();
      scn.setup(state);

      applyStateToUI();
      rebuildCandidateTable();
      render();

      add(true, `— ${scn.name}`, ""); // visual separator (always OK)
      runInvariantSuite({
        scenarioName: scn.name,
        expectOpt: scn.expectOpt !== false,
        expectTimeline: scn.expectTimeline !== false,
        expectHiring: scn.expectHiring !== false,
        allowBadValidation: !!scn.allowBadValidation,
      });
    }

  } catch (e){
    add(false, "Self-test matrix crashed", String(e?.message || e));
  } finally {
    // Restore
    state = saved;
    lastOptSnapshot = savedLastOpt;
    applyStateToUI();
    rebuildCandidateTable();
    render();

    const failed = results.filter(r => !r.ok).length;
    const ms = Date.now() - startedAt;
    if (failed === 0){
      setStatus("PASS");
      showSummary("ok", `Self-test PASS (${results.length} checks, ${scenarios.length} scenarios) — ${ms}ms`);
    } else {
      setStatus("FAIL");
      showSummary("bad", `Self-test FAIL (${failed}/${results.length} checks failed, ${scenarios.length} scenarios) — ${ms}ms`);
    }
    renderList();
  }
}

function normalizeLoadedState(s){
  const base = makeDefaultState();
  const out = { ...base, ...s };
  out.candidates = Array.isArray(s.candidates) ? s.candidates : base.candidates;
  out.userSplit = (s.userSplit && typeof s.userSplit === "object") ? s.userSplit : {};
  out.ui = { ...base.ui, ...(s.ui || {}) };

  out.budget = (s.budget && typeof s.budget === "object")
    ? { ...base.budget, ...s.budget,
        tactics: { ...base.budget.tactics, ...(s.budget.tactics||{}) },
        optimize: { ...base.budget.optimize, ...(s.budget.optimize||{}) }
      }
    : structuredClone(base.budget);

  out.gotv = (s.gotv && typeof s.gotv === "object")
    ? { ...base.gotv, ...s.gotv, tactics: { ...base.gotv.tactics, ...(s.gotv.tactics||{}) } }
    : structuredClone(base.gotv);

  out.timeline = (s.timeline && typeof s.timeline === "object")
    ? { ...base.timeline, ...s.timeline }
    : structuredClone(base.timeline);

  out.hiring = (s.hiring && typeof s.hiring === "object")
    ? { ...base.hiring, ...s.hiring }
    : structuredClone(base.hiring);

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

  renderRoi(res, weeks);
  renderGotvBasics(res);
  renderOptimization(res, weeks);

  renderTimeline(res, weeks);

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


function renderRoi(res, weeks){
  if (!els.roiTbody) return;

  const needVotes = deriveNeedVotes(res);
  const crPct = safeNum(state.contactRatePct);
  const srPct = safeNum(state.supportRatePct);
  const trPct = safeNum(state.turnoutReliabilityPct);

  const cr = (crPct != null) ? clamp(crPct, 0, 100) / 100 : null;
  const sr = (srPct != null) ? clamp(srPct, 0, 100) / 100 : null;
  const tr = (trPct != null) ? clamp(trPct, 0, 100) / 100 : null;

  // Capacity ceiling (attempts) from Phase 3 inputs (blended)
  const w = (weeks != null && weeks >= 0) ? weeks : null;
  const capBreakdown = computeCapacityBreakdown({
    weeks: w,
    orgCount: safeNum(state.orgCount),
    orgHoursPerWeek: safeNum(state.orgHoursPerWeek),
    volunteerMult: safeNum(state.volunteerMultBase),
    doorShare: (() => {
      const v = safeNum(state.channelDoorPct);
      return (v != null) ? clamp(v, 0, 100) / 100 : null;
    })(),
    doorsPerHour: (safeNum(state.doorsPerHour3) ?? safeNum(state.doorsPerHour)),
    callsPerHour: safeNum(state.callsPerHour3),
  });
  const capAttempts = capBreakdown?.total ?? null;

  const budget = state.budget || {};
  const tactics = budget.tactics || {};
  const overheadAmount = safeNum(budget.overheadAmount) ?? 0;
  const includeOverhead = !!budget.includeOverhead;

  const mcLast = state.mcLast || null;

  const { rows, banner } = computeRoiRows({
    goalNetVotes: needVotes,
    baseRates: { cr, sr, tr },
    tactics,
    overheadAmount,
    includeOverhead,
    caps: { total: capAttempts, doors: capBreakdown?.doors ?? null, phones: capBreakdown?.phones ?? null },
    mcLast
  });

  // Cache for Phase 8 comparison (best paid $/net-vote)
  lastRoiRows = rows;

  // banner
  if (els.roiBanner){
    if (banner){
      els.roiBanner.hidden = false;
      els.roiBanner.className = `banner ${banner.kind}`;
      els.roiBanner.textContent = banner.text;
    } else {
      els.roiBanner.hidden = true;
    }
  }

  // render table
  els.roiTbody.innerHTML = "";
  if (!rows.length){
    const trEl = document.createElement("tr");
    trEl.innerHTML = '<td class="muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="muted">—</td>';
    els.roiTbody.appendChild(trEl);
    return;
  }

  for (const r of rows){
    const trEl = document.createElement("tr");

    const td0 = document.createElement("td");
    td0.textContent = r.label;

    const td1 = document.createElement("td");
    td1.className = "num";
    td1.textContent = r.cpa == null ? "—" : `$${r.cpa.toFixed(2)}`;

    const td2 = document.createElement("td");
    td2.className = "num";
    td2.textContent = r.costPerNetVote == null ? "—" : `$${r.costPerNetVote.toFixed(2)}`;

    const td3 = document.createElement("td");
    td3.className = "num";
    td3.textContent = r.totalCost == null ? "—" : `$${fmtInt(Math.round(r.totalCost))}`;

    const td4 = document.createElement("td");
    td4.textContent = r.feasibilityText || "—";

    trEl.appendChild(td0);
    trEl.appendChild(td1);
    trEl.appendChild(td2);
    trEl.appendChild(td3);
    trEl.appendChild(td4);

    els.roiTbody.appendChild(trEl);
  }
}




function renderGotvBasics(res){
  // Phase 6 panel isn't present, fail silently.
  if (!els.gotvCeilingVotes && !els.gotvBanner) return;

  const U = safeNum(state.universeSize);
  const basePct = safeNum(state.gotv?.basePct);
  const baseTurnPct = safeNum(state.gotv?.baseTurnoutPct);

  const persuasionPct = safeNum(state.persuasionPct);

  const baseUniverse = (U != null && basePct != null) ? (U * clamp(basePct, 0, 100) / 100) : null;
  const baseTurn = (baseTurnPct != null) ? clamp(baseTurnPct, 0, 100) / 100 : null;

  const nonVoterShare = (baseTurn != null) ? clamp(1 - baseTurn, 0, 1) : null;
  const ceilingVotes = (baseUniverse != null && nonVoterShare != null) ? (baseUniverse * nonVoterShare) : null;

  if (els.gotvCeilingVotes) els.gotvCeilingVotes.textContent = (ceilingVotes == null) ? "—" : fmtInt(Math.round(ceilingVotes));

  // Guardrails (transparent + defensible)
  const bannerEl = els.gotvBanner;
  if (!bannerEl) return;

  const show = (kind, text) => {
    bannerEl.hidden = false;
    bannerEl.className = `banner ${kind}`;
    bannerEl.textContent = text;
  };
  const hide = () => { bannerEl.hidden = true; };

  // Reset if nothing entered
  if (U == null || U <= 0){
    hide();
    return;
  }

  if (basePct == null || baseTurnPct == null){
    show("warn", "Phase 6: Enter Base mobilization universe % and Baseline base turnout % to compute the GOTV ceiling.");
    return;
  }

  const totalSeg = (persuasionPct != null ? clamp(persuasionPct, 0, 100) : 0) + clamp(basePct, 0, 100);
  if (totalSeg > 100.0001){
    show("bad", `Phase 6 guardrail: Base % + Persuasion % exceeds 100% (currently ${totalSeg.toFixed(1)}%). Reduce one of them to avoid overlap/double counting.`);
    return;
  }

  if (baseTurnPct >= 95){
    show("warn", "Phase 6: Baseline base turnout is very high (≥95%). Mobilization ceiling will be small; confirm this is realistic for your base universe and election type.");
    return;
  }

  hide();
}


function renderOptimization(res, weeks){
  if (!els.optTbody) return;

  // Reference context (not a constraint)
  const needVotes = deriveNeedVotes(res);
  if (els.optGapContext) els.optGapContext.textContent = (needVotes == null) ? "—" : fmtInt(Math.round(needVotes));

  const crPct = safeNum(state.contactRatePct);
  const srPct = safeNum(state.supportRatePct);
  const trPct = safeNum(state.turnoutReliabilityPct);

  const cr = (crPct != null) ? clamp(crPct, 0, 100) / 100 : null;
  const sr = (srPct != null) ? clamp(srPct, 0, 100) / 100 : null;
  const tr = (trPct != null) ? clamp(trPct, 0, 100) / 100 : null;

  // Phase 3 capacity ceiling (attempts)
  const w = (weeks != null && weeks >= 0) ? weeks : null;
  const capBreakdown = computeCapacityBreakdown({
    weeks: w,
    orgCount: safeNum(state.orgCount),
    orgHoursPerWeek: safeNum(state.orgHoursPerWeek),
    volunteerMult: safeNum(state.volunteerMultBase),
    doorShare: (() => {
      const v = safeNum(state.channelDoorPct);
      return (v != null) ? clamp(v, 0, 100) / 100 : null;
    })(),
    doorsPerHour: (safeNum(state.doorsPerHour3) ?? safeNum(state.doorsPerHour)),
    callsPerHour: safeNum(state.callsPerHour3),
  });
  const capAttempts = capBreakdown?.total ?? null;

  const budget = state.budget || {};
  const tacticsRaw = budget.tactics || {};
  const opt = budget.optimize || { mode:"budget", budgetAmount:0, capacityAttempts:"", step:25, useDecay:false };

  const overheadAmount = safeNum(budget.overheadAmount) ?? 0;
  const includeOverhead = !!budget.includeOverhead;


  // Phase 6 — derive GOTV config (separate attempt pool)
  const U = safeNum(state.universeSize);
  const basePct = safeNum(state.gotv?.basePct);
  const baseTurnPct = safeNum(state.gotv?.baseTurnoutPct);

  const baseUniverse = (U != null && basePct != null) ? (U * clamp(basePct, 0, 100) / 100) : null;
  const baseTurn = (baseTurnPct != null) ? clamp(baseTurnPct, 0, 100) / 100 : null;
  const nonVoterShare = (baseTurn != null) ? clamp(1 - baseTurn, 0, 1) : null;

  const gotv = {
    baseUniverse,
    nonVoterShare,
    tactics: state.gotv?.tactics || {}
  };

  const tactics = buildOptimizationTactics({
    baseRates: { cr, sr, tr },
    tactics: tacticsRaw,
    gotv
  });

  const bannerEl = els.optBanner;
  const showBanner = (kind, text) => {
    if (!bannerEl) return;
    bannerEl.hidden = false;
    bannerEl.className = `banner ${kind}`;
    bannerEl.textContent = text;
  };
  const hideBanner = () => {
    if (!bannerEl) return;
    bannerEl.hidden = true;
    bannerEl.textContent = "";
  };



  const useDecay = !!opt.useDecay;

  const getTierMult = (t, currentAttempts) => {
    const tiers = Array.isArray(t.decayTiers) ? t.decayTiers : null;
    if (!tiers || tiers.length === 0) return 1;
    for (const tier of tiers){
      const upto = Number(tier?.upto);
      if (!Number.isFinite(upto)) continue;
      if (currentAttempts < upto) {
        const m = Number(tier?.mult);
        return Number.isFinite(m) ? m : 1;
      }
    }
    const last = tiers[tiers.length - 1];
    const lm = Number(last?.mult);
    return Number.isFinite(lm) ? lm : 1;
  };

  const votesForAllocation = (t, attempts, step) => {
    if (!useDecay) return attempts * t.netVotesPerAttempt;
    const st = (step != null && step > 0) ? step : 1;
    let v = 0;
    for (let cur = 0; cur < attempts; cur += st){
      const add = Math.min(st, attempts - cur);
      const mult = getTierMult(t, cur);
      v += add * t.netVotesPerAttempt * mult;
    }
    return v;
  };


  // Mode UI (budget vs capacity)
  if (els.optMode && els.optBudget && els.optCapacity){
    const m = opt.mode || "budget";
    const isBudget = m === "budget";
    const budgetField = els.optBudget.closest(".field");
    const capField = els.optCapacity.closest(".field");
    if (budgetField) budgetField.hidden = !isBudget;
    if (capField) capField.hidden = isBudget;
  }

  // Clear table
  els.optTbody.innerHTML = "";

  if (!tactics.length){
    hideBanner();
    showBanner("warn", "Optimization: Enable at least one tactic (Doors/Phones/Texts) in Phase 4 inputs.");
    setTotals(null);
    lastOptSnapshot = null;
    stubRow();
    return;
  }

  if (!(cr && cr > 0) || !(sr && sr > 0) || !(tr && tr > 0)){
    hideBanner();
    showBanner("warn", "Optimization: Enter Phase 2 Contact rate + Support rate and Phase 3 Turnout reliability to optimize.");
    setTotals(null);
    lastOptSnapshot = null;
    stubRow();
    return;
  }

  const step = safeNum(opt.step) ?? 25;
  let result = null;

  if ((opt.mode || "budget") === "capacity"){
    const capUser = safeNum(opt.capacityAttempts);
    const cap = (capUser != null && capUser >= 0) ? capUser : (capAttempts != null ? capAttempts : 0);

    result = optimizeMixCapacity({
      capacity: cap,
      tactics,
      step,
      useDecay: !!opt.useDecay
    });

    hideBanner();
    showBanner("ok", "Optimization: Capacity-constrained plan (maximize expected net persuasion votes under attempt ceiling).");

  } else {
    // Budget mode: overhead treated as fixed to avoid circular logic.
    const budgetIn = safeNum(opt.budgetAmount) ?? 0;
    const budgetAvail = Math.max(0, budgetIn - (includeOverhead ? overheadAmount : 0));

    result = optimizeMixBudget({
      budget: budgetAvail,
      tactics,
      step,
      capacityCeiling: capAttempts,
      useDecay: !!opt.useDecay
    });

    hideBanner();
    if (includeOverhead && overheadAmount > 0){
      showBanner("ok", `Optimization: Budget-constrained plan. Overhead ($${fmtInt(Math.round(overheadAmount))}) treated as fixed; remaining budget optimized.`);
    } else {
      showBanner("ok", "Optimization: Budget-constrained plan (maximize expected net persuasion votes under fixed budget).");
    }
  }

  if (!result){
    setTotals(null);
    lastOptSnapshot = null;
    stubRow();
    return;
  }

  // Table rows
  let any = false;
  let persVotes = 0;
  let turnVotes = 0;
  for (const t of tactics){
    const a = result.allocation?.[t.id] ?? 0;
    if (!a) continue;

    const votesHere = votesForAllocation(t, a, safeNum(opt.step) ?? 1);
    if (String(t.id).endsWith("_gotv")) turnVotes += votesHere;
    else persVotes += votesHere;
    any = true;

    const trEl = document.createElement("tr");

    const td0 = document.createElement("td");
    td0.textContent = t.label;

    const td1 = document.createElement("td");
    td1.className = "num";
    td1.textContent = fmtInt(Math.round(a));

    const td2 = document.createElement("td");
    td2.className = "num";
    td2.textContent = `$${fmtInt(Math.round(a * t.costPerAttempt))}`;

    const td3 = document.createElement("td");
    td3.className = "num";
    td3.textContent = fmtInt(Math.round(votesForAllocation(t, a, safeNum(opt.step) ?? 1)));

    trEl.appendChild(td0);
    trEl.appendChild(td1);
    trEl.appendChild(td2);
    trEl.appendChild(td3);
    els.optTbody.appendChild(trEl);
  }

  if (!any) stubRow();

  const totalAttempts = result.totals?.attempts ?? 0;
  let totalCost = result.totals?.cost ?? 0;
  if ((opt.mode || "budget") === "budget" && includeOverhead && overheadAmount > 0){
    totalCost += overheadAmount;
  }
  const totalVotes = result.totals?.netVotes ?? 0;

  setTotals({
    attempts: totalAttempts,
    cost: totalCost,
    votes: totalVotes,
    persVotes,
    turnVotes,
    binding: result.binding || "—"
  });

  // Cache for Phase 7/8 layers (non-invasive)
  lastOptSnapshot = {
    totalAttempts: totalAttempts,
    totalNetVotes: totalVotes,
    persVotes,
    turnVotes,
    netVotesPerAttempt: (totalAttempts > 0) ? (totalVotes / totalAttempts) : 0,
  };

  function setTotals(t){
    if (els.optTotalAttempts) els.optTotalAttempts.textContent = t ? fmtInt(Math.round(t.attempts)) : "—";
    if (els.optTotalCost) els.optTotalCost.textContent = t ? `$${fmtInt(Math.round(t.cost))}` : "—";
    if (els.optPersVotes) els.optPersVotes.textContent = t ? fmtInt(Math.round(t.persVotes ?? 0)) : "—";
    if (els.optTurnVotes) els.optTurnVotes.textContent = t ? fmtInt(Math.round(t.turnVotes ?? 0)) : "—";
    if (els.optTotalVotes) els.optTotalVotes.textContent = t ? fmtInt(Math.round(t.votes)) : "—";
    if (els.optBinding) els.optBinding.textContent = t ? (t.binding || "—") : "—";
  }
  }

  function stubRow(){
    const tr = document.createElement("tr");
    tr.innerHTML = '<td class="muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="num muted">—</td>';
    els.optTbody.appendChild(tr);
  }
}


/* ---- Phase 7: Timeline & pacing ---- */

function renderTimeline(res, weeks){
  if (!els.tlTbody) return;

  const enabled = (state.timeline?.enabled ?? true);
  if (els.tlEnabled) els.tlEnabled.checked = !!enabled;

  const bannerEl = els.tlBanner;
  const showBanner = (kind, text) => {
    if (!bannerEl) return;
    bannerEl.hidden = false;
    bannerEl.className = `banner ${kind}`;
    bannerEl.textContent = text;
  };
  const hideBanner = () => {
    if (!bannerEl) return;
    bannerEl.hidden = true;
    bannerEl.textContent = "";
  };

  // If disabled, show stub and return.
  if (!enabled){
    hideBanner();
    if (els.tlCutoff) els.tlCutoff.textContent = "—";
    if (els.tlGoalWeek) els.tlGoalWeek.textContent = "—";
    if (els.tlPersAfter) els.tlPersAfter.textContent = "—";
    els.tlTbody.innerHTML = '<tr><td class="muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="num muted">—</td></tr>';
    return;
  }

  const W = (weeks != null && weeks > 0) ? weeks : null;
  if (!W){
    hideBanner();
    showBanner("warn", "Phase 7: Set election date (or weeks remaining) to build a weekly timeline.");
    if (els.tlCutoff) els.tlCutoff.textContent = "—";
    if (els.tlGoalWeek) els.tlGoalWeek.textContent = "—";
    if (els.tlPersAfter) els.tlPersAfter.textContent = "—";
    els.tlTbody.innerHTML = '<tr><td class="muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="num muted">—</td></tr>';
    return;
  }

  const snap = lastOptSnapshot;
  if (!snap || !(snap.totalNetVotes > 0)){
    hideBanner();
    showBanner("warn", "Phase 7: Run Optimization (Phase 5) to produce total expected persuasion + turnout votes, then Phase 7 will sequence them by week.");
    if (els.tlCutoff) els.tlCutoff.textContent = "—";
    if (els.tlGoalWeek) els.tlGoalWeek.textContent = "—";
    if (els.tlPersAfter) els.tlPersAfter.textContent = "—";
    els.tlTbody.innerHTML = '<tr><td class="muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="num muted">—</td></tr>';
    return;
  }

  const EV = clamp(safeNum(state.earlyVoteExp) ?? 0, 0, 100) / 100;
  const kPers = clamp(safeNum(state.timeline?.persCompression) ?? 0.60, 0.10, 1.0);
  if (els.tlPersCompression && (els.tlPersCompression.value === "" || safeNum(els.tlPersCompression.value) == null)){
    // Keep placeholder behavior but ensure the model has a value.
    els.tlPersCompression.value = kPers;
  }

  const wCut = Math.max(1, Math.min(W, Math.ceil(W * (1 - EV))));
  if (els.tlCutoff) els.tlCutoff.textContent = fmtInt(wCut);

  const timeline = computeTimeline({
    weeks: W,
    earlyVoteShare: EV,
    persCompression: kPers,
    totalAttempts: snap.totalAttempts,
    persVotes: snap.persVotes,
    turnVotes: snap.turnVotes,
  });

  // Render table
  els.tlTbody.innerHTML = "";
  let cum = 0;
  for (const row of timeline.rows){
    cum += row.totalVotes;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fmtInt(row.week)}</td>
      <td class="num">${fmtInt(Math.round(row.attempts))}</td>
      <td class="num">${fmtInt(Math.round(row.persVotes))}</td>
      <td class="num">${fmtInt(Math.round(row.turnVotes))}</td>
      <td class="num">${fmtInt(Math.round(row.totalVotes))}</td>
      <td class="num">${fmtInt(Math.round(cum))}</td>
    `;
    els.tlTbody.appendChild(tr);
  }

  const needVotes = deriveNeedVotes(res);
  const goalWeek = (needVotes > 0) ? weekReached({ timelineRows: timeline.rows, needVotes }) : null;
  if (els.tlGoalWeek) els.tlGoalWeek.textContent = (goalWeek == null) ? "—" : fmtInt(goalWeek);

  const persAfter = timeline.persuasionAfterCutoffShare;
  if (els.tlPersAfter) els.tlPersAfter.textContent = (persAfter == null) ? "—" : `${(persAfter*100).toFixed(0)}%`;

  hideBanner();
  if (persAfter != null && persAfter > 0.35){
    showBanner("warn", "Phase 7 pacing risk: More than 35% of persuasion votes are scheduled after the early-vote cutoff. Consider front-loading persuasion or increasing early program capacity.");
  }
}

function computeTimeline({ weeks, earlyVoteShare, persCompression, totalAttempts, persVotes, turnVotes }){
  const W = weeks;
  const EV = clamp(earlyVoteShare ?? 0, 0, 1);
  const k = clamp(persCompression ?? 0.60, 0.10, 1.0);

  const wCut = Math.max(1, Math.min(W, Math.ceil(W * (1 - EV))));

  // Attempts are paced evenly by default.
  const attemptsPerWeek = (totalAttempts && totalAttempts > 0) ? (totalAttempts / W) : 0;

  // Persuasion weights: 1 before cutoff, k after cutoff.
  const pw = new Array(W).fill(1);
  for (let i = wCut; i < W; i++) pw[i] = k; // 0-indexed; wCut is 1-indexed cutoff week
  const pSum = pw.reduce((a,b)=>a+b, 0) || 1;

  // GOTV ramp: if W>3, 20% pre-surge (weeks 1..W-3), then 25/35/20 in last 3.
  const gw = new Array(W).fill(0);
  if (W <= 3){
    for (let i=0;i<W;i++) gw[i] = 1;
  } else {
    const preWeeks = W - 3;
    for (let i=0;i<preWeeks;i++) gw[i] = 0.20 / preWeeks;
    gw[W-3] = 0.25;
    gw[W-2] = 0.35;
    gw[W-1] = 0.20;
  }

  // If W<=3 we need to normalize gw to 1.0
  if (W <= 3){
    const s = gw.reduce((a,b)=>a+b,0) || 1;
    for (let i=0;i<W;i++) gw[i] = gw[i] / s;
  }

  const rows = [];
  let persAfter = 0;
  for (let w=1; w<=W; w++){
    const pShare = pw[w-1] / pSum;
    const gShare = gw[w-1];
    const p = (persVotes || 0) * pShare;
    const g = (turnVotes || 0) * gShare;
    if (w > wCut) persAfter += p;
    rows.push({
      week: w,
      attempts: attemptsPerWeek,
      persVotes: p,
      turnVotes: g,
      totalVotes: p + g,
    });
  }

  const persuasionAfterCutoffShare = (persVotes && persVotes > 0) ? (persAfter / persVotes) : 0;
  return { rows, persuasionAfterCutoffShare, cutoffWeek: wCut };
}

function weekReached({ timelineRows, needVotes }){
  let cum = 0;
  for (const r of timelineRows){
    cum += r.totalVotes;
    if (cum >= needVotes) return r.week;
  }
  return null;
}


/* ---- Phase 8: Hiring simulation (button-triggered) ---- */

function runHiringSim(){
  if (!els.hireTbody) return;

  const bannerEl = els.hireBanner;
  const showBanner = (kind, text) => {
    if (!bannerEl) return;
    bannerEl.hidden = false;
    bannerEl.className = `banner ${kind}`;
    bannerEl.textContent = text;
  };
  const hideBanner = () => {
    if (!bannerEl) return;
    bannerEl.hidden = true;
    bannerEl.textContent = "";
  };

  const weeks = derivedWeeksRemaining();
  const W = (weeks != null && weeks > 0) ? weeks : null;
  if (!W){
    showBanner("warn", "Phase 8: Set election date (or weeks remaining) before simulating hiring.");
    renderHiringStub();
    return;
  }

  const snap = lastOptSnapshot;
  if (!snap || !(snap.totalAttempts > 0) || !(snap.totalNetVotes > 0)){
    showBanner("warn", "Phase 8: Run Optimization (Phase 5) first so we have a baseline plan (attempts + net votes). Then simulate hiring.");
    renderHiringStub();
    return;
  }

  const weeklyCost = safeNum(state.hiring?.weeklyCost);
  if (weeklyCost == null || weeklyCost <= 0){
    showBanner("warn", "Phase 8: Enter an organizer weekly cost to simulate hiring ROI.");
    renderHiringStub();
    return;
  }

  const hireWeek = clamp(safeNum(state.hiring?.hireWeek) ?? 1, 1, W);
  const endWeekRaw = safeNum(state.hiring?.endWeek);
  const endWeek = clamp(endWeekRaw ?? W, 1, W);
  if (endWeek < hireWeek){
    showBanner("warn", "Phase 8: End week is before hire week. Adjust inputs and try again.");
    renderHiringStub();
    return;
  }

  // Compute attempts/week per organizer from Phase 3 productivity inputs.
  const orgHrs = safeNum(state.orgHoursPerWeek);
  const volMult = safeNum(state.volunteerMultBase);
  const doorShare = clamp(safeNum(state.channelDoorPct) ?? 0, 0, 100) / 100;
  const dph = safeNum(state.doorsPerHour3) ?? safeNum(state.doorsPerHour);
  const cph = safeNum(state.callsPerHour3);

  if (orgHrs == null || orgHrs <= 0 || volMult == null || volMult <= 0 || dph == null || cph == null){
    showBanner("warn", "Phase 8: Enter Phase 3 production inputs (hours/week, doors/hr, calls/hr, volunteer multiplier) to simulate added capacity.");
    renderHiringStub();
    return;
  }

  const blended = doorShare * dph + (1 - doorShare) * cph;
  if (!isFinite(blended) || blended <= 0){
    showBanner("warn", "Phase 8: Invalid blended productivity. Check door share and per-hour rates.");
    renderHiringStub();
    return;
  }

  const attemptsPerWeekPerOrg = orgHrs * blended * volMult;
  const activeWeeks = Math.max(0, endWeek - hireWeek + 1);

  // Benchmark: best paid cost per net vote from ROI table (if available)
  const bestPaid = getBestPaidCostPerVote();

  // Prepare baseline timeline for week goal reached.
  const baseTimeline = computeTimeline({
    weeks: W,
    earlyVoteShare: clamp(safeNum(state.earlyVoteExp) ?? 0, 0, 100) / 100,
    persCompression: clamp(safeNum(state.timeline?.persCompression) ?? 0.60, 0.10, 1.0),
    totalAttempts: snap.totalAttempts,
    persVotes: snap.persVotes,
    turnVotes: snap.turnVotes,
  });

  // Need votes context (uses existing Phase 1–2 output)
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
  const needVotes = deriveNeedVotes(res);

  hideBanner();
  els.hireTbody.innerHTML = "";

  for (const n of [1,2,3]){
    const deltaAttempts = n * attemptsPerWeekPerOrg * activeWeeks;
    const deltaVotes = deltaAttempts * (snap.netVotesPerAttempt || 0);
    const cost = n * weeklyCost * activeWeeks;
    const cpv = (deltaVotes > 0) ? (cost / deltaVotes) : null;

    // Timeline shift: assume added attempts scale votes proportionally, then recompute timeline.
    const scaledTotalAttempts = snap.totalAttempts + deltaAttempts;
    const scaledPers = snap.persVotes + (snap.persVotes * (deltaAttempts / snap.totalAttempts));
    const scaledTurn = snap.turnVotes + (snap.turnVotes * (deltaAttempts / snap.totalAttempts));
    const simTimeline = computeTimeline({
      weeks: W,
      earlyVoteShare: clamp(safeNum(state.earlyVoteExp) ?? 0, 0, 100) / 100,
      persCompression: clamp(safeNum(state.timeline?.persCompression) ?? 0.60, 0.10, 1.0),
      totalAttempts: scaledTotalAttempts,
      persVotes: scaledPers,
      turnVotes: scaledTurn,
    });
    const goalWeek = (needVotes > 0) ? weekReached({ timelineRows: simTimeline.rows, needVotes }) : null;

    const efficient = (bestPaid != null && cpv != null) ? (cpv <= bestPaid) : null;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>+${n}</td>
      <td class="num">${fmtInt(Math.round(deltaVotes))}</td>
      <td class="num">$${fmtInt(Math.round(cost))}</td>
      <td class="num">${cpv == null ? "—" : `$${cpv.toFixed(2)}`}</td>
      <td>${efficient == null ? "—" : (efficient ? "✓" : "✗")}</td>
      <td class="num">${goalWeek == null ? "—" : fmtInt(goalWeek)}</td>
    `;
    els.hireTbody.appendChild(tr);
  }

  if (bestPaid != null){
    showBanner("ok", `Hiring benchmark: best paid $/net-vote currently ≈ $${bestPaid.toFixed(2)} (from Phase 4 ROI).`);
  } else {
    showBanner("warn", "Hiring benchmark: ROI table is incomplete; cannot compare efficiency vs paid tactics.");
  }
}

function renderHiringStub(){
  if (!els.hireTbody) return;
  els.hireTbody.innerHTML = '<tr><td class="muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="num muted">—</td><td class="muted">—</td><td class="num muted">—</td></tr>';
}

function getBestPaidCostPerVote(){
  const rows = Array.isArray(lastRoiRows) ? lastRoiRows : null;
  if (!rows || !rows.length) return null;
  let best = null;
  for (const r of rows){
    const v = Number(r?.costPerNetVote);
    if (!Number.isFinite(v) || v <= 0) continue;
    if (best == null || v < best) best = v;
  }
  return best;
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


function computeCapacityBreakdown({ weeks, orgCount, orgHoursPerWeek, volunteerMult, doorShare, doorsPerHour, callsPerHour }){
  const total = computeCapacityContacts({ weeks, orgCount, orgHoursPerWeek, volunteerMult, doorShare, doorsPerHour, callsPerHour });
  if (total == null) return null;

  // Channel ceilings in attempt units (doors knocked vs calls dialed), derived from the same staff-hours budget.
  const doorsCap = weeks * orgCount * orgHoursPerWeek * doorsPerHour * volunteerMult * doorShare;
  const phonesCap = weeks * orgCount * orgHoursPerWeek * callsPerHour * volunteerMult * (1 - doorShare);

  return {
    total,
    doors: (isFinite(doorsCap) && doorsCap >= 0) ? doorsCap : null,
    phones: (isFinite(phonesCap) && phonesCap >= 0) ? phonesCap : null,
  };
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
