import { useState } from "react";
import {
  ASSET_BASE,
  CartItem,
  formatRupiah,
  FREE_SHIPPING_MIN,
  getUnitPrice,
  Page,
  panel,
  primary,
  ProductItem,
  secondary,
  Weight,
} from "../data/products";

interface CartProps {
  items: CartItem[];
  promoCode: string;
  discountRate: number;
  go: (page: Page, sectionId?: string) => void;
  onSelectProduct: (item: ProductItem) => void;
  onUpdateQty: (productId: string, weight: Weight, delta: number) => void;
  onRemoveItem: (productId: string, weight: Weight) => void;
  onApplyPromo: (code: string) => boolean;
}

export default function Cart({
  items,
  promoCode,
  discountRate,
  go,
  onSelectProduct,
  onUpdateQty,
  onRemoveItem,
  onApplyPromo,
}: CartProps) {
  const [promoInput, setPromoInput] = useState(promoCode);
  const [promoMsg, setPromoMsg] = useState("");

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + getUnitPrice(item.product.price, item.weight) * item.qty, 0);
  const discount = Math.round(subtotal * discountRate);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_MIN - subtotal);
  const shipping = items.length === 0 ? 0 : remainingForFreeShipping === 0 ? 0 : 24000;
  const total = subtotal - discount + shipping;
  const progressPct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_MIN) * 100));

  const handlePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onApplyPromo(promoInput.trim());
    setPromoMsg(ok ? "Kode promo KopiHemat15 diterapkan (diskon 15%)." : "Kode promo tidak valid. Coba: KopiHemat15");
  };

  return (
    <main className="bg-[#fbf6f0]">
      <div className="mx-auto max-w-[1312px] px-6 py-10">
        <p className="text-sm text-[#8c8075]">
          <button onClick={() => go("home")} className="hover:underline">
            Beranda
          </button>
          　/　Keranjang
        </p>
        <h1 className="mt-3 text-4xl font-bold">Keranjang Belanja</h1>
        <p className="mt-2 text-[#8c8075]">{totalItems} produk di keranjangmu</p>

        {items.length > 0 && (
          <div className={`${panel} mt-6 p-6`}>
            <b>
              {remainingForFreeShipping === 0
                ? "▣　Selamat! Kamu mendapatkan gratis ongkir reguler"
                : `▣　Tambah ${formatRupiah(remainingForFreeShipping)} lagi untuk dapat gratis ongkir`}
            </b>
            <p className="mt-1 text-xs text-[#8c8075]">
              Gratis ongkir reguler untuk minimal belanja {formatRupiah(FREE_SHIPPING_MIN)}
            </p>
            <div className="mt-3 h-2 rounded-full bg-[#eae2d9]">
              <div className="h-2 rounded-full bg-[#5c3d2e] transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className={`${panel} mt-7 p-12 text-center`}>
            <b className="block text-xl">Keranjang belanjamu masih kosong</b>
            <p className="mt-2 text-sm text-[#8c8075]">Yuk pilih biji kopi favoritmu dari katalog kami.</p>
            <button onClick={() => go("catalog")} className={`${primary} mt-6`}>
              Jelajahi Katalog
            </button>
          </div>
        ) : (
          <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_380px]">
            <div className="space-y-5">
              {items.map((item) => {
                const lineTotal = getUnitPrice(item.product.price, item.weight) * item.qty;
                return (
                  <div
                    key={`${item.product.id}-${item.weight}`}
                    className={`${panel} flex flex-wrap items-center gap-5 p-5`}
                  >
                    <button onClick={() => onSelectProduct(item.product)}>
                      <img
                        src={ASSET_BASE + item.product.image}
                        alt={item.product.name}
                        className="size-28 rounded-xl object-cover"
                      />
                    </button>
                    <div className="min-w-48 flex-1">
                      <button onClick={() => onSelectProduct(item.product)} className="text-left font-bold">
                        {item.product.name}
                      </button>
                      <p className="mt-2 inline-block rounded-full bg-[#fbf6f0] px-3 py-1.5 text-xs">
                        {item.weight} · {item.product.roast} Roast
                      </p>
                      <p className="mt-2 text-xs text-[#2e7e4f]">
                        ● Disangrai {item.product.roastDate} · stok tersedia
                      </p>
                      <button
                        onClick={() => onRemoveItem(item.product.id, item.weight)}
                        className="mt-3 text-xs text-[#c0492f] hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                    <div className="flex items-center rounded-xl border">
                      <button
                        onClick={() => onUpdateQty(item.product.id, item.weight, -1)}
                        className="px-3.5 py-2.5"
                        aria-label={`Kurangi jumlah ${item.product.name}`}
                      >
                        −
                      </button>
                      <span className="px-3 py-2.5 text-sm font-semibold">{item.qty}</span>
                      <button
                        onClick={() => onUpdateQty(item.product.id, item.weight, 1)}
                        className="px-3.5 py-2.5"
                        aria-label={`Tambah jumlah ${item.product.name}`}
                      >
                        ＋
                      </button>
                    </div>
                    <strong className="text-xl text-[#5c3d2e]">{formatRupiah(lineTotal)}</strong>
                  </div>
                );
              })}

              <button
                onClick={() => go("home", "plans")}
                className="flex w-full items-center gap-5 rounded-2xl border border-[#c9963f] bg-[#fff4d7] p-5 text-left"
              >
                <img src={ASSET_BASE + "f1b3c.png"} alt="Paket Langganan" className="size-24 rounded-xl object-cover" />
                <span className="flex-1">
                  <b>Tambah paket langganan &amp; hemat 15%</b>
                  <small className="mt-2 block">Gayo Wine Natural 500 gr rutin tiap bulan</small>
                </span>
                <span className={primary}>Tambah Langganan</span>
              </button>
            </div>

            <aside className="space-y-5">
              <div className={`${panel} p-6`}>
                <h2 className="text-xl font-bold">Ringkasan Belanja</h2>
                {[
                  [`Subtotal (${totalItems} produk)`, formatRupiah(subtotal)],
                  ["Ongkir reguler", shipping === 0 ? "Gratis" : formatRupiah(shipping)],
                  ["Diskon promo", discount > 0 ? `-${formatRupiah(discount)}` : "Rp 0"],
                  ["Biaya layanan", "Rp 0"],
                ].map((x) => (
                  <div key={x[0]} className="mt-5 flex justify-between text-sm">
                    <span className="text-[#8c8075]">{x[0]}</span>
                    <b>{x[1]}</b>
                  </div>
                ))}
                <div className="my-5 border-t" />
                <div className="flex justify-between text-xl">
                  <b>Total Bayar</b>
                  <strong className="text-2xl text-[#5c3d2e]">{formatRupiah(total)}</strong>
                </div>
                <button onClick={() => go("checkout")} className={`${primary} mt-6 w-full`}>
                  Lanjut ke Checkout
                </button>
                <button onClick={() => go("catalog")} className="mt-5 block w-full text-center font-semibold text-[#5c3d2e]">
                  Lanjut Belanja
                </button>
              </div>

              <form onSubmit={handlePromo} className={`${panel} p-6`}>
                <b>Punya kode promo?</b>
                <div className="mt-4 flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    aria-label="Kode promo"
                    className="min-w-0 flex-1 rounded-xl border bg-[#fbf6f0] px-3 py-2 text-sm"
                    placeholder="KopiHemat15"
                  />
                  <button type="submit" className={secondary}>
                    Pakai
                  </button>
                </div>
                {discountRate > 0 && promoCode ? (
                  <div className="mt-2 flex items-center justify-between text-xs text-[#2e7e4f]">
                    <span>Kode promo {promoCode} diterapkan (diskon 15%).</span>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyPromo("");
                        setPromoInput("");
                        setPromoMsg("");
                      }}
                      className="font-semibold text-[#c0492f] hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  promoMsg && <p className="mt-2 text-xs text-[#5c3d2e]">{promoMsg}</p>
                )}
              </form>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
