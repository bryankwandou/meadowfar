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
- [ ] Dasbor orang tua untuk 12 akun anak

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
- [ ] Biome baru (gurun, salju, danau)
- [ ] NPC desa + cerita 12 bab
- [ ] Siklus siang-malam
- [ ] Hewan peliharaan pengikut
- [ ] Musik latar prosedural
- [ ] Rumah pohon + dekorasi
- [ ] Papan peringkat keluarga
- [ ] Mode foto

## Kualitas
- [x] Build produksi lolos TypeScript ketat
- [x] Deploy produksi terverifikasi setelah setiap fase
- [ ] Uji perangkat nyata: Android murah, iPad, laptop sekolah
- [ ] Target 60 fps di HP kelas bawah (LOD + instancing)
- [ ] Uji beban API progress
