import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function RecoveryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updatePassword, user } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [exchanging, setExchanging] = useState(true);

  /*
    HashRouter recovery URL from Supabase:
    https://kisu-io.github.io/worldcup-prediction/#/recovery?access_token=xxx&refresh_token=yyy&type=recovery
    useSearchParams parses the query-string that lives inside the fragment.
  */
  useEffect(() => {
    if (user) return;

    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const type = searchParams.get("type");

    if (type === "recovery" && accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(() => setExchanging(false))
        .catch(() => {
          setExchanging(false);
          setError("Link đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu link mới.");
        });
    } else {
      setExchanging(false);
      setError("Link không hợp lệ hoặc đã hết hạn.");
    }
  }, [searchParams, user]);

  /* If user already has an active session, allow them to change password anyway */
  useEffect(() => {
    if (user) setExchanging(false);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await updatePassword(password);
    if (res.error) setError(res.error);
    else setDone(true);
    setLoading(false);
  };

  /* Show spinner while exchanging the recovery token */
  if (exchanging) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Đang xác thực...</p>
        </motion.div>
      </div>
    );
  }

  /* Success screen */
  if (done) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-white mb-2">Thành công!</h2>
          <p className="text-slate-400 text-sm mb-6">Mật khẩu của bạn đã được cập nhật.</p>
          <Button variant="primary" onClick={() => navigate("/login")} className="w-full">
            Đăng nhập <ArrowRight size={14} />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-4xl mb-2"
          >
            🔐
          </motion.div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent">
            Đặt lại Mật khẩu
          </h1>
          <p className="text-slate-400 text-sm mt-1">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-xs p-3 rounded-xl bg-rose-500/10 text-rose-400">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                type="password"
                placeholder="Mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                type="password"
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>

            <Button variant="primary" type="submit" disabled={loading} className="w-full">
              {loading ? "⏳..." : "Cập nhật mật khẩu"}
              {!loading && <ArrowRight size={14} />}
            </Button>
          </div>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/login")}
            className="text-slate-500 text-xs hover:text-cyan-400 transition-colors cursor-pointer"
          >
            ← Quay lại đăng nhập
          </button>
        </div>
      </motion.div>
    </div>
  );
}
