import { readSession } from "@/lib/auth";

export async function GET(req: Request) {
  const s = readSession(req);
  if (!s) return Response.json({ user: null });
  return Response.json({ user: { username: s.username } });
}
