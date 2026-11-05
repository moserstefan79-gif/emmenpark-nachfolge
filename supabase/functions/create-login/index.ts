// Legt für ein Mitglied ein Login mit Startpasswort an (nur Admins).
// Aufruf aus der App: supabase.functions.invoke('create-login', { body: { profile_id, reset?: true } })
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function makePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const buf = new Uint8Array(10);
  crypto.getRandomValues(buf);
  return "Emmen-" + Array.from(buf, (b) => chars[b % chars.length]).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // 1) Aufrufer prüfen: eingeloggt und Admin?
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uerr } = await caller.auth.getUser();
    if (uerr || !user) return json({ error: "Nicht angemeldet" }, 401);
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: me } = await admin.from("profiles").select("role").eq("user_id", user.id).eq("active", true).maybeSingle();
    if (me?.role !== "admin") return json({ error: "Nur Admins dürfen Logins anlegen" }, 403);

    // 2) Zielprofil laden
    const { profile_id, reset } = await req.json();
    const { data: p, error: perr } = await admin.from("profiles").select("*").eq("id", profile_id).single();
    if (perr || !p) return json({ error: "Profil nicht gefunden" }, 404);
    if (/@emmenpark\.ch$/i.test(p.email) && /^(markus\.balsiger|tom\.burkhalter|wolfgang\.aeberhard|christian\.scheuermeyer|andreas\.moser|michelle\.vonfluee|damaris\.strebel|lina\.walter|christian\.selau|stefan\.raetz)@/i.test(p.email)) {
      return json({ error: "Bitte zuerst die Platzhalter-Adresse durch die echte E-Mail ersetzen" }, 400);
    }

    const password = makePassword();
    let userId = p.user_id as string | null;

    if (!userId) {
      // existiert der Auth-User evtl. schon (z.B. per Einladung)?
      const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
      userId = list?.users.find((u) => (u.email ?? "").toLowerCase() === p.email.toLowerCase())?.id ?? null;
    }
    if (!userId) {
      const { data: created, error: cerr } = await admin.auth.admin.createUser({
        email: p.email, password, email_confirm: true, user_metadata: { full_name: p.full_name },
      });
      if (cerr) return json({ error: cerr.message }, 400);
      userId = created.user.id;
    } else {
      if (!reset) return json({ error: "Login existiert bereits – «Passwort zurücksetzen» verwenden" }, 409);
      const { error: rerr } = await admin.auth.admin.updateUserById(userId, { password });
      if (rerr) return json({ error: rerr.message }, 400);
    }
    await admin.from("profiles").update({ user_id: userId }).eq("id", profile_id);

    return json({ ok: true, email: p.email, full_name: p.full_name, password });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
