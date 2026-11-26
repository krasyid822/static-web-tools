import { useState } from "react";
import { InfoModalType, Notice, Page } from "../data/products";

interface FooterProps {
  go: (page: Page, sectionId?: string) => void;
  subscribe: () => void;
  onOpenInfo: (info: InfoModalType) => void;
  onNotify: (notice: Notice) => void;
}

export default function Footer({ go, subscribe, onOpenInfo, onNotify }: FooterProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    setError("");
    setEmail("");
    subscribe();
  };

  return (
    <footer className="bg-[#241812] text-[#b9aaa0]">
      <div className="mx-auto grid max-w-[1312px] gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-3 text-white">
            <b className="grid size-9 place-items-center rounded-xl bg-[#5c3d2e] text-xs">KN</b>
            <strong>Kedai Kopi Nusantara</strong>
          </div>
          <p className="max-w-xs text-sm">Biji kopi lokal specialty, fresh roast, langganan fleksibel tiap bulan.</p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard?.writeText("@kedaikopinusantara");
              } catch {
                // Clipboard API may be unavailable
              }
              onNotify("social_copied");
            }}
            className="mt-5 text-sm text-white hover:underline"
          >
            ◎　◉　◌　 @kedaikopinusantara
          </button>
        </div>

        <div>
          <b className="text-white">Belanja</b>
          {["Katalog", "Paket Langganan", "Kopi Terlaris", "Gift Card"].map((x) => (
            <button
              key={x}
              onClick={() => {
                if (x === "Paket Langganan") go("home", "plans");
                else if (x === "Kopi Terlaris") go("home", "featured");
                else if (x === "Gift Card") onOpenInfo("gift-card");
                else go("catalog");
              }}
              className="mt-3 block text-sm hover:text-white"
            >
              {x}
            </button>
          ))}
        </div>

        <div>
          <b className="text-white">Bantuan</b>
          {(
            [
              ["Cara Pesan", "help-order"],
              ["Pengiriman", "help-shipping"],
              ["Tukar & Retur", "help-return"],
              ["FAQ", "help-faq"],
            ] as const
          ).map(([label, modal]) => (
            <button key={label} onClick={() => onOpenInfo(modal)} className="mt-3 block text-sm hover:text-white">
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <b className="text-white">Dapatkan tips seduh &amp; promo</b>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            aria-label="Alamat email newsletter"
            className="mt-4 w-full rounded-xl border border-[#5c4f45] bg-[#392820] px-4 py-3 text-sm text-white outline-none placeholder:text-[#8c8075]"
            placeholder="nama@email.com"
          />
          {error && <p className="mt-1.5 text-xs text-[#f29b7e]">{error}</p>}
          <button type="submit" className="mt-3 w-full rounded-xl bg-[#c9963f] py-3 font-semibold text-white">
            Kirim
          </button>
        </form>
      </div>
      <div className="mx-auto flex max-w-[1312px] flex-wrap justify-between gap-2 border-t border-[#49352b] px-6 py-5 text-xs">
        <span>2026 Kedai Kopi Nusantara Daring</span>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => onOpenInfo("terms")} className="hover:text-white">
            Syarat &amp; Ketentuan
          </button>
          <button onClick={() => onOpenInfo("privacy")} className="hover:text-white">
            Kebijakan Privasi
          </button>
          <button onClick={() => onOpenInfo("cookies")} className="hover:text-white">
            Cookies
          </button>
        </div>
      </div>
    </footer>
  );
}
