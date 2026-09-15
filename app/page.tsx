"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import { useLang } from "@/components/landing/useLang";
import RevealRoot from "@/components/landing/Reveal";
import HeroScene from "@/components/landing/HeroScene";
import { SiteFooter, SiteNav } from "@/components/landing/SiteChrome";
import {
  CONTROL_COLORS,
  GamepadDiagram,
  KeyboardDiagram,
  TouchDiagram,
} from "@/components/landing/ControlDiagrams";

type Pair = { id: string; en: string };
const p = (id: string, en: string): Pair => ({ id, en });

const T = {
  eyebrow: p("Dunia terbuka 3D gratis untuk anak, langsung di peramban", "A free 3D open world for kids, right in the browser"),
  h1a: p("Dunia yang luas untuk dijelajahi.", "A world big enough to wander."),
  h1b: p("Cukup aman untuk dilepas.", "Safe enough to let them."),
  sub: p(
    "Meadowfar adalah padang tanpa tepi berisi hutan, gurun, salju, dan gua kristal. Anak menjelajah, menghias rumah pohon, dan bermain bersama sampai 12 teman di ruang privat. Tanpa unduhan, tanpa iklan, tanpa pembelian uang sungguhan.",
    "Meadowfar is an endless meadow of forests, deserts, snow and crystal caves. Kids explore, decorate a tree house, and play with up to 12 friends in a private room. No downloads, no ads, no real-money purchases."
  ),
  play: p("Main gratis", "Play free"),
  account: p("Buat akun", "Create an account"),
  heroNote: p("Jalan di HP, tablet, dan laptop. Tidak perlu instal.", "Runs on phones, tablets and laptops. Nothing to install."),

  stBiomes: p("biome", "biomes"),
  stFriends: p("teman per ruang", "friends per room"),
  stChapters: p("bab kisah", "story chapters"),
  stAch: p("prestasi", "achievements"),
  stQuests: p("jenis misi", "quest types"),
  stAds: p("iklan, selamanya", "ads, ever"),

  modesKicker: p("Dua cara bermain", "Two ways to play"),
  modesTitle: p("Pilih tempo yang cocok untuk anakmu", "Pick the pace that suits your child"),
  casual: p("Santai", "Casual"),
  adventure: p("Petualangan", "Adventure"),
  casualBody: p(
    "Tanpa nyawa dan tanpa kalah. Cukup berjalan, mengumpulkan, menghias, dan menjelajah sesukanya.",
    "No health bar and no way to lose. Walk, collect, decorate and explore at whatever speed feels right."
  ),
  adventureBody: p(
    "Hati muncul di layar, dan slime kecil yang lucu melompat-lompat di padang. Kalau hatinya habis, kamu muncul lagi di rumah dengan semua barang dan misi tetap utuh.",
    "Hearts appear, and soft, bouncy slimes roam the fields. Run out of hearts and you pop back at home, with every item and quest still exactly where you left it."
  ),
  casualTags: p("Tanpa nyawa|Tidak bisa kalah|Cocok untuk pemula", "No health|Cannot lose|Great for first-timers"),
  adventureTags: p("Hati dan HP|Slime yang ramah|Progres tak pernah hilang", "Hearts and HP|Friendly slimes|Progress is never lost"),

  featKicker: p("Isi dunianya", "What is inside"),
  featTitle: p("Sebuah dunia utuh, bukan sekadar level", "A whole world, not a list of levels"),
  f1t: p("Peta tanpa tepi", "A map with no edge"),
  f1b: p(
    "Dunia prosedural tumbuh mengikuti langkah anak: enam biome, siklus siang dan malam, danau dan bukit yang terus muncul.",
    "A procedural world that grows as kids walk: six biomes, a full day and night cycle, and new hills and lakes around every corner."
  ),
  f2t: p("Main bareng sampai 12 teman", "Up to 12 friends, one private room"),
  f2b: p(
    "Buat ruang, bagikan kode 6 karakter, dan bermain bersama secara langsung. Hanya emote ramah yang sudah disiapkan, tanpa obrolan teks.",
    "Create a room, share a 6-character code, and play together in real time. Fixed friendly emotes only, no text chat."
  ),
  f3t: p("Pintu yang benar-benar terbuka", "Doors that actually open"),
  f3b: p(
    "Rumah desa, rumah pohon, gua kristal, aula gunung, dan arena latihan punya ruang dalam yang bisa dimasuki.",
    "Village houses, the tree house, a crystal cave, a mountain hall and a friendly training arena all have interiors you can walk into."
  ),
  f4t: p("Orang pertama atau ketiga", "First or third person"),
  f4b: p(
    "Ganti sudut pandang dengan tombol V atau tombol di layar. Putar kamera dengan mouse, stik kanan, atau geser jari.",
    "Switch views with the V key or the on-screen button. Turn the camera with the mouse, the right stick, or a finger drag."
  ),
  f5t: p("Lemari baju dan toko", "Wardrobe and shop"),
  f5b: p(
    "Topi, pakaian, jubah, sepatu, dan warna. Semua dibeli dengan koin yang didapat dari bermain, lalu disimpan di inventaris.",
    "Hats, outfits, capes, shoes and colours, bought with coins earned by playing and kept in your inventory."
  ),
  f6t: p("Kisah 12 bab, 5 jenis misi", "A 12-chapter story, 5 kinds of quest"),
  f6b: p(
    "Kumpulkan, balapan, cari harta, antar paket, dan kembalikan pecahan bintang. Ada 24 prestasi yang bisa diraih, dalam dua bahasa.",
    "Collect, race, hunt for treasure, deliver parcels and return star shards. 24 achievements to earn, in two languages."
  ),
  f7t: p("Rumah pohon dan hewan peliharaan", "A tree house and pets"),
  f7b: p(
    "Hiasan terbuka setiap kali misi selesai. Hewan peliharaan ikut berjalan, dan mode foto siap untuk momen terbaik.",
    "Decorations unlock as quests are finished. Pets follow you around, and photo mode is ready for the best moments."
  ),

  gfxKicker: p("Pengaturan grafis", "Graphics settings"),
  gfxTitle: p("Lancar di laptop sekolah. Indah di PC gaming.", "Smooth on a school laptop. Lovely on a gaming PC."),
  gfxBody: p(
    "Pilih preset Rendah, Sedang, Tinggi, atau Ultra, lalu atur sendiri setiap bagiannya.",
    "Pick a Low, Medium, High or Ultra preset, then fine-tune each setting on its own."
  ),
  gfxRes: p("Skala resolusi", "Resolution scale"),
  gfxShadows: p("Bayangan", "Shadows"),
  gfxView: p("Jarak pandang", "View distance"),
  gfxGrass: p("Kepadatan rumput", "Grass density"),
  gfxBloom: p("Bloom", "Bloom"),
  gfxAA: p("Antialiasing", "Antialiasing"),
  gfxFov: p("Bidang pandang (FOV)", "Field of view (FOV)"),
  off: p("Mati", "Off"),
  on: p("Nyala", "On"),
  low: p("Rendah", "Low"),
  medium: p("Sedang", "Medium"),
  high: p("Tinggi", "High"),
  ultra: p("Ultra", "Ultra"),
  near: p("Dekat", "Near"),
  far: p("Jauh", "Far"),
  veryFar: p("Sangat jauh", "Very far"),
  slider: p("Geser sesuka hati", "Your choice"),
  presetLabel: p("Preset grafis", "Graphics preset"),

  ctrlKicker: p("Kontrol", "Controls"),
  ctrlTitle: p("Main dengan apa pun yang ada di rumah", "Play with whatever is in the house"),
  tabKeys: p("Keyboard dan mouse", "Keyboard and mouse"),
  tabPad: p("Gamepad", "Gamepad"),
  tabTouch: p("Layar sentuh", "Touch"),
  kMove: p("WASD atau panah untuk berjalan, Shift untuk berlari", "WASD or arrows to walk, Shift to sprint"),
  kAct: p("Spasi untuk melompat, E untuk bicara dan masuk", "Space to jump, E to talk and go inside"),
  kCam: p("Mouse untuk memutar kamera, V untuk ganti sudut pandang", "Mouse to turn the camera, V to switch views"),
  kNote: p("Klik layar permainan untuk mengunci mouse, tekan Esc untuk melepas.", "Click the game to lock the mouse, press Esc to let go."),
  gMove: p("Stik kiri untuk berjalan dan berlari", "Left stick to walk and run"),
  gAct: p("Tombol A untuk melompat", "A button to jump"),
  gCam: p("Stik kanan untuk kamera, arah tidak terbalik", "Right stick for the camera, with non-inverted axes"),
  gNote: p("Kontroler Xbox dan gamepad standar di Windows. Colokkan, lalu tekan tombol apa saja.", "Xbox and standard controllers on Windows. Plug in, then press any button."),
  tMove: p("Stik bergerak di kiri bawah", "Animated move stick, bottom left"),
  tAct: p("Tombol lompat besar di kanan bawah", "Big jump button, bottom right"),
  tCam: p("Geser sisi kanan untuk melihat, tombol V untuk sudut pandang", "Drag the right side to look, V button to switch views"),
  tNote: p("Tata letaknya menyesuaikan saat HP diputar tegak atau mendatar.", "The layout adapts when the phone is held upright or sideways."),
  legMove: p("Gerak", "Move"),
  legAct: p("Aksi", "Action"),
  legCam: p("Kamera", "Camera"),

  togKicker: p("Main bareng", "Play together"),
  togTitle: p("Tiga langkah, lalu kalian satu dunia", "Three steps, then you share one world"),
  togBody: p(
    "Perangkat saling terhubung langsung (peer-to-peer lewat WebRTC). Tidak ada lobi umum, tidak ada obrolan teks, dan tidak ada orang asing yang bisa masuk tanpa kode.",
    "Devices connect directly to each other (peer-to-peer over WebRTC). There is no public lobby, no text chat, and nobody can join without the code."
  ),
  s1t: p("Buat ruang", "Create a room"),
  s1b: p("Buka menu Main bareng dan pilih Buat. Kamu langsung mendapat kode 6 karakter.", "Open Play together and choose Create. You get a 6-character code straight away."),
  s2t: p("Bagikan kodenya", "Share the code"),
  s2b: p("Kirim ke saudara, sepupu, atau teman sekelas yang kamu kenal. Hanya pemegang kode yang bisa bergabung.", "Send it to a sibling, cousin or classmate you know. Only people with the code can join."),
  s3t: p("Bermain bersama", "Play"),
  s3b: p("Sampai 12 penjelajah di dunia yang sama, saling melihat pakaian, dan menyapa dengan emote. Ping langsung terlihat di layar.", "Up to 12 explorers in the same world, seeing each other's outfits and waving with emotes. Live ping is shown on screen."),
  roomCode: p("Kode ruang", "Room code"),
  copy: p("Salin", "Copy"),
  copied: p("Tersalin", "Copied"),
  joined: p("bergabung", "joined"),
  emotes: p("Lambai|Sorak|Menari|Tos", "Wave|Cheer|Dance|High five"),

  parKicker: p("Untuk orang tua", "For parents"),
  parTitle: p("Dibuat dengan orang tua di ruangan", "Built with a parent in the room"),
  parBody: p(
    "Setiap keputusan desain melewati satu pertanyaan: apakah saya tenang kalau anak saya memainkan ini sendirian?",
    "Every design decision went through one question: would I be comfortable if my own child played this alone?"
  ),
  sa1t: p("Tanpa iklan, tanpa uang sungguhan, tanpa loot box", "No ads, no real-money purchases, no loot boxes"),
  sa1b: p("Koin didapat dari bermain. Tidak ada yang bisa dibeli dengan kartu.", "Coins come from playing. Nothing can be bought with a card."),
  sa2t: p("Tanpa obrolan dengan orang asing", "No chat with strangers"),
  sa2b: p("Ruang bersifat privat lewat kode, dan hanya ada emote yang sudah disiapkan.", "Rooms are private by code, and players can only use a fixed set of emotes."),
  sa3t: p("Tanpa kekerasan, tanpa kehilangan", "No violence, nothing to lose"),
  sa3b: p("Slime di mode Petualangan lembut dan lucu. Progres tidak pernah hilang.", "Adventure slimes are soft and bouncy. Progress is never taken away."),
  sa4t: p("Dasbor dan batas waktu main", "Dashboard and play-time limits"),
  sa4b: p("Lihat perkembangan tiap anak dan atur batas harian. Pengingat istirahat yang lembut, bukan kunci mendadak.", "See each child's progress and set a daily limit. Gentle break reminders, never a sudden lockout."),
  sa5t: p("Papan keluarga tanpa peringkat", "A family board with no rankings"),
  sa5b: p("Semua petualangan dihargai. Tidak ada juara satu, tidak ada yang terakhir.", "Every adventure counts. No first place, no last place."),
  sa6t: p("Anak tidak pernah butuh dompet", "Kids never need a wallet"),
  sa6b: p(
    "Akun orang tua bisa mencoba pembelian uji di Solana devnet. Token devnet tidak punya nilai uang sungguhan.",
    "Parent accounts can try a Solana devnet test purchase. Devnet tokens have no real-money value."
  ),
  dashTitle: p("Dasbor orang tua", "Parent dashboard"),
  dashLimit: p("Batas harian", "Daily limit"),
  dashLast: p("Terakhir main 20 menit lalu", "Last played 20 min ago"),
  dashOpen: p("Buka dasbor", "Open the dashboard"),
  level: p("Level", "Level"),
  story: p("Kisah", "Story"),
  quests: p("Misi", "Quests"),

  faqKicker: p("Tanya jawab", "FAQ"),
  faqTitle: p("Pertanyaan yang sering muncul", "Questions parents ask"),
  q1: p("Apakah benar-benar gratis?", "Is it really free?"),
  a1: p(
    "Ya. Tidak ada iklan, tidak ada pembelian dengan uang sungguhan, dan tidak ada loot box. Koin di toko didapat dari bermain.",
    "Yes. There are no ads, no real-money purchases and no loot boxes. Shop coins are earned by playing."
  ),
  q2: p("Bisakah anak saya mengobrol dengan orang asing?", "Can my child talk to strangers?"),
  a2: p(
    "Tidak. Tidak ada obrolan teks sama sekali. Ruang bermain bersama hanya bisa dimasuki dengan kode 6 karakter, dan pemain hanya bisa memakai emote ramah yang sudah disiapkan.",
    "No. There is no text chat at all. Shared rooms can only be joined with a 6-character code, and players can only use a fixed set of friendly emotes."
  ),
  q3: p("Apa itu pembelian uji Solana devnet?", "What is the Solana devnet test purchase?"),
  a3: p(
    "Fitur opsional khusus akun orang tua untuk mencoba cara kerja pembelian di jaringan uji. Devnet tidak punya nilai uang sungguhan, dan anak tidak pernah perlu dompet.",
    "An optional feature for parent accounts that shows how a purchase works on a test network. Devnet has no real-money value, and kids never need a wallet."
  ),
  q4: p("Perangkat dan kontroler apa yang didukung?", "Which devices and controllers work?"),
  a4: p(
    "Keyboard dan mouse, kontroler Xbox atau gamepad standar di Windows, serta kontrol sentuh di HP dan tablet, baik tegak maupun mendatar.",
    "Keyboard and mouse, Xbox or standard gamepads on Windows, and touch controls on phones and tablets, upright or sideways."
  ),
  q5: p("Apakah bisa jalan di laptop lama?", "Will it run on an older laptop?"),
  a5: p(
    "Biasanya bisa. Pilih preset Rendah, atau matikan bayangan dan kurangi rumput di pengaturan grafis.",
    "Usually, yes. Choose the Low preset, or turn off shadows and reduce grass in the graphics settings."
  ),
  q6: p("Apa yang terjadi kalau hati habis di mode Petualangan?", "What happens when the hearts run out in Adventure mode?"),
  a6: p(
    "Penjelajah muncul lagi di rumah. Barang, koin, dan misi tetap utuh. Mau tanpa hati sama sekali? Pilih mode Santai.",
    "The explorer reappears at home with every item, coin and quest intact. Prefer no hearts at all? Choose Casual mode."
  ),
  q7: p("Apakah perlu membuat akun?", "Does my child need an account?"),
  a7: p(
    "Tidak wajib. Tamu bisa langsung bermain dan progresnya tersimpan di perangkat itu. Akun menyimpan progres dengan aman dan membuka papan keluarga serta dasbor orang tua.",
    "No. Guests can play straight away, with progress saved on that device. An account keeps progress safe and unlocks the family board and parent dashboard."
  ),

  ctaTitle: p("Padangnya sudah terbuka", "The meadow is open"),
  ctaBody: p(
    "Mulai sebagai tamu dengan satu klik, atau buat akun supaya progres tersimpan.",
    "Start as a guest in one click, or create an account so progress is kept safe."
  ),
  login: p("Masuk", "Log in"),
};

type Key = keyof typeof T;
const dl = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

function SectionHead({ kicker, title, body, center = false }: { kicker: string; title: string; body?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p data-reveal className="text-xs font-semibold uppercase tracking-[0.16em] text-leaf">{kicker}</p>
      <h2 data-reveal style={dl(60)} className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
        {title}
      </h2>
      {body && (
        <p data-reveal style={dl(120)} className="mt-4 text-pretty text-lg leading-relaxed text-ink-soft">
          {body}
        </p>
      )}
    </div>
  );
}

/* ---------- feature card icons (simple line art, no emoji) ---------- */
const ICONS: Record<string, React.ReactNode> = {
  world: <path d="M3 17l5-6 4 4 3-3 6 5M3 17h18M15 7a2 2 0 1 0 0-.01" />,
  together: <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 2.7-5 6-5s6 2 6 5m0-4.6c.6-.3 1.3-.4 2-.4 3.3 0 6 2 6 5" />,
  door: <path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18M15 12h.01" />,
  camera: <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  shirt: <path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z" />,
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zm0 16a2 2 0 0 1 2-2h13v2" />,
  home: <path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-5h4v5" />,
};

function Icon({ name }: { name: string }) {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf/10 text-leaf transition-colors group-hover:bg-leaf group-hover:text-white">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICONS[name]}
      </svg>
    </span>
  );
}

function FeatureCard({ icon, title, body, className = "", delay = 0, children }: { icon: string; title: string; body: string; className?: string; delay?: number; children?: React.ReactNode }) {
  return (
    <article
      data-reveal
      style={dl(delay)}
      className={`group relative overflow-hidden rounded-3xl border border-line bg-paper p-6 transition duration-300 hover:-translate-y-1 hover:border-leaf/30 hover:shadow-[0_20px_50px_-25px_rgba(16,36,27,0.35)] sm:p-7 ${className}`}
    >
      <Icon name={icon} />
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
      {children}
    </article>
  );
}

/* ---------- interactive: casual / adventure ---------- */
function ModesPanel({ lang, t }: { lang: Lang; t: (k: Key) => string }) {
  const [mode, setMode] = useState<"casual" | "adventure">("casual");
  const adv = mode === "adventure";
  const tags = t(adv ? "adventureTags" : "casualTags").split("|");
  return (
    <div data-reveal style={dl(120)} className="mt-10 grid overflow-hidden rounded-3xl border border-line bg-paper md:grid-cols-2">
      <div className="p-6 sm:p-9">
        <div role="tablist" aria-label={t("modesKicker")} className="inline-flex rounded-full bg-background p-1 ring-1 ring-line">
          {(["casual", "adventure"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              id={`mode-tab-${m}`}
              aria-selected={mode === m}
              aria-controls="mode-panel"
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === m ? "bg-ink text-white shadow" : "text-ink-soft hover:text-ink"}`}
            >
              {t(m)}
            </button>
          ))}
        </div>
        <div id="mode-panel" role="tabpanel" aria-labelledby={`mode-tab-${mode}`} key={`${mode}-${lang}`} className="animate-rise">
          <h3 className="mt-7 text-2xl font-semibold tracking-tight text-ink">{t(mode)}</h3>
          <p className="mt-3 max-w-md text-lg leading-relaxed text-ink-soft">{t(adv ? "adventureBody" : "casualBody")}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag} className="rounded-full border border-line bg-background px-3 py-1.5 text-sm font-medium text-ink">
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={`relative min-h-64 overflow-hidden transition-colors duration-500 ${adv ? "bg-[#dff1d9]" : "bg-[#e4f2f8]"}`} aria-hidden="true">
        <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
          <path d="M0 190 Q120 150 230 180 T400 170 V280 H0Z" fill="#8fcf8a" />
          <path d="M0 225 Q150 195 290 220 T400 215 V280 H0Z" fill="#5fb46e" />
          <g transform="translate(150 190)">
            <rect x="-10" y="0" width="20" height="26" rx="9" fill="#3a7bd5" />
            <circle cx="0" cy="-8" r="10" fill="#f5c9a0" />
            <path d="M-12 -12 Q0 -27 12 -12Z" fill="#f4b43c" />
          </g>
          {adv ? (
            <>
              <g transform="translate(275 212)">
                <g className="animate-squish">
                  <path d="M-20 6 Q-20 -22 0 -22 Q20 -22 20 6Z" fill="#8be07a" />
                  <ellipse cx="-6" cy="-6" rx="3" ry="4" fill="#1f3d2a" />
                  <ellipse cx="6" cy="-6" rx="3" ry="4" fill="#1f3d2a" />
                </g>
              </g>
              <g transform="translate(335 200)">
                <g className="animate-squish" style={{ animationDelay: "0.5s" }}>
                  <path d="M-14 6 Q-14 -14 0 -14 Q14 -14 14 6Z" fill="#b69cf4" />
                  <circle cx="-4" cy="-4" r="2.4" fill="#2b1f4a" />
                  <circle cx="4" cy="-4" r="2.4" fill="#2b1f4a" />
                </g>
              </g>
              {[0, 1, 2].map((i) => (
                <path key={i} transform={`translate(${24 + i * 30} 24)`} d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" fill={i < 2 ? "#e2574c" : "#f1d8d2"} />
              ))}
            </>
          ) : (
            <>
              <g transform="translate(270 140)">
                <circle r="10" fill="#f4b43c" className="animate-twinkle" />
              </g>
              <g transform="translate(320 170)">
                <circle r="7" fill="#9be3ff" className="animate-twinkle" style={{ animationDelay: "0.6s" }} />
              </g>
              <g transform="translate(220 120)">
                <circle r="6" fill="#f7a8c4" className="animate-twinkle" style={{ animationDelay: "1.2s" }} />
              </g>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

/* ---------- interactive: graphics presets ---------- */
const PRESETS = ["low", "medium", "high", "ultra"] as const;
type Preset = (typeof PRESETS)[number];

function GraphicsPanel({ t }: { t: (k: Key) => string }) {
  const [preset, setPreset] = useState<Preset>("high");
  const i = PRESETS.indexOf(preset);
  const rows: [Key, string, number][] = [
    ["gfxRes", ["60%", "80%", "100%", "100%"][i], [0.6, 0.8, 1, 1][i]],
    ["gfxShadows", [t("off"), t("low"), t("high"), t("ultra")][i], [0, 0.4, 0.8, 1][i]],
    ["gfxView", [t("near"), t("medium"), t("far"), t("veryFar")][i], [0.3, 0.55, 0.8, 1][i]],
    ["gfxGrass", [t("low"), t("medium"), t("high"), t("ultra")][i], [0.25, 0.5, 0.8, 1][i]],
    ["gfxBloom", i >= 2 ? t("on") : t("off"), i >= 2 ? 1 : 0],
    ["gfxAA", i >= 1 ? t("on") : t("off"), i >= 1 ? 1 : 0],
    ["gfxFov", t("slider"), 0.7],
  ];
  const blades = [14, 26, 42, 60][i];
  return (
    <div data-reveal style={dl(120)} className="grid gap-6 rounded-3xl border border-line bg-paper p-5 sm:p-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="relative min-h-52 overflow-hidden rounded-2xl" aria-hidden="true">
        <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full transition-[filter] duration-500" style={{ filter: `saturate(${0.7 + i * 0.12}) blur(${i === 0 ? 0.6 : 0}px)` }}>
          <rect width="300" height="200" fill="#bfe2ef" />
          {i >= 2 && <circle cx="230" cy="50" r="46" fill="#fff3c4" opacity="0.7" />}
          <circle cx="230" cy="50" r="18" fill="#ffd66b" />
          <path d="M0 110 L60 70 L110 100 L170 55 L240 100 L300 80 V140 H0Z" fill="#9dbfd2" opacity={[0.25, 0.55, 0.85, 1][i]} />
          <path d="M0 135 Q90 105 170 125 T300 118 V200 H0Z" fill="#62b46f" />
          <path d="M0 160 Q110 140 210 155 T300 150 V200 H0Z" fill="#3f9a57" />
          {i >= 1 && <ellipse cx="120" cy="170" rx="24" ry={4 + i} fill="#000" opacity={0.08 * i} />}
          <g transform="translate(120 142)">
            <rect x="-7" y="0" width="14" height="24" rx="6" fill="#3a7bd5" />
            <circle cx="0" cy="-6" r="8" fill="#f5c9a0" />
          </g>
          {Array.from({ length: blades }).map((_, b) => {
            const x = (b * 97) % 300;
            const y = 162 + ((b * 37) % 34);
            return <path key={b} d={`M${x} ${y} q2 -9 4 0`} fill="none" stroke="#9be08f" strokeWidth="1.6" strokeLinecap="round" />;
          })}
        </svg>
      </div>
      <div>
        <div role="radiogroup" aria-label={t("presetLabel")} className="grid grid-cols-4 gap-1 rounded-2xl bg-background p-1 ring-1 ring-line">
          {PRESETS.map((pr) => (
            <button
              key={pr}
              role="radio"
              aria-checked={preset === pr}
              onClick={() => setPreset(pr)}
              className={`rounded-xl px-2 py-2.5 text-sm font-semibold transition ${preset === pr ? "bg-ink text-white shadow" : "text-ink-soft hover:bg-ink/5 hover:text-ink"}`}
            >
              {t(pr)}
            </button>
          ))}
        </div>
        <dl className="mt-5 divide-y divide-line">
          {rows.map(([k, v, frac]) => (
            <div key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-2.5 sm:grid-cols-[10rem_1fr_6rem]">
              <dt className="text-sm text-ink-soft">{t(k)}</dt>
              <dd className="order-3 col-span-2 h-1.5 overflow-hidden rounded-full bg-line sm:order-none sm:col-span-1">
                <span className="block h-full rounded-full bg-leaf transition-[width] duration-500" style={{ width: `${Math.max(frac, 0.04) * 100}%` }} />
              </dd>
              <dd className="text-right text-sm font-semibold tabular-nums text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/* ---------- interactive: controls ---------- */
function ControlsPanel({ t }: { t: (k: Key) => string }) {
  const [tab, setTab] = useState<"keys" | "pad" | "touch">("keys");
  const tabs: ["keys" | "pad" | "touch", Key][] = [
    ["keys", "tabKeys"],
    ["pad", "tabPad"],
    ["touch", "tabTouch"],
  ];
  const info = {
    keys: ["kMove", "kAct", "kCam", "kNote"],
    pad: ["gMove", "gAct", "gCam", "gNote"],
    touch: ["tMove", "tAct", "tCam", "tNote"],
  }[tab] as Key[];
  const colors = [CONTROL_COLORS.MOVE, CONTROL_COLORS.ACT, CONTROL_COLORS.CAM];
  const legend: Key[] = ["legMove", "legAct", "legCam"];
  return (
    <div data-reveal style={dl(120)} className="mt-10">
      <div role="tablist" aria-label={t("ctrlKicker")} className="flex gap-1 overflow-x-auto rounded-full bg-paper p-1 ring-1 ring-line sm:inline-flex">
        {tabs.map(([id, k]) => (
          <button
            key={id}
            role="tab"
            id={`ctrl-tab-${id}`}
            aria-selected={tab === id}
            aria-controls="ctrl-panel"
            onClick={() => setTab(id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${tab === id ? "bg-ink text-white shadow" : "text-ink-soft hover:text-ink"}`}
          >
            {t(k)}
          </button>
        ))}
      </div>
      <div id="ctrl-panel" role="tabpanel" aria-labelledby={`ctrl-tab-${tab}`} className="mt-5 grid items-center gap-8 rounded-3xl border border-line bg-paper p-5 sm:p-9 lg:grid-cols-[1.35fr_1fr]">
        <div key={tab} className="animate-rise">
          {tab === "keys" && <KeyboardDiagram />}
          {tab === "pad" && <GamepadDiagram />}
          {tab === "touch" && <TouchDiagram />}
        </div>
        <div key={`${tab}-text`} className="animate-rise">
          <ul className="space-y-4">
            {info.slice(0, 3).map((k, n) => (
              <li key={k} className="flex gap-3">
                <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: colors[n] }} />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{t(legend[n])}</span>
                  <span className="text-ink">{t(k)}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-2xl bg-background p-4 text-sm leading-relaxed text-ink-soft">{t(info[3])}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- play together mock ---------- */
function RoomCard({ t }: { t: (k: Key) => string }) {
  const [copied, setCopied] = useState(false);
  const code = "K7QX2M";
  const players = [
    ["Nara", "#3a7bd5"],
    ["Bima", "#9b5de5"],
    ["Sekar", "#e2574c"],
    ["Dimas", "#0f8a5f"],
  ];
  return (
    <div data-reveal style={dl(150)} className="rounded-3xl bg-ink p-6 text-white shadow-[0_30px_80px_-30px_rgba(16,36,27,0.6)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">{t("roomCode")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {code.split("").map((c, i) => (
            <span key={i} className="flex h-11 w-9 items-center justify-center rounded-lg bg-white/10 font-mono text-xl font-semibold sm:h-12 sm:w-10">
              {c}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(code).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-ink"
        >
          <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
        </button>
      </div>
      <ul className="mt-7 space-y-2.5">
        {players.map(([name, color], i) => (
          <li key={name} className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ background: color }}>
              {name[0]}
            </span>
            <span className="font-medium">{name}</span>
            <span className="text-xs text-white/45">{t("joined")}</span>
            <span className="ml-auto font-mono text-xs text-emerald-300">{[24, 38, 41, 57][i]} ms</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-2">
        {t("emotes").split("|").map((e) => (
          <span key={e} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- FAQ accordion ---------- */
function Faq({ t }: { t: (k: Key) => string }) {
  const [open, setOpen] = useState<number | null>(0);
  const qs: [Key, Key][] = [
    ["q1", "a1"],
    ["q2", "a2"],
    ["q3", "a3"],
    ["q4", "a4"],
    ["q5", "a5"],
    ["q6", "a6"],
    ["q7", "a7"],
  ];
  return (
    <div className="divide-y divide-line rounded-3xl border border-line bg-paper">
      {qs.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <div key={q} className="faq-item" data-open={isOpen}>
            <h3>
              <button
                type="button"
                id={`faq-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-base font-semibold text-ink transition-colors hover:text-leaf sm:px-7"
              >
                {t(q)}
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line transition-transform duration-300 ${isOpen ? "rotate-45 bg-ink text-white" : ""}`} aria-hidden="true">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                </span>
              </button>
            </h3>
            <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="faq-body">
              <div>
                <p className="px-5 pb-6 leading-relaxed text-ink-soft sm:px-7">{t(a)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useLang();
  const t = (k: Key) => T[k][lang];

  const stats: [string, Key][] = [
    ["6", "stBiomes"],
    ["12", "stFriends"],
    ["12", "stChapters"],
    ["24", "stAch"],
    ["5", "stQuests"],
    ["0", "stAds"],
  ];
  const safety: [Key, Key][] = [
    ["sa1t", "sa1b"],
    ["sa2t", "sa2b"],
    ["sa3t", "sa3b"],
    ["sa4t", "sa4b"],
    ["sa5t", "sa5b"],
    ["sa6t", "sa6b"],
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <RevealRoot />
      <SiteNav lang={lang} setLang={setLang} />

      <main className="flex-1 overflow-x-clip">
        {/* ---------------- hero ---------------- */}
        <section className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(60%_60%_at_70%_20%,rgba(191,226,239,0.9),transparent_70%),radial-gradient(40%_50%_at_10%_10%,rgba(244,180,60,0.18),transparent_70%)]" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-[1fr_1.05fr] md:gap-8 md:pb-20 md:pt-14 lg:gap-14 lg:pt-20">
            <div>
              <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-line bg-paper/80 px-3 py-1.5 text-xs font-medium text-ink-soft sm:text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
                {t("eyebrow")}
              </p>
              <h1 className="animate-rise mt-5 text-balance text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-5xl md:text-[2.9rem] lg:text-[4rem]" style={dl(80)}>
                {t("h1a")} <span className="text-leaf">{t("h1b")}</span>
              </h1>
              <p className="animate-rise mt-5 max-w-xl text-pretty text-base leading-relaxed text-ink-soft sm:text-lg" style={dl(160)}>
                {t("sub")}
              </p>
              <div className="animate-rise mt-8 flex flex-wrap items-center gap-3" style={dl(240)}>
                <Link
                  href="/play"
                  className="group inline-flex items-center gap-2 rounded-full bg-leaf px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-leaf/30 transition hover:-translate-y-0.5 hover:bg-leaf-deep active:translate-y-0"
                >
                  {t("play")}
                  <svg viewBox="0 0 16 16" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </Link>
                <Link href="/daftar" className="rounded-full border border-line bg-paper px-6 py-3.5 text-base font-semibold text-ink transition hover:border-ink/30">
                  {t("account")}
                </Link>
              </div>
              <p className="animate-rise mt-5 text-sm text-ink-soft" style={dl(300)}>
                {t("heroNote")}
              </p>
            </div>
            <div className="animate-rise" style={dl(200)}>
              <HeroScene lang={lang} />
            </div>
          </div>
        </section>

        {/* ---------------- stats ---------------- */}
        <section className="border-y border-line bg-paper">
          <dl className="mx-auto grid max-w-6xl grid-cols-3 px-4 sm:px-6 lg:grid-cols-6">
            {stats.map(([n, k], i) => (
              <div key={k} data-reveal style={dl(i * 50)} className="border-line px-2 py-6 text-center max-lg:[&:nth-child(-n+3)]:border-b lg:border-l lg:first:border-l-0">
                <dt className="sr-only">{t(k)}</dt>
                <dd className="text-3xl font-semibold tabular-nums tracking-tight text-ink sm:text-4xl">{n}</dd>
                <dd className="mt-1 text-xs text-ink-soft sm:text-sm">{t(k)}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------------- modes ---------------- */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <SectionHead kicker={t("modesKicker")} title={t("modesTitle")} />
          <ModesPanel lang={lang} t={t} />
        </section>

        {/* ---------------- features ---------------- */}
        <section id="features" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:pb-28">
          <SectionHead kicker={t("featKicker")} title={t("featTitle")} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon="world" title={t("f1t")} body={t("f1b")} className="lg:col-span-2" />
            <FeatureCard icon="together" title={t("f2t")} body={t("f2b")} delay={60} />
            <FeatureCard icon="door" title={t("f3t")} body={t("f3b")} delay={0} />
            <FeatureCard icon="camera" title={t("f4t")} body={t("f4b")} delay={60} />
            <FeatureCard icon="shirt" title={t("f5t")} body={t("f5b")} delay={120} />
            <FeatureCard icon="book" title={t("f6t")} body={t("f6b")} delay={0} />
            <FeatureCard icon="home" title={t("f7t")} body={t("f7b")} delay={60} className="lg:col-span-2" />
          </div>

          <div className="mt-20 md:mt-28">
            <SectionHead kicker={t("gfxKicker")} title={t("gfxTitle")} body={t("gfxBody")} />
            <div className="mt-10">
              <GraphicsPanel t={t} />
            </div>
          </div>
        </section>

        {/* ---------------- controls ---------------- */}
        <section id="controls" className="border-y border-line bg-[#efeadc]/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
            <SectionHead kicker={t("ctrlKicker")} title={t("ctrlTitle")} />
            <ControlsPanel t={t} />
          </div>
        </section>

        {/* ---------------- play together ---------------- */}
        <section id="together" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <SectionHead kicker={t("togKicker")} title={t("togTitle")} body={t("togBody")} />
              <ol className="mt-10 space-y-3">
                {([["s1t", "s1b"], ["s2t", "s2b"], ["s3t", "s3b"]] as [Key, Key][]).map(([h, b], i) => (
                  <li key={h} data-reveal style={dl(i * 90)} className="group flex gap-5 rounded-2xl border border-transparent p-4 transition hover:border-line hover:bg-paper">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper font-mono text-sm font-semibold text-leaf transition group-hover:bg-leaf group-hover:text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">{t(h)}</h3>
                      <p className="mt-1 leading-relaxed text-ink-soft">{t(b)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lg:sticky lg:top-24">
              <RoomCard t={t} />
            </div>
          </div>
        </section>

        {/* ---------------- parents / safety ---------------- */}
        <section id="parents" className="bg-ink text-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
            <div className="max-w-2xl">
              <p data-reveal className="text-xs font-semibold uppercase tracking-[0.16em] text-sun">{t("parKicker")}</p>
              <h2 data-reveal style={dl(60)} className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
                {t("parTitle")}
              </h2>
              <p data-reveal style={dl(120)} className="mt-4 text-lg leading-relaxed text-white/70">{t("parBody")}</p>
            </div>
            <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
              <ul className="grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2">
                {safety.map(([h, b], i) => (
                  <li key={h} data-reveal style={dl((i % 2) * 80)} className="bg-ink p-6 transition-colors hover:bg-[#15301f]">
                    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
                      <circle cx="10" cy="10" r="10" fill="#f4b43c" />
                      <path d="M6 10.5l2.5 2.5L14 7.5" fill="none" stroke="#10241b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h3 className="mt-4 font-semibold tracking-tight">{t(h)}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/65">{t(b)}</p>
                  </li>
                ))}
              </ul>
              <div data-reveal style={dl(150)} className="self-start rounded-3xl bg-paper p-6 text-ink sm:p-7">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{t("dashTitle")}</p>
                  <span className="h-2 w-2 rounded-full bg-leaf animate-pulse-ring" aria-hidden="true" />
                </div>
                <div className="mt-5 rounded-2xl border border-line p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold">Nara</p>
                    <p className="text-xs text-ink-soft">{t("dashLast")}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {([["level", "7"], ["story", "5/12"], ["quests", "23"]] as [Key, string][]).map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-background px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-ink-soft">{t(k)}</p>
                        <p className="text-lg font-semibold tabular-nums">{v}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("dashLimit")}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5" aria-hidden="true">
                    {["30", "45", "60", "90"].map((m) => (
                      <span key={m} className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${m === "60" ? "border-leaf bg-leaf text-white" : "border-line text-ink-soft"}`}>
                        {m} min
                      </span>
                    ))}
                  </div>
                </div>
                <Link href="/orangtua" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-leaf hover:text-leaf-deep">
                  {t("dashOpen")} <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section id="faq" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead kicker={t("faqKicker")} title={t("faqTitle")} />
            <div data-reveal style={dl(100)}>
              <Faq t={t} />
            </div>
          </div>
        </section>

        {/* ---------------- final CTA ---------------- */}
        <section className="px-4 pb-20 sm:px-6 md:pb-28">
          <div data-reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-leaf px-6 py-16 text-center text-white sm:px-10 md:py-20">
            <svg viewBox="0 0 1200 300" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 w-full" aria-hidden="true">
              <path d="M0 200 Q300 120 600 180 T1200 160 V300 H0Z" fill="#0a5c40" opacity="0.55" />
              <path d="M0 250 Q350 200 700 240 T1200 230 V300 H0Z" fill="#0a5c40" />
            </svg>
            <div className="relative">
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">{t("ctaTitle")}</h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-white/80">{t("ctaBody")}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/play" className="rounded-full bg-sun px-8 py-3.5 font-semibold text-ink shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#ffc657]">
                  {t("play")}
                </Link>
                <Link href="/masuk" className="rounded-full border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white hover:text-ink">
                  {t("login")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}
