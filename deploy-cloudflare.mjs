#!/usr/bin/env node
/**
 * ============================================================
 *  RESERV DTPHP — Deploy Otomatis ke Cloudflare
 * ============================================================
 *  Cara pakai (hanya 1 perintah, dari folder proyek):
 *
 *      node deploy-cloudflare.mjs
 *
 *  Script ini otomatis:
 *   1. Memasang dependensi (jika belum)
 *   2. Login akun Cloudflare (browser terbuka, klik "Allow")
 *   3. Membuat database D1 dan menyambungkannya ke proyek
 *   4. Membuat tabel + mengisi data awal (user 01-05, ruangan)
 *   5. Build dan upload aplikasi ke Cloudflare Workers
 *   6. Menampilkan alamat website Anda
 *
 *  Aman dijalankan berulang kali — langkah yang sudah selesai
 *  akan dilewati/diulang dengan aman.
 * ============================================================
 */
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const DB_NAME = 'reserv-dtphp-db'
const PLACEHOLDER = 'GANTI_DENGAN_ID_D1_ANDA'
const ROOT = process.cwd()
const WRANGLER = path.join(ROOT, 'wrangler.jsonc')
const isWin = os.platform() === 'win32'
const NPM = isWin ? 'npm.cmd' : 'npm'
const NPX = isWin ? 'npx.cmd' : 'npx'

const step = (n, msg) => console.log(`\n==== Langkah ${n}: ${msg} ====`)
const ok = (msg) => console.log(`  [OK] ${msg}`)

function run(cmd, args, opts = {}) {
  const shell = opts.shell ?? (isWin && (cmd === NPM || cmd === NPX))
  const res = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', shell, ...opts })
  const stdout = res.stdout || ''
  const stderr = res.stderr || ''
  return { ...res, out: `${stdout}\n${stderr}`, stdout, stderr }
}

/** Menjalankan perintah dengan output langsung tampil, lalu mengembalikan seluruh teksnya. */
function runStream(cmd, args) {
  return new Promise((resolve) => {
    const shell = isWin && (cmd === NPM || cmd === NPX)
    const child = spawn(cmd, args, { shell, env: { ...process.env, CI: '1' } })
    let buf = ''
    child.stdout.on('data', (d) => {
      buf += d.toString()
      process.stdout.write(d)
    })
    child.stderr.on('data', (d) => {
      buf += d.toString()
      process.stderr.write(d)
    })
    child.on('close', (code) => resolve({ status: code, out: buf }))
    child.on('error', (err) => resolve({ status: 1, out: String(err) }))
  })
}

function die(msg) {
  console.error(`\n  [GAGAL] ${msg}`)
  console.error('  Kirim pesan error di atas ke asisten untuk dibantu.\n')
  process.exit(1)
}

function parseD1List(out) {
  try {
    return JSON.parse(out.slice(out.indexOf('[')))
  } catch {
    return null
  }
}

// ---------- Langkah 1: pastikan dependensi ----------
step(1, 'Memeriksa dependensi proyek')
if (!fs.existsSync(path.join(ROOT, 'node_modules', 'wrangler'))) {
  console.log('  Memasang dependensi (sekali saja, mohon tunggu)...')
  const r = run(NPM, ['install'], { stdio: 'inherit' })
  if (r.status !== 0) die('npm install gagal. Pastikan Node.js 20+ sudah terpasang (nodejs.org).')
}
ok('Dependensi siap')

// ---------- Langkah 2: login Cloudflare ----------
step(2, 'Login akun Cloudflare')
let who = run(NPX, ['wrangler', 'whoami'])
if (who.status !== 0 || /not authenticated/i.test(who.out)) {
  console.log('  Browser akan terbuka — silakan klik tombol "Allow" untuk mengizinkan akses.')
  const login = run(NPX, ['wrangler', 'login'], { stdio: 'inherit' })
  if (login.status !== 0) die('Gagal login ke Cloudflare.')
  who = run(NPX, ['wrangler', 'whoami'])
  if (who.status !== 0) die('Login belum berhasil terverifikasi. Jalankan lagi script ini.')
}
ok('Terhubung ke akun Cloudflare Anda')

// ---------- Langkah 3: database D1 ----------
step(3, 'Menyiapkan database D1')
let db = null
{
  const listed = parseD1List(run(NPX, ['wrangler', 'd1', 'list', '--json']).out)
  if (listed) db = listed.find((d) => d.name === DB_NAME) ?? null
  if (!db) {
    console.log(`  Membuat database "${DB_NAME}"...`)
    const created = run(NPX, ['wrangler', 'd1', 'create', DB_NAME])
    if (created.status !== 0) die(`Gagal membuat database D1:\n${created.out.slice(0, 600)}`)
    const again = parseD1List(run(NPX, ['wrangler', 'd1', 'list', '--json']).out)
    db = again?.find((d) => d.name === DB_NAME) ?? null
    if (!db) die('Database dibuat tetapi ID-nya tidak ketemu. Jalankan lagi script ini.')
  }
}
ok(`Database D1 siap (id: ${db.uuid})`)

// Sambungkan ID database ke wrangler.jsonc
let cfg = fs.readFileSync(WRANGLER, 'utf8')
if (cfg.includes(PLACEHOLDER)) {
  cfg = cfg.replace(PLACEHOLDER, db.uuid)
  fs.writeFileSync(WRANGLER, cfg)
  ok('wrangler.jsonc diperbarui dengan ID database')
} else if (cfg.includes(db.uuid)) {
  ok('wrangler.jsonc sudah terhubung dengan database yang benar')
} else {
  cfg = cfg.replace(/("database_id"\s*:\s*")[^"]*(")/, `$1${db.uuid}$2`)
  fs.writeFileSync(WRANGLER, cfg)
  ok('wrangler.jsonc diperbarui dengan ID database')
}

// ---------- Langkah 4: tabel + data awal ----------
step(4, 'Membuat tabel dan data awal di D1 (mohon tunggu, ± 1 menit)')
const m1 = run(NPX, ['wrangler', 'd1', 'execute', DB_NAME, '--remote', '--file=./migrations/0001_init.sql', '-y'])
if (m1.status !== 0) die(`Gagal membuat tabel:\n${m1.out.slice(0, 600)}`)
ok('Tabel siap (User, Room, Reservation, Settings)')

const m2 = run(NPX, ['wrangler', 'd1', 'execute', DB_NAME, '--remote', '--file=./migrations/0002_seed.sql', '-y'])
if (m2.status !== 0) die(`Gagal mengisi data awal:\n${m2.out.slice(0, 600)}`)
ok('Data awal terisi — admin kode 01, pengguna kode 02 s.d. 05')

// ---------- Langkah 5: build & deploy ----------
step(5, 'Build dan upload ke Cloudflare Workers (1-3 menit, mohon tunggu)')
const dep = await runStream(NPM, ['run', 'cf:deploy'])
if (dep.status !== 0) die('Deploy gagal. Periksa pesan error di atas.')

// ---------- Selesai ----------
const urls = [...dep.out.matchAll(/https:\/\/[a-z0-9.-]+\.workers\.dev/gi)].map((m) => m[0])
const url = urls.length ? [...new Set(urls)].pop() : 'https://reserv-dtphp.<subdomain-anda>.workers.dev'
console.log(`
============================================================
  SELESAI! RESERV DTPHP sudah ONLINE di Cloudflare.

  Alamat website  : ${url}

  Kode akses masuk:
    - Admin    : 01
    - Pengguna : 02, 03, 04, 05

  Tips:
    - Update aplikasi nanti: ubah kodenya, lalu jalankan lagi
      "node deploy-cloudflare.mjs" (data tidak akan hilang).
    - Custom domain: dashboard Cloudflare > Workers & Pages >
      reserv-dtphp > Settings > Domains & Routes.
============================================================
`)
