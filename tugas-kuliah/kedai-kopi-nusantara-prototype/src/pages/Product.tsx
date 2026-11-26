import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import {
  ASSET_BASE,
  formatRupiah,
  getUnitPrice,
  Page,
  panel,
  primary,
  ProductItem,
  PRODUCTS,
  secondary,
  Weight,
} from "../data/products";

interface ProductProps {
  product: ProductItem;
  go: (page: Page, sectionId?: string) => void;
  onSelectProduct: (item: ProductItem) => void;
  onAddToCart: (item: ProductItem, weight: Weight, qty: number, redirect?: Page) => void;
}

export default function Product({ product, go, onSelectProduct, onAddToCart }: ProductProps) {
  const [qty, setQty] = useState(1);
  const [weight, setWeight] = useState<Weight>("200 gr");
  const [activeImage, setActiveImage] = useState(product.image);
  const [activeTab, setActiveTab] = useState<"desc" | "spec" | "reviews">("desc");

  useEffect(() => {
    setActiveImage(product.image);
    setQty(1);
    setWeight("200 gr");
  }, [product]);

  const thumbs = [product.image, "59392.png", "ecd6d.png", "b97ea.png"];
  const totalPrice = getUnitPrice(product.price, weight) * qty;
  const related = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <main className="bg-[#fbf6f0]">
      <div className="mx-auto max-w-[1312px] px-6 py-10">
        <p className="text-sm text-[#8c8075]">
          <button onClick={() => go("home")} className="hover:underline">
            Beranda
          </button>
          　/　
          <button onClick={() => go("catalog")} className="hover:underline">
            Katalog
          </button>
          　/　{product.name}
        </p>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div>
            <img
              src={ASSET_BASE + activeImage}
              alt={product.name}
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
            <div className="mt-4 flex gap-3">
              {thumbs.map((x) => (
                <button
                  key={x}
                  onClick={() => setActiveImage(x)}
                  className={`overflow-hidden rounded-xl ${activeImage === x ? "ring-2 ring-[#5c3d2e]" : ""}`}
                >
                  <img src={ASSET_BASE + x} alt={`Galeri ${product.name}`} className="size-20 object-cover" />
                </button>
              ))}
            </div>

            <div className="mt-7 flex gap-8 border-b">
              {[
                ["desc", "Deskripsi"],
                ["spec", "Spesifikasi"],
                ["reviews", "Ulasan (128)"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as "desc" | "spec" | "reviews")}
                  className={`pb-3 ${activeTab === key ? "border-b-2 border-[#5c3d2e] font-semibold" : "text-[#8c8075]"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === "desc" && <p className="py-5 text-sm text-[#5c4f45]">{product.description}</p>}
            {activeTab === "spec" && (
              <div className={`${panel} mt-4 divide-y p-5 text-sm`}>
                {[
                  ["Asal", product.origin],
                  ["Proses", product.process],
                  ["Ketinggian", product.altitude],
                  ["Roast level", `${product.roast} Roast`],
                  ["Tanggal sangrai", product.roastDate],
                ].map((x) => (
                  <div className="flex justify-between py-3" key={x[0]}>
                    <span className="text-[#8c8075]">{x[0]}</span>
                    <b>{x[1]}</b>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "reviews" && (
              <div className={`${panel} mt-4 space-y-4 p-5 text-sm`}>
                <div>
                  <b>Rian Pratama</b> <span className="text-[#c9963f]">★★★★★</span>
                  <p className="mt-1 text-[#5c4f45]">Aroma kuat, fresh roast sesuai tanggal di kemasan.</p>
                </div>
                <div className="border-t pt-4">
                  <b>Siti Nurhaliza</b> <span className="text-[#c9963f]">★★★★★</span>
                  <p className="mt-1 text-[#5c4f45]">Cocok untuk V60 pagi hari, pengemasan rapi.</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-28 lg:h-fit">
            <div className="flex gap-2">
              <span className="rounded-full bg-[#fff1ce] px-3 py-2 text-[10px]">{product.category.toUpperCase()}</span>
              <span className="rounded-full bg-[#e5f2e8] px-3 py-2 text-[10px] text-[#2e7e4f]">READY STOCK</span>
            </div>
            <h1 className="mt-5 text-4xl font-bold">{product.name}</h1>
            <p className="mt-2 text-sm text-[#8c8075]">
              {product.origin} · proses {product.process.toLowerCase()} · {weight}
            </p>
            <p className="mt-4 text-[#c9963f]">
              ★★★★★ <span className="text-[#5c4f45]">4.9 (128 ulasan)</span>
            </p>
            <strong className="mt-5 block text-3xl text-[#5c3d2e]">{formatRupiah(totalPrice)}</strong>

            <p className="mt-7 text-sm font-semibold">Varian kemasan</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {(["200 gr", "500 gr", "1 kg"] as Weight[]).map((x) => (
                <button
                  onClick={() => setWeight(x)}
                  className={`rounded-xl border p-4 text-left text-sm ${
                    weight === x ? "border-[#5c3d2e] bg-white" : "border-[#eae2d9] bg-white"
                  }`}
                  key={x}
                >
                  {x}
                  <small className="block text-[#8c8075]">Pilih ukuran</small>
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm">Jumlah</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex rounded-xl border bg-white">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3" aria-label="Kurangi jumlah">
                  −
                </button>
                <span className="px-4 py-3">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-4 py-3" aria-label="Tambah jumlah">
                  ＋
                </button>
              </div>
              <span className="text-xs text-[#2e7e4f]">Stok tersedia · sisa 18 paket</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => onAddToCart(product, weight, qty)} className={primary}>
                Tambah ke Keranjang
              </button>
              <button onClick={() => onAddToCart(product, weight, qty, "checkout")} className={secondary}>
                Beli Sekarang
              </button>
            </div>

            <button
              onClick={() => go("home", "plans")}
              className="mt-8 w-full rounded-2xl border border-[#c9963f] bg-[#fff4d7] p-6 text-left"
            >
              <span className="rounded-full bg-[#c9963f] px-4 py-2 text-[10px] text-white">HEMAT 15%</span>
              <b className="mt-4 block text-lg">Langganan rutin</b>
              <p className="mt-2 text-sm text-[#5c4f45]">Pesan rutin, atur jadwal sendiri, bebas jeda kapan pun.</p>
            </button>
          </div>
        </div>

        <section className="py-12">
          <h2 className="text-2xl font-bold">Produk Lainnya</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                item={p}
                onSelect={onSelectProduct}
                onAddToCart={(item) => onAddToCart(item, "200 gr", 1)}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
