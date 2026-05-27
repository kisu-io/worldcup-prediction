// Unified store: Supabase + localStorage fallback
import { supabase, supabaseUrl } from "./supabase";

const isValidConfig = !!supabaseUrl && !supabaseUrl.includes("YOUR_SUPABASE_URL");

let _currentUserId: string | null = null;
let _currentUser: any = null;

// Listen for real auth changes (no auto-anonymous)
supabase.auth.onAuthStateChange((_event, session) => {
  _currentUserId = session?.user?.id || null;
  _currentUser = session?.user || null;
});

// Init once from any existing session
supabase.auth.getSession().then(({ data }) => {
  _currentUserId = data.session?.user?.id || null;
  _currentUser = data.session?.user || null;
});

export function getCurrentUser() {
  return _currentUser;
}

export function getCurrentUserId(): string | null {
  if (!isValidConfig) return null;
  return _currentUserId;
}

export function isLoggedIn(): boolean {
  return !!_currentUserId;
}

export function onUserChange(cb: (userId: string | null) => void): () => void {
  if (!isValidConfig) {
    cb(null);
    return () => {};
  }
  cb(_currentUserId);
  const { data } = supabase.auth.onAuthStateChange((_e, session) => {
    cb(session?.user?.id || null);
  });
  return () => data?.subscription?.unsubscribe?.();
}

export type MatchPrediction = {
  name: string;
  score: string;
  time: string;
  uid?: string;
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

const STORAGE_KEY = "wc2026_db_v5";

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

let _state: DBState = loadLocal();

export function loadState(): DBState {
  return { ..._state };
}

export function saveState(state: DBState) {
  _state = { ...state };
  saveLocal(state);
  window.dispatchEvent(new CustomEvent("wc:dbchange"));

  if (!isValidConfig) return;
  supabase.from("worldcup_state").upsert({
    id: "singleton",
    matches: state.matches,
    leaderboard: state.leaderboard,
    globalFund: state.globalFund,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" }).then(({ error }) => {
    if (error) console.warn("Supabase write failed:", error);
  });
}

export function syncAppState(callback: (state: DBState) => void): () => void {
  _state = loadLocal();
  callback({ ..._state });

  if (!isValidConfig) {
    const handler = () => {
      _state = loadLocal();
      callback({ ..._state });
    };
    window.addEventListener("wc:dbchange", handler);
    return () => window.removeEventListener("wc:dbchange", handler);
  }

  // Fetch once
  supabase.from("worldcup_state").select("*").eq("id", "singleton").single().then(({ data, error }) => {
    if (error) console.warn("Supabase fetch failed:", error);
    if (data) {
      const newState: DBState = {
        matches: data.matches || {},
        leaderboard: data.leaderboard || {},
        globalFund: data.globalFund || 0,
      };
      _state = newState;
      saveLocal(newState);
      callback(newState);
    }
  });

  // Realtime subscription
  const channel = supabase.channel("worldcup_state").on(
    "postgres_changes",
    { event: "*", schema: "public", table: "worldcup_state" },
    (payload) => {
      const newData = payload.new as any;
      if (!newData) return;
      const newState: DBState = {
        matches: newData.matches || {},
        leaderboard: newData.leaderboard || {},
        globalFund: newData.globalFund || 0,
      };
      _state = newState;
      saveLocal(newState);
      callback(newState);
    }
  ).subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function fetchAppState(): Promise<DBState> {
  if (!isValidConfig) return loadLocal();
  const { data, error } = await supabase
    .from("worldcup_state")
    .select("*")
    .eq("id", "singleton")
    .single();
  if (error) {
    console.warn("Supabase fetch failed:", error);
    return loadLocal();
  }
  if (data) {
    const s: DBState = {
      matches: data.matches || {},
      leaderboard: data.leaderboard || {},
      globalFund: data.globalFund || 0,
    };
    _state = s;
    saveLocal(s);
    return s;
  }
  return loadLocal();
}
