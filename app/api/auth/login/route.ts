import bcrypt from "bcryptjs";
import { sql, ensureSchema } from "@/lib/db";
import { createSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!username || !password)
    return Response.json({ error: "Isi nama pengguna dan kata sandi" }, { status: 400 });

  await ensureSchema();
  const q = sql();
  const rows = await q`
    SELECT id, username, password_hash FROM users
    WHERE username_lower = ${username.toLowerCase()} OR email = ${username.toLowerCase()}
    LIMIT 1`;
  const user = rows[0];
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok)
    return Response.json(
      { error: "Nama pengguna atau kata sandi salah" },
      { status: 401 }
    );
  return Response.json(
    { ok: true, username: user.username },
    { headers: { "Set-Cookie": createSessionCookie(user.id, user.username) } }
  );
}
