// Unified store: Firebase Realtime DB + localStorage fallback
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC4cqXffU53-0eMmmo4At89PtkuVUyxuL0",
  authDomain: "wc2026-ef036.firebaseapp.com",
  databaseURL: "https://wc2026-ef036-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wc2026-ef036",
  storageBucket: "wc2026-ef036.firebasestorage.app",
  messagingSenderId: "87408081251",
  appId: "1:87408081251:web:794030499ebd1eccf2bb56",
  measurementId: "G-G04FJ9QGX0"
};

const isValidConfig = !!firebaseConfig.databaseURL 
  && !firebaseConfig.databaseURL.includes("YOUR_DATABASE_URL");

let db: any = null;
if (isValidConfig) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  } catch (e) {
    console.warn("Firebase init failed, using localStorage:", e);
  }
}

export type MatchPrediction = {
  name: string;
  score: string;
  time: string;
};

export type MatchData = {
  predictions: MatchPrediction[];
  result: string | null;
};

export type DBState = {
  matches: Record<string, MatchData>;
  leaderboard: Record<string, number>;
  globalFund: number;
};

const STORAGE_KEY = "wc2026_db_v4";

const DEFAULT: DBState = { matches: {}, leaderboard: {}, globalFund: 0 };

function loadLocal(): DBState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DBState;
  } catch { /* ignore */ }
  return DEFAULT;
}

function saveLocal(state: DBState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Public API ───────────────────────────────────────────────────────────

let _state: DBState = loadLocal();

export function loadState(): DBState {
  return { ..._state };
}

export function saveState(state: DBState) {
  _state = { ...state };
  saveLocal(state);
  window.dispatchEvent(new CustomEvent("wc:dbchange"));
  
  if (isValidConfig && db) {
    try {
      set(ref(db, "worldcup"), {
        matches: state.matches,
        leaderboard: state.leaderboard,
        globalFund: state.globalFund,
        updatedAt: Date.now()
      });
    } catch (e) {
      console.warn("Firebase write failed:", e);
    }
  }
}

export function syncAppState(callback: (state: DBState) => void): () => void {
  _state = loadLocal();
  callback({ ..._state });

  if (isValidConfig && db) {
    const dbRef = ref(db, "worldcup");
    const unsub = onValue(dbRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const newState: DBState = {
          matches: val.matches || {},
          leaderboard: val.leaderboard || {},
          globalFund: val.globalFund || 0,
        };
        _state = newState;
        saveLocal(newState);
        callback(newState);
      }
    }, (err: any) => {
      console.warn("Firebase sync error, using localStorage:", err);
    });
    return () => unsub();
  }

  // Fallback: listen to localStorage changes
  const handler = () => {
    _state = loadLocal();
    callback({ ..._state });
  };
  window.addEventListener("wc:dbchange", handler);
  return () => window.removeEventListener("wc:dbchange", handler);
}

// One-time fetch (for async operations)
export async function fetchAppState(): Promise<DBState> {
  if (isValidConfig && db) {
    try {
      const snap = await get(ref(db, "worldcup"));
      const val = snap.val();
      if (val) {
        const s: DBState = {
          matches: val.matches || {},
          leaderboard: val.leaderboard || {},
          globalFund: val.globalFund || 0,
        };
        _state = s;
        saveLocal(s);
        return s;
      }
    } catch (e) {
      console.warn("Firebase fetch failed:", e);
    }
  }
  return loadLocal();
}
