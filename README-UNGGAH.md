# CARA UNGGAH RESERV DTPHP KE CLOUDFLARE — TANPA TERMINAL

Semua langkah di bawah ini dilakukan 100% di browser. Tidak perlu PowerShell, tidak perlu Node.js di komputer Anda. Estimasi waktu: 15 menit.

Yang perlu disiapkan: akun GitHub (gratis) dan akun Cloudflare (gratis).

---

## BAGIAN 1 — Unggah proyek ke GitHub

1. Buka **github.com** → klik **Sign up** → daftar (gratis) → verifikasi email.
2. Masuk, lalu buka **github.com/new**.
   - Repository name: `reserv-dtphp`
   - Pilih **Public** (gratis)
   - Klik **Create repository**
3. Di halaman repo yang baru dibuat, klik tulisan **"uploading an existing file"**.
4. **Bongkar dulu file ZIP ini** di komputer (klik kanan → Extract All).
5. Buka folder hasil bongkar. **Seret (drag) 4 folder ini sekaligus ke kotak unggah GitHub:** `src`, `public`, `prisma`, `migrations`. Tunggu selesai → klik **Commit changes**.
6. Sekarang **seret semua file yang berada langsung di folder utama** (package.json, wrangler.jsonc, next.config.ts, open-next.config.ts, tsconfig.json, postcss.config.mjs, components.json, eslint.config.mjs, .gitignore, package-lock.json, deploy-cloudflare.mjs, README ini). → klik **Commit changes**.

## BAGIAN 2 — Buat database D1 di Cloudflare

7. Buka **dash.cloudflare.com** → login (daftar gratis bila belum punya).
8. Menu kiri: **Storage & Databases → D1 SQL Database** → **Create**.
   - Name: `reserv-dtphp-db` → Create.
9. Di halaman database itu, **salin tulisan "Database ID"** (panjang, mirip `abcd1234-...`) ke Notepad.

## BAGIAN 3 — Pasang ID database ke konfigurasi

10. Kembali ke **github.com** → repo `reserv-dtphp` → klik file **wrangler.jsonc** → ikon **pensil (Edit)**.
11. Ganti tulisan `GANTI_DENGAN_ID_D1_ANDA` dengan Database ID yang tadi disalin → **Commit changes**.

## BAGIAN 4 — Isi tabel dan data awal (lewat web console D1)

12. Di dashboard Cloudflare → **Storage & Databases → D1 → reserv-dtphp-db → tab Console**.
13. Buka file `migrations/0001_init.sql` (di folder hasil bongkar, pakai Notepad) → salin SEMUA isinya → tempel di Console → **Run**.
14. Lakukan yang sama untuk `migrations/0002_seed.sql` → salin semua → tempel → **Run**.
    (Setelah ini, database berisi: admin kode 01, pengguna kode 02–05, 1 ruangan.)

## BAGIAN 5 — Sambungkan GitHub ke Cloudflare dan bangun otomatis

15. Dashboard Cloudflare → menu kiri **Workers & Pages** → **Create** → pilih **Import an existing Git repository** → **Connect GitHub** → izinkan (Authorize) → pilih repo **reserv-dtphp** → **Begin setup**.
16. Pada pengaturan build:
    - **Build command**: `npx opennextjs-cloudflare build`
    - **Deploy command**: `npx wrangler deploy`
    - Tambahkan **Variable**: nama `NODE_VERSION` nilai `22`
17. Klik **Save and Deploy** → tunggu 2–4 menit (build pertama agak lama, normal).
18. Selesai! Alamat website Anda muncul, bentuknya:
    `https://reserv-dtphp.<nama-akun-anda>.workers.dev`

## BAGIAN 6 — Coba masuk

- Buka alamat di atas → masukkan kode akses:
  - **Admin: 01** (boleh tambah user lewat menu Pengguna)
  - **Pengguna: 02, 03, 04, 05**

---

## Update aplikasi nanti

- Ubah kode di GitHub (Edit langsung di web, atau dari komputer) → Cloudflare otomatis membangun ulang dalam beberapa menit. **Data tidak hilang.**
- Kelola pengguna/ruangan/jam operasional langsung dari menu admin di aplikasi.

## Kalau ada yang gagal

Salin/tempel pesan error yang muncul (GitHub maupun Cloudflare) ke asisten — akan dibantu sampai jalan.
