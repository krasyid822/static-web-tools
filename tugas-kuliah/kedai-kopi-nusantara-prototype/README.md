# Kedai Kopi Nusantara — Prototype

Prototipe aplikasi web **Kedai Kopi Nusantara** yang dibangun menggunakan React 19, Vite 8, TypeScript, dan Tailwind CSS v4.

## 1. Cara Terbaik: Build Statis dengan Vite (Disarankan)

Pendekatan ini menghasilkan *bundle* statis (`HTML`, `CSS`, dan `JavaScript`) yang sudah dioptimasi dan diminifikasi di dalam folder `dist/`. Hasil *build* siap di-*deploy* ke layanan hosting statis seperti GitHub Pages, Netlify, Vercel, atau dijalankan di server web lokal.

### Prasyarat

- **Node.js** (disarankan versi 22+)
- **pnpm** (atau `npm`)

### Langkah-langkah

1. **Instal dependensi**

   ```bash
   pnpm install
   # atau: npm install
   ```

2. **(Opsional) Sesuaikan `base` di `vite.config.ts` untuk sub-path / GitHub Pages**

   Jika aplikasi akan di-*deploy* ke sub-path tertentu (misalnya GitHub Pages) atau dibuka melalui path relatif, ubah opsi `base` di `vite.config.ts` menjadi `'./'` atau `'/nama-repo/'` agar path aset tetap bekerja.

3. **Jalankan build statis**

   ```bash
   pnpm build
   # atau: npm run build
   ```

4. **Hasil build**

   Output *build* akan tersimpan di folder `dist/` yang berisi `index.html` dan folder `assets/`.

5. **Uji hasil build secara lokal**

   ```bash
   pnpm preview
   # atau: npm run preview
   ```

### Menjalankan Mode Pengembangan (Opsional)

Untuk menjalankan server pengembangan dengan *hot reload*:

```bash
pnpm dev
# atau: npm run dev
```
