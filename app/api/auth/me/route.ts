import { readSession } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";

export async function GET(req: Request) {
  const s = readSession(req);
  if (!s) return Response.json({ user: null });
  let isParent = false;
  let dailyLimitMin = 0;
  try {
    await ensureSchema();
    const q = sql();
    const rows = await q`
      SELECT is_parent, daily_limit_min FROM users WHERE id = ${s.userId}`;
    if (rows[0]) {
      isParent = !!rows[0].is_parent;
      dailyLimitMin = (rows[0].daily_limit_min as number) ?? 0;
    }
  } catch {
    // A database hiccup must never block a child from playing.
  }
  return Response.json({
    user: { username: s.username, isParent, dailyLimitMin },
  });
}
