import { sql, ensureSchema } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { sanitizeProgress, defaultProgress } from "@/lib/progression";

export async function GET(req: Request) {
  const s = readSession(req);
  if (!s) return Response.json({ error: "Belum masuk" }, { status: 401 });
  await ensureSchema();
  const q = sql();
  const rows = await q`SELECT data FROM progress WHERE user_id = ${s.userId}`;
  const data = rows[0] ? sanitizeProgress(rows[0].data) : defaultProgress();
  return Response.json({ progress: data });
}

export async function PUT(req: Request) {
  const s = readSession(req);
  if (!s) return Response.json({ error: "Belum masuk" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const clean = sanitizeProgress(body);
  await ensureSchema();
  const q = sql();
  await q`
    INSERT INTO progress (user_id, data, updated_at)
    VALUES (${s.userId}, ${JSON.stringify(clean)}::jsonb, now())
    ON CONFLICT (user_id)
    DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  return Response.json({ ok: true });
}
