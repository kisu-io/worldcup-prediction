import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";

type Mode = "login" | "register" | "forgot";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "login") {
      const res = await signIn(email, password);
      if (res.error) setError(res.error);
      else navigate("/");
    } else if (mode === "register") {
      if (!displayName.trim()) {
        setError("Nhập tên hiển thị");
        setLoading(false);
        return;
      }
      const res = await signUp(email, password, displayName.trim());
      if (res.error) setError(res.error);
      else {
        setMode("login");
        setError("Đăng ký thành công! Vui lòng đăng nhập.");
      }
    } else if (mode === "forgot") {
      if (!email.trim()) {
        setError("Nhập email của bạn");
        setLoading(false);
        return;
      }
      const res = await resetPassword(email.trim());
      if (res.error) setError(res.error);
      else {
        setMode("login");
        setError("✅ Đã gửi link đặt lại mật khẩu! Kiểm tra email.");
      }
    }
    setLoading(false);
  };

  const isError = error.length > 0 && !error.includes("thành công") && !error.includes("✅");
  const isSuccess = error.includes("thành công") || error.includes("✅");

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
          >⚽</motion.div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent">
            Dự Đoán Tỉ Số
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {mode === "login" && "Đăng nhập để tham gia"}
            {mode === "register" && "Tạo tài khoản mới"}
            {mode === "forgot" && "Nhận link đặt lại mật khẩu"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-4">
            {error && (
              <div className={`flex items-center gap-2 text-xs p-3 rounded-xl ${
                isSuccess ? "bg-emerald-500/10 text-emerald-400" : isError ? "bg-rose-500/10 text-rose-400" : ""
              }`}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {mode === "register" && (
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Tên hiển thị"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10"
                  maxLength={30}
                />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            {mode !== "forgot" && (
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  type="password"
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required={true}
                  minLength={6}
                />
              </div>
            )}

            <Button variant="primary" type="submit" disabled={loading} className="w-full">
              {loading ? "⏳..." : mode === "forgot" ? "Gửi link" : mode === "login" ? "Đăng nhập" : "Đăng ký"}
              {!loading && <ArrowRight size={14} />}
            </Button>
          </div>
        </form>

        <div className="text-center mt-4 space-y-2">
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setPassword(""); }}
            className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors cursor-pointer"
          >
            {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
          </button>

          {mode === "login" && (
            <button
              onClick={() => { setMode("forgot"); setError(""); setPassword(""); }}
              className="block w-full text-slate-500 text-xs hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Quên mật khẩu?
            </button>
          )}
          {mode === "forgot" && (
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className="block w-full text-slate-500 text-xs hover:text-cyan-400 transition-colors cursor-pointer"
            >
              ← Quay lại đăng nhập
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
