import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Flame,
  LogOut,
  History,
  Settings,
  Filter,
} from "lucide-react";
import { MatchCard } from "../components/match-card";
import { ToastContainer, useToast } from "../components/toast";
import { HistoryModal } from "../components/history-modal";
import { syncAppState } from "../lib/store";
import type { DBState } from "../lib/store";
import { FIXTURES, getMatchLabel, ROUND_FEES, GROUPS } from "../lib/schedule";
import { useAuth } from "../contexts/AuthContext";
import { BottomNav } from "../components/bottom-nav";

const GROUP_ORDER = ["A","B","C","D","E","F","G","H","I","J","K","L"];

type GroupKey = typeof GROUP_ORDER[number];

export default function MatchListPage() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, dismissToast } = useToast();

  const [db, setDb] = useState<DBState>({ matches: {}, leaderboard: {}, globalFund: 0 });
  const [activeGroup, setActiveGroup] = useState<GroupKey | "ALL">("ALL");
  const [showProfile, setShowProfile] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const unsub = syncAppState((state) => setDb(state));
    return () => unsub();
  }, []);

  const playerCount = Object.keys(db.leaderboard).length;
  const totalFund = db.globalFund;

  const getMatchStatus = (fixtureId: string): "open" | "locked" | "closed" => {
    const fixture = FIXTURES.find((f) => f.id === fixtureId);
    if (!fixture) return "locked";
    const key = getMatchLabel(fixture);
    const data = db.matches[key];

    if (data?.result) return "closed";
    if (fixture.locked) return "locked";
    const matchDate = new Date(`${fixture.date}T${fixture.time}`);
    const now = new Date();
    if (now >= matchDate) return "locked";
    return "open";
  };

  const getPredictionCount = (fixtureId: string): number => {
    const fixture = FIXTURES.find((f) => f.id === fixtureId);
    if (!fixture) return 0;
    const key = getMatchLabel(fixture);
    return db.matches[key]?.predictions.length || 0;
  };

  // Only group-stage fixtures
  const groupStageFixtures = useMemo(() => {
    return FIXTURES.filter((f) => f.round === "Vòng bảng" && (activeGroup === "ALL" || f.group === activeGroup));
  }, [activeGroup, db]); // db included so status refresh triggers re-sort

  const fixturesByGroup = useMemo(() => {
    const map: Record<string, typeof FIXTURES> = {};
    groupStageFixtures.forEach((f) => {
      const g = f.group || "?";
      if (!map[g]) map[g] = [];
      map[g].push(f);
    });
    // Sort each group's matches by date
    Object.keys(map).forEach((g) => {
      map[g].sort((a, b) => {
        const da = new Date(`${a.date}T${a.time}`).getTime();
        const db_ = new Date(`${b.date}T${b.time}`).getTime();
        return da - db_;
      });
    });
    return map;
  }, [groupStageFixtures]);

  const groupHeader = (g: string) => {
    const teams = GROUPS[g]?.join(" · ") || "";
    return `Nhóm ${g} — ${teams}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 pb-24">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <ToastContainer toast={toast} onDismiss={dismissToast} />

      {/* Profile Dropdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showProfile ? 1 : 0, y: showProfile ? 0 : -8 }}
        className={`fixed top-14 right-4 z-50 bg-[#111928] border border-white/[0.08] rounded-2xl p-4 w-56 shadow-2xl ${showProfile ? "pointer-events-auto" : "pointer-events-none opacity-0"}`}
      >
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold text-cyan-400">
            {profile?.display_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div className="text-sm font-medium text-white truncate max-w-[120px]">
              {profile?.display_name || "User"}
            </div>
            <div className="text-[10px] text-slate-500">{isAdmin ? "Admin" : "Player"}</div>
          </div>
        </div>
        <button onClick={() => { setHistoryOpen(true); setShowProfile(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer">
          <History size={14} /> Lịch sử dự đoán
        </button>
        {isAdmin && (
          <button onClick={() => { navigate("/admin"); setShowProfile(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-400 hover:bg-white/[0.05] transition-colors cursor-pointer">
            <Settings size={14} /> Admin Dashboard
          </button>
        )}
        <button onClick={() => signOut()} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors mt-2 cursor-pointer">
          <LogOut size={14} /> Đăng xuất
        </button>
      </motion.div>

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 pt-6 sm:pt-8 pb-3 text-center px-4">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition-colors cursor-pointer"
          >
            <User size={16} className="text-slate-300" />
          </button>
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold tracking-wider uppercase">
            <Flame size={12} /> Live World Cup 2026
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent">
          ⚽ Trận Đấu
        </h1>
        <p className="text-slate-400 mt-1 text-xs sm:text-sm">Chọn trận · Dự đoán · Trúng thưởng</p>
      </motion.header>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative z-10 max-w-lg mx-auto px-4 mt-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Người chơi", val: playerCount, color: "text-cyan-400", bg: "bg-cyan-500/10" },
            { label: "Tổng trận", val: FIXTURES.length, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Quỹ toàn giải", val: `${totalFund.toLocaleString()}đ`, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border border-white/[0.06] backdrop-blur-xl p-2.5 sm:p-3 text-center ${s.bg}`}>
              <div className={`text-sm sm:text-lg font-bold text-white`}>{s.val}</div>
              <div className={`text-[10px] sm:text-[11px] ${s.color}`}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Group Filter Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="relative z-10 max-w-lg mx-auto px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-bold text-white">Vòng bảng</h2>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Filter size={11} /> Lọc nhóm
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            onClick={() => setActiveGroup("ALL")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeGroup === "ALL"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-slate-200"
            }`}
          >
            All
          </button>
          {GROUP_ORDER.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                activeGroup === g
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:text-white"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Match Grid — grouped by table */}
      <div className="relative z-10 max-w-lg mx-auto px-4 mt-2 space-y-6 sm:space-y-8 pb-6">
        {Object.entries(fixturesByGroup).length > 0 ? (
          Object.entries(fixturesByGroup).map(([group, fixtures]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold">
                  Nhóm {group}
                </div>
                <span className="text-[10px] text-slate-500">
                  {GROUPS[group]?.join(" · ") || ""}
                </span>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {fixtures.map((fixture) => {
                  const status = getMatchStatus(fixture.id);
                  const predCount = getPredictionCount(fixture.id);
                  return (
                    <MatchCard
                      key={fixture.id}
                      fixture={fixture}
                      status={status}
                      predictionCount={predCount}
                      onClick={() => navigate(`/match/${fixture.id}`)}
                    />
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            Không có trận nào trong nhóm này
          </div>
        )}
      </div>

      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} matches={db.matches} />
      <BottomNav active="matches" />
    </div>
  );
}
