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

  // Check if caller is already admin
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", callerId)
    .single();

  const isAdmin = callerProfile?.role === "admin";

  // Only admins or those with valid secret can promote
  if (!isAdmin && !isValidSecret) {
    return new Response(JSON.stringify({ error: "Secret không đúng hoặc bạn chưa phải admin." }), { status: 403 });
  }

  // Promote target user to admin
  const { error } = await supabase.from("profiles").upsert({
    id: uid,
    role: "admin",
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, uid }), { status: 200 });
});
