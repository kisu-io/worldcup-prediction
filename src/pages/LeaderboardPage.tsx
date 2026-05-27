import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowLeft, Crown, Medal } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BottomNav } from "../components/bottom-nav";
import { syncAppState } from "../lib/store";
import type { DBState } from "../lib/store";
import { useNavigate } from "react-router-dom";

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [db, setDb] = useState<DBState>({ matches: {}, leaderboard: {}, globalFund: 0 });

  useEffect(() => {
    const unsub = syncAppState((state) => setDb(state));
    return () => unsub();
  }, []);

  const sortedBoard = useMemo(() => {
    return Object.entries(db.leaderboard).sort((a, b) => b[1] - a[1]);
  }, [db.leaderboard]);

  const getRankIcon = (i: number) => {
    if (i === 0) return <Crown size={16} className="text-amber-400" />;
    if (i === 1) return <Medal size={16} className="text-slate-300" />;
    if (i === 2) return <Medal size={16} className="text-orange-400" />;
    return <span className="text-sm font-bold text-slate-500 w-4 text-center">{i + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 pb-24">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 pt-6 sm:pt-8 pb-3 text-center px-4"
      >
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-4 flex items-center gap-1.5 text-slate-400 hover:text-white text-xs cursor-pointer"
        >
          <ArrowLeft size={14} /> Quay lại
        </button>
        <div className="flex items-center justify-center gap-2 mb-1 mt-6">
          <Trophy size={18} className="text-amber-400" />
          <span className="text-lg sm:text-xl font-bold text-white">Bảng xếp hạng</span>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm mb-3">
          {sortedBoard.length} người chơi · Quỹ {db.globalFund.toLocaleString()}đ
        </p>
      </motion.header>

      <div className="relative z-10 max-w-lg mx-auto px-4 space-y-2">
        {sortedBoard.length > 0 ? (
          sortedBoard.map(([name, money], i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card
                className={`border ${
                  i === 0
                    ? "bg-amber-500/10 border-amber-500/20"
                    : i === 1
                    ? "bg-slate-400/10 border-slate-400/20"
                    : i === 2
                    ? "bg-orange-700/10 border-orange-700/20"
                    : "bg-white/[0.03] border-white/[0.06]"
                }`}
              >
                <CardContent className="py-2.5 sm:py-3 px-3 sm:px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-5 flex justify-center">{getRankIcon(i)}</div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-xs sm:text-sm font-bold text-cyan-400">
                        {name[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-sm sm:text-base font-medium text-white">{name}</span>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-amber-400">{money.toLocaleString()}đ</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            Chưa có dữ liệu bảng xếp hạng
          </div>
        )}

        {sortedBoard.length >= 3 && (
          <div className="text-center py-4 text-[10px] text-slate-500">
            Top 3: 🥇 {sortedBoard[0]?.[0]} · 🥈 {sortedBoard[1]?.[0]} · 🥉 {sortedBoard[2]?.[0]}
          </div>
        )}
      </div>

      <BottomNav active="leaderboard" />
    </div>
  );
}
