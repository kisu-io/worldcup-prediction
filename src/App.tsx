import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import MatchListPage from "./pages/MatchListPage";
import MatchBetPage from "./pages/MatchBetPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import RecoveryPage from "./pages/RecoveryPage";

export default function App() {
  /*
    Supabase redirects with ?access_token=&type=recovery appended to the URL.
    Since we use HashRouter, those query params live OUTSIDE the fragment.
    Intercept them here, move them inside the hash, and reload cleanly.
  */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");
    const refreshToken = urlParams.get("refresh_token");
    const type = urlParams.get("type");

    if ((type === "recovery" || type === "signup") && accessToken) {
      const hashParams = new URLSearchParams();
      hashParams.set("access_token", accessToken);
      if (refreshToken) hashParams.set("refresh_token", refreshToken);
      hashParams.set("type", type);
      window.location.replace(
        window.location.origin + window.location.pathname + "#/recovery?" + hashParams.toString()
      );
    }
  }, []);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recovery" element={<RecoveryPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MatchListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/match/:matchId"
          element={
            <ProtectedRoute>
              <MatchBetPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MatchListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </AuthProvider>
  );
}
