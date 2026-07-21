import { sql, ensureSchema } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { sanitizeProgress, levelFromXp } from "@/lib/progression";

// Parent-only overview of every child account, plus the daily play-time limit.
// Access is gated on users.is_parent, which is only ever set by the seed script.
async function requireParent(req: Request) {
  const s = readSession(req);
  if (!s) return null;
  await ensureSchema();
  const q = sql();
  const rows = await q`SELECT is_parent FROM users WHERE id = ${s.userId}`;
  if (!rows[0]?.is_parent) return null;
  return s;
}

export async function GET(req: Request) {
  const s = await requireParent(req);
  if (!s) return Response.json({ error: "Bukan akun orang tua" }, { status: 403 });
  const q = sql();
  const rows = await q`
    SELECT u.id, u.username, u.created_at, u.is_parent, u.daily_limit_min,
           p.data, p.updated_at
    FROM users u
    LEFT JOIN progress p ON p.user_id = u.id
    ORDER BY u.username`;
  const children = rows.map((r) => {
    const prog = sanitizeProgress(r.data);
    return {
      id: r.id as number,
      username: r.username as string,
      isParent: !!r.is_parent,
      dailyLimitMin: (r.daily_limit_min as number) ?? 0,
      level: levelFromXp(prog.xp),
      story: prog.storyChapter,
      items: prog.itemsCollected,
      quests: prog.missionsDone,
      races: prog.racesWon,
      achievements: prog.achievements.length,
      lastPlayed: r.updated_at ? new Date(r.updated_at as string).toISOString() : null,
    };
  });
  return Response.json({ children });
}

export async function PUT(req: Request) {
  const s = await requireParent(req);
  if (!s) return Response.json({ error: "Bukan akun orang tua" }, { status: 403 });
  let body: { userId?: unknown; minutes?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const userId = Number(body.userId);
  const minutes = Number(body.minutes);
  if (!Number.isInteger(userId) || userId <= 0)
    return Response.json({ error: "Anak tidak ditemukan" }, { status: 400 });
  // 0 means no limit; cap at 8 hours so a typo cannot lock a child out for days.
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 480)
    return Response.json({ error: "Batas waktu tidak masuk akal" }, { status: 400 });
  const q = sql();
  await q`UPDATE users SET daily_limit_min = ${Math.round(minutes)} WHERE id = ${userId}`;
  return Response.json({ ok: true });
}
