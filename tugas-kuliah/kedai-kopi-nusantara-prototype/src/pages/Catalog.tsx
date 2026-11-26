import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { formatRupiah, Page, panel, ProductItem, PRODUCTS, secondary } from "../data/products";

interface CatalogProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectProduct: (item: ProductItem) => void;
  onAddToCart: (item: ProductItem) => void;
  go: (page: Page, sectionId?: string) => void;
}

const FILTERS = ["Semua", "Single Origin", "Blend", "Light Roast", "Medium Roast", "Dark Roast"] as const;
const PER_PAGE = 6;

export default function Catalog({ searchQuery, onSearchChange, onSelectProduct, onAddToCart, go }: CatalogProps) {
  const [filter, setFilter] = useState<string>("Semua");
  const [maxPrice, setMaxPrice] = useState<number>(300000);
  const [sortBy, setSortBy] = useState<"popular" | "price-asc" | "price-desc">("popular");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = PRODUCTS.filter((p) => {
      const matchesFilter =
        filter === "Semua"
          ? true
          : filter === "Single Origin" || filter === "Blend"
            ? p.category === filter
            : p.roast === filter.replace(" Roast", "");
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.origin.toLowerCase().includes(q);
      const matchesPrice = p.price <= maxPrice;
      return matchesFilter && matchesQuery && matchesPrice;
    });

    if (sortBy === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [filter, searchQuery, maxPrice, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const resetAll = () => {
    setFilter("Semua");
    onSearchChange("");
    setMaxPrice(300000);
    setSortBy("popular");
    setCurrentPage(1);
  };

  return (
    <main className="bg-[#fbf6f0]">
      <div className="mx-auto max-w-[1312px] px-6 py-10">
        <p className="text-sm text-[#8c8075]">
          <button onClick={() => go("home")} className="hover:underline">
            Beranda
          </button>
          　/　Katalog
        </p>
        <h1 className="mt-3 text-4xl font-bold">Katalog Biji Kopi</h1>
        <p className="mt-2 text-[#5c4f45]">
          Menampilkan {filtered.length} dari {PRODUCTS.length} produk single origin &amp; blend, disangrai sesuai tanggal
          pesanan.
        </p>

        <div className="mt-7 flex flex-wrap gap-2">
          {FILTERS.map((x) => (
            <button
              key={x}
              onClick={() => {
                setFilter(x);
                setCurrentPage(1);
              }}
              className={`rounded-full border px-4 py-2 text-xs ${
                filter === x ? "border-[#5c3d2e] bg-[#5c3d2e] text-white" : "border-[#eae2d9] bg-white"
              }`}
            >
              {x}
            </button>
          ))}
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[250px_1fr]">
          <aside className={`${panel} h-fit p-6`}>
            <div className="flex justify-between">
              <b>Filter</b>
              <button onClick={resetAll} className="text-xs text-[#5c3d2e]">
                Hapus semua
              </button>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter nama atau asal biji kopi"
              className="mt-5 w-full rounded-xl border border-[#eae2d9] bg-[#fbf6f0] px-4 py-3 text-xs"
              placeholder="⌕  Nama biji kopi"
            />
            <b className="mt-6 block text-xs">Kategori</b>
            {FILTERS.map((x) => (
              <label key={x} className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
                <input
                  checked={filter === x}
                  onChange={() => {
                    setFilter(x);
                    setCurrentPage(1);
                  }}
                  type="radio"
                  name="catalog-filter"
                />
                {x}
              </label>
            ))}
            <div className="mt-6 flex items-center justify-between text-xs">
              <b>Harga Maksimal</b>
              <span className="text-[#5c3d2e]">{formatRupiah(maxPrice)}</span>
            </div>
            <input
              type="range"
              min={80000}
              max={300000}
              step={5000}
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Harga maksimal"
              className="mt-4 w-full accent-[#5c3d2e]"
            />
            <div className="flex justify-between text-[10px] text-[#8c8075]">
              <span>Rp 80.000</span>
              <span>Rp 300.000</span>
            </div>
          </aside>

          <div>
            <div className="mb-4 flex justify-end">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as "popular" | "price-asc" | "price-desc");
                  setCurrentPage(1);
                }}
                aria-label="Urutkan produk"
                className="rounded-xl border border-[#eae2d9] bg-white px-4 py-3 text-xs"
              >
                <option value="popular">Urutkan: Terlaris</option>
                <option value="price-asc">Harga Terendah</option>
                <option value="price-desc">Harga Tertinggi</option>
              </select>
            </div>

            {paged.length === 0 ? (
              <div className={`${panel} p-10 text-center`}>
                <b className="block text-lg">Produk tidak ditemukan</b>
                <p className="mt-2 text-sm text-[#8c8075]">Coba ubah kata kunci pencarian atau reset filter.</p>
                <button onClick={resetAll} className={`${secondary} mt-5`}>
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {paged.map((p) => (
                  <ProductCard key={p.id} item={p} onSelect={onSelectProduct} onAddToCart={onAddToCart} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="grid size-9 place-items-center rounded-lg border bg-white disabled:opacity-40"
                  aria-label="Halaman sebelumnya"
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`grid size-9 place-items-center rounded-lg border ${
                      safePage === num ? "bg-[#5c3d2e] text-white" : "bg-white"
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="grid size-9 place-items-center rounded-lg border bg-white disabled:opacity-40"
                  aria-label="Halaman berikutnya"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
