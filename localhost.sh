#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="8000"
PROJECT=""

usage() {
  cat <<EOF
Penggunaan: $(basename "$0") [proyek] [opsi]

Menjalankan server HTTP lokal untuk proyek web statis di repositori ini.

Argumen:
  proyek              Nama folder proyek di root (opsional; default: root repositori)

Opsi:
  -p, --port <PORT>   Port server lokal (default: 8000)
  -l, --list          Tampilkan daftar proyek yang tersedia
  -h, --help          Tampilkan bantuan ini

Contoh:
  $(basename "$0")                  # Jalankan root di http://localhost:8000/
  $(basename "$0") pdf-to-image     # Jalankan proyek pdf-to-image
  $(basename "$0") -p 3000          # Jalankan root di port 3000
EOF
}

list_projects() {
  local found=0
  for dir in "$ROOT_DIR"/*/; do
    [[ -d "$dir" ]] || continue
    if [[ -f "${dir}index.html" ]]; then
      basename "$dir"
      found=1
    fi
  done
  if [[ "$found" -eq 0 ]]; then
    echo "(tidak ada proyek dengan index.html)"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--port)
      if [[ $# -lt 2 ]]; then
        echo "Error: Opsi $1 membutuhkan nilai port." >&2
        exit 1
      fi
      PORT="$2"
      shift 2
      ;;
    -l|--list)
      list_projects
      exit 0
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      echo "Error: Opsi tidak dikenal: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [[ -n "$PROJECT" ]]; then
        echo "Error: Terlalu banyak argumen posisional: $1" >&2
        usage >&2
        exit 1
      fi
      PROJECT="$1"
      shift
      ;;
  esac
done

if ! [[ "$PORT" =~ ^[0-9]+$ ]] || (( PORT < 1 || PORT > 65535 )); then
  echo "Error: Port tidak valid '$PORT' (harus berupa angka 1-65535)." >&2
  exit 1
fi

if [[ -n "$PROJECT" ]]; then
  TARGET_DIR="$ROOT_DIR/$PROJECT"
  if [[ ! -d "$TARGET_DIR" ]]; then
    echo "Error: Folder proyek '$PROJECT' tidak ditemukan di $ROOT_DIR." >&2
    echo "Proyek yang tersedia:" >&2
    list_projects >&2
    exit 1
  fi
else
  TARGET_DIR="$ROOT_DIR"
fi

echo "Menjalankan server lokal untuk: $TARGET_DIR"
echo "URL: http://localhost:${PORT}/"

if [[ -z "$PROJECT" ]]; then
  for dir in "$ROOT_DIR"/*/; do
    [[ -d "$dir" && -f "${dir}index.html" ]] || continue
    name="$(basename "$dir")"
    echo "  -> http://localhost:${PORT}/${name}/"
  done
fi

echo "Tekan Ctrl+C untuk menghentikan server."

if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$TARGET_DIR"
elif command -v php >/dev/null 2>&1; then
  exec php -S "127.0.0.1:${PORT}" -t "$TARGET_DIR"
elif command -v npx >/dev/null 2>&1; then
  exec npx --yes serve -l "$PORT" "$TARGET_DIR"
else
  echo "Error: Tidak ditemukan runtime server (python3, php, atau npx)." >&2
  exit 1
fi
