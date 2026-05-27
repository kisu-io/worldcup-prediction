import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }

  const body = await req.json().catch(() => ({}));
  const { uid, secret } = body;
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (!uid || !secret) {
    return new Response(JSON.stringify({ error: "Thiếu uid hoặc secret." }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SB_URL") || "https://rofwhndjmidfttszuwts.supabase.co",
    Deno.env.get("SERVICE_ROLE_KEY")!
  );

  const { data } = await supabase.auth.getUser(token);
  const callerId = data.user?.id;

  if (!callerId) {
    return new Response(JSON.stringify({ error: "Chưa đăng nhập." }), { status: 401 });
  }

  const master = Deno.env.get("ADMIN_SECRET") || "2026-admin";
  const isValidSecret = secret === master;

  const { data: existing } = await supabase.from("admins").select("user_id").eq("user_id", callerId).single();

  if (!existing && !isValidSecret) {
    return new Response(JSON.stringify({ error: "Secret không đúng." }), { status: 403 });
  }

  if (existing?.user_id !== callerId && callerId !== uid && !isValidSecret) {
    return new Response(JSON.stringify({ error: "Chỉ admin mới có thể thêm admin khác." }), { status: 403 });
  }

  await supabase.from("admins").insert({ user_id: uid });

  return new Response(JSON.stringify({ success: true, uid }), { status: 200 });
});
