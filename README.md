# Static Web Tools

Kumpulan proyek web statis mandiri berbasis HTML, CSS, dan Vanilla JavaScript yang dapat dijalankan langsung di browser tanpa instalasi atau *build tools*.

## Index Otomatis (Root & Direktori Lompat)

Halaman index pada root (`index.html`) maupun direktori lompat (`pwa-wrapper/index.html` dan `tugas-kuliah/index.html`) dibuat mandiri (*standalone*) dengan kemampuan berikut:

- **Deteksi Folder Otomatis:** Mengambil daftar subdirektori secara dinamis melalui GitHub Contents API (`contents/` untuk root, `contents/<subpath>` untuk direktori lompat), dilengkapi *cache* `sessionStorage` selama 5 menit serta daftar *fallback* lokal jika offline atau terkena *rate-limit*.
- **Metadata Otomatis:** Membaca `<title>` dan `<meta name="description">` langsung dari `index.html` masing-masing subproyek.
- **Pratinjau & Interaksi:** Menampilkan kartu pratinjau langsung (*live scaled iframe*), modal pratinjau interaktif (mode Desktop, Tablet, Mobile), pencarian *real-time*, dan dukungan tema terang/gelap.
- **Navigasi Direktori Lompat:** Setiap direktori lompat (`pwa-wrapper/`, `tugas-kuliah/`) memiliki tautan kembali ke root (`../`) pada badge header.

## Cara Kerja Card Preview

Berikut penjelasan mekanisme *card preview* yang digunakan pada `index.html`, `pwa-wrapper/index.html`, dan `tugas-kuliah/index.html`:

### 1. Teknologi di Balik Card Preview

*Card preview* tidak memakai *screenshot* statis, melainkan *live* `<iframe>` berskala kecil dengan kombinasi 4 teknik bawaan browser (Vanilla CSS & JS):

- **Virtual Desktop + CSS Scale (`index.html`):**
  - Elemen `<iframe>` (`.card-preview-frame`) diberi ukuran tetap layaknya layar desktop (`1280px × 800px`), lalu diperkecil menggunakan `transform: scale(var(--preview-scale))` dan `transform-origin: top left` agar pas di wadah kartu berasio `16 / 10`.
  - Properti `pointer-events: none` dan `tabIndex = -1` dipasang supaya *thumbnail* tidak dapat digulir (*scroll*) atau diklik secara langsung; klik pada kartu justru membuka *Preview Modal* interaktif.
- **ResizeObserver (`index.html`):**
  - Memantau lebar tiap kartu secara responsif, lalu menghitung `--preview-scale = width / 1280` secara otomatis saat ukuran layar berubah.
- **IntersectionObserver + Lazy Loading (`index.html`):**
  - URL proyek disimpan terlebih dahulu di `data-src` (bukan `src`), dan baru diisikan ke `iframe.src` ketika kartu mendekati *viewport* (`rootMargin: '150px'`), ditambah atribut `loading="lazy"`. Teknik ini mencegah browser memuat seluruh halaman sekaligus saat awal dibuka.
- **Skeleton Shimmer (`index.html`):**
  - Saat `<iframe>` masih memuat, animasi *shimmer* ditampilkan. Begitu *event* `load` pada `<iframe>` selesai, kelas `.is-loaded` ditambahkan untuk memunculkan `<iframe>` secara halus (`opacity: 0 → 1`).

---

### 2. Mengapa Iframe Tidak Terkena Blokir?

Pemblokiran `<iframe>` oleh browser umumnya disebabkan oleh *header* keamanan HTTP dari server target (`X-Frame-Options: DENY/SAMEORIGIN` atau `Content-Security-Policy: frame-ancestors ...`). Pada proyek ini, `<iframe>` dapat dimuat karena alasan berikut:

1. **Same-Origin (Satu Asal):**  
   Semua halaman dimuat melalui *relative path* `./<nama-folder>/index.html` pada *origin* yang sama persis (baik di `https://krasyid822.github.io/static-web-tools/...` maupun di `http://localhost:8000/...`).
2. **Tidak Ada Header Pemblokir Frame:**  
   Baik GitHub Pages maupun server lokal di `localhost.sh` (`python3 -m http.server`, `php -S`, `serve`) secara bawaan tidak mengirimkan *header* `X-Frame-Options: DENY` atau `CSP frame-ancestors 'none'`.
3. **Catatan Khusus (Batasan):**
   - Jika halaman proyek di dalamnya melakukan *redirect* langsung ke situs eksternal (seperti beberapa *wrapper* PWA yang mengarah ke domain pihak ketiga seperti Canva, Gemini, atau Copilot), situs eksternal tersebut dapat memblokir tampilan di dalam `<iframe>` karena menerapkan `X-Frame-Options` atau `CSP frame-ancestors`.
   - Jika dibuka langsung melalui protokol `file://` (tanpa server lokal), browser juga dapat membatasi sebagian perilaku `fetch` maupun `<iframe>` bergantung pada kebijakan keamanan masing-masing browser.

## Lint

- Pemeriksaan sintaks **JavaScript** menggunakan `node -e (new Function(...))`.