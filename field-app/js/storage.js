const KEY = "dsc_field_engine_state_v1";

function stripEphemeral(state){
  try{
    if (state && state.ui && Object.prototype.hasOwnProperty.call(state.ui, "dark")){
      const ui = { ...state.ui };
      delete ui.dark;
      return { ...state, ui };
    }
    return state;
  } catch {
    return state;
  }
}

export function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return stripEphemeral(parsed);
  } catch {
    return null;
  }
}

export function saveState(state){
  try{
    const clean = stripEphemeral(state);
    localStorage.setItem(KEY, JSON.stringify(clean));
  } catch {
    // ignore
  }
}

export function clearState(){
  try{
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function readBackups(){
  try{
    const raw = localStorage.getItem(KEY + "__backups");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function writeBackupEntry(entry){
  try{
    const backups = readBackups();
    backups.unshift(entry);
    const trimmed = backups.slice(0, 5);
    localStorage.setItem(KEY + "__backups", JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}
