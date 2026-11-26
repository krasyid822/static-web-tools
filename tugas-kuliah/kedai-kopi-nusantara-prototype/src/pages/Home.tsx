import { useState } from "react";
import ProductCard from "../components/ProductCard";
import {
  ASSET_BASE,
  formatRupiah,
  Page,
  panel,
  primary,
  ProductItem,
  PRODUCTS,
  secondary,
  SUBSCRIPTION_PLANS,
  SubscriptionPlanOption,
} from "../data/products";

interface HomeProps {
  go: (page: Page, sectionId?: string) => void;
  onSelectProduct: (item: ProductItem) => void;
  onAddToCart: (item: ProductItem) => void;
  onSelectPlan: (plan: SubscriptionPlanOption, cycle: "Bulanan" | "3 Bulan") => void;
}

export default function Home({ go, onSelectProduct, onAddToCart, onSelectPlan }: HomeProps) {
  const [quarter, setQuarter] = useState(false);
  const cycle = quarter ? "3 Bulan" : "Bulanan";

  return (
    <>
      <section className="bg-[#fbf6f0]">
        <div className="mx-auto grid max-w-[1312px] items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:py-16">
          <div>
            <span className="rounded-full bg-[#fff1ce] px-4 py-2 text-[10px] font-bold text-[#9c6b20]">
              SINGLE ORIGIN INDONESIA
            </span>
            <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight md:text-5xl">
              Biji kopi lokal premium,
              <br />
              langganan tiap bulan.
            </h1>
            <p className="mt-6 max-w-xl text-[#5c4f45]">
              Kedai Kopi Nusantara menyaring biji pilihan petani lokal setiap minggu. Pesan sekali atau langganan rutin
              - bebas dijeda kapan saja lewat portal.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => go("catalog")} className={primary}>
                Belanja Sekarang
              </button>
              <button
                onClick={() => document.querySelector("#plans")?.scrollIntoView({ behavior: "smooth" })}
                className={secondary}
              >
                Lihat Paket Langganan
              </button>
            </div>
            <p className="mt-8 text-xs text-[#5c4f45]">
              <span className="text-[#c9963f]">★★★★★</span>　4.9 · 1.240 pembeli　　Gratis ongkir min. Rp 250.000
            </p>
          </div>

          <button
            onClick={() => document.querySelector("#plans")?.scrollIntoView({ behavior: "smooth" })}
            className="relative overflow-hidden rounded-2xl text-left"
          >
            <img
              src={ASSET_BASE + "6e1ea.png"}
              alt="Perkebunan kopi Nusantara"
              className="aspect-[7/5] w-full object-cover"
            />
            <div className="absolute bottom-5 left-5 rounded-xl bg-white p-3 shadow-lg">
              <b className="block text-xs">Paket Regular</b>
              <small>500 gr / bulan · gratis ongkir</small>
              <strong className="block text-sm">Rp 149.000</strong>
            </div>
          </button>
        </div>
      </section>

      <section id="why-us" className="mx-auto max-w-[1312px] px-6 py-12">
        <h2 className="text-2xl font-bold">Kenapa Kedai Kopi Nusantara?</h2>
        <p className="mt-1 text-sm text-[#8c8075]">Tiga alasan pelanggan tetap langganan tiap bulan.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            ["●", "Fresh roast", "Biji disangrai dalam 7 hari sebelum dikirim."],
            ["▰", "Transparan", "Setiap kemasan mencantumkan tanggal sangrai."],
            ["◷", "Langganan fleksibel", "Jeda, ganti varian, atau atur jadwal kirim."],
          ].map((x) => (
            <div key={x[1]} className={`${panel} p-6`}>
              <span className="grid size-10 place-items-center rounded-full bg-[#fff1ce] text-[#c9963f]">{x[0]}</span>
              <b className="mt-4 block">{x[1]}</b>
              <p className="mt-2 text-sm text-[#8c8075]">{x[2]}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="plans" className="bg-[#fbf6f0]">
        <div className="mx-auto max-w-[1312px] px-6 py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Paket Langganan Bulanan</h2>
              <p className="text-sm text-[#8c8075]">Hemat hingga 15% dibanding beli satuan.</p>
            </div>
            <button
              onClick={() => setQuarter(!quarter)}
              aria-pressed={quarter}
              className="relative flex w-48 rounded-full bg-white p-1 text-xs shadow"
            >
              <span
                className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-[#5c3d2e] transition-transform duration-300 ${
                  quarter ? "translate-x-[92px]" : ""
                }`}
              />
              <span className={`relative flex-1 py-2 ${!quarter ? "text-white" : ""}`}>Bulanan</span>
              <span className={`relative flex-1 py-2 ${quarter ? "text-white" : ""}`}>3 Bulan</span>
            </button>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {SUBSCRIPTION_PLANS.map((plan, i) => {
              const price = quarter ? plan.quarterlyPrice : plan.monthlyPrice;
              return (
                <article
                  key={plan.name}
                  className={`${panel} relative p-6 text-left ${i === 1 ? "border-[#5c3d2e]" : ""}`}
                >
                  {i === 1 && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#c9963f] px-5 py-2 text-[9px] font-bold text-white">
                      PALING POPULER
                    </span>
                  )}
                  <b>{plan.name}</b>
                  <strong className="mt-3 block text-2xl text-[#5c3d2e]">{formatRupiah(price)}</strong>
                  <small>{plan.weightLabel}</small>
                  <ul className="my-5 space-y-2 text-xs text-[#5c4f45]">
                    <li>• {plan.variants} varian pilihan</li>
                    <li>• Jeda kapan saja</li>
                    <li>• Gratis ongkir</li>
                  </ul>
                  <button
                    onClick={() => onSelectPlan(plan, cycle)}
                    className={`${i === 1 ? primary : secondary} block w-full text-center`}
                  >
                    Pilih Paket {plan.name}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="featured" className="mx-auto max-w-[1312px] px-6 py-12">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Katalog Unggulan</h2>
          <button onClick={() => go("catalog")} className="text-sm font-semibold text-[#5c3d2e]">
            Lihat semua produk →
          </button>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.slice(0, 4).map((p) => (
            <ProductCard key={p.id} item={p} onSelect={onSelectProduct} onAddToCart={onAddToCart} />
          ))}
        </div>
      </section>

      <section className="bg-[#5c3d2e] text-white">
        <div className="mx-auto grid max-w-[1312px] gap-8 px-6 py-12 md:grid-cols-[2fr_1fr]">
          <blockquote className="text-2xl font-semibold">
            "Sejak langganan, kopi rumah saya selalu segar. Tinggal jeda kalau sedang pergi."
            <small className="mt-5 block text-sm font-normal text-[#d9ccbd]">
              Rian Pratama · pelanggan sejak 2025
            </small>
          </blockquote>
          <div className="grid grid-cols-3 text-center text-[#c9963f]">
            <b className="text-2xl">
              500+<small className="block text-[10px] font-normal text-[#d9ccbd]">pelanggan</small>
            </b>
            <b className="text-2xl">
              4.9<small className="block text-[10px] font-normal text-[#d9ccbd]">rating</small>
            </b>
            <b className="text-2xl">
              12<small className="block text-[10px] font-normal text-[#d9ccbd]">varian</small>
            </b>
          </div>
        </div>
      </section>
    </>
  );
}
