import { useState } from "react";
import { AccountTab, InfoModalType, Page, primary } from "../data/products";

interface HeaderProps {
  page: Page;
  go: (page: Page, sectionId?: string) => void;
  cartCount: number;
  searchQuery: string;
  onSearch: (query: string) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onOpenAccount: (tab: AccountTab) => void;
  onOpenInfo: (info: InfoModalType) => void;
}

export default function Header({
  page,
  go,
  cartCount,
  searchQuery,
  onSearch,
  isLoggedIn,
  onLogin,
  onOpenAccount,
  onOpenInfo,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav: { label: string; target: Page; sectionId?: string }[] = [
    { label: "Beranda", target: "home" },
    { label: "Katalog", target: "catalog" },
    { label: "Langganan", target: "home", sectionId: "plans" },
  ];

  const handleNav = (target: Page, sectionId?: string) => {
    setMobileOpen(false);
    go(target, sectionId);
  };

  return (
    <>
      <div className="bg-[#5c3d2e] py-2 text-center text-[11px] text-white">
        Gratis ongkir min. Rp 250.000 · Roasting fresh tiap Senin &amp; Kamis · Langganan bisa dijeda kapan pun
      </div>
      <header className="sticky top-0 z-30 border-b border-[#eae2d9] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1312px] items-center gap-4 px-5 py-3">
          <button className="flex min-w-fit items-center gap-3 text-left" onClick={() => handleNav("home")}>
            <span className="grid size-10 place-items-center rounded-xl bg-[#5c3d2e] text-sm font-bold text-white">
              KN
            </span>
            <span className="hidden sm:block">
              <b className="block text-sm">Kedai Kopi Nusantara</b>
              <small className="text-[#8c8075]">Biji kopi lokal + langganan</small>
            </span>
          </button>

          <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
            {nav.map(({ label, target, sectionId }) => {
              const isActive = !sectionId && page === target;
              return (
                <button
                  key={label}
                  onClick={() => handleNav(target, sectionId)}
                  className={`rounded-full px-4 py-2 text-sm ${
                    isActive ? "bg-[#f1e7d9] font-semibold text-[#5c3d2e]" : "text-[#5c4f45]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            <button onClick={() => onOpenInfo("story")} className="px-4 py-2 text-sm text-[#5c4f45]">
              Cerita Kopi
            </button>
            <button onClick={() => onOpenInfo("help-faq")} className="px-4 py-2 text-sm text-[#5c4f45]">
              Bantuan
            </button>
          </nav>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNav("catalog");
            }}
            className="hidden min-w-44 md:block"
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="⌕  Cari biji kopi..."
              aria-label="Cari biji kopi"
              className="w-full rounded-full border border-[#eae2d9] bg-[#fbf6f0] px-4 py-2 text-xs text-[#241812] placeholder:text-[#8c8075]"
            />
          </form>

          <button
            onClick={() => handleNav("cart")}
            className="relative ml-auto text-2xl lg:ml-0"
            aria-label={`Keranjang (${cartCount} item)`}
          >
            ▢
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1 grid size-5 place-items-center rounded-full bg-[#c9963f] text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => (isLoggedIn ? onOpenAccount("Dashboard") : onLogin())}
            className={`${primary} hidden !px-7 !py-2.5 sm:inline-flex`}
          >
            {isLoggedIn ? "Akun" : "Masuk"}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="grid size-10 place-items-center rounded-xl border border-[#eae2d9] text-lg lg:hidden"
            aria-label="Buka menu navigasi"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileOpen && (
          <nav className="border-t border-[#eae2d9] bg-white px-5 py-4 lg:hidden" aria-label="Navigasi mobile">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNav("catalog");
              }}
              className="mb-3"
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="⌕  Cari biji kopi..."
                aria-label="Cari biji kopi mobile"
                className="w-full rounded-full border border-[#eae2d9] bg-[#fbf6f0] px-4 py-2 text-xs text-[#241812] placeholder:text-[#8c8075]"
              />
            </form>
            <div className="flex flex-col gap-2">
              {nav.map(({ label, target, sectionId }) => {
                const isActive = !sectionId && page === target;
                return (
                  <button
                    key={label}
                    onClick={() => handleNav(target, sectionId)}
                    className={`rounded-xl px-4 py-2.5 text-left text-sm ${
                      isActive ? "bg-[#f1e7d9] font-semibold text-[#5c3d2e]" : "text-[#5c4f45]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onOpenInfo("story");
                }}
                className="rounded-xl px-4 py-2.5 text-left text-sm text-[#5c4f45]"
              >
                Cerita Kopi
              </button>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onOpenInfo("help-faq");
                }}
                className="rounded-xl px-4 py-2.5 text-left text-sm text-[#5c4f45]"
              >
                Bantuan
              </button>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  if (isLoggedIn) {
                    onOpenAccount("Dashboard");
                  } else {
                    onLogin();
                  }
                }}
                className={`${primary} mt-2 w-full text-center sm:hidden`}
              >
                {isLoggedIn ? "Akun" : "Masuk"}
              </button>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
