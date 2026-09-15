// Browser side of the parent-only devnet purchase. The transaction is signed
// by the wallet but always SENT by us to the devnet RPC, so it can never land
// on mainnet even if the wallet happens to be set to mainnet (a devnet
// blockhash is also rejected by mainnet, a second safety net).

import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

const DEVNET = "https://api.devnet.solana.com";

interface WalletProvider {
  connect(): Promise<{ publicKey: PublicKey }>;
  signTransaction(tx: Transaction): Promise<Transaction>;
}

export function getWallet(): WalletProvider | null {
  const w = window as unknown as {
    phantom?: { solana?: WalletProvider };
    solflare?: WalletProvider;
    solana?: WalletProvider;
  };
  return w.phantom?.solana ?? w.solflare ?? w.solana ?? null;
}

export async function devnetBuy(itemId: string, onStatus: (s: string) => void): Promise<string[]> {
  const info = (await fetch("/api/shop/devnet").then((r) => r.json())) as {
    treasury: string;
    items: { id: string; lamports: number }[];
  };
  const item = info.items.find((i) => i.id === itemId);
  if (!item) throw new Error("unknown-item");
  const wallet = getWallet();
  if (!wallet) throw new Error("no-wallet");
  onStatus("connect");
  const { publicKey } = await wallet.connect();
  const conn = new Connection(DEVNET, "confirmed");
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
  const tx = new Transaction({ feePayer: publicKey, blockhash, lastValidBlockHeight }).add(
    SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(info.treasury), lamports: item.lamports })
  );
  onStatus("sign");
  const signed = await wallet.signTransaction(tx);
  onStatus("send");
  const sig = await conn.sendRawTransaction(signed.serialize());
  await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  onStatus("verify");
  const r = await fetch("/api/shop/devnet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signature: sig, itemId }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "verify-failed");
  onStatus("done:" + sig);
  return j.devnet as string[];
}
