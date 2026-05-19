type MatchData = {
  predictions: { name: string; score: string; time: string }[];
  result: string | null;
};

type DBState = {
  matches: Record<string, MatchData>;
  leaderboard: Record<string, number>;
  globalFund: number;
};

const STORAGE_KEY = "wc2026_db_v2";

export function loadState(): DBState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DBState;
  } catch {
    // ignore
  }
  return { matches: {}, leaderboard: {}, globalFund: 0 };
}

export function saveState(state: DBState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("wc:dbchange", { detail: state }));
}

export function useDbState(): [DBState, (s: DBState) => void] {
  // Returns state from localStorage; reactivity handled in page component
  return [loadState(), saveState];
}
