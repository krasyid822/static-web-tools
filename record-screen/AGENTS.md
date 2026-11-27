# AGENTS.md

## Konteks Proyek
Aplikasi perekam layar (screen recorder) berbasis web murni menggunakan Vanilla HTML, CSS, dan JavaScript tanpa *build tools*, *bundler*, atau *framework* eksternal. Aplikasi ini mengandalkan Web API bawaan browser (`MediaDevices.getDisplayMedia`, `MediaDevices.getUserMedia`, `MediaRecorder`, dan `AudioContext`) untuk merekam layar, audio sistem, dan mikrofon langsung di sisi klien (*client-side*).

---

## Arsitektur & Struktur File
Pertahankan struktur flat dan modular menggunakan ES Modules bawaan browser (`type="module"`):

```text
/
├── index.html          # Struktur semantik UI, kontrol perekaman, dan elemen <video> preview
├── css/
│   └── style.css       # Styling responsif, CSS Variables, state indikator (recording/paused)
├── js/
│   ├── app.js          # Entry point: inisialisasi event listener dan koordinasi state UI
│   ├── recorder.js     # Logika inti MediaDevices, penggabungan stream audio, dan MediaRecorder
│   └── utils.js        # Helper: format durasi (MM:SS), manajemen Blob/URL, validasi dukungan browser
└── AGENTS.md           # Dokumentasi instruksi dan batasan untuk AI coding agent

```

---

## Aturan Ketat (Strict Constraints)

1. **Zero Dependencies:** Dilarang menginstal atau mengimpor library eksternal (npm, CDN, jQuery, Tailwind, Bootstrap, dll.). Semua komponen UI dan logika wajib menggunakan HTML5, CSS3, dan ES6+ murni.
2. **No Build Step:** Kode harus dapat langsung dijalankan melalui HTTP server lokal sederhana (seperti `npx serve` atau VS Code Live Server) tanpa proses kompilasi.
3. **Client-Side Only:** Tidak ada pengiriman data video/audio ke server mana pun. Seluruh pemrosesan berlangsung di memori browser pengguna.
4. **HTTPS / Localhost Context:** Ingat bahwa `navigator.mediaDevices` hanya tersedia dalam *Secure Context* (`https://` atau `http://localhost`). Jangan membuat fallback HTTP biasa yang tidak valid.

---

## Panduan Teknis & Pola Kode

### 1. Manajemen Media Stream (`js/recorder.js`)

* **Video & Audio Sistem:** Gunakan `navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })`.
* **Audio Mikrofon (Opsional):** Jika pengguna mengaktifkan mikrofon bersamaan dengan audio sistem, gabungkan kedua `MediaStreamTrack` audio menggunakan `AudioContext` dan `MediaStreamAudioDestinationNode` sebelum memasukkannya ke `MediaRecorder`, karena `MediaRecorder` sering kali hanya merekam trek audio pertama jika digabungkan langsung secara mentah.
* **Cleanup Wajib:** Selalu hentikan semua trek (`stream.getTracks().forEach(track => track.stop())`) ketika perekaman selesai, dibatalkan, atau pengguna menekan tombol *"Stop sharing"* bawaan browser (`track.onended`).

### 2. Konfigurasi MediaRecorder & Codec

* Periksa dukungan MIME type secara dinamis menggunakan `MediaRecorder.isTypeSupported()`.
* Urutan prioritas fallback MIME type:
1. `video/webm;codecs=vp9,opus`
2. `video/webm;codecs=vp8,opus`
3. `video/webm`
4. `video/mp4` (untuk kompatibilitas Safari modern)


* Simpan potongan data ke dalam array `chunks = []` pada event `ondataavailable`.
* Setelah event `onstop`, buat `Blob`, hasilkan URL objek dengan `URL.createObjectURL(blob)`, dan pastikan `URL.revokeObjectURL()` dipanggil saat rekaman baru dimulai untuk mencegah *memory leak*.

### 3. State Management UI (`js/app.js`)

Kelola antarmuka secara eksplisit berdasarkan 4 state berikut:

* `IDLE`: Tombol *Start* aktif; tombol *Pause*, *Resume*, *Stop*, dan *Download* nonaktif/tersembunyi.
* `RECORDING`: Indikator visual merah aktif, timer berjalan, tombol *Pause* dan *Stop* aktif.
* `PAUSED`: Timer berhenti sementara, indikator visual berubah status, tombol *Resume* dan *Stop* aktif.
* `PREVIEW`: Video hasil rekaman dimuat ke elemen `<video controls>`, tombol *Download* aktif dengan nama file berformat `recording-YYYY-MM-DD-HHmmss.webm`.

### 4. Penanganan Error

Tangani penolakan izin pengguna atau perangkat tidak didukung secara eksplisit menggunakan `try...catch`:

* `NotAllowedError`: Pengguna membatalkan dialog pemilihan layar atau menolak izin mikrofon. Tampilkan pesan status yang jelas tanpa merusak state aplikasi.
* `NotFoundError`: Perangkat audio/video yang diminta tidak ditemukan.
* `NotSupportedError`: Browser tidak mendukung `getDisplayMedia` (misalnya browser mobile tertentu).

---

## Konvensi Penamaan & Gaya Kode

* **JavaScript:** Gunakan `const` dan `let` (dilarang `var`), `async/await` untuk operasi asinkron, serta JSDoc singkat untuk fungsi publik. Gunakan `camelCase` untuk variabel/fungsi dan `UPPER_SNAKE_CASE` untuk konstanta state/konfigurasi.
* **CSS:** Gunakan CSS Custom Properties (`--color-primary`, `--color-danger`, dll.) di `:root` dan metodologi penamaan kelas BEM sederhana (contoh: `.controls__btn--record`).
* **HTML:** Gunakan atribut `aria-live="polite"` pada elemen timer dan pesan status agar aksesibel bagi pembaca layar.

---

## Daftar Periksa Sebelum Menyelesaikan Tugas

Sebelum menganggap perubahan kode selesai, pastikan hal-hal berikut terpenuhi:

* [ ] Menekan tombol *"Stop sharing"* bawaan browser memicu fungsi stop aplikasi secara bersih (tidak menggantung di state `RECORDING`).
* [ ] Tidak ada memori yang bocor dari `URL.createObjectURL` atau `MediaStream` yang masih menyala (ikon tab perekaman di browser harus hilang setelah stop).
* [ ] Rekaman dengan kombinasi layar + audio sistem + mikrofon menghasilkan file yang memiliki kedua sumber suara secara sinkron.
* [ ] UI tetap fungsional dan tidak *overflow* pada layar ukuran desktop maupun tablet.