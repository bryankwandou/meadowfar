import bcrypt from "bcryptjs";
import { sql, ensureSchema } from "@/lib/db";
import { createSessionCookie } from "@/lib/auth";
import { defaultProgress } from "@/lib/progression";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const username = String(body.username || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const confirm = String(body.confirm || "");

  if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(username))
    return Response.json(
      { error: "Nama pengguna 3-24 huruf, angka, titik, garis bawah, atau strip" },
      { status: 400 }
    );
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return Response.json({ error: "Alamat email tidak valid" }, { status: 400 });
  if (password.length < 8)
    return Response.json({ error: "Kata sandi minimal 8 karakter" }, { status: 400 });
  if (password !== confirm)
    return Response.json({ error: "Konfirmasi kata sandi tidak cocok" }, { status: 400 });
  if (body.agreeTerms !== true || body.agreePrivacy !== true)
    return Response.json(
      { error: "Centang persetujuan syarat & ketentuan dan kebijakan privasi" },
      { status: 400 }
    );

  await ensureSchema();
  const q = sql();
  const hash = await bcrypt.hash(password, 10);
  try {
    const rows = await q`
      INSERT INTO users (username, username_lower, email, password_hash)
      VALUES (${username}, ${username.toLowerCase()}, ${email}, ${hash})
      RETURNING id, username`;
    const user = rows[0];
    await q`INSERT INTO progress (user_id, data)
      VALUES (${user.id}, ${JSON.stringify(defaultProgress())}::jsonb)`;
    return Response.json(
      { ok: true, username: user.username },
      { headers: { "Set-Cookie": createSessionCookie(user.id, user.username) } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("users_username") )
      return Response.json({ error: "Nama pengguna sudah dipakai" }, { status: 409 });
    if (msg.includes("users_email"))
      return Response.json({ error: "Email sudah terdaftar" }, { status: 409 });
    console.error("register error:", e);
    return Response.json({ error: "Terjadi kendala di server, coba lagi" }, { status: 500 });
  }
}
