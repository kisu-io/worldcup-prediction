"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ id: Date.now().toString(), message, type });
  };
  const dismissToast = () => setToast(null);
  return { toast, showToast, dismissToast };
}

export function ToastContainer({ toast, onDismiss }: { toast: Toast | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl border backdrop-blur-md w-[90vw] max-w-sm text-center ${
            toast.type === "error"
              ? "bg-red-500/20 border-red-500/30 text-red-200"
              : toast.type === "success"
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-200"
              : "bg-cyan-500/20 border-cyan-500/30 text-cyan-200"
          }`}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
