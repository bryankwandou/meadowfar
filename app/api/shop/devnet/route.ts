// Parent-only Solana DEVNET purchase. Devnet SOL has no monetary value; this
// exists so a family can see a real on-chain purchase flow without real money.
// The server never trusts the client: it re-reads the transaction from a
// devnet RPC and checks the transfer, amount and destination before granting.

import { sql, ensureSchema } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { COSMETICS } from "@/lib/catalog";
import { sanitizeProgress } from "@/lib/progression";

const TREASURY =
  process.env.DEVNET_TREASURY || "Hh158zcS5RJGgf4hs652rV2RwkPiNBGfJoYQhgFKEDnX";
const RPC = process.env.DEVNET_RPC || "https://api.devnet.solana.com";

export async function GET() {
  return Response.json({
    cluster: "devnet",
    treasury: TREASURY,
    items: COSMETICS.filter((c) => c.devnetLamports).map((c) => ({
      id: c.id,
      lamports: c.devnetLamports,
    })),
  });
}

interface ParsedIx {
  program?: string;
  parsed?: { type?: string; info?: { source?: string; destination?: string; lamports?: number } };
}

export async function POST(req: Request) {
  const s = readSession(req);
  if (!s) return Response.json({ error: "login" }, { status: 401 });
  let body: { signature?: unknown; itemId?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const signature = typeof body.signature === "string" ? body.signature : "";
  const itemId = typeof body.itemId === "string" ? body.itemId : "";
  const def = COSMETICS.find((c) => c.id === itemId && c.devnetLamports);
  if (!def || !/^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(signature))
    return Response.json({ error: "bad-request" }, { status: 400 });

  await ensureSchema();
  const q = sql();
  const u = await q`SELECT is_parent FROM users WHERE id = ${s.userId}`;
  if (!u[0]?.is_parent) return Response.json({ error: "parent-only" }, { status: 403 });
  await q`CREATE TABLE IF NOT EXISTS devnet_receipts (
    signature TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    lamports BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  const used = await q`SELECT 1 FROM devnet_receipts WHERE signature = ${signature}`;
  if (used.length) return Response.json({ error: "already-used" }, { status: 409 });

  // Confirmation can lag a few seconds behind the wallet, so retry briefly.
  let tx: { meta?: { err: unknown }; transaction?: { message?: { instructions?: ParsedIx[] } } } | null = null;
  for (let i = 0; i < 6 && !tx; i++) {
    const r = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [signature, { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 }],
      }),
    }).then((x) => x.json()).catch(() => null);
    tx = r?.result ?? null;
    if (!tx) await new Promise((res) => setTimeout(res, 1500));
  }
  if (!tx) return Response.json({ error: "not-found" }, { status: 404 });
  if (tx.meta?.err) return Response.json({ error: "tx-failed" }, { status: 400 });
  const paid = (tx.transaction?.message?.instructions ?? []).some(
    (ix) =>
      ix.program === "system" &&
      ix.parsed?.type === "transfer" &&
      ix.parsed.info?.destination === TREASURY &&
      (ix.parsed.info?.lamports ?? 0) >= (def.devnetLamports ?? Infinity)
  );
  if (!paid) return Response.json({ error: "wrong-transfer" }, { status: 400 });

  await q`INSERT INTO devnet_receipts (signature, user_id, item_id, lamports)
          VALUES (${signature}, ${s.userId}, ${def.id}, ${def.devnetLamports})`;
  const rows = await q`SELECT data FROM progress WHERE user_id = ${s.userId}`;
  const p = sanitizeProgress(rows[0]?.data);
  p.devnet = [...new Set([...p.devnet, def.id])];
  await q`
    INSERT INTO progress (user_id, data, updated_at)
    VALUES (${s.userId}, ${JSON.stringify(p)}::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  return Response.json({ ok: true, item: def.id, devnet: p.devnet });
}
