"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Lock,
  Trophy,
  Users,
  Banknote,
  PiggyBank,
  ArrowLeft,
  Flame,
  CircleDot,
  ChevronRight,
  BarChart3,
  Clock,
  Shield,
  ShieldCheck,
  LogOut,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { FIXTURES, getMatchLabel, type RoundKey } from "./lib/schedule";
import { FixtureSelector } from "./components/fixture-selector";
import { ToastContainer } from "./components/toast";
import { HistoryModal } from "./components/history-modal";
import { PinModal } from "./components/pin-modal";
import { syncAppState, saveState, onUserChange, getCurrentUser } from "./lib/store";
import type { DBState } from "./lib/store";
import { fireConfettiBurst, fireConfettiWin } from "./lib/confetti";
import { isAdmin, logoutAdmin } from "./lib/admin";

import { ROUND_FEES } from "./lib/schedule";
const ROUNDS = Object.keys(ROUND_FEES);
const MAX_PER_SCORE = 4;

const ALL_TABS = ["predict", "result", "board", "admin"] as const;
type TabId = typeof ALL_TABS[number];

type ToastType = "success" | "error" | "info";
interface Toast { id: string; message: string; type: ToastType; }

const variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function HomePage() {
  const [db, setDb] = useState<DBState>({ matches: {}, leaderboard: {}, globalFund: 0 });
  const [name, setName] = useState("");
  const [matchId, setMatchId] = useState(FIXTURES[0].id);
  const [round, setRound] = useState<RoundKey>("Vòng bảng");
  const currentFixture = FIXTURES.find(f => f.id === matchId)!;
  const [score, setScore] = useState("");
  const [actualScore, setActualScore] = useState("");
  const [tab, setTab] = useState<TabId>("predict");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [userReady, setUserReady] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    const unsubSync = syncAppState((state) => {
      setDb((prev) => {
        const sJSON = JSON.stringify(state);
        const pJSON = JSON.stringify(prev);
        return sJSON !== pJSON ? state : prev;
      });
    });
    const unsubAuth = onUserChange((user) => {
      setUserReady(true);
      if (user?.uid && !name) {
        setName(user.uid.slice(0, 8));
      }
    });
    // Check admin status on mount
    setIsAdminUser(isAdmin());
    return () => {
      unsubSync();
      unsubAuth();
    };
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ id: Date.now().toString(), message, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const matchKey = getMatchLabel(currentFixture);
  const matchData = db.matches[matchKey] || { predictions: [], result: null };
  const fee = ROUND_FEES[round];
  const totalPlayers = matchData.predictions.length;
  const totalMoney = totalPlayers * fee;
  const sortedBoard = Object.entries(db.leaderboard).sort((a, b) => b[1] - a[1]);

  const handlePredict = () => {
    const trimmedName = name.trim();
    const trimmedScore = score.trim();

    if (!trimmedName || !trimmedScore) {
      showToast("Nhập đầy đủ tên và tỉ số", "error");
      return;
    }
    if (trimmedName.length > 30) {
      showToast("Tên tối đa 30 ký tự", "error");
      return;
    }
    if (!/^\d+\s*[-–:]\s*\d+$/.test(trimmedScore)) {
      showToast("Tỉ số không hợp lệ (VD: 2-1)", "error");
      return;
    }

    setDb((prev) => {
      const current = prev.matches[match] || { predictions: [], result: null };
      if (current.result) {
        showToast("Trận này đã kết thúc!", "error");
        return prev;
      }
      const same = current.predictions.filter((p) => p.score === trimmedScore).length;
      if (same >= MAX_PER_SCORE) {
        showToast("Tỉ số này đã đủ 4 người chọn!", "error");
        return prev;
      }
      const next: DBState = {
        ...prev,
        matches: {
          ...prev.matches,
          [matchKey]: {
            ...current,
            predictions: [
              ...current.predictions,
              { name: trimmedName, score: trimmedScore, time: new Date().toLocaleString("vi-VN"), uid: getCurrentUser()?.uid || "" },
            ],
          },
        },
      };
      saveState(next);
      return next;
    });
    setScore("");
    showToast("✅ Đã gửi dự đoán!", "success");
  };

  const handleResult = () => {
    const trimmedResult = actualScore.trim();
    if (!trimmedResult) {
      showToast("Nhập tỉ số thật", "error");
      return;
    }
    if (!/^\d+\s*[-–:]\s*\d+$/.test(trimmedResult)) {
      showToast("Tỉ số không hợp lệ (VD: 2-1)", "error");
      return;
    }

    setDb((prev) => {
      const current = prev.matches[match] || { predictions: [], result: null };
      if (current.result) {
        showToast("Trận này đã chốt!", "error");
        return prev;
      }
      const total = current.predictions.length * fee;
      const fundPart = total * 0.1;
      const winners = current.predictions.filter((p) => p.score === trimmedResult);
      const newLeaderboard = { ...prev.leaderboard };
      let newFund = prev.globalFund + fundPart;

      if (winners.length > 0) {
        const reward = (total * 0.9) / winners.length;
        winners.forEach((w) => {
          newLeaderboard[w.name] = (newLeaderboard[w.name] || 0) + reward;
        });
        fireConfettiBurst();
        showToast(
          `🎉 ${winners.length} người trúng — mỗi người ${Math.round(reward).toLocaleString()}đ`,
          "success"
        );
      } else {
        newFund += total * 0.9;
        fireConfettiWin();
        showToast("Không ai trúng — tiền vào quỹ", "info");
      }

      const next: DBState = {
        ...prev,
        matches: {
          ...prev.matches,
          [matchKey]: { ...current, result: trimmedResult },
        },
        leaderboard: newLeaderboard,
        globalFund: newFund,
      };
      saveState(next);
      return next;
    });
    setActualScore("");
  };

  // Admin actions
  const handleDeleteMatch = (matchName: string) => {
    setConfirmAction({
      message: `Xóa trận "${matchName}"? Tất cả dự đoán và kết quả sẽ mất.`,
      onConfirm: () => {
        setDb((prev) => {
          const next = { ...prev, matches: { ...prev.matches } };
          delete next.matches[matchName];
          saveState(next);
          return next;
        });
        showToast("✅ Đã xóa trận", "success");
      },
    });
  };

  const handleResetFund = () => {
    setConfirmAction({
      message: "Reset quỹ toàn giải về 0? Hành động không thể hoàn tác.",
      onConfirm: () => {
        setDb((prev) => {
          const next = { ...prev, globalFund: 0 };
          saveState(next);
          return next;
        });
        showToast("✅ Đã reset quỹ", "success");
      },
    });
  };

  const handleResetAll = () => {
    setConfirmAction({
      message: "XÓA TẤT CẢ DỮ LIỆU? Mọi trận, dự đoán, leaderboard sẽ biến mất.",
      onConfirm: () => {
        const empty: DBState = { matches: {}, leaderboard: {}, globalFund: 0 };
        setDb(empty);
        saveState(empty);
        showToast("✅ Đã xóa toàn bộ", "success");
      },
    });
  };

  const handleLogoutAdmin = () => {
    logoutAdmin();
    setIsAdminUser(false);
    if (tab === "admin" || tab === "result") setTab("predict");
    showToast("👋 Đã đăng xuất admin", "info");
  };

  // Visible tabs based on admin status
  const visibleTabs = [
    { id: "predict" as const, label: "Dự đoán", icon: CircleDot },
    { id: "result" as const, label: "Chốt trận", icon: Lock, adminOnly: true },
    { id: "board" as const, label: "BXH", icon: Trophy },
    ...(isAdminUser ? [{ id: "admin" as const, label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 pb-8">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <ToastContainer toast={toast} onDismiss={dismissToast} />
      <PinModal
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onSuccess={() => {
          setIsAdminUser(true);
          setPinOpen(false);
          showToast("🔐 Admin mode enabled", "success");
        }}
      />

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0f1525] border border-white/[0.08] rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 text-amber-400 mb-3">
                <AlertTriangle size={18} />
                <span className="font-bold text-sm">Xác nhận</span>
              </div>
              <p className="text-sm text-slate-300 mb-5">{confirmAction.message}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-slate-300 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500/15 text-rose-400 text-sm font-semibold hover:bg-rose-500/25 transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 pt-6 sm:pt-8 pb-3 text-center px-4"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold tracking-wider uppercase">
            <Flame size={12} />
            Live World Cup 2026
          </div>
          {!isAdminUser ? (
            <button
              onClick={() => setPinOpen(true)}
              className="p-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
              title="Admin Login"
            >
              <Shield size={14} />
            </button>
          ) : (
            <button
              onClick={handleLogoutAdmin}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-semibold hover:bg-amber-500/25 transition-colors"
            >
              <ShieldCheck size={12} />
              <span>ADMIN</span>
              <LogOut size={10} />
            </button>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent">
          ⚽ Dự Đoán Tỉ Số
        </h1>
        <p className="text-slate-400 mt-1 text-xs sm:text-sm">
          Chọn trận · Dự đoán · Trúng thưởng · Giật quỹ
        </p>
      </motion.header>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 max-w-lg mx-auto px-4 mt-4"
      >
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Người chơi", val: totalPlayers, icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10" },
            { label: "Tiền trận", val: `${totalMoney.toLocaleString()}đ`, icon: Banknote, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Quỹ toàn giải", val: `${db.globalFund.toLocaleString()}đ`, icon: PiggyBank, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border border-white/[0.06] backdrop-blur-xl p-2.5 sm:p-3 text-center ${s.bg}`}>
              <div className={`${s.color} mb-1 flex justify-center`}>
                <s.icon size={14} className="sm:w-4 sm:h-4" />
              </div>
              <div className="text-sm sm:text-lg font-bold text-white">{s.val}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 max-w-lg mx-auto px-4 mt-4"
      >
        <div className="flex gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                tab === t.id ? "bg-white/10 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <t.icon size={13} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.slice(0, 3)}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 max-w-lg mx-auto px-4 mt-4 grid gap-3 sm:gap-4">
        <AnimatePresence mode="wait">
          {tab === "predict" && (
            <motion.div key="predict" initial="hidden" animate="visible" exit={{ opacity: 0, y: -8 }}>
              {/* Match card */}
              <motion.div variants={variants} custom={0}>
                <Card>
                  <CardContent>
                    <div className="flex items-center gap-2 text-amber-400 mb-3">
                      <BarChart3 size={15} />
                      <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase">Trận đấu & Vòng</span>
                    </div>
                    <FixtureSelector
                      selectedId={matchId}
                      onSelect={(id) => {
                        setMatchId(id);
                        const f = FIXTURES.find(x => x.id === id)!;
                        setRound(f.round);
                      }}
                      onRoundChange={(r) => setRound(r)}
                    />
                    <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 mt-3 mb-2.5">
                      <span className="text-xs text-slate-400">Vòng đấu</span>
                      <span className="text-sm font-semibold text-amber-400">{round}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-slate-400">Phí tham gia</span>
                      <span className="text-amber-400 font-bold">{fee.toLocaleString()}đ / người</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Predict card */}
              <motion.div variants={variants} custom={1} className="mt-3">
                <Card>
                  <CardContent>
                    <div className="flex items-center gap-2 text-cyan-400 mb-3">
                      <Send size={15} />
                      <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase">Nhập dự đoán</span>
                    </div>
                    <Input
                      placeholder="Tên của bạn"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mb-2.5"
                    />
                    <Input
                      placeholder="Tỉ số dự đoán (VD: 2-1)"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      className="mb-3"
                    />
                    <Button variant="primary" onClick={handlePredict} className="w-full">
                      <Send size={15} />
                      Gửi dự đoán
                    </Button>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 mt-2 text-center">
                      Mỗi tỉ số tối đa 4 người chọn · Chọn trước khi trận bắt đầu
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Live predictions */}
              <motion.div variants={variants} custom={2} className="mt-3">
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Clock size={15} />
                        <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase">Dự đoán trực tiếp</span>
                      </div>
                      <span className="text-[10px] sm:text-xs text-slate-400">{currentFixture.homeTeam} vs {currentFixture.awayTeam}</span>
                    </div>
                    <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
                      <AnimatePresence>
                        {matchData.predictions.map((p: { name: string; score: string; time: string }, i: number) => (
                          <motion.div
                            key={`${p.name}-${p.score}-${i}`}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 sm:px-4 py-2"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
                                {p.name[0]}
                              </div>
                              <span className="text-xs sm:text-sm font-medium">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="text-base sm:text-lg font-bold text-amber-400 font-mono">{p.score}</span>
                              <span className="text-[9px] sm:text-[10px] text-slate-500">{p.time.split(",")[1]?.trim() || p.time}</span>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {matchData.predictions.length === 0 && (
                        <p className="text-slate-500 text-xs sm:text-sm text-center py-6 italic">
                          Chưa có dự đoán nào cho trận này
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* History button */}
              <motion.button
                variants={variants}
                custom={3}
                onClick={() => setHistoryOpen(true)}
                className="w-full mt-3 rounded-2xl border border-white/[0.08] backdrop-blur-xl bg-[rgba(17,25,40,0.5)] p-3 text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={14} />
                Xem lịch sử các trận
                <ChevronRight size={14} />
              </motion.button>
            </motion.div>
          )}

          {tab === "result" && (
            <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {!isAdminUser ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Lock size={32} className="mx-auto mb-3 text-slate-500" />
                    <p className="text-slate-400 text-sm mb-4">Chỉ admin mới có thể chốt trận</p>
                    <Button variant="primary" onClick={() => setPinOpen(true)} className="mx-auto">
                      <Shield size={15} />
                      Đăng nhập Admin
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent>
                    <div className="flex items-center gap-2 text-rose-400 mb-3">
                      <Lock size={15} />
                      <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase">Chốt kết quả</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl p-3 mb-4 text-xs sm:text-sm space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Trận</span>
                        <span className="font-medium">{currentFixture.homeTeam} vs {currentFixture.awayTeam}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vòng</span>
                        <span className="font-medium">{round}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Người chơi</span>
                        <span className="font-medium">{totalPlayers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tổng tiền</span>
                        <span className="text-amber-400 font-bold">{totalMoney.toLocaleString()}đ</span>
                      </div>
                    </div>
                    {matchData.result ? (
                      <div className="text-center py-4 sm:py-6">
                        <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono mb-1">{matchData.result}</div>
                        <div className="text-xs sm:text-sm text-slate-400">Trận đã chốt · Kết quả chính thức</div>
                      </div>
                    ) : (
                      <>
                        <Input
                          placeholder="Nhập tỉ số thật (VD: 3-1)"
                          value={actualScore}
                          onChange={(e) => setActualScore(e.target.value)}
                          className="mb-3 focus:border-rose-500/50"
                        />
                        <Button variant="danger" onClick={handleResult} className="w-full">
                          <Lock size={15} />
                          Chốt trận & Phân thưởng
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {tab === "board" && (
            <motion.div key="board" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 text-amber-400 mb-4">
                    <Trophy size={16} />
                    <span className="text-xs sm:text-sm font-bold tracking-wider uppercase">Bảng xếp hạng</span>
                  </div>
                  <div className="grid gap-2">
                    <AnimatePresence>
                      {sortedBoard.map(([name, money], i) => (
                        <motion.div
                          key={name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`flex items-center justify-between rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border ${
                            i === 0
                              ? "bg-amber-500/10 border-amber-500/20"
                              : i === 1
                              ? "bg-slate-400/10 border-slate-400/20"
                              : i === 2
                              ? "bg-orange-700/10 border-orange-700/20"
                              : "bg-white/[0.03] border-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                                i === 0
                                  ? "bg-amber-500 text-black"
                                  : i === 1
                                  ? "bg-slate-300 text-black"
                                  : i === 2
                                  ? "bg-orange-600 text-white"
                                  : "bg-white/10 text-slate-300"
                              }`}
                            >
                              {i + 1}
                            </div>
                            <span className="font-medium text-xs sm:text-sm">{name}</span>
                          </div>
                          <span className="font-bold text-emerald-400 text-xs sm:text-sm">{Math.round(money).toLocaleString()}đ</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {sortedBoard.length === 0 && (
                      <p className="text-slate-500 text-xs sm:text-sm text-center py-6 italic">
                        Chưa có ai trúng thưởng · Hãy là người đầu tiên! 🎯
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {tab === "admin" && isAdminUser && (
            <motion.div key="admin" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {/* Match management */}
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 text-amber-400 mb-4">
                    <ShieldCheck size={16} />
                    <span className="text-xs sm:text-sm font-bold tracking-wider uppercase">Quản lý trận đấu</span>
                  </div>
                  <div className="grid gap-2 max-h-72 overflow-y-auto">
                    {Object.entries(db.matches).length === 0 && (
                      <p className="text-slate-500 text-xs text-center py-4">Chưa có trận nào</p>
                    )}
                    {Object.entries(db.matches).map(([matchName, m]) => (
                      <div key={matchName} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
                        <div>
                          <div className="text-sm font-medium">{matchName}</div>
                          <div className="text-[10px] text-slate-400">
                            {m.predictions.length} dự đoán · {m.result ? `Kết quả: ${m.result}` : "Đang mở"}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMatch(matchName)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Xóa trận"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Danger zone */}
              <Card className="mt-3 border-rose-500/20">
                <CardContent>
                  <div className="flex items-center gap-2 text-rose-400 mb-4">
                    <AlertTriangle size={16} />
                    <span className="text-xs sm:text-sm font-bold tracking-wider uppercase">Vùng nguy hiểm</span>
                  </div>
                  <div className="grid gap-2">
                    <button
                      onClick={handleResetFund}
                      className="flex items-center gap-2 w-full py-2.5 px-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-400 text-sm hover:bg-rose-500/10 transition-colors"
                    >
                      <RotateCcw size={14} />
                      Reset quỹ toàn giải về 0
                    </button>
                    <button
                      onClick={handleResetAll}
                      className="flex items-center gap-2 w-full py-2.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm hover:bg-rose-500/20 transition-colors"
                    >
                      <Trash2 size={14} />
                      XÓA TẤT CẢ DỮ LIỆU
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} matches={db.matches} />

      <div className="relative z-10 text-center text-[10px] sm:text-xs text-slate-600 mt-6 pb-4">
        World Cup Prediction · Vite + React + Firebase · 2026
      </div>
    </div>
  );
}
