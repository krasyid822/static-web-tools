import { useState } from "react";
import {
  AddressItem,
  ASSET_BASE,
  CartItem,
  formatRupiah,
  FREE_SHIPPING_MIN,
  getUnitPrice,
  OrderSummary,
  Page,
  panel,
  primary,
  secondary,
} from "../data/products";

interface CheckoutProps {
  items: CartItem[];
  discountRate: number;
  addresses: AddressItem[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
  onUpdateAddress: (id: string, detail: string) => void;
  onAddAddress: (addr: Omit<AddressItem, "id">) => void;
  go: (page: Page, sectionId?: string) => void;
  onCompleteOrder: (order: OrderSummary) => void;
}

export default function Checkout({
  items,
  discountRate,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onUpdateAddress,
  onAddAddress,
  go,
  onCompleteOrder,
}: CheckoutProps) {
  const [shipping, setShipping] = useState<"Reguler" | "Express">("Reguler");
  const [pay, setPay] = useState("Transfer Virtual Account");
  const [agreed, setAgreed] = useState(true);
  const [agreeError, setAgreeError] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDetail, setNewDetail] = useState("");

  const subtotal = items.reduce((sum, item) => sum + getUnitPrice(item.product.price, item.weight) * item.qty, 0);
  const discount = Math.round(subtotal * discountRate);
  const shippingCost =
    items.length === 0 ? 0 : shipping === "Express" ? 45000 : subtotal >= FREE_SHIPPING_MIN ? 0 : 24000;
  const total = subtotal - discount + shippingCost;

  const handlePay = () => {
    if (items.length === 0) return;
    if (!agreed) {
      setAgreeError(true);
      return;
    }
    const order: OrderSummary = {
      id: `KKN-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      status: "Diproses",
      total,
      shippingLabel: shipping === "Express" ? "JNE Express" : "JNE Regular",
      eta: shipping === "Express" ? "Besok (1 hari)" : "2-3 hari kerja",
    };
    onCompleteOrder(order);
  };

  if (items.length === 0) {
    return (
      <main className="bg-[#fbf6f0]">
        <div className="mx-auto max-w-[1312px] px-6 py-10">
          <p className="text-sm text-[#8c8075]">
            <button onClick={() => go("home")} className="hover:underline">
              Beranda
            </button>
            　/　
            <button onClick={() => go("cart")} className="hover:underline">
              Keranjang
            </button>
            　/　Checkout
          </p>
          <h1 className="mt-3 text-4xl font-bold">Checkout</h1>
          <div className={`${panel} mt-7 p-12 text-center`}>
            <b className="block text-xl">Keranjang belanjamu masih kosong</b>
            <p className="mt-2 text-sm text-[#8c8075]">Tambahkan biji kopi ke keranjang sebelum melanjutkan ke checkout.</p>
            <button onClick={() => go("catalog")} className={`${primary} mt-6`}>
              Jelajahi Katalog
            </button>
          </div>
        </div>
      </main>
    );
  }

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient.trim() || !newPhone.trim() || !newDetail.trim()) return;
    onAddAddress({
      label: "Alamat Baru",
      recipient: newRecipient.trim(),
      phone: newPhone.trim(),
      detail: newDetail.trim(),
    });
    setNewRecipient("");
    setNewPhone("");
    setNewDetail("");
    setAddingAddress(false);
  };

  return (
    <main className="bg-[#fbf6f0]">
      <div className="mx-auto max-w-[1312px] px-6 py-10">
        <p className="text-sm text-[#8c8075]">
          <button onClick={() => go("home")} className="hover:underline">
            Beranda
          </button>
          　/　
          <button onClick={() => go("cart")} className="hover:underline">
            Keranjang
          </button>
          　/　Checkout
        </p>
        <div className="my-8 flex items-start justify-between">
          {["Keranjang", "Data Pengiriman", "Pembayaran", "Selesai"].map((x, i) =>
            i < 3 ? (
              <button
                key={x}
                onClick={() => {
                  if (i === 0) go("cart");
                  else if (i === 1) document.getElementById("checkout-shipping")?.scrollIntoView({ behavior: "smooth" });
                  else if (i === 2) document.getElementById("checkout-payment")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex flex-1 items-center text-left text-xs"
              >
                <span className="grid size-9 place-items-center rounded-full border bg-[#5c3d2e] text-white">
                  {i + 1}
                </span>
                <span className="ml-2 hidden sm:block">{x}</span>
                <span className={`mx-4 h-px flex-1 ${i < 2 ? "bg-[#5c3d2e]" : "bg-[#eae2d9]"}`} />
              </button>
            ) : (
              <div key={x} className="flex flex-1 items-center text-xs">
                <span className="grid size-9 place-items-center rounded-full border bg-white">{i + 1}</span>
                <span className="ml-2 hidden sm:block">{x}</span>
              </div>
            )
          )}
        </div>

        <h1 className="text-4xl font-bold">Checkout</h1>
        <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_370px]">
          <div className="space-y-6">
            <section id="checkout-shipping" className={`${panel} p-6`}>
              <div className="flex justify-between">
                <h2 className="text-lg font-bold">Alamat Pengiriman</h2>
                <button onClick={() => setEditingAddress(!editingAddress)} className="text-sm font-semibold text-[#5c3d2e]">
                  {editingAddress ? "Simpan" : "Ubah"}
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {addresses.map((addr) => {
                  const isSelected = addr.id === selectedAddressId;
                  return (
                    <label
                      key={addr.id}
                      className={`flex cursor-pointer gap-4 rounded-xl border p-5 ${
                        isSelected ? "border-[#5c3d2e]" : "border-[#eae2d9]"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => onSelectAddress(addr.id)}
                      />
                      <span className="flex-1">
                        <b>{addr.recipient}</b>{" "}
                        <span className="ml-2 rounded-full bg-[#fbf6f0] px-2.5 py-0.5 text-[10px] text-[#5c3d2e]">
                          {addr.label}
                        </span>
                        {editingAddress && isSelected ? (
                          <input
                            value={addr.detail}
                            onChange={(e) => onUpdateAddress(addr.id, e.target.value)}
                            className="mt-2 w-full rounded-lg border border-[#eae2d9] px-3 py-2 text-sm"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-[#5c4f45]">{addr.detail}</p>
                        )}
                        <small className="mt-1 block">{addr.phone}</small>
                      </span>
                    </label>
                  );
                })}
              </div>

              {addingAddress ? (
                <form onSubmit={handleSaveNewAddress} className="mt-4 space-y-3 rounded-xl border border-[#eae2d9] bg-[#fbf6f0] p-4">
                  <input
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="Nama penerima"
                    required
                    className="w-full rounded-lg border border-[#eae2d9] bg-white px-3 py-2 text-sm"
                  />
                  <input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Nomor HP (contoh: 0812-3456-7890)"
                    required
                    className="w-full rounded-lg border border-[#eae2d9] bg-white px-3 py-2 text-sm"
                  />
                  <input
                    value={newDetail}
                    onChange={(e) => setNewDetail(e.target.value)}
                    placeholder="Alamat lengkap"
                    required
                    className="w-full rounded-lg border border-[#eae2d9] bg-white px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className={primary}>
                      Simpan Alamat
                    </button>
                    <button type="button" onClick={() => setAddingAddress(false)} className={secondary}>
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setAddingAddress(true)} className={`${secondary} mt-4`}>
                  Tambah Alamat Baru
                </button>
              )}
            </section>

            <section className={`${panel} p-6`}>
              <h2 className="text-lg font-bold">Metode Pengiriman</h2>
              {[
                {
                  name: "Reguler" as const,
                  desc: "2-3 hari kerja",
                  eta: "Estimasi tiba 2-3 hari kerja",
                  priceLabel: subtotal >= FREE_SHIPPING_MIN ? "Gratis" : "Rp 24.000",
                },
                {
                  name: "Express" as const,
                  desc: "1 hari area Medan",
                  eta: "Estimasi tiba besok (1 hari)",
                  priceLabel: "Rp 45.000",
                },
              ].map((x) => (
                <label
                  key={x.name}
                  className={`mt-4 flex cursor-pointer gap-3 rounded-xl border p-4 ${
                    shipping === x.name ? "border-[#5c3d2e]" : ""
                  }`}
                >
                  <input type="radio" checked={shipping === x.name} onChange={() => setShipping(x.name)} />
                  <span className="flex-1">
                    <b>
                      {x.name} ({x.desc})
                    </b>
                    <small className="block text-[#8c8075]">{x.eta}</small>
                  </span>
                  <b>{x.priceLabel}</b>
                </label>
              ))}
            </section>

            <section id="checkout-payment" className={`${panel} p-6`}>
              <h2 className="text-lg font-bold">Metode Pembayaran</h2>
              {["Transfer Virtual Account", "e-Wallet", "Kartu Kredit / Debit", "QRIS", "Bayar di Tempat (COD)"].map(
                (x) => (
                  <label
                    key={x}
                    className={`mt-3 flex cursor-pointer gap-3 rounded-xl border p-4 ${
                      pay === x ? "border-[#5c3d2e]" : ""
                    }`}
                  >
                    <input type="radio" checked={pay === x} onChange={() => setPay(x)} />
                    <span>
                      <b>{x}</b>
                      <small className="block text-[#8c8075]">Pembayaran aman dan terverifikasi</small>
                    </span>
                  </label>
                )
              )}
            </section>
          </div>

          <aside>
            <div className={`${panel} sticky top-28 p-6`}>
              <h2 className="text-xl font-bold">Ringkasan Pesanan</h2>
              {items.map((item) => {
                const lineTotal = getUnitPrice(item.product.price, item.weight) * item.qty;
                return (
                  <div key={`${item.product.id}-${item.weight}`} className="mt-5 flex items-center gap-3">
                    <img
                      src={ASSET_BASE + item.product.image}
                      alt={item.product.name}
                      className="size-14 rounded-lg object-cover"
                    />
                    <span className="flex-1">
                      <b className="text-sm">{item.product.name}</b>
                      <small className="block">
                        {item.weight} × {item.qty}
                      </small>
                    </span>
                    <b className="text-sm">{formatRupiah(lineTotal)}</b>
                  </div>
                );
              })}

              <div className="my-5 border-t" />
              {[
                ["Subtotal", formatRupiah(subtotal)],
                [`Ongkir ${shipping.toLowerCase()}`, shippingCost === 0 ? "Gratis" : formatRupiah(shippingCost)],
                ["Diskon promo", discount > 0 ? `-${formatRupiah(discount)}` : "Rp 0"],
                ["Biaya layanan", "Rp 0"],
              ].map((x) => (
                <div key={x[0]} className="mt-3 flex justify-between text-sm">
                  <span>{x[0]}</span>
                  <b>{x[1]}</b>
                </div>
              ))}
              <div className="my-5 border-t" />
              <div className="flex justify-between text-xl">
                <b>Total Bayar</b>
                <b className="text-2xl text-[#5c3d2e]">{formatRupiah(total)}</b>
              </div>

              <button onClick={handlePay} className={`${primary} mt-6 w-full`}>
                Bayar Sekarang
              </button>

              <label className="mt-4 flex cursor-pointer gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (e.target.checked) setAgreeError(false);
                  }}
                />
                Saya setuju syarat &amp; ketentuan pembelian.
              </label>
              {agreeError && (
                <p className="mt-2 text-xs text-[#c0492f]">Centang syarat &amp; ketentuan sebelum melanjutkan.</p>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-[#c9963f] bg-[#fff4d7] p-5">
              <b>Pesananmu aman</b>
              <p className="mt-2 text-sm">Pembayaran lewat payment gateway terenkripsi.</p>
              <a href="tel:081266442210" className={`${secondary} mt-4 block w-full text-center`}>
                Chat Admin 0812-6644-2210
              </a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
