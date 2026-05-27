// Client-side helpers calling Supabase Edge Functions
import { getCurrentUserId } from "./store";
import { supabase, supabaseUrl, supabaseAnonKey } from "./supabase";

const EDGE_BASE = import.meta.env.VITE_SUPABASE_EDGE_BASE || (supabaseUrl ? supabaseUrl + "/functions/v1" : "");

async function edgeCall(path: string, body: any, authToken?: string) {
  if (!EDGE_BASE) {
    throw new Error("Supabase Edge Functions chưa cấu hình.");
  }
  const resp = await fetch(`${EDGE_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken ? `Bearer ${authToken}` : `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(err || `HTTP ${resp.status}`);
  }
  return resp.json();
}

export async function activateAdmin(secret: string): Promise<{ success: boolean; error?: string }> {
  const userId = getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Chưa có phiên đăng nhập. Tải lại trang để tạo phiên mới." };
  }

  // Attempt to exchange secret for a one-time edge token (or just call directly if function checks secret inline)
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    await edgeCall("/setAdminClaim", { uid: userId, secret }, token);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Thất bại. Kiểm tra secret." };
  }
}

export async function callSubmitResult(
  matchKey: string,
  result: string,
  round: string
): Promise<{ success: boolean; error?: string }> {
  const userId = getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Chưa có phiên đăng nhập." };
  }

  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    await edgeCall("/submitResult", { matchKey, result, round }, token);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Chốt trận thất bại." };
  }
}
