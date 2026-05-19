"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Badge } from "./ui/badge";

type Match = {
  predictions: { name: string; score: string; time: string }[];
  result: string | null;
};

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  matches: Record<string, Match>;
}

export function HistoryModal({ open, onClose, matches }: HistoryModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-[#0f1525] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-amber-400">
                <span className="font-bold">Lịch sử trận đấu</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 grid gap-3">
              {Object.entries(matches).length === 0 && (
                <p className="text-slate-500 text-center py-8">Chưa có trận nào được lưu</p>
              )}
              {Object.entries(matches).map(([name, match]) => (
                <div key={name} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-white text-sm">{name}</span>
                    {match.result ? (
                      <Badge variant="emerald">Đã chốt</Badge>
                    ) : (
                      <Badge variant="amber">Đang mở</Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    {match.predictions?.length || 0} dự đoán · Kết quả: {match.result || "?"}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {match.predictions?.map((p, i) => (
                      <span
                        key={i}
                        className={`text-[11px] px-2 py-1 rounded-md border ${
                          match.result && p.score === match.result
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : "bg-white/[0.03] border-white/[0.06] text-slate-400"
                        }`}
                      >
                        {p.name}: {p.score}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
