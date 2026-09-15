"use client";

// The in-game menu: one place for every button, reachable with a tap, a click,
// Esc/Tab on a keyboard or Start on a gamepad. Works in portrait and landscape.

import { useState } from "react";
import AvatarPreview from "./AvatarPreview";
import Thumb from "./Thumb";
import { COSMETICS, ITEMS, RECIPES, SLOTS, MAX_HEARTS, canCraft, type Slot } from "@/lib/catalog";
import {
  ACHIEVEMENTS, DECORS, PETS, SKILLS, TOOLS, levelFromXp,
  type GameMode, type HeroId, type Progress,
} from "@/lib/progression";
import { STORY } from "@/lib/story";
import { pick, type Lang } from "@/lib/i18n";
import { PRESETS, PRESET_LABEL, PRESET_ORDER, type Controls, type Gfx } from "@/lib/game/gfx";
import { EMOTES, type EmoteId } from "@/lib/game/net";
import type { Equip } from "@/lib/game/avatar";

export type MenuTab = "play" | "wardrobe" | "bag" | "together" | "book" | "home" | "settings";

export interface RoomUi {
  status: "none" | "connecting" | "open" | "error" | "closed";
  code: string;
  isHost: boolean;
  ping: number;
  players: { id: string; name: string }[];
  error: string;
}

export const EMOTE_TEXT: Record<EmoteId, { id: string; en: string }> = {
  hello: { id: "Halo!", en: "Hello!" },
  yay: { id: "Hore!", en: "Yay!" },
  follow: { id: "Ikuti aku", en: "Follow me" },
  thanks: { id: "Terima kasih", en: "Thank you" },
  look: { id: "Lihat ini", en: "Look here" },
};

const SLOT_NAMES: Record<Slot, { id: string; en: string }> = {
  hat: { id: "Kepala", en: "Head" },
  outfit: { id: "Baju", en: "Outfit" },
  cape: { id: "Jubah", en: "Cape" },
  shoes: { id: "Sepatu", en: "Shoes" },
  back: { id: "Punggung", en: "Back" },
};


export function Coin({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#f5c542" stroke="#b8860b" strokeWidth="1.5" />
      <path d="M10 5.2l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5z" fill="#fff3c4" />
    </svg>
  );
}

export function Heart({ full }: { full: boolean }) {
  return (
    <svg viewBox="0 0 24 22" className="h-6 w-6 drop-shadow" aria-hidden>
      <path
        d="M12 21s-9-5.6-9-12A5 5 0 0 1 12 6a5 5 0 0 1 9 3c0 6.4-9 12-9 12z"
        fill={full ? "#ff4d6d" : "rgba(255,255,255,0.25)"}
        stroke="#fff"
        strokeWidth="1.6"
      />
    </svg>
  );
}

interface Props {
  lang: Lang;
  tab: MenuTab;
  setTab: (t: MenuTab) => void;
  onClose: () => void;
  prog: Progress;
  hero: HeroId;
  user: string | null;
  isParent: boolean;
  mode: GameMode;
  setMode: (m: GameMode) => void;
  onBuy: (id: string) => void;
  onEquip: (slot: Slot, id: string) => void;
  onDevnetBuy: (id: string) => void;
  devnetStatus: string;
  onBuyItem: (id: string) => void;
  onUseItem: (id: string) => void;
  onCraft: (recipeId: string) => void;
  hearts: number;
  onToggleDecor: (id: string) => void;
  onGoHome: () => void;
  onChoosePet: (id: string) => void;
  room: RoomUi;
  onHost: () => void;
  onJoin: (code: string) => void;
  onLeave: () => void;
  onEmote: (e: EmoteId) => void;
  gfx: Gfx;
  setGfx: (g: Gfx) => void;
  controls: Controls;
  setControls: (c: Controls) => void;
  musicOn: boolean;
  toggleMusic: () => void;
  volume: number;
  setVolume: (v: number) => void;
  toggleLang: () => void;
  onPhoto: () => void;
  onChangeHero: () => void;
  gamepad: string;
}

export default function Menu(p: Props) {
  const L = (id: string, en: string) => pick(p.lang, id, en);
  const [slot, setSlot] = useState<Slot>("hat");
  const [tryOn, setTryOn] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const level = levelFromXp(p.prog.xp);
  const wearable = new Set([...p.prog.owned, ...p.prog.devnet]);
  const previewEquip: Equip = { ...p.prog.equip };
  if (tryOn) {
    const d = COSMETICS.find((c) => c.id === tryOn);
    if (d) previewEquip[d.slot] = d.id;
  }

  const tabs: { id: MenuTab; label: string }[] = [
    { id: "play", label: L("Main", "Play") },
    { id: "wardrobe", label: L("Lemari", "Wardrobe") },
    { id: "bag", label: L("Tas", "Inventory") },
    { id: "together", label: L("Main bareng", "Together") },
    { id: "book", label: L("Buku", "Book") },
    { id: "home", label: L("Rumah", "Home") },
    { id: "settings", label: L("Pengaturan", "Settings") },
  ];

  const toggle = (on: boolean, set: (v: boolean) => void, label: string, testid?: string) => (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => set(!on)}
        data-testid={testid}
        className={`relative h-6 w-11 rounded-full transition ${on ? "bg-emerald-600" : "bg-emerald-200"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-5" : "left-0.5"}`} />
      </button>
    </label>
  );

  const setG = (patch: Partial<Gfx>) => p.setGfx({ ...p.gfx, ...patch, preset: "custom" });

  return (
    <div className="absolute inset-0 z-30 flex items-stretch justify-center bg-black/55 p-2 backdrop-blur-sm sm:items-center sm:p-4" data-testid="game-menu">
      <div className="menu-pop flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white text-emerald-950 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-emerald-100 px-4 py-3">
          <h2 className="text-lg font-bold">{L("Menu", "Menu")}</h2>
          <span className="ml-2 flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
            <Coin /> {p.prog.coins}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold">Lv {level}</span>
          <button onClick={p.onClose} className="ml-auto rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white" data-testid="menu-close">
            {L("Lanjut main", "Resume")}
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-emerald-100 px-2 py-2" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={p.tab === t.id}
              onClick={() => p.setTab(t.id)}
              data-testid={`tab-${t.id}`}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                p.tab === t.id ? "bg-emerald-600 text-white" : "text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {p.tab === "play" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{L("Mode permainan", "Game mode")}</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(["casual", "adventure"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => p.setMode(m)}
                      data-testid={`mode-${m}`}
                      className={`rounded-2xl border-2 p-4 text-left transition ${
                        p.mode === m ? "border-emerald-600 bg-emerald-50" : "border-emerald-100 hover:border-emerald-300"
                      }`}
                    >
                      <p className="font-bold">{m === "casual" ? L("Santai", "Casual") : L("Petualangan", "Adventure")}</p>
                      <p className="mt-1 text-sm text-emerald-800">
                        {m === "casual"
                          ? L("Tanpa nyawa, tidak bisa kalah. Jelajah sepuasnya.", "No health, no way to lose. Explore at your own pace.")
                          : L(`${MAX_HEARTS} hati, slime yang suka menyenggol, tiup gelembung untuk meletuskannya. Pingsan = bangun di rumah, progres aman.`, `${MAX_HEARTS} hearts, bumpy slimes, and a bubble wand to pop them. Faint and you wake up at home with nothing lost.`)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button onClick={p.onPhoto} className="rounded-xl border border-emerald-200 px-3 py-3 text-sm font-semibold hover:bg-emerald-50">{L("Mode foto", "Photo mode")}</button>
                <button onClick={p.onGoHome} className="rounded-xl border border-emerald-200 px-3 py-3 text-sm font-semibold hover:bg-emerald-50">{L("Ke rumah pohon", "Go to tree house")}</button>
                <button onClick={p.onChangeHero} className="rounded-xl border border-emerald-200 px-3 py-3 text-sm font-semibold hover:bg-emerald-50">{L("Ganti tokoh", "Change character")}</button>
                <a href="/keluarga" className="rounded-xl border border-emerald-200 px-3 py-3 text-center text-sm font-semibold hover:bg-emerald-50">{L("Papan keluarga", "Family board")}</a>
                {p.isParent && <a href="/orangtua" className="rounded-xl border border-violet-200 px-3 py-3 text-center text-sm font-semibold text-violet-800 hover:bg-violet-50">{L("Dasbor orang tua", "Parent dashboard")}</a>}
                {!p.user && <a href="/daftar" className="rounded-xl bg-emerald-600 px-3 py-3 text-center text-sm font-semibold text-white">{L("Buat akun", "Create account")}</a>}
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm leading-relaxed">
                <h3 className="font-semibold">{L("Kontrol", "Controls")}</h3>
                <p className="mt-1"><b>{L("Keyboard", "Keyboard")}:</b> WASD {L("jalan", "move")} · {L("mouse / geser", "mouse drag")} {L("kamera", "camera")} · Space {L("lompat", "jump")} · Shift {L("lari", "run")} · E {L("bicara", "talk")} · F {L("gelembung", "bubble")} · Q item · V {L("kamera 1/3", "1st/3rd person")} · Esc menu</p>
                <p className="mt-1"><b>Gamepad:</b> {L("stik kiri jalan, stik kanan kamera", "left stick move, right stick camera")} · A {L("lompat", "jump")} · B {L("lari", "run")} · X {L("gelembung", "bubble")} · Y {L("bicara", "talk")} · LB item · RB/R3 {L("kamera", "view")} · Start menu</p>
                <p className="mt-1"><b>{L("Layar sentuh", "Touch")}:</b> {L("stik muncul di bawah jempol kiri, geser sisi kanan untuk kamera", "the stick appears under your left thumb, drag the right side to look around")}</p>
                <p className="mt-1 text-emerald-700">{p.gamepad ? L(`Gamepad terhubung: ${p.gamepad}`, `Gamepad connected: ${p.gamepad}`) : L("Belum ada gamepad. Colok atau tekan tombol apa saja di gamepad.", "No gamepad yet. Plug one in or press any button on it.")}</p>
              </div>
            </div>
          )}

          {p.tab === "wardrobe" && (
            <div className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
              <div className="rounded-2xl bg-gradient-to-b from-sky-100 to-emerald-50">
                <AvatarPreview hero={p.hero} equip={previewEquip} />
                <p className="px-3 pb-3 text-center text-xs text-emerald-700">
                  {tryOn ? L("Sedang dicoba. Beli atau pakai untuk menyimpan.", "Trying it on. Buy or wear it to keep.") : L("Pilih barang untuk dicoba.", "Pick an item to try it on.")}
                </p>
              </div>
              <div>
                <div className="flex flex-wrap gap-1">
                  {SLOTS.map((s) => (
                    <button key={s} onClick={() => { setSlot(s); setTryOn(null); }} className={`rounded-full px-3 py-1 text-xs font-semibold ${slot === s ? "bg-emerald-600 text-white" : "bg-emerald-50"}`} data-testid={`slot-${s}`}>
                      {pick(p.lang, SLOT_NAMES[s].id, SLOT_NAMES[s].en)}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {COSMETICS.filter((c) => c.slot === slot).map((c) => {
                    const owned = wearable.has(c.id);
                    const worn = p.prog.equip[slot] === c.id;
                    return (
                      <div
                        key={c.id}
                        onMouseEnter={() => setTryOn(c.id)}
                        className={`rounded-2xl border-2 p-2 text-center transition ${worn ? "border-emerald-600 bg-emerald-50" : "border-emerald-100"} ${tryOn === c.id ? "ring-2 ring-sky-300" : ""}`}
                        data-testid={`cos-${c.id}`}
                      >
                        <button
                          onClick={() => setTryOn(c.id)}
                          className={`mx-auto block rounded-xl bg-gradient-to-b from-sky-50 to-emerald-50 ${c.glow ? "ring-2 ring-cyan-200" : ""}`}
                          aria-label={`${L("Coba", "Try on")}: ${pick(p.lang, c.nama, c.namaEn)}`}
                        >
                          <Thumb kind="cosmetic" id={c.id} hero={p.hero} alt={pick(p.lang, c.nama, c.namaEn)} className="h-20 w-20" />
                        </button>
                        <p className="mt-1 text-xs font-semibold leading-tight">{pick(p.lang, c.nama, c.namaEn)}</p>
                        {c.devnetLamports && <p className="text-[10px] font-semibold text-violet-700">Solana devnet</p>}
                        {owned ? (
                          <button onClick={() => p.onEquip(slot, c.id)} disabled={worn} className={`mt-1 w-full rounded-lg px-2 py-1 text-xs font-semibold ${worn ? "bg-emerald-600 text-white" : "bg-emerald-100"}`}>
                            {worn ? L("Dipakai", "Wearing") : L("Pakai", "Wear")}
                          </button>
                        ) : c.devnetLamports ? (
                          p.isParent ? (
                            <button onClick={() => p.onDevnetBuy(c.id)} className="mt-1 w-full rounded-lg bg-violet-600 px-2 py-1 text-[11px] font-semibold text-white" data-testid={`devnet-${c.id}`}>
                              {(c.devnetLamports / 1e9).toFixed(2)} devnet SOL
                            </button>
                          ) : (
                            <p className="mt-1 text-[10px] text-violet-700">{L("Khusus akun orang tua", "Parent account only")}</p>
                          )
                        ) : (
                          <button onClick={() => p.onBuy(c.id)} className={`mt-1 flex w-full items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${p.prog.coins >= c.price ? "bg-amber-400 text-amber-950" : "bg-amber-100 text-amber-800/60"}`} data-testid={`buy-${c.id}`}>
                            <Coin className="h-3.5 w-3.5" /> {c.price}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {p.isParent && (
                  <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900">
                    <p className="font-semibold">{L("Pembelian uji Solana devnet (orang tua)", "Solana devnet test purchase (parents)")}</p>
                    <p className="mt-1">{L("Devnet adalah jaringan uji: SOL-nya tidak bernilai uang. Butuh dompet Solana (mis. Phantom) dengan saldo devnet. Transaksi diverifikasi di server sebelum barang diberikan.", "Devnet is a test network: its SOL has no money value. You need a Solana wallet (for example Phantom) with devnet balance. The server checks the transaction on devnet before granting the item.")}</p>
                    {p.devnetStatus && <p className="mt-1 break-all font-mono" data-testid="devnet-status">{p.devnetStatus}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {p.tab === "bag" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{L("Hati", "Hearts")}</span>
                {Array.from({ length: MAX_HEARTS }, (_, i) => <Heart key={i} full={i < p.hearts} />)}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {ITEMS.map((it) => {
                  const n = p.prog.inventory[it.id] ?? 0;
                  return (
                    <div key={it.id} className="flex items-center gap-3 rounded-2xl border border-emerald-100 p-3" data-testid={`item-${it.id}`}>
                      <span className="relative shrink-0 rounded-2xl bg-gradient-to-b from-amber-50 to-emerald-50">
                        <Thumb kind="item" id={it.id} alt={pick(p.lang, it.nama, it.namaEn)} className="h-14 w-14" />
                        <span className="absolute -bottom-1 -right-1 min-w-6 rounded-full bg-emerald-700 px-1.5 text-center text-xs font-bold text-white">{n}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{pick(p.lang, it.nama, it.namaEn)}</p>
                        <p className="text-xs text-emerald-700">{pick(p.lang, it.desc, it.descEn)}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {it.use !== "none" && (
                          <button disabled={!n} onClick={() => p.onUseItem(it.id)} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40" data-testid={`use-${it.id}`}>
                            {L("Pakai", "Use")}
                          </button>
                        )}
                        {it.price > 0 && (
                          <button onClick={() => p.onBuyItem(it.id)} className="flex items-center gap-1 rounded-lg bg-amber-400 px-2 py-1 text-xs font-semibold text-amber-950" data-testid={`buyitem-${it.id}`}>
                            <Coin className="h-3.5 w-3.5" /> {it.price}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3" data-testid="crafting">
                <h3 className="font-semibold">{L("Racik & gabungkan", "Crafting")}</h3>
                <p className="text-xs text-emerald-800">{L("Petik beri, bunga dan jamur di alam, lalu gabungkan di sini.", "Gather berries, flowers and mushrooms in the wild, then combine them here.")}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {RECIPES.map((r) => {
                    const out = ITEMS.find((i) => i.id === r.out)!;
                    const ok = canCraft(r, p.prog.inventory);
                    return (
                      <div key={r.id} className="flex items-center gap-2 rounded-xl bg-white p-2 ring-1 ring-amber-100" data-testid={`recipe-${r.id}`}>
                        <div className="flex flex-1 flex-wrap items-center gap-1">
                          {Object.entries(r.needs).map(([k, n], i) => {
                            const ing = ITEMS.find((x) => x.id === k)!;
                            const have = p.prog.inventory[k] ?? 0;
                            return (
                              <span key={k} className="flex items-center gap-0.5 text-xs">
                                {i > 0 && <span className="px-0.5 text-emerald-700">+</span>}
                                <Thumb kind="item" id={k} alt={pick(p.lang, ing.nama, ing.namaEn)} className="h-8 w-8" />
                                <span className={have >= n ? "font-semibold text-emerald-800" : "font-semibold text-rose-600"}>{have}/{n}</span>
                              </span>
                            );
                          })}
                          <span className="px-1 text-emerald-700" aria-hidden>→</span>
                          <Thumb kind="item" id={out.id} alt={pick(p.lang, out.nama, out.namaEn)} className="h-9 w-9" />
                          <span className="text-xs font-semibold">{r.qty > 1 ? `${r.qty}× ` : ""}{pick(p.lang, out.nama, out.namaEn)}</span>
                        </div>
                        <button disabled={!ok} onClick={() => p.onCraft(r.id)} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-amber-950 disabled:opacity-35" data-testid={`craft-${r.id}`}>
                          {L("Racik", "Craft")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-emerald-700">{L("Koin didapat dari bermain: item, misi, permata gua, slime, dan peti. Tidak ada pembelian dengan uang sungguhan.", "Coins come from playing: items, quests, cave gems, slimes and chests. Nothing here costs real money.")}</p>
            </div>
          )}

          {p.tab === "together" && (
            <div className="space-y-4">
              <p className="text-sm text-emerald-800">
                {L(`Main bareng sampai ${12} teman di ruang pribadi. Hanya posisi, pakaian, dan emote yang dikirim. Tidak ada obrolan teks, jadi orang asing tidak bisa mengirim pesan.`, `Play with up to 12 friends in a private room. Only positions, outfits and emotes are shared. There is no text chat, so strangers cannot send messages.`)}
              </p>
              {p.room.status === "none" || p.room.status === "closed" || p.room.status === "error" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button onClick={p.onHost} className="rounded-2xl bg-emerald-600 px-4 py-4 font-semibold text-white" data-testid="room-host">
                    {L("Buat ruang baru", "Create a room")}
                  </button>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      p.onJoin(code);
                    }}
                  >
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                      placeholder={L("KODE", "CODE")}
                      aria-label={L("Kode ruang", "Room code")}
                      className="w-full rounded-2xl border-2 border-emerald-200 px-3 text-center font-mono text-lg tracking-widest"
                      data-testid="room-code-input"
                    />
                    <button className="rounded-2xl bg-sky-600 px-4 font-semibold text-white" data-testid="room-join">
                      {L("Gabung", "Join")}
                    </button>
                  </form>
                  {p.room.status === "error" && (
                    <p className="text-sm text-rose-700 sm:col-span-2">
                      {p.room.error === "full" ? L("Ruang sudah penuh (12 pemain).", "That room is full (12 players).") : L("Tidak bisa terhubung. Periksa kode dan coba lagi.", "Could not connect. Check the code and try again.")} ({p.room.error})
                    </p>
                  )}
                </div>
              ) : p.room.status === "connecting" ? (
                <p className="text-sm">{L("Menghubungkan...", "Connecting...")}</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-50 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-emerald-700">{L("Kode ruang", "Room code")}</p>
                      <p className="font-mono text-3xl font-bold tracking-[0.3em]" data-testid="room-code">{p.room.code}</p>
                    </div>
                    <div className="ml-auto text-right text-sm">
                      <p data-testid="room-count">{p.room.players.length + 1} / 12 {L("pemain", "players")}</p>
                      <p className="font-mono" data-testid="room-ping">{p.room.isHost && !p.room.players.length ? L("menunggu teman", "waiting for friends") : `ping ${p.room.ping.toFixed(1)} ms`}</p>
                    </div>
                  </div>
                  <ul className="grid gap-1 text-sm sm:grid-cols-2">
                    <li className="rounded-xl bg-white px-3 py-2 ring-1 ring-emerald-100">{L("Kamu", "You")}{p.room.isHost ? L(" (tuan rumah)", " (host)") : ""}</li>
                    {p.room.players.map((pl) => (
                      <li key={pl.id} className="rounded-xl bg-white px-3 py-2 ring-1 ring-emerald-100">{pl.name}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    {EMOTES.map((e) => (
                      <button key={e} onClick={() => p.onEmote(e)} className="rounded-full bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-900" data-testid={`emote-${e}`}>
                        {pick(p.lang, EMOTE_TEXT[e].id, EMOTE_TEXT[e].en)}
                      </button>
                    ))}
                  </div>
                  <button onClick={p.onLeave} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">
                    {L("Keluar ruang", "Leave room")}
                  </button>
                </div>
              )}
              <p className="text-xs text-emerald-700">
                {L("Koneksi langsung antar perangkat (WebRTC). Di Wi-Fi rumah yang sama ping biasanya beberapa milidetik; lewat internet tergantung jarak, umumnya 20 sampai 100 ms.", "Devices connect directly (WebRTC). On the same home Wi-Fi ping is usually a few milliseconds; over the internet it depends on distance, typically 20 to 100 ms.")}
              </p>
            </div>
          )}

          {p.tab === "book" && (
            <div className="space-y-4 text-sm">
              <p className="text-emerald-800">
                Level {level} · {p.prog.itemsCollected} {L("item", "items")} · {p.prog.missionsDone} {L("misi", "quests")} · {Math.round(p.prog.distance)} m · {L("kisah", "story")} {p.prog.storyChapter}/{STORY.length} · {p.prog.slimesPopped} slime · {p.prog.gemsFound} {L("permata", "gems")}
              </p>
              <div>
                <h3 className="font-semibold">{L("Sahabat perjalanan", "Travel companions")}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PETS.map((pt) => {
                    const unlocked = level >= pt.level;
                    return (
                      <button key={pt.id} disabled={!unlocked} onClick={() => p.onChoosePet(pt.id)} className={`rounded-xl border px-4 py-2 font-semibold ${p.prog.pet === pt.id ? "border-emerald-600 bg-emerald-600 text-white" : unlocked ? "border-emerald-300" : "border-emerald-100 text-emerald-300"}`}>
                        {pick(p.lang, pt.nama, pt.namaEn)}{!unlocked && ` (Lv ${pt.level})`}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="font-semibold">{L("Keahlian", "Skills")}</h3>
                <ul className="mt-1 space-y-1">
                  {SKILLS.map((s) => (
                    <li key={s.id} className={p.prog.skills.includes(s.id) ? "" : "opacity-40"}>
                      {p.prog.skills.includes(s.id) ? "✓" : `Lv ${s.level}`} · {pick(p.lang, s.nama, s.namaEn)}: {pick(p.lang, s.keterangan, s.keteranganEn)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">{L("Perlengkapan", "Gear")}</h3>
                <ul className="mt-1 space-y-1">
                  {TOOLS.map((t) => (
                    <li key={t.id} className={p.prog.tools.includes(t.id) ? "" : "opacity-40"}>
                      {p.prog.tools.includes(t.id) ? "✓" : `Lv ${t.level}`} · {pick(p.lang, t.nama, t.namaEn)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">{L("Prestasi", "Achievements")} ({p.prog.achievements.length}/{ACHIEVEMENTS.length})</h3>
                <ul className="mt-1 grid gap-1 sm:grid-cols-2">
                  {ACHIEVEMENTS.map((a) => (
                    <li key={a.id} className={`rounded-lg px-2 py-1 ${p.prog.achievements.includes(a.id) ? "bg-amber-50" : "opacity-40"}`}>
                      <b>{pick(p.lang, a.nama, a.namaEn)}</b> · {pick(p.lang, a.keterangan, a.keteranganEn)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {p.tab === "home" && (
            <div className="space-y-3">
              <p className="text-sm text-emerald-700">{L("Rumah pohonmu punya tangga putar dan kabin yang bisa dimasuki. Selesaikan misi untuk membuka hiasan.", "Your tree house has spiral stairs and a cabin you can walk into. Finish quests to unlock decorations.")}</p>
              <button onClick={p.onGoHome} className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white">{L("Ke rumah pohon", "Go to tree house")}</button>
              <div className="grid grid-cols-2 gap-2">
                {DECORS.map((d) => {
                  const owned = p.prog.decors.includes(d.id);
                  const placed = p.prog.placedDecors.includes(d.id);
                  return (
                    <button key={d.id} disabled={!owned} onClick={() => p.onToggleDecor(d.id)} className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${placed ? "border-emerald-600 bg-emerald-600 text-white" : owned ? "border-emerald-300" : "border-emerald-100 text-emerald-300"}`}>
                      {pick(p.lang, d.nama, d.namaEn)}
                      <span className="mt-0.5 block text-xs font-normal">
                        {!owned ? L(`Buka setelah ${d.missions} misi`, `Unlocks after ${d.missions} quests`) : placed ? L("Lepas", "Remove") : L("Pasang", "Place")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {p.tab === "settings" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold">{L("Grafis", "Graphics")}</h3>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                  {PRESET_ORDER.map((pr) => (
                    <button
                      key={pr}
                      onClick={() => p.setGfx({ ...p.gfx, ...PRESETS[pr], preset: pr })}
                      data-testid={`preset-${pr}`}
                      className={`rounded-lg px-2 py-2 text-left text-xs font-semibold ${p.gfx.preset === pr ? "bg-emerald-600 text-white" : "bg-emerald-50"}`}
                    >
                      {pick(p.lang, PRESET_LABEL[pr].id, PRESET_LABEL[pr].en)}
                      <span className={`block text-[10px] font-normal ${p.gfx.preset === pr ? "text-emerald-50" : "text-emerald-700"}`}>{pick(p.lang, PRESET_LABEL[pr].hint, PRESET_LABEL[pr].hintEn)}</span>
                    </button>
                  ))}
                </div>
                {p.gfx.preset === "custom" && <p className="text-xs text-emerald-700">{L("Kustom", "Custom")}</p>}
                <label className="block rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  {L("Resolusi render", "Render resolution")}: {Math.round(p.gfx.scale * 100)}%
                  <input type="range" min={50} max={150} step={10} value={p.gfx.scale * 100} onChange={(e) => setG({ scale: Number(e.target.value) / 100 })} className="w-full accent-emerald-600" />
                </label>
                <label className="block rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  {L("Jarak pandang", "View distance")}: {p.gfx.view}
                  <input type="range" min={1} max={6} value={p.gfx.view} onChange={(e) => setG({ view: Number(e.target.value) })} className="w-full accent-emerald-600" />
                </label>
                <label className="block rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  {L("Kepadatan rumput", "Grass density")}: {Math.round(p.gfx.grass * 100)}%
                  <input type="range" min={0} max={220} step={10} value={p.gfx.grass * 100} onChange={(e) => setG({ grass: Number(e.target.value) / 100 })} className="w-full accent-emerald-600" />
                </label>
                <label className="block rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  {L("Kepadatan hewan", "Wildlife density")}: {Math.round(p.gfx.wildlife * 100)}%
                  <input type="range" min={0} max={150} step={10} value={p.gfx.wildlife * 100} onChange={(e) => setG({ wildlife: Number(e.target.value) / 100 })} className="w-full accent-emerald-600" />
                </label>
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm" data-testid="picture-settings">
                  <p className="font-semibold">{L("Gambar", "Picture")}</p>
                  {([
                    ["brightness", L("Kecerahan", "Brightness"), 60, 150],
                    ["contrast", L("Kontras", "Contrast"), 70, 140],
                    ["saturation", L("Saturasi warna", "Colour saturation"), 50, 160],
                  ] as const).map(([k, label, lo, hi]) => (
                    <label key={k} className="mt-1 block">
                      {label}: {Math.round(p.gfx[k] * 100)}%
                      <input type="range" min={lo} max={hi} step={5} value={Math.round(p.gfx[k] * 100)} onChange={(e) => p.setGfx({ ...p.gfx, [k]: Number(e.target.value) / 100 })} className="w-full accent-emerald-600" data-testid={`gfx-${k}`} />
                    </label>
                  ))}
                  <button onClick={() => p.setGfx({ ...p.gfx, brightness: 1, contrast: 1, saturation: 1 })} className="mt-1 rounded-lg bg-white px-2 py-1 text-xs font-semibold">{L("Setel ulang", "Reset")}</button>
                </div>
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  {L("Bayangan", "Shadows")}
                  <div className="mt-1 grid grid-cols-3 gap-1">
                    {([0, 1, 2] as const).map((s) => (
                      <button key={s} onClick={() => setG({ shadows: s })} className={`rounded-lg px-2 py-1 text-xs font-semibold ${p.gfx.shadows === s ? "bg-emerald-600 text-white" : "bg-white"}`}>
                        {s === 0 ? L("Mati", "Off") : s === 1 ? L("Lembut", "Soft") : L("Tajam", "Sharp")}
                      </button>
                    ))}
                  </div>
                </div>
                {toggle(p.gfx.bloom, (v) => setG({ bloom: v }), L("Cahaya pendar (bloom)", "Bloom glow"))}
                {toggle(p.gfx.aa, (v) => setG({ aa: v }), L("Anti-aliasing", "Antialiasing"))}
                <label className="block rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  {L("Sudut pandang (FOV)", "Field of view")}: {p.gfx.fov}°
                  <input type="range" min={50} max={95} value={p.gfx.fov} onChange={(e) => p.setGfx({ ...p.gfx, fov: Number(e.target.value) })} className="w-full accent-emerald-600" />
                </label>
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  {L("Batas FPS", "Frame rate cap")}
                  <div className="mt-1 grid grid-cols-3 gap-1">
                    {([30, 60, 0] as const).map((f) => (
                      <button key={f} onClick={() => p.setGfx({ ...p.gfx, maxFps: f })} className={`rounded-lg px-2 py-1 text-xs font-semibold ${p.gfx.maxFps === f ? "bg-emerald-600 text-white" : "bg-white"}`}>
                        {f === 0 ? L("Bebas", "Uncapped") : f}
                      </button>
                    ))}
                  </div>
                </div>
                {toggle(p.gfx.showFps, (v) => p.setGfx({ ...p.gfx, showFps: v }), L("Tampilkan FPS", "Show FPS"))}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">{L("Kontrol & kamera", "Controls & camera")}</h3>
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  {L("Kamera", "Camera")}
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {(["tpp", "fpp"] as const).map((v) => (
                      <button key={v} onClick={() => p.setControls({ ...p.controls, view: v })} data-testid={`view-${v}`} className={`rounded-lg px-2 py-1 text-xs font-semibold ${p.controls.view === v ? "bg-emerald-600 text-white" : "bg-white"}`}>
                        {v === "tpp" ? L("Orang ketiga", "Third person") : L("Orang pertama", "First person")}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  {L("Kepekaan kamera", "Look sensitivity")}: {p.controls.sensitivity.toFixed(1)}
                  <input type="range" min={2} max={30} value={p.controls.sensitivity * 10} onChange={(e) => p.setControls({ ...p.controls, sensitivity: Number(e.target.value) / 10 })} className="w-full accent-emerald-600" />
                </label>
                {toggle(p.controls.invertY, (v) => p.setControls({ ...p.controls, invertY: v }), L("Balik sumbu vertikal (opsional)", "Invert vertical look (optional)"), "invert-y")}
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  {L("Kontrol layar sentuh", "On-screen controller")}
                  <div className="mt-1 grid grid-cols-3 gap-1">
                    {(["auto", "on", "off"] as const).map((v) => (
                      <button key={v} onClick={() => p.setControls({ ...p.controls, touch: v })} className={`rounded-lg px-2 py-1 text-xs font-semibold ${p.controls.touch === v ? "bg-emerald-600 text-white" : "bg-white"}`}>
                        {v === "auto" ? L("Otomatis", "Auto") : v === "on" ? L("Selalu", "Always") : L("Mati", "Off")}
                      </button>
                    ))}
                  </div>
                </div>
                <h3 className="pt-2 font-semibold">{L("Suara & bahasa", "Sound & language")}</h3>
                {toggle(p.musicOn, () => p.toggleMusic(), L("Musik", "Music"))}
                <label className="block rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  {L("Volume", "Volume")}: {p.volume}
                  <input type="range" min={0} max={100} value={p.volume} onChange={(e) => p.setVolume(Number(e.target.value))} className="w-full accent-emerald-600" aria-label={L("Volume suara", "Sound volume")} />
                </label>
                <button onClick={p.toggleLang} className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold">
                  {p.lang === "id" ? "English" : "Bahasa Indonesia"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
