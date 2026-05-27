import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ROUND_FUND_RATES: Record<string, number> = {
  "Vòng bảng": 0.10,
  "Vòng 1/32": 0.20,
  "Vòng 1/16": 0.20,
  "Tứ kết": 0.20,
  "Bán kết": 0.20,
  "Tranh hạng 3": 0.30,
  "Chung kết": 0.30,
};

const ROUND_FEES: Record<string, number> = {
  "Vòng bảng": 10000,
  "Vòng 1/32": 20000,
  "Vòng 1/16": 20000,
  "Tứ kết": 20000,
  "Bán kết": 20000,
  "Tranh hạng 3": 50000,
  "Chung kết": 100000,
};

interface Prediction {
  name: string;
  score: string;
  time: string;
  uid?: string;
}

interface MatchData {
  predictions: Prediction[];
  result: string | null;
}

interface AppState {
  id?: string;
  matches: Record<string, MatchData>;
  leaderboard: Record<string, number>;
  globalFund: number;
  updated_at?: string;
}

async function isAdmin(supabase: any, userId: string, secret: string): Promise<boolean> {
  // Check profiles.role = 'admin'
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (profile?.role === "admin") return true;

  // First-time bootstrap via secret
  const master = Deno.env.get("ADMIN_SECRET") || "2026-admin";
  if (secret === master) {
    // Promote to admin
    await supabase.from("profiles").upsert({
      id: userId,
      role: "admin",
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    return true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }

  const body = await req.json().catch(() => ({}));
  const { matchKey, result, round } = body;
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (!matchKey || !result || !round) {
    return new Response(JSON.stringify({ error: "Thiếu matchKey, result hoặc round." }), { status: 400 });
  }
  if (!/^\d+\s*[-–:]\s*\d+$/.test(result)) {
    return new Response(JSON.stringify({ error: "Tỉ số không hợp lệ." }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SB_URL") || "https://rofwhndjmidfttszuwts.supabase.co",
    Deno.env.get("SERVICE_ROLE_KEY")!
  );

  const { data: { user } } = await supabase.auth.getUser(token);
  const userId = user?.id;

  if (!userId || !(await isAdmin(supabase, userId, ""))) {
    return new Response(JSON.stringify({ error: "Từ chối: Bạn không có quyền chốt trận." }), { status: 403 });
  }

  const fee = ROUND_FEES[round];
  if (!fee) {
    return new Response(JSON.stringify({ error: `Vòng "${round}" không tồn tại.` }), { status: 400 });
  }

  // Fetch current state
  const { data: row, error: fetchErr } = await supabase.from("worldcup_state").select("*").eq("id", "singleton").single();
  if (fetchErr || !row) {
    return new Response(JSON.stringify({ error: "Dữ liệu không tồn tại." }), { status: 400 });
  }
  const currentState: AppState = {
    id: row.id,
    matches: row.matches || {},
    leaderboard: row.leaderboard || {},
    globalFund: row.globalFund || 0,
    updated_at: row.updated_at,
  };

  const current = currentState.matches[matchKey];
  if (!current) {
    return new Response(JSON.stringify({ error: `Trận "${matchKey}" không tồn tại.` }), { status: 404 });
  }
  if (current.result) {
    return new Response(JSON.stringify({ error: "Trận này đã chốt!" }), { status: 409 });
  }

  const totalPlayers = current.predictions.length;
  const totalMoney = totalPlayers * fee;
  const fundRate = ROUND_FUND_RATES[round] ?? 0.10;
  const fundPart = totalMoney * fundRate;

  const winners = current.predictions.filter((p: Prediction) => p.score === result);
  const newLeaderboard = { ...currentState.leaderboard };
  let newFund = (currentState.globalFund || 0) + fundPart;

  if (winners.length > 0) {
    const reward = (totalMoney * (1 - fundRate)) / winners.length;
    winners.forEach((w: Prediction) => {
      newLeaderboard[w.name] = (newLeaderboard[w.name] || 0) + reward;
    });
  } else {
    newFund += totalMoney * (1 - fundRate);
  }

  currentState.matches = {
    ...currentState.matches,
    [matchKey]: {
      ...current,
      result,
    },
  };
  currentState.leaderboard = newLeaderboard;
  currentState.globalFund = newFund;
  currentState.updated_at = new Date().toISOString();

  const { error: upsertErr } = await supabase.from("worldcup_state").upsert({
    id: "singleton",
    matches: currentState.matches,
    leaderboard: currentState.leaderboard,
    globalFund: currentState.globalFund,
    updated_at: currentState.updated_at,
  });

  if (upsertErr) {
    return new Response(JSON.stringify({ error: upsertErr.message }), { status: 500 });
  }

  return new Response(JSON.stringify({
    success: true,
    matchKey,
    result,
    winners: winners.length,
  }), { status: 200 });
});
