# Meadowfar — Checklist eksekusi

Catatan jujur: daftar 50.000 butir tidak akan membantu siapa pun — yang penting adalah daftar yang benar-benar dikerjakan dan dicentang. Ini daftar kerja nyata; butir baru ditambah setiap fase.

## Infrastruktur
- [x] Repo publik GitHub terhubung Vercel (auto-deploy tiap push)
- [x] Domain produksi meadowfar.vercel.app
- [x] Neon Postgres terhubung (pooled connection string)
- [x] Env rahasia hanya di .env.local (gitignored) + Vercel env
- [x] Skema DB: users, progress (JSONB)

## Autentikasi & akun
- [x] Daftar: username, email, sandi, konfirmasi sandi
- [x] Ceklis wajib: syarat & ketentuan + kebijakan privasi
- [x] Validasi server: format username/email, sandi min 8, duplikat 409
- [x] Sandi di-hash bcrypt (cost 10) — tidak pernah disimpan mentah
- [x] Login via username ATAU email
- [x] Sesi cookie HttpOnly + HMAC-SHA256 + expiry 30 hari, Secure di produksi
- [x] Logout endpoint
- [x] Halaman /syarat dan /privasi berbahasa natural
- [x] Tombol "Masuk dengan Google — segera hadir" (nonaktif)
- [x] Akun uji QA dengan progres maksimum (di-seed dari env, kredensial tidak pernah masuk repo)
- [ ] Ganti sandi / lupa sandi (butuh layanan email)
- [x] Dasbor orang tua /orangtua: level, bab kisah, misi, item, prestasi, terakhir main tiap anak
- [x] Batas waktu main harian per anak (0/30/45/60/90 menit) diatur orang tua, tersimpan di DB
- [x] Pengingat istirahat lembut di game saat batas tercapai — mengingatkan, bukan mengunci
- [x] Akses dasbor dijaga kolom users.is_parent (hanya diset skrip seed, bukan pendaftaran)
- [x] Halaman /keluarga: semua penjelajah keluarga, aman dan tidak saling menjatuhkan

## Progression & gameplay
- [x] XP dari item (10) dan misi (30); kurva level kuadratik
- [x] 6 tokoh: 2 awal + 4 terbuka di level 3/5/8/12, tiap tokoh punya aksesori 3D unik
- [x] 5 keahlian nyata di gameplay: lari kilat (Shift), lompat ganda, magnet item, meluncur, sepatu roket
- [x] 5 perlengkapan dengan bonus skor bertingkat
- [x] 12 prestasi dengan syarat terukur (item, misi, lompatan, jarak, level)
- [x] Buku Petualang di dalam game: statistik, keahlian, perlengkapan, prestasi
- [x] Toast antrean untuk naik level / unlock / prestasi (tidak saling menimpa)
- [x] Simpan otomatis: tiap 15 detik + tiap misi selesai + saat keluar halaman
- [x] Mode tamu tetap jalan (localStorage) dengan ajakan buat akun
- [x] Sanitasi progres di server (anti nilai mustahil / cheat payload)
- [x] Biome baru: gurun (kaktus), salju (pinus bersalju), danau (air di lembah)
- [x] Desa NPC prosedural + tetua pencerita, cerita utama 12 bab dua bahasa
- [x] Siklus siang-malam: matahari-bulan-bintang, kunang-kunang malam, lentera menyala
- [x] Hewan peliharaan pengikut: anak anjing (lv3), rubah (lv7), burung (lv10)
- [x] Musik latar prosedural (WebAudio) + tombol nyala/mati
- [x] Dua bahasa penuh (Indonesia/Inggris) dengan toggle di game dan halaman akun
- [x] Prestasi baru: cerita, biome, malam (total 18)
- [x] Lima jenis misi bergilir: kumpul, balapan gerbang, peti harta, antar paket, pecahan bintang
- [x] Balapan waktu: gerbang berurutan, timer longgar, gagal tanpa hukuman
- [x] Rumah pohon tetap + 8 hiasan yang dibuka lewat jumlah misi, bisa dipasang/dilepas
- [x] Tombol "ke rumah pohon" (tanpa jalan kaki jauh dari salju)
- [x] Papan keluarga: level, bab kisah, jumlah item — urut abjad, tanpa peringkat
- [x] Tiap bab kisah punya permintaan tetua yang nyambung ke jenis misi
- [x] 6 prestasi baru (balapan, peti, kurir, rumah, pecahan bintang) — total 24
- [x] Mode foto: stiker emoji ditempel dengan ketukan, bingkai putih, tanda "Meadowfar", simpan PNG
- [x] Rumput bergoyang (instanced + shader), air danau beriak, debu cahaya siang
- [x] Rasa gerak: napas saat diam, ayun tangan-kaki, condong saat lari, pantulan langkah
- [x] Lompat squash & stretch: memanjat saat naik, memipih saat mendarat + kamera turun sekejap
- [x] Sensasi kecepatan: lensa kamera melebar (FOV) & mundur sedikit saat lari kencang
- [x] Efek ambil item: percikan kristal berhamburan + angka "+skor" melayang naik
- [x] Tombol "ganti tokoh" di dalam game (tanpa muat ulang halaman)
- [x] Kaki & tangan berayun dari pinggul/bahu (pivot sendi, bukan tengah limb) — langkah lebih natural
- [x] Penggeser volume suara 0–100 (master gain WebAudio, live, tersimpan) — bukan cuma nyala/mati
- [x] Animasi berenang di danau: pose telungkup, tangan mengayuh bergantian, kaki menendang, badan mengapung
- [x] Grafik lebih realistis: ACES filmic tone mapping + exposure, sRGB output, bayangan lembut (bias/normalBias/radius)
- [x] Hormati prefers-reduced-motion: animasi dekoratif berhenti untuk anak/perangkat yang minta kurangi gerak
- [x] Gambar pratinjau OpenGraph saat link dibagikan (app/opengraph-image.tsx, bertema padang rumput)
- [x] Uji browser nyata (Chrome+WebGL): canvas true, slider volume operable, 0 error konsol

## Fase QA/auditor (September 2026)
- [x] Kontrol relatif kamera: W/stik-atas = maju menjauhi kamera; mouse/stik kanan/geser kanan = putar kanan (tidak terbalik). Invert-Y hanya opsi.
- [x] Gamepad standar (Xbox/PS di Windows, Android Chrome): stik kiri jalan, stik kanan kamera, A lompat, B lari, X gelembung, Y bicara, LB item, RB/R3 kamera, Start menu
- [x] Kontroler layar sentuh: stik mengambang beranimasi (knob mengikuti jari), tombol Lompat/Lari/Tiup/Item/Kamera, multi-sentuh via pointer events
- [x] Kontroler tampil di potret DAN lanskap (dulu tersembunyi oleh `md:hidden` saat HP lanskap lebar >= 768px)
- [x] Semua tombol HUD dijadikan satu Menu (Esc/Tab/Start/tombol) — tidak perlu keyboard di HP
- [x] Kamera orang ketiga (orbit, anti tembus dinding) dan orang pertama (V / tombol / RB)
- [x] Perbaikan rotasi tokoh: sudut di-wrap, tidak lagi berputar jauh saat melewati 180 derajat
- [x] Perbaikan medan: mesh tiap chunk kini diberi posisi dunia (dulu semua chunk bertumpuk di titik asal → lantai "tembus")
- [x] Fisika kotak padat: dinding menahan, lantai/tangga/perabot bisa dipijak, plafon menahan lompatan
- [x] Batang pohon, batu, kaktus kini padat (tidak ada lagi properti palsu yang bisa ditembus)
- [x] Rumah desa berongga dengan pintu terbuka, lantai, plafon, jendela, tangga depan, kasur, meja, bangku, rak buku, lampu — bisa dimasuki
- [x] Desa Padang tetap di dekat titik awal (selalu terlihat, termasuk di HP)
- [x] Rumah pohon: tangga putar, dek berpagar, kabin dengan pintu yang bisa dimasuki
- [x] Interior terpisah: Gua Kristal (permata), Aula Gunung (tangga ke balkon + peti), Arena Latihan (gelombang slime)
- [x] Mode Santai (tanpa nyawa) dan Mode Petualangan (5 hati, slime, pingsan = bangun di rumah tanpa kehilangan barang)
- [x] Tongkat gelembung untuk meletuskan slime (tanpa kekerasan, tanpa darah)
- [x] Lemari pakaian: 5 slot (kepala, baju, jubah, sepatu, punggung), 27 barang, pratinjau 3D berputar
- [x] Tas/inventori: apel, pai, permen bintang, permata gua, kerang — bisa dipakai (Q / LB / tombol Item)
- [x] Koin dari bermain (item, misi, permata, slime, peti) — tidak ada uang sungguhan
- [x] Pembelian uji Solana DEVNET khusus akun orang tua; server membaca transaksi dari RPC devnet dan mencatat tanda tangan (anti pakai ulang)
- [x] Main bareng real-time: ruang pribadi kode 6 karakter, maks 12 pemain, WebRTC P2P, snapshot 15 Hz, ping ditampilkan, emote tetap (tanpa chat teks)
- [x] Pengaturan grafis: preset Rendah/Sedang/Tinggi/Ultra + resolusi render, jarak pandang, kepadatan rumput, bayangan, bloom, AA, FOV, batas FPS, tampilan FPS
- [x] Langit gradasi + matahari/bulan, medan diwarnai per titik (rumput/pasir/salju/batu), pohon bulat & pinus bertingkat, bunga, awan 3D
- [x] Streaming chunk bertahap (terdekat dulu, 2 per frame) — mengurangi patah-patah
- [x] HUD tidak lagi me-render ulang React tiap frame (panah kompas lewat DOM ref)
- [x] Skrip QA Playwright `scripts/qa.mjs` (desktop, HP lanskap & potret, gamepad simulasi, 2 pemain satu ruang)

### Batas yang jujur
- Latensi di bawah 4 ms hanya mungkin di jaringan lokal yang sama (Wi-Fi rumah). Lewat internet, cahaya saja butuh ~1 ms per 100 km pulang-pergi; ping umum 20–100 ms. Game menampilkan ping nyata, bukan angka karangan.
- WebRTC tanpa server TURN bisa gagal di sebagian jaringan sekolah/kantor yang ketat. Butuh layanan TURN berbayar bila ingin 100%.
- Grafis berbasis geometri prosedural di peramban; tidak setara game AAA berbiaya ratusan juta dolar. Target realistisnya: rapi, berwarna, mulus di laptop sekolah.

## Kualitas
- [x] Build produksi lolos TypeScript ketat
- [x] Deploy produksi terverifikasi setelah setiap fase
- [x] Tingkat grafis Otomatis/Ringan/Indah — deteksi otomatis dari jumlah inti CPU dan lebar layar
- [x] Mode ringan: bayangan mati, pixel ratio dibatasi 1.25, rumput & debu dilewati, air tanpa segmen
- [x] Rumput pakai InstancedMesh (satu draw call per chunk), bukan mesh per helai
- [ ] Uji perangkat nyata: Android murah, iPad, laptop sekolah
- [ ] Ukur 60 fps di HP kelas bawah setelah uji perangkat
- [ ] Uji beban API progress
