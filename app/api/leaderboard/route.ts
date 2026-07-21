import { sql, ensureSchema } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { sanitizeProgress, levelFromXp } from "@/lib/progression";

// Family board: every explorer in the family, shown warmly and not as a
// competition. We expose only gentle, non-shaming numbers (level, story
// chapter, items) — never raw scores or a rank order that could sting.
export async function GET(req: Request) {
  const s = readSession(req);
  if (!s) return Response.json({ error: "Belum masuk" }, { status: 401 });
  await ensureSchema();
  const q = sql();
  const rows = await q`
    SELECT u.username, p.data
    FROM users u
    JOIN progress p ON p.user_id = u.id`;
  const explorers = rows.map((r) => {
    const prog = sanitizeProgress(r.data);
    return {
      username: r.username as string,
      level: levelFromXp(prog.xp),
      story: prog.storyChapter,
      items: prog.itemsCollected,
      hero: prog.lastHero,
      me: r.username === s.username,
    };
  });
  // Sort alphabetically so there is no winner/loser ladder — just the family.
  explorers.sort((a, b) => a.username.localeCompare(b.username));
  return Response.json({ explorers });
}
