# Panduan AI Agent (`agents.md`)

Dokumen ini berfungsi sebagai instruksi utama bagi AI Agent (seperti Cursor, Copilot, Claude, dll.) saat berinteraksi, memodifikasi, atau membuat kode di dalam repositori ini.

## 1. Konteks Repositori

Repositori ini adalah kumpulan dari berbagai **proyek web statis (*static web*)** yang dibangun murni menggunakan teknologi dasar web: **HTML, CSS, dan JavaScript (Vanilla)**.

Setiap proyek dipisahkan ke dalam direktorinya masing-masing di tingkat *root* (atau sesuai struktur folder yang ada) dan bersifat mandiri (*standalone*).

## 2. Struktur Direktori Standar

Setiap folder proyek di dalam repositori ini harus mengikuti struktur dasar berikut agar tetap rapi dan konsisten:

```
/
├── agents.md               # File panduan ini
├── README.md               # Daftar isi atau dokumentasi umum repositori
├── nama-proyek-1/          # Folder proyek mandiri ke-1
│   ├── index.html          # Titik masuk utama (entry point)
│   ├── css/                # Folder stylesheet (atau style.css di root proyek)
│   │   └── style.css
│   ├── js/                 # Folder skrip (atau script.js di root proyek)
│   │   └── script.js
│   └── assets/             # Gambar, font, ikon, atau media lokal lainnya
└── nama-proyek-2/          # Folder proyek mandiri ke-2
    └── ...
```

## 3. Aturan & Batasan Teknologi (Strict Rules)

Saat membuat proyek baru atau memodifikasi proyek yang sudah ada, AI Agent **WAJIB** mematuhi aturan berikut:

1. **Tanpa Framework & Build Tools:**
   * **DILARANG** menggunakan framework modern seperti React, Vue, Angular, Svelte, atau Next.js.
   * **DILARANG** memperkenalkan *bundler* atau *package manager* seperti Node.js (`package.json`), Webpack, Vite, atau Parcel.
   * Semua kode harus dapat dijalankan langsung di browser cukup dengan membuka file `index.html` atau menggunakan *local static server* sederhana (seperti Live Server).

2. **Isolasi Proyek (Standalone):**
   * Setiap folder proyek harus berdiri sendiri. **Jangan** membuat ketergantungan lintas folder (misalnya: `proyek-a` mengimpor file CSS atau JS dari `proyek-b`).
   * Selalu gunakan *relative path* (contoh: `./css/style.css` atau `assets/logo.png`) dan hindari *absolute path* dari root domain (`/css/style.css`) agar proyek tetap berjalan baik meskipun dibuka lewat protokol `file://` atau *sub-path* GitHub Pages.

3. **Standar Kode:**
   * **HTML5:** Gunakan tag semantik (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<nav>`) dan pastikan struktur aksesibilitas dasar (seperti atribut `alt` pada gambar dan `label` pada input) terpenuhi.
   * **CSS3:** Utamakan penggunaan CSS Variables (`:root`) untuk warna dan tipografi, serta Flexbox/CSS Grid untuk tata letak yang responsif (*mobile-first*). Library CSS berbasis CDN (seperti Tailwind CDN atau Bootstrap CDN) hanya boleh digunakan jika diminta secara eksplisit oleh pengguna.
   * **JavaScript (ES6+):** Gunakan Vanilla JS modern (`const`/`let`, *arrow functions*, `fetch API`, DOM manipulation standar). Hindari penggunaan jQuery kecuali diminta.

4. **Utamakan Holistic SEO (Technical, Content, & UX SEO):**
   Setiap halaman HTML yang dibuat harus dioptimalkan secara menyeluruh (*holistic*) sejak awal penulisan kode:
   * **Technical & Meta SEO:**
     * Wajib menyertakan `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, `<title>` yang unik dan deskriptif, serta `<meta name="description">` yang relevan.
     * Sertakan tag **Open Graph** (`og:title`, `og:description`, `og:image`, `og:type`) dan Twitter Cards untuk optimasi saat dibagikan ke media sosial.
     * Gunakan `<link rel="canonical">` jika relevan, dan pastikan atribut `lang` pada tag `<html>` sesuai dengan bahasa konten (misal: `lang="id"`).
     * Tambahkan **Structured Data (JSON-LD)** (`<script type="application/ld+json">`) sesuai konteks halaman (seperti `WebSite`, `Article`, `SoftwareApplication`, atau `FAQPage`).
   * **Semantic & Content Hierarchy:**
     * Terapkan hierarki *heading* yang ketat dan logis: hanya **satu** tag `<h1>` per halaman untuk topik utama, diikuti `<h2>`, `<h3>`, dst. secara berurutan tanpa melompati level.
     * Hindari merender konten teks utama secara dinamis lewat JavaScript jika bisa ditulis langsung di HTML statis (agar mudah di-*crawl* oleh mesin pencari).
   * **Performance & Core Web Vitals (UX SEO):**
     * Optimalkan *Largest Contentful Paint (LCP)* dan *Cumulative Layout Shift (CLS)*: selalu tentukan atribut `width` dan `height` pada tag `<img>` serta gunakan `loading="lazy"` untuk gambar di bawah layar (*below the fold*).
     * Muat skrip JavaScript secara non-blocking menggunakan atribut `defer` pada tag `<script>`.
     * Pastikan kontras warna teks memadai dan elemen interaktif mudah diakses di perangkat seluler (*mobile-friendly*).

## 4. Alur Kerja AI Agent

* **Membuat Proyek Baru:** Buat folder baru di *root* dengan penamaan `kebab-case` (contoh: `kalkulator-sederhana`, `landing-page-kopi`). Lengkapi dengan file minimal `index.html`, `style.css`, dan `script.js`.
* **Memodifikasi Proyek:** Pastikan perubahan hanya berdampak pada folder proyek yang sedang dikerjakan tanpa merusak atau mengubah file di folder proyek lain.
* **Dokumentasi:** Jika menambahkan proyek baru yang cukup kompleks, tambahkan file `README.md` singkat di dalam folder proyek tersebut yang menjelaskan cara kerja atau fitur utamanya.