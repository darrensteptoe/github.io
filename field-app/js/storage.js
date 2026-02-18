const KEY = "dsc_field_engine_state_v1";

export function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveState(state){
  try{
    localStorage.setItem(KEY, JSON.stringify(state));
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


// ================================
// Phase 11 — Auto-Backup Snapshots
// ================================
const BACKUP_KEY = "fpe_backups_v1";
const BACKUP_MAX = 5;

function safeParse(json){
  try{ return JSON.parse(json); } catch { return null; }
}

export function readBackups(storage = localStorage){
  try{
    const raw = storage.getItem(BACKUP_KEY);
    if (!raw) return [];
    const arr = safeParse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function writeBackupEntry(entry, storage = localStorage){
  try{
    const prev = readBackups(storage);
    const next = [entry, ...prev].slice(0, BACKUP_MAX);
    storage.setItem(BACKUP_KEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}

export function clearBackups(storage = localStorage){
  try{
    storage.removeItem(BACKUP_KEY);
  } catch {
    // ignore
  }
}
