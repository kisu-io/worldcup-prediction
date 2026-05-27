import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Clock,
  MapPin,
  Users,
  Banknote,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ToastContainer, useToast } from "../components/toast";
import { BottomNav } from "../components/bottom-nav";
import { FIXTURES, getMatchLabel, ROUND_FEES } from "../lib/schedule";
import { syncAppState, saveState, getCurrentUserId } from "../lib/store";
import type { DBState } from "../lib/store";
import { callSubmitResult } from "../lib/admin";
import { useAuth } from "../contexts/AuthContext";

const MAX_PER_SCORE = 4;

export default function MatchBetPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const { toast, showToast, dismissToast } = useToast();

  const [db, setDb] = useState<DBState>({ matches: {}, leaderboard: {}, globalFund: 0 });
  const [name, setName] = useState(profile?.display_name || "");
  const [score, setScore] = useState("");
  const [actualScore, setActualScore] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.display_name && !name) setName(profile.display_name);
  }, [profile]);

  useEffect(() => {
    const unsub = syncAppState((state) => {
      setDb((prev) => {
        const sJSON = JSON.stringify(state);
        const pJSON = JSON.stringify(prev);
        return sJSON !== pJSON ? state : prev;
      });
    });
    return () => unsub();
  }, []);

  const fixture = FIXTURES.find((f) => f.id === matchId);

  if (!fixture) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2">Không tìm thấy trận đấu</h1>
          <Button variant="primary" onClick={() => navigate("/")} className="mt-4">
            <ArrowLeft size={15} /> Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const matchKey = getMatchLabel(fixture);
  const matchData = db.matches[matchKey] || { predictions: [], result: null };
  const fee = ROUND_FEES[fixture.round];
  const totalPlayers = matchData.predictions.length;
  const totalMoney = totalPlayers * fee;

  const isLocked = fixture.locked || matchData.result !== null;
  const matchDate = new Date(`${fixture.date}T${fixture.time}`);
  const now = new Date();
  const isPast = now >= matchDate;
  const canPredict = !isLocked && !isPast;

  const dateStr = matchDate.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = matchDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const handlePredict = () => {
    if (!canPredict) {
      showToast("Trận này đã khóa hoặc đã kết thúc", "error");
      return;
    }
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
      const current = prev.matches[matchKey] || { predictions: [], result: null };
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
              {
                name: trimmedName,
                score: trimmedScore,
                time: new Date().toLocaleString("vi-VN"),
                uid: getCurrentUserId() || "",
              },
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

  const handleResult = async () => {
    if (!isAdmin) {
      showToast("Không có quyền chốt trận", "error");
      return;
    }
    const trimmedResult = actualScore.trim();
    if (!trimmedResult) {
      showToast("Nhập tỉ số thật", "error");
      return;
    }
    if (!/^\d+\s*[-–:]\s*\d+$/.test(trimmedResult)) {
      showToast("Tỉ số không hợp lệ (VD: 2-1)", "error");
      return;
    }

    setIsSubmitting(true);
    showToast("⏳ Đang chốt trận...", "info");

    const res = await callSubmitResult(matchKey, trimmedResult, fixture.round);
    if (res.success) {
      showToast("✅ Trận đã chốt!", "success");
      setActualScore("");
    } else {
      showToast(res.error || "Chốt trận thất bại", "error");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 pb-24">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <ToastContainer toast={toast} onDismiss={dismissToast} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 pt-6 sm:pt-8 pb-3 px-4"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-3 cursor-pointer"
        >
          <ArrowLeft size={14} /> Quay lại danh sách
        </button>
      </motion.header>

      {/* Match Header Details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 max-w-lg mx-auto px-4"
      >
        <Card className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-white/[0.08]">
          <CardContent className="p-4 sm:p-5 text-center">
            <div className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-3">
              {fixture.round}{fixture.group ? ` · Bảng ${fixture.group}` : ""}
            </div>

            <div className="flex items-center justify-between my-4 sm:my-6">
              <div className="flex-1 flex flex-col items-center">
                <div className="text-lg sm:text-2xl font-extrabold text-white text-center">{fixture.homeTeam}</div>
                <div className="text-[10px] text-slate-500 mt-1">Nhà</div>
              </div>

              <div className="flex-shrink-0 px-4 sm:px-5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] mx-2">
                <span className="text-sm sm:text-base font-black text-slate-300 font-mono">VS</span>
              </div>

              <div className="flex-1 flex flex-col items-center">
                <div className="text-lg sm:text-2xl font-extrabold text-white text-center">{fixture.awayTeam}</div>
                <div className="text-[10px] text-slate-500 mt-1">Khách</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] sm:text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Clock size={11} />
                <span>{dateStr} · {timeStr}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={11} />
                <span>{fixture.venue}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="relative z-10 max-w-lg mx-auto px-4 mt-3"
      >
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Người chơi", val: totalPlayers, icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10" },
            { label: "Tiền trận", val: `${totalMoney.toLocaleString()}đ`, icon: Banknote, color: "text-amber-400", bg: "bg-amber-500/10" },
            {
              label: matchData.result ? "Kết quả" : canPredict ? "Đang nhận" : "Đã khóa",
              val: matchData.result || "",
              icon: matchData.result ? CheckCircle2 : canPredict ? Send : Lock,
              color: matchData.result ? "text-emerald-400" : canPredict ? "text-cyan-400" : "text-amber-400",
              bg: matchData.result ? "bg-emerald-500/10" : canPredict ? "bg-cyan-500/10" : "bg-amber-500/10",
            },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-white/[0.06] p-2.5 text-center ${s.bg}`}>
              <div className={`${s.color} mb-1 flex justify-center`}>
                <s.icon size={13} />
              </div>
              <div className="text-sm font-bold text-white">{s.val}</div>
              <div className="text-[10px] text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="relative z-10 max-w-lg mx-auto px-4 mt-4 space-y-3 sm:space-y-4">
        {/* Prediction Input */}
        {canPredict && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
                  Gửi dự đoán ({fee.toLocaleString()}đ)
                </Button>
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                  Mỗi tỉ số tối đa 4 người chọn
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!canPredict && !matchData.result && (
          <div className="text-center py-6 text-slate-500 text-sm">
            🔒 Trận này đã khóa, không nhận dự đoán
          </div>
        )}

        {/* Predictions List */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Users size={15} />
                <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase">Dự đoán trực tiếp</span>
              </div>
              <span className="text-[10px] text-slate-400">{totalPlayers} người đã chọn</span>
            </div>
            <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
              <AnimatePresence>
                {matchData.predictions.map((p, i) => (
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

        {/* Admin: Close Match */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="border-rose-500/20">
              <CardContent>
                <div className="flex items-center gap-2 text-rose-400 mb-3">
                  <Lock size={15} />
                  <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase">Admin · Chốt trận</span>
                </div>
                {matchData.result ? (
                  <div className="text-center py-4">
                    <div className="text-3xl font-black text-emerald-400 font-mono mb-1">{matchData.result}</div>
                    <div className="text-xs text-slate-400">Trận đã chốt · Kết quả chính thức</div>
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Nhập tỉ số thật (VD: 3-1)"
                      value={actualScore}
                      onChange={(e) => setActualScore(e.target.value)}
                      className="mb-3 focus:border-rose-500/50"
                    />
                    <Button variant="primary" onClick={handleResult} disabled={isSubmitting} className="w-full">
                      <Lock size={15} />
                      {isSubmitting ? "⏳ Đang chốt..." : "Chốt trận & Phân thưởng"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <BottomNav active="matches" />
    </div>
  );
}
