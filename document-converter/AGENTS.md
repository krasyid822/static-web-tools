# AGENTS.md — Client-Side PDF to ZIP Image Converter

## 1. Project Overview
Build a client-side web application that converts PDF documents into individual page images (PNG, JPEG, or WebP) and bundles them into a downloadable `.zip` archive. All processing must execute locally in the user's browser without uploading files to a backend server.

## 2. Core Tech Stack & Constraints
- **Architecture:** 100% Client-Side (Static HTML5, CSS3, Vanilla ES6+ JavaScript — or lightweight framework-free structure suitable for static hosting).
- **PDF Rendering Engine:** `pdf.js` (`pdfjs-dist` via CDN or local vendor bundle, with explicit `workerSrc` configuration).
- **Archive Bundler:** `JSZip` (for in-memory `.zip` generation) + native `Blob` / `URL.createObjectURL` download trigger.
- **No Backend / No Server Uploads:** Zero server-side file processing. Ensure privacy and zero server storage overhead.
- **Responsive UI:** Clean, dark/light-aware, accessible interface with drag-and-drop file input.

## 3. Functional Requirements
1. **File Input & Validation:**
   - Support drag-and-drop and standard file picker (`accept="application/pdf"`).
   - Validate MIME type (`application/pdf`) and magic bytes (`%PDF-`) before processing.
   - Display file metadata: filename, file size, and total page count upon load.
2. **Conversion Configuration:**
   - **Image Format:** PNG (lossless), JPEG (adjustable quality `0.1`–`1.0`, default `0.85`), WebP.
   - **Resolution / Scale (DPI):** Dropdown or slider for render scale (`1.0x` / 72 DPI, `1.5x` / 108 DPI, `2.0x` / 144 DPI default, `3.0x` / 216 DPI).
   - **Page Range Selection:** Option to convert `All Pages` or specific range/pages (e.g., `1-3, 5, 8-10`) with input validation against `numPages`.
   - **Naming Pattern:** Zero-padded page filenames inside the ZIP (e.g., `page_001.png`, `page_002.png` based on digit length of `numPages`).
3. **Processing Pipeline & Memory Management:**
   - Render pages sequentially (one by one) using an offscreen `<canvas>` to prevent browser tab crashes (OOM) on large PDFs.
   - Convert canvas directly to `Blob` via `canvas.toBlob()` rather than memory-heavy Base64 data URLs.
   - Append each image `Blob` immediately to the `JSZip` instance, then clear/reset canvas dimensions (`canvas.width = 0; canvas.height = 0;`) after each page to release GPU/RAM buffers.
   - Provide real-time progress UI: progress bar, current page indicator (`Processing page X of Y...`), and a **Cancel** button (`AbortController` / state flag) to halt ongoing conversion cleanly.
4. **Output & Download:**
   - Generate final `.zip` blob with `STORE` compression (since PNG/JPEG/WebP are already compressed, avoiding redundant CPU overhead).
   - Trigger automatic download named `<original_pdf_name>_images.zip` and provide a manual re-download button until a new file is loaded.
   - Revoke object URLs (`URL.revokeObjectURL`) appropriately to avoid memory leaks.

## 4. Directory Structure
```text
/
├── index.html          # Main semantic markup & CDN/vendor script imports
├── css/
│   └── style.css       # Layout, drag-and-drop states, progress bar, responsive rules
├── js/
│   ├── app.js          # UI state management, event listeners, DOM updates
│   ├── pdfConverter.js # PDF.js loading, page range parser, sequential canvas rendering
│   └── zipBundler.js   # JSZip wrapper, Blob streaming, download trigger
└── AGENTS.md           # Agent instructions and architectural rules

```

## 5. Coding Standards & Error Handling

* **Modular ES Modules:** Use `<script type="module" src="js/app.js"></script>` with strict separation between DOM manipulation (`app.js`) and core processing logic (`pdfConverter.js`, `zipBundler.js`).
* **Explicit Error Handling:** Gracefully catch and display user-friendly messages for:
* Password-protected / encrypted PDFs (`PasswordException`).
* Corrupted or invalid PDF structures (`InvalidPDFException`).
* Canvas memory limits on extreme DPI/page dimensions.
* Invalid page range syntax.


* **Non-Blocking UI:** Yield to the main thread between page renders if needed so the progress bar and Cancel button remain responsive.
* **No Unnecessary Dependencies:** Do not introduce npm build steps, bundlers (Webpack/Vite), or heavy CSS frameworks unless explicitly requested. Keep the project runnable directly via static HTTP server.

## 6. Verification Checklist (Definition of Done)

Before completing any task, verify:

* [ ] Uploading a multi-page PDF accurately extracts all selected pages at the chosen DPI and format.
* [ ] Page filenames inside the `.zip` are properly zero-padded and sort chronologically in file managers.
* [ ] Canceling mid-conversion stops processing immediately and resets UI state cleanly.
* [ ] Memory usage remains stable when converting a 50+ page PDF (sequential `toBlob` + canvas cleanup).
* [ ] Password-protected or non-PDF files trigger clear error alerts without uncaught console exceptions.

---

### Beberapa Catatan Teknis di Dalamnya:
* **Pencegahan Crash Memori (OOM):** Agen diarahkan memakai `canvas.toBlob()` secara sekuensial dan mereset ukuran kanvas per halaman, bukan `toDataURL()` secara paralel yang sering membuat tab browser crash pada PDF puluhan halaman.
* **Kompresi `STORE` pada JSZip:** Format gambar seperti PNG, JPEG, dan WebP sudah terkompresi dari sananya. Menggunakan metode `STORE` (tanpa kompresi ulang) membuat proses pembuatan ZIP jauh lebih cepat tanpa membebani CPU.
* **Tanpa Build Step:** Struktur dibuat modular dengan ES Modules murni agar bisa langsung dijalankan atau di-deploy ke static hosting tanpa konfigurasi bundler tambahan.