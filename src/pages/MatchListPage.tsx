import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Trophy,
  User,
  ChevronRight,
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
import { FIXTURES, ROUND_KEYS, getMatchLabel, ROUND_FEES } from "../lib/schedule";
import { useAuth } from "../contexts/AuthContext";
import { BottomNav } from "../components/bottom-nav";
import type { RoundKey } from "../lib/schedule";

export default function MatchListPage() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, dismissToast } = useToast();

  const [db, setDb] = useState<DBState>({ matches: {}, leaderboard: {}, globalFund: 0 });
  const [roundFilter, setRoundFilter] = useState<RoundKey | "Tất cả">("Tất cả");
  const [showProfile, setShowProfile] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

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

  const filteredFixtures = useMemo(() => {
    let list = [...FIXTURES];
    if (roundFilter !== "Tất cả") {
      list = list.filter((f) => f.round === roundFilter);
    }

    list.sort((a, b) => {
      const statusA = getMatchStatus(a.id);
      const statusB = getMatchStatus(b.id);
      const statusOrder: Record<string, number> = { open: 0, locked: 1, closed: 2 };
      if (statusOrder[statusA] !== statusOrder[statusB]) return statusOrder[statusA] - statusOrder[statusB];

      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateA - dateB;
    });

    return list;
  }, [roundFilter, db]);

  const roundLabel = (r: string) => {
    if (r === "Vòng bảng") return "🏆 " + r;
    if (r.includes("1/32")) return "🔥 " + r;
    if (r.includes("1/16")) return "⚡ " + r;
    if (r.includes("kết")) return "🏅 " + r;
    return r;
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

      {/* Filter */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="relative z-10 max-w-lg mx-auto px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-bold text-white">Danh sách trận đấu</h2>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <Filter size={12} /> {roundFilter === "Tất cả" ? "Lọc vòng" : roundFilter}
            <ChevronRight size={12} className={`transition-transform ${showFilter ? "rotate-90" : ""}`} />
          </button>
        </div>

        {showFilter && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => setRoundFilter("Tất cả")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${roundFilter === "Tất cả" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-slate-200"}`}
            >
              Tất cả
            </button>
            {ROUND_KEYS.map((r) => (
              <button
                key={r}
                onClick={() => setRoundFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${roundFilter === r ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-slate-200"}`}
              >
                {r}
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Match Grid */}
      <div className="relative z-10 max-w-lg mx-auto px-4 mt-2 space-y-3 sm:space-y-4">
        {filteredFixtures.length > 0 ? (
          filteredFixtures.map((fixture, i) => {
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
          })
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            Không có trận nào trong vòng này
          </div>
        )}
      </div>

      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} matches={db.matches} />
      <BottomNav active="matches" />
    </div>
  );
}
