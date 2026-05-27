import { motion } from "framer-motion";
import { Clock, MapPin, Users, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import type { MatchFixture } from "../lib/schedule";
import { ROUND_FEES } from "../lib/schedule";

interface MatchCardProps {
  fixture: MatchFixture;
  status: "open" | "locked" | "closed";
  predictionCount: number;
  onClick: () => void;
}

export function MatchCard({ fixture, status, predictionCount, onClick }: MatchCardProps) {
  const statusConfig = {
    open: {
      label: "Đang mở",
      icon: ArrowRight,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    locked: {
      label: "Đã khóa",
      icon: Lock,
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      text: "text-amber-400",
      dot: "bg-amber-400",
    },
    closed: {
      label: "Đã chốt",
      icon: CheckCircle2,
      bg: "bg-slate-500/10",
      border: "border-slate-500/20",
      text: "text-slate-400",
      dot: "bg-slate-400",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const dateObj = new Date(`${fixture.date}T${fixture.time}`);
  const dateStr = dateObj.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
  const timeStr = dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const fee = ROUND_FEES[fixture.round];

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className={`${config.bg} ${config.border} group hover:border-white/10`}>
        <CardContent className="p-3 sm:p-4">
          {/* Header: round + status */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              {fixture.round}{fixture.group ? ` · Bảng ${fixture.group}` : ""}
            </span>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${config.bg} ${config.text} border ${config.border}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              <StatusIcon size={10} className="sm:w-3 sm:h-3" />
              <span className="text-[10px] sm:text-[11px] font-semibold">{config.label}</span>
            </div>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-between my-2 sm:my-3">
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="text-sm sm:text-base font-bold text-white text-center leading-tight">
                {fixture.homeTeam}
              </div>
              <div className="text-[10px] text-slate-500">(Nhà)</div>
            </div>

            <div className="flex-shrink-0 px-3 sm:px-4 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
              <span className="text-xs sm:text-sm font-black text-slate-300 font-mono">VS</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="text-sm sm:text-base font-bold text-white text-center leading-tight">
                {fixture.awayTeam}
              </div>
              <div className="text-[10px] text-slate-500">(Khách)</div>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400">
                <Clock size={11} className="sm:w-3 sm:h-3" />
                <span>{dateStr} · {timeStr}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500">
                <MapPin size={10} className="sm:w-3 sm:h-3" />
                <span className="truncate max-w-[100px]">{fixture.venue}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400">
                <Users size={11} className="sm:w-3 sm:h-3" />
                <span>{predictionCount}</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-amber-400">
                {fee.toLocaleString()}đ
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
