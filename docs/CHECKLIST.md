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

## Kualitas
- [x] Build produksi lolos TypeScript ketat
- [x] Deploy produksi terverifikasi setelah setiap fase
- [x] Tingkat grafis Otomatis/Ringan/Indah — deteksi otomatis dari jumlah inti CPU dan lebar layar
- [x] Mode ringan: bayangan mati, pixel ratio dibatasi 1.25, rumput & debu dilewati, air tanpa segmen
- [x] Rumput pakai InstancedMesh (satu draw call per chunk), bukan mesh per helai
- [ ] Uji perangkat nyata: Android murah, iPad, laptop sekolah
- [ ] Ukur 60 fps di HP kelas bawah setelah uji perangkat
- [ ] Uji beban API progress
