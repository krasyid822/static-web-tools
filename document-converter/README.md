# Document to Image & Compressor

Aplikasi web **100% client-side** untuk mengonversi dokumen **PDF** dan **PPTX** menjadi gambar individual (PNG, JPEG, atau WebP) dalam arsip `.zip`, serta mengompres ukuran file PDF dan PPTX berdasarkan target ukuran. Seluruh pemrosesan berjalan langsung di browser pengguna tanpa mengunggah file ke server mana pun.

---

## Fitur Utama

### 1. Konversi ke Gambar (ZIP)
- **Format Dokumen:** Mendukung file **PDF** (`.pdf`) dan **PowerPoint** (`.pptx`).
- **Format Gambar Output:**
  - **PNG** (Lossless)
  - **JPEG** (dengan pengaturan kualitas `0.1` – `1.0`, default `0.85`)
  - **WebP** (dengan pengaturan kualitas `0.1` – `1.0`, default `0.85`)
- **Pilihan Resolusi (DPI):**
  - `1.0x` (72 DPI)
  - `1.5x` (108 DPI)
  - `2.0x` (144 DPI — default)
  - `3.0x` (216 DPI)
- **Pemilihan Rentang Halaman / Slide:**
  - **All Pages:** Mengonversi seluruh halaman/slide.
  - **Custom Range:** Mengonversi halaman tertentu, misalnya `1-3, 5, 8-10`.
- **Penamaan & Pengemasan ZIP:**
  - Nama file gambar di dalam arsip menggunakan *zero-padding* (misalnya `page_001.png`, `page_002.png`) agar berurutan secara kronologis.
  - Menggunakan kompresi `STORE` pada JSZip untuk menghindari kompresi ulang yang tidak perlu pada gambar yang sudah terkompresi.

### 2. Kompresi Dokumen
- **Kompresi Berdasarkan Target Ukuran:** Menentukan target ukuran file dalam satuan **KB** atau **MB**.
- **Preset Cepat:** Tombol preset **25%**, **50%**, dan **75%** dari ukuran file asli.
- **Penyesuaian Otomatis:** Kualitas dan resolusi disesuaikan secara otomatis untuk mencapai target ukuran yang diinginkan.

### 3. Privasi, Performa & Antarmuka
- **100% Client-Side:** Tidak ada backend atau unggahan file ke server.
- **Validasi File:** Memeriksa MIME type dan *magic bytes* file sebelum diproses, serta menangani error (seperti PDF terenkripsi/terproteksi kata sandi atau file rusak) dengan pesan yang jelas.
- **Manajemen Memori:** Rendering dilakukan secara sekuensial menggunakan `canvas.toBlob()` dan membersihkan dimensi kanvas setelah tiap halaman untuk mencegah *Out of Memory* (OOM) pada dokumen besar.
- **Kontrol Proses:** Progress bar *real-time*, tombol **Cancel** untuk menghentikan proses di tengah jalan, dan tombol unduh ulang setelah selesai.
- **UI Responsif & Tema:** Mendukung *drag-and-drop*, *file picker*, serta tombol pengubah tema **Dark / Light Mode**.

---

## Teknologi yang Digunakan

- **HTML5, CSS3, Vanilla ES6+ Modules** — Tanpa *build step*, *bundler*, atau framework tambahan.
- **[pdf.js](https://mozilla.github.io/pdf.js/)** (`v3.11.174` via CDN) — Rendering halaman PDF di browser.
- **[JSZip](https://stuk.github.io/jszip/)** (`v3.10.1` via CDN) — Pembuatan arsip `.zip` dan pembacaan/pengemasan `.pptx`.

---

## Struktur Direktori

```text
/
├── index.html               # Markup utama & impor script CDN/modul
├── css/
│   └── style.css            # Styling, layout responsif, drag-and-drop, tema gelap/terang
├── js/
│   ├── app.js               # Manajemen state UI, event listener, dan pembaruan DOM
│   ├── pdfConverter.js      # Pemuatan PDF.js, parser rentang halaman, rendering kanvas sekuensial
│   ├── pptxConverter.js     # Validasi, parsing, dan rendering slide PPTX ke kanvas
│   ├── documentCompressor.js# Kompresi PDF & PPTX berdasarkan target ukuran
│   └── zipBundler.js        # Wrapper JSZip dan pemicu unduhan file
├── AGENTS.md                # Panduan arsitektur & aturan pengembangan
└── README.md                # Dokumentasi proyek
```

---

## Cara Menjalankan secara Lokal

Karena aplikasi ini menggunakan **ES Modules** (`<script type="module">`), Anda harus membukanya melalui **static HTTP server** (bukan langsung melalui protokol `file://`).

Pilih salah satu perintah berikut di direktori proyek:

```bash
# Menggunakan Python 3
python3 -m http.server 8000
```

atau

```bash
# Menggunakan Node.js (npx)
npx serve .
```

Setelah server berjalan, buka browser dan akses `http://localhost:8000` (atau port yang ditampilkan di terminal).

---

## Cara Penggunaan

1. **Unggah File:** Seret dan lepas (*drag & drop*) file `.pdf` atau `.pptx` ke area unggah, atau klik **Browse File**.
2. **Pilih Mode:**
   - **Convert to Images (ZIP):**
     1. Pilih format gambar (`PNG`, `JPEG`, atau `WebP`) dan resolusi DPI.
     2. Jika memilih `JPEG` atau `WebP`, atur slider kualitas sesuai kebutuhan.
     3. Pilih **All Pages** atau masukkan **Custom Range** (contoh: `1-3, 5, 8-10`).
     4. Klik **Convert & Download ZIP**.
   - **Compress Document:**
     1. Masukkan target ukuran file (`KB` atau `MB`), atau pilih salah satu tombol preset (`25%`, `50%`, `75%`).
     2. Klik **Compress & Download**.
3. **Unduh Hasil:** File hasil akan terunduh otomatis. Anda juga dapat menekan tombol unduh ulang pada panel hasil jika diperlukan.
