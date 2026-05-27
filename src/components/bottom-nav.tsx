import { Trophy, Calendar, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

interface BottomNavProps {
  active: "matches" | "leaderboard" | "account";
}

const NAV_ITEMS = [
  { id: "matches" as const, label: "Trận đấu", icon: Calendar, path: "/" },
  { id: "leaderboard" as const, label: "BXH", icon: Trophy, path: "/leaderboard" },
  { id: "account" as const, label: "Tài khoản", icon: User, path: "/account" },
];

export function BottomNav({ active }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-lg mx-auto">
        <div className="mx-4 mb-4 rounded-2xl bg-[#111928]/95 backdrop-blur-xl border border-white/[0.06] px-3 py-2">
          <div className="flex items-center justify-around">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    isActive ? "text-cyan-400" : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute bottom-1 w-6 h-0.5 bg-cyan-400 rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon size={18} className={isActive ? "text-cyan-400" : ""} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
