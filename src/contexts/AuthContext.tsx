import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: "user" | "admin";
  total_points: number;
  total_predictions: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REDIRECT_URL = "https://kisu-io.github.io/worldcup-prediction/";

const PROFILE_KEY = "wc2026_profile_cache";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const cached = localStorage.getItem(PROFILE_KEY);
      if (cached) return JSON.parse(cached) as Profile;
    } catch { /* ignore */ }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = profile?.role === "admin";

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .single();

      if (error) {
        console.warn("Failed to fetch profile:", error);
        return false;
      }
      setProfile(data as Profile);
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
      return true;
    } catch (err) {
      console.error("fetchProfile exception:", err);
      return false;
    }
  };

  useEffect(() => {
    // Fallback: force exit loading after 5s (prevents infinite spinner)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error("Auth init failed:", err);
      } finally {
        setIsLoading(false);
        clearTimeout(timer);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: REDIRECT_URL,
      },
    });
    if (error) return { error: error.message };
    
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: displayName,
        email: email,
        role: "user",
        total_points: 0,
        total_predictions: 0,
      }, { onConflict: "id" });
      await fetchProfile(data.user.id);
    }
    return {};
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: REDIRECT_URL,
    });
    return { error: error?.message };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
    setUser(null);
    setProfile(null);
    try { localStorage.removeItem(PROFILE_KEY); } catch { /* ignore */ }
    window.location.assign("https://kisu-io.github.io/worldcup-prediction/");
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, isAdmin, signIn, signUp, resetPassword, updatePassword, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
