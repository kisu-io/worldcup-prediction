import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, Lock } from "lucide-react";
import { checkAdminPin, setAdmin } from "../lib/admin";

interface PinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PinModal({ open, onClose, onSuccess }: PinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (checkAdminPin(pin)) {
      setAdmin(true);
      setPin("");
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setPin("");
    }
  };

  const handleKey = (k: string) => {
    if (k === "clear") {
      setPin("");
      setError(false);
      return;
    }
    if (k === "enter") {
      handleSubmit();
      return;
    }
    if (pin.length < 4) {
      setPin((p) => p + k);
      setError(false);
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "enter"];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-[#0f1525] border border-white/[0.08] rounded-3xl p-6 text-center"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Shield size={18} />
                <span className="font-bold text-sm">Admin Access</span>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-10 h-12 rounded-xl flex items-center justify-center text-lg font-bold border ${
                    i < pin.length
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                      : "bg-white/[0.03] border-white/[0.06] text-slate-500"
                  }`}
                >
                  {i < pin.length && <Lock size={14} />}
                </div>
              ))}
            </div>

            {error && (
              <p className="text-rose-400 text-xs mb-3 animate-pulse">Mã PIN không đúng</p>
            )}

            <div className="grid grid-cols-3 gap-2">
              {keys.map((k) => (
                <button
                  key={k}
                  onClick={() => handleKey(k)}
                  className={`py-3 rounded-xl text-sm font-semibold transition-colors ${
                    k === "clear"
                      ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                      : k === "enter"
                      ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-white/[0.05] text-white hover:bg-white/10"
                  }`}
                >
                  {k === "clear" ? "XÓA" : k === "enter" ? "OK" : k}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
