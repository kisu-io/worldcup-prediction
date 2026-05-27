import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  Trophy,
  Users,
  Download,
  BarChart3,
  Calendar,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Send,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { FIXTURES, getMatchLabel, ROUND_KEYS, ROUND_FEES, ROUND_FUND_RATES } from "../lib/schedule";
import { syncAppState, saveState, type DBState } from "../lib/store";
import { callSubmitResult } from "../lib/admin";
import { useAuth } from "../contexts/AuthContext";

type ToastType = "success" | "error" | "info";
interface Toast { id: string; message: string; type: ToastType; }

export default function AdminDashboardPage() {
  const { profile, signOut } = useAuth();
  const [db, setDb] = useState<DBState>({ matches: {}, leaderboard: {}, globalFund: 0 });
  const [activeTab, setActiveTab] = useState<"matches" | "export" | "winners">("matches");
  const [toast, setToast] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(false);

  // Match result input state
  const [selectedMatchId, setSelectedMatchId] = useState(FIXTURES[0].id);
  const [actualScore, setActualScore] = useState("");
  const [submittingMatch, setSubmittingMatch] = useState(false);

  // Export state
  const [exportDate, setExportDate] = useState(new Date().toISOString().split("T")[0]);

  // Load data
  useEffect(() => {
    const unsub = syncAppState((s) => setDb(s));
    return () => unsub();
  }, []);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ id: Date.now().toString(), message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCloseMatch = async () => {
    const fixture = FIXTURES.find(f => f.id === selectedMatchId);
    if (!fixture) return;

    const trimmed = actualScore.trim();
    if (!/^\d+\s*[-–:]\s*\d+$/.test(trimmed)) {
      showToast("Tỉ số không hợp lệ (VD: 2-1)", "error");
      return;
    }

    setSubmittingMatch(true);
    const matchKey = getMatchLabel(fixture);
    const res = await callSubmitResult(matchKey, trimmed, fixture.round);
    if (res.success) {
      showToast(`✅ Đã chốt ${fixture.homeTeam} vs ${fixture.awayTeam}: ${trimmed}`, "success");
      setActualScore("");
    } else {
      showToast(res.error || "Chốt trận thất bại", "error");
    }
    setSubmittingMatch(false);
  };

  const generateDailyReport = () => {
    const date = new Date(exportDate);
    const dateStr = date.toISOString().split("T")[0];

    let totalPredictions = 0;
    let correctPredictions = 0;
    let totalFees = 0;
    let activeMatches = 0;

    Object.entries(db.matches).forEach(([key, data]) => {
      totalPredictions += data.predictions.length;
      if (data.result) {
        activeMatches++;
        data.predictions.forEach(p => {
          if (p.score === data.result) correctPredictions++;
        });
      }
    });

    const report = {
      date: dateStr,
      totalPredictions,
      correctPredictions,
      incorrectPredictions: totalPredictions - correctPredictions,
      accuracy: totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100).toFixed(1) : "0",
      totalGlobalFund: db.globalFund,
      activeMatches,
      totalPlayers: Object.keys(db.leaderboard).length,
      leaderboard: Object.entries(db.leaderboard)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worldcup-report-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`✅ Đã xuất báo cáo ngày ${dateStr}`, "success");
  };

  const getWinners = () => {
    const winners: Array<{ match: string; name: string; score: string; reward: number }> = [];
    Object.entries(db.matches).forEach(([matchKey, data]) => {
      if (!data.result) return;
      const matchPredictions = data.predictions.filter(p => p.score === data.result);
      if (matchPredictions.length > 0) {
        const reward = Math.floor(data.predictions.length * (ROUND_FEES[FIXTURES[0].round] || 5000) / matchPredictions.length);
        matchPredictions.forEach(p => {
          winners.push({
            match: matchKey,
            name: p.name,
            score: p.score,
            reward: reward,
          });
        });
      }
    });
    return winners.sort((a, b) => b.reward - a.reward);
  };

  // Filter matches that haven't been closed yet
  const openFixtures = FIXTURES.filter(f => {
    const key = getMatchLabel(f);
    return !db.matches[key]?.result;
  });

  const closedFixtures = FIXTURES.filter(f => {
    const key = getMatchLabel(f);
    return !!db.matches[key]?.result;
  });

  const winners = getWinners();

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 pb-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl" />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-2xl border ${
              toast.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : toast.type === "error"
                ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                : "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-6 sm:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Shield size={20} className="text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold" >ADMIN</span>
              </div>
              <p className="text-xs text-slate-500">{profile?.display_name || "Admin"} · Quản lý giải đấu</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <ArrowLeft size={14} />
              Về app
            </Link>
            <button
              onClick={() => signOut()}
              className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Tổng dự đoán", val: Object.values(db.matches).reduce((s, m) => s + m.predictions.length, 0), icon: Send, color: "text-cyan-400", bg: "bg-cyan-500/10" },
            { label: "Trận đã chốt", val: Object.values(db.matches).filter(m => m.result).length, icon: Lock, color: "text-rose-400", bg: "bg-rose-500/10" },
            { label: "Người trúng", val: winners.length, icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Quỹ hiện tại", val: `${db.globalFund.toLocaleString()}đ`, icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border border-white/[0.06] backdrop-blur-xl p-3 ${s.bg}`}>
              <div className={`${s.color} mb-1`}><s.icon size={16} /></div>
              <div className="text-lg font-bold text-white">{s.val}</div>
              <div className="text-[10px] text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
          {[
            { id: "matches" as const, label: "Chốt trận", icon: Lock },
            { id: "winners" as const, label: "Người trúng", icon: Trophy },
            { id: "export" as const, label: "Xuất báo cáo", icon: Download },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === t.id ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "matches" && (
            <motion.div
              key="matches"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid gap-4"
            >
              {/* Close Match */}
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 text-rose-400 mb-4">
                    <Lock size={15} />
                    <span className="text-xs font-bold tracking-wider uppercase">Chốt kết quả trận đấu</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-[11px] text-slate-500 mb-1.5 block">Chọn trận đấu</label>
                      <select
                        value={selectedMatchId}
                        onChange={(e) => setSelectedMatchId(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:border-cyan-500/30 outline-none"
                      >
                        {openFixtures.length === 0 && (
                          <option value="">Tất cả trận đã chốt</option>
                        )}
                        {openFixtures.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.homeTeam} vs {f.awayTeam} ({f.round})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 mb-1.5 block">Kết quả thực tế</label>
                      <Input
                        placeholder="VD: 2-1"
                        value={actualScore}
                        onChange={(e) => setActualScore(e.target.value)}
                        disabled={openFixtures.length === 0}
                      />
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleCloseMatch}
                    disabled={submittingMatch || openFixtures.length === 0}
                    className="w-full"
                  >
                    <Lock size={15} />
                    {submittingMatch ? "⏳ Đang chốt..." : "Chốt trận & Phân thưởng"}
                  </Button>
                </CardContent>
              </Card>

              {/* Closed matches */}
              {closedFixtures.length > 0 && (
                <Card>
                  <CardContent>
                    <div className="flex items-center gap-2 text-emerald-400 mb-4">
                      <CheckCircle size={15} />
                      <span className="text-xs font-bold tracking-wider uppercase">Trận đã chốt ({closedFixtures.length})</span>
                    </div>
                    <div className="grid gap-2 max-h-80 overflow-y-auto">
                      {closedFixtures.map(f => {
                        const key = getMatchLabel(f);
                        const data = db.matches[key];
                        return (
                          <div key={f.id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle size={14} className="text-emerald-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{f.homeTeam} vs {f.awayTeam}</div>
                                <div className="text-[10px] text-slate-500">{f.round} · {data?.predictions?.length || 0} dự đoán</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold font-mono text-emerald-400">{data?.result}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === "winners" && (
            <motion.div
              key="winners"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid gap-4"
            >
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 text-amber-400 mb-4">
                    <Trophy size={15} />
                    <span className="text-xs font-bold tracking-wider uppercase">Danh sách người trúng thưởng</span>
                  </div>
                  {winners.length > 0 ? (
                    <div className="grid gap-2">
                      {winners.map((w, i) => (
                        <motion.div
                          key={`${w.match}-${w.name}-${i}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center justify-between bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/10 rounded-xl px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                              {i + 1}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{w.name}</div>
                              <div className="text-[10px] text-slate-500">{w.match} · Đoán đúng {w.score}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-emerald-400">+{w.reward.toLocaleString()}đ</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <AlertTriangle size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Chưa có trận nào được chốt hoặc chưa có người trúng</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "export" && (
            <motion.div
              key="export"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid gap-4"
            >
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 text-cyan-400 mb-4">
                    <Download size={15} />
                    <span className="text-xs font-bold tracking-wider uppercase">Xuất báo cáo thống kê</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-[11px] text-slate-500 mb-1.5 block">Ngày báo cáo</label>
                      <Input
                        type="date"
                        value={exportDate}
                        onChange={(e) => setExportDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-white/[0.03] rounded-xl p-4 mb-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tổng số dự đoán</span>
                      <span>{Object.values(db.matches).reduce((s, m) => s + m.predictions.length, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Số người chơi</span>
                      <span>{Object.keys(db.leaderboard).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Trận đã chốt</span>
                      <span className="text-emerald-400">{Object.values(db.matches).filter(m => m.result).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quỹ toàn giải</span>
                      <span className="text-amber-400 font-bold">{db.globalFund.toLocaleString()}đ</span>
                    </div>
                  </div>

                  <Button variant="primary" onClick={generateDailyReport} className="w-full">
                    <Download size={15} />
                    Xuất báo cáo JSON
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
