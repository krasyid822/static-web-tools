import { useState } from "react";
import {
  AccountTab,
  AddressItem,
  ASSET_BASE,
  btn,
  formatRupiah,
  Notice,
  OrderSummary,
  Page,
  panel,
  primary,
  ProductItem,
  PRODUCTS,
  secondary,
  SUBSCRIPTION_PLANS,
  SubscriptionState,
} from "../data/products";

interface AccountProps {
  activeNav: AccountTab;
  onChangeNav: (tab: AccountTab) => void;
  subscription: SubscriptionState;
  orders: OrderSummary[];
  addresses: AddressItem[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
  onUpdateAddress: (id: string, detail: string) => void;
  onAddAddress: (addr: Omit<AddressItem, "id">) => void;
  go: (page: Page, sectionId?: string) => void;
  onNotify: (notice: Notice) => void;
  onToggleSubscription: () => void;
  onUpdateSubscription: (patch: Partial<SubscriptionState>) => void;
  onCopyTracking: () => void;
  onLogout: () => void;
  onSelectProduct: (item: ProductItem) => void;
}

const SIDEBAR_ITEMS: (AccountTab | "Keluar")[] = [
  "Dashboard",
  "Langganan Saya",
  "Riwayat Pesanan",
  "Alamat Kirim",
  "Metode Pembayaran",
  "Ulasan Saya",
  "Keluar",
];

export default function Account({
  activeNav,
  onChangeNav,
  subscription,
  orders,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onUpdateAddress,
  onAddAddress,
  go,
  onNotify,
  onToggleSubscription,
  onUpdateSubscription,
  onCopyTracking,
  onLogout,
  onSelectProduct,
}: AccountProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDetail, setNewDetail] = useState("");

  const [subPanel, setSubPanel] = useState<"variants" | "schedule" | null>(null);
  const [draftVariants, setDraftVariants] = useState<string[]>(subscription.variantIds);
  const [draftCycle, setDraftCycle] = useState<"Bulanan" | "3 Bulan">(subscription.cycle);
  const [draftDate, setDraftDate] = useState(subscription.nextDelivery);

  const [primaryPayIndex, setPrimaryPayIndex] = useState(0);

  const [reviews, setReviews] = useState([
    { product: "Gayo Wine Natural", rating: 5, text: "Aroma kuat, fresh roast sesuai tanggal di kemasan." },
    { product: "Toraja Sapan", rating: 5, text: "Cocok untuk seduh pagi hari, pengemasan sangat rapi." },
  ]);
  const [writingReview, setWritingReview] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(PRODUCTS[0].name);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];
  const selectedVariants = PRODUCTS.filter((p) => subscription.variantIds.includes(p.id));

  const handleNavClick = (item: AccountTab | "Keluar") => {
    setSelectedOrder(null);
    if (item === "Keluar") {
      onLogout();
      return;
    }
    onChangeNav(item);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText("0087654321");
    } catch {
      // Clipboard API may be unavailable in non-HTTPS contexts
    }
    onCopyTracking();
  };

  return (
    <main className="bg-[#fbf6f0]">
      <div className="mx-auto max-w-[1312px] px-6 py-10">
        <p className="text-sm text-[#8c8075]">
          <button onClick={() => go("home")} className="hover:underline">
            Beranda
          </button>
          　/　
          <button onClick={() => onChangeNav("Dashboard")} className="hover:underline">
            Akun
          </button>
          　/　{activeNav}
        </p>
        <h1 className="mt-3 text-4xl font-bold">{activeNav}</h1>
        <p className="mt-2 text-[#5c4f45]">Kelola jadwal, varian, dan jeda langganan kapan pun.</p>

        <div className="mt-7 grid gap-7 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-5">
            <div className={`${panel} p-6 text-center`}>
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#f1e7d9] text-xl font-bold text-[#5c3d2e]">
                RP
              </span>
              <b className="mt-4 block">Rian Pratama</b>
              <small>rian.pratama@mail.com</small>
              <span className="mx-auto mt-3 block w-fit rounded-full bg-[#e5f2e8] px-3 py-2 text-[10px] text-[#2e7e4f]">
                PEMBELI AKTIF
              </span>
            </div>

            <nav className={`${panel} p-4`} aria-label="Menu akun">
              {SIDEBAR_ITEMS.map((x) => (
                <button
                  key={x}
                  onClick={() => handleNavClick(x)}
                  className={`block w-full rounded-lg px-4 py-3 text-left text-sm ${
                    activeNav === x ? "bg-[#fbf6f0] font-semibold text-[#5c3d2e]" : ""
                  }`}
                >
                  {x}
                </button>
              ))}
            </nav>

            <div className="rounded-2xl border border-[#c9963f] bg-[#fff4d7] p-5">
              <b>Butuh bantuan?</b>
              <p className="mt-2 text-sm">Tim kami siap bantu atur jadwal dan tukar varian.</p>
              <a href="tel:081266442210" className={`${secondary} mt-4 block w-full text-center`}>
                Chat Admin
              </a>
            </div>
          </aside>

          <div className="space-y-6">
            {(activeNav === "Dashboard" || activeNav === "Langganan Saya") && (
              <section className="rounded-2xl bg-gradient-to-br from-[#6b4635] to-[#362117] p-7 text-white shadow-lg">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <span
                      className={`rounded-full px-4 py-2 text-[10px] font-bold ${
                        subscription.status === "AKTIF"
                          ? "bg-white text-[#5c3d2e]"
                          : "bg-[#fff4d7] text-[#9c6b20]"
                      }`}
                    >
                      {subscription.status}
                    </span>
                    <h2 className="mt-5 text-2xl font-bold">
                      Paket {subscription.planName} - {subscription.weightLabel} ({subscription.cycle})
                    </h2>
                    <p className="mt-2 text-sm text-[#e3d8d0]">
                      Berikutnya: {subscription.nextDelivery} ·{" "}
                      {selectedVariants.length > 0
                        ? selectedVariants.map((v) => `${v.name} 250 gr`).join(" + ")
                        : "Belum ada varian dipilih"}
                    </p>
                  </div>
                  <strong className="text-2xl text-[#d9a33e]">
                    {formatRupiah(subscription.price)} / bulan
                    {subscription.cycle === "3 Bulan" ? " (tagihan 3 bulan)" : ""}
                  </strong>
                </div>
                <div className="my-5 h-2 rounded-full bg-[#a17a68]">
                  <div className="h-2 w-3/5 rounded-full bg-[#d9a33e]" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={onToggleSubscription} className={secondary}>
                    {subscription.status === "AKTIF" ? "Jeda Langganan" : "Aktifkan Langganan"}
                  </button>
                  <button
                    onClick={() => {
                      setDraftVariants(subscription.variantIds);
                      setSubPanel(subPanel === "variants" ? null : "variants");
                    }}
                    className={secondary}
                  >
                    Ganti Varian
                  </button>
                  <button
                    onClick={() => {
                      setDraftCycle(subscription.cycle);
                      setDraftDate(subscription.nextDelivery);
                      setSubPanel(subPanel === "schedule" ? null : "schedule");
                    }}
                    className={`${btn} bg-[#c9963f] text-white`}
                  >
                    Atur Jadwal
                  </button>
                </div>

                {subPanel === "variants" && (
                  <div className="mt-5 rounded-xl bg-white/10 p-4 text-sm">
                    <b className="block">Pilih Varian Kopi Langganan</b>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {PRODUCTS.map((p) => {
                        const checked = draftVariants.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() =>
                              setDraftVariants((prev) =>
                                checked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                              )
                            }
                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                              checked ? "bg-[#c9963f] text-white" : "bg-white/20 text-white"
                            }`}
                          >
                            {checked ? "✓ " : "+ "}
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (draftVariants.length > 0) {
                            onUpdateSubscription({ variantIds: draftVariants });
                            onNotify("plan_updated");
                            setSubPanel(null);
                          }
                        }}
                        className={`${btn} bg-[#c9963f] text-white`}
                      >
                        Simpan Varian
                      </button>
                      <button type="button" onClick={() => setSubPanel(null)} className={secondary}>
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {subPanel === "schedule" && (
                  <div className="mt-5 rounded-xl bg-white/10 p-4 text-sm">
                    <b className="block">Atur Siklus &amp; Tanggal Pengiriman</b>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs text-[#e3d8d0]">Siklus</label>
                        <select
                          value={draftCycle}
                          onChange={(e) => setDraftCycle(e.target.value as "Bulanan" | "3 Bulan")}
                          className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm text-[#241812]"
                        >
                          <option value="Bulanan">Bulanan</option>
                          <option value="3 Bulan">3 Bulan (Hemat 15%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-[#e3d8d0]">Pengiriman Berikutnya</label>
                        <select
                          value={draftDate}
                          onChange={(e) => setDraftDate(e.target.value)}
                          className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm text-[#241812]"
                        >
                          <option value="12 Okt 2026">12 Okt 2026</option>
                          <option value="19 Okt 2026">19 Okt 2026</option>
                          <option value="26 Okt 2026">26 Okt 2026</option>
                          <option value="2 Nov 2026">2 Nov 2026</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const planOpt = SUBSCRIPTION_PLANS.find((p) => p.name === subscription.planName);
                          const nextPrice = planOpt
                            ? draftCycle === "3 Bulan"
                              ? planOpt.quarterlyPrice
                              : planOpt.monthlyPrice
                            : subscription.price;
                          onUpdateSubscription({
                            cycle: draftCycle,
                            price: nextPrice,
                            nextDelivery: draftDate,
                          });
                          onNotify("plan_updated");
                          setSubPanel(null);
                        }}
                        className={`${btn} bg-[#c9963f] text-white`}
                      >
                        Simpan Jadwal
                      </button>
                      <button type="button" onClick={() => setSubPanel(null)} className={secondary}>
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeNav === "Langganan Saya" && (
              <section className={`${panel} p-6`}>
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold">Pengiriman Berikutnya</h3>
                    <small>{subscription.nextDelivery}</small>
                  </div>
                  <button
                    onClick={() => {
                      onUpdateSubscription({ nextDelivery: "Besok (Pengiriman Dipercepat)" });
                      onNotify("ship_early");
                    }}
                    className={secondary}
                  >
                    Kirim Lebih Awal
                  </button>
                </div>
                {(selectedVariants.length > 0 ? selectedVariants : PRODUCTS.slice(0, 2)).map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectProduct(p)}
                    className="mt-4 flex w-full items-center gap-3 border-t pt-3 text-left hover:bg-[#fbf6f0]"
                  >
                    <img src={ASSET_BASE + p.image} alt={p.name} className="size-10 rounded-md object-cover" />
                    <span className="flex-1 text-sm font-medium">{p.name} 250 gr</span>
                    <b className="text-sm">{i === 2 ? "Gratis" : formatRupiah(p.price)}</b>
                  </button>
                ))}
              </section>
            )}

            {activeNav === "Dashboard" && (
              <div className="grid gap-5 sm:grid-cols-3">
                {[
                  ["12 paket", "kopi sudah dikirim"],
                  ["Rp 216.000", "total hemat langganan"],
                  ["4 ulasan", "menjadi pembeli aktif"],
                ].map((x) => (
                  <div key={x[0]} className={`${panel} p-6`}>
                    <b className="text-xl text-[#5c3d2e]">●　{x[0]}</b>
                    <small className="mt-3 block">{x[1]}</small>
                  </div>
                ))}
              </div>
            )}

            {(activeNav === "Dashboard" || activeNav === "Riwayat Pesanan") && (
              <section className={`${panel} overflow-hidden`}>
                <div className="flex justify-between p-5">
                  <b>Riwayat Pesanan</b>
                  {activeNav !== "Riwayat Pesanan" && (
                    <button onClick={() => onChangeNav("Riwayat Pesanan")} className="text-sm text-[#5c3d2e]">
                      Lihat semua
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-[#fbf6f0]">
                      <tr>
                        {["No. Pesanan", "Tanggal", "Status", "Total", "Aksi"].map((x) => (
                          <th className="p-4" key={x}>
                            {x}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr className="border-t" key={order.id}>
                          <td className="p-4 font-semibold">{order.id}</td>
                          <td>{order.date}</td>
                          <td>
                            <span className="rounded-full bg-[#e5f2e8] px-4 py-1 text-[#2e7e4f]">{order.status}</span>
                          </td>
                          <td>{formatRupiah(order.total)}</td>
                          <td>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="font-semibold text-[#5c3d2e] hover:underline"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {selectedOrder && (
              <section className={`${panel} p-6`}>
                <div className="flex items-center justify-between">
                  <b>Detail Pesanan {selectedOrder.id}</b>
                  <button onClick={() => setSelectedOrder(null)} className="text-xs text-[#8c8075] hover:underline">
                    Tutup
                  </button>
                </div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-[#8c8075]">Tanggal:</span> <b>{selectedOrder.date}</b>
                  </div>
                  <div>
                    <span className="text-[#8c8075]">Status:</span> <b>{selectedOrder.status}</b>
                  </div>
                  <div>
                    <span className="text-[#8c8075]">Kurir:</span> <b>{selectedOrder.shippingLabel}</b>
                  </div>
                  <div>
                    <span className="text-[#8c8075]">Estimasi tiba:</span> <b>{selectedOrder.eta}</b>
                  </div>
                  <div>
                    <span className="text-[#8c8075]">Total:</span>{" "}
                    <b className="text-[#5c3d2e]">{formatRupiah(selectedOrder.total)}</b>
                  </div>
                </div>
              </section>
            )}

            {activeNav === "Riwayat Pesanan" && (
              <section className={`${panel} p-6`}>
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <b>Status Pengiriman</b>
                    <span className="ml-4 rounded-full bg-[#c9963f] px-4 py-2 text-[10px] text-white">
                      DALAM PERJALANAN
                    </span>
                  </div>
                  <div>
                    <b>0087654321</b>
                    <button onClick={handleCopy} className={`${secondary} ml-3`}>
                      Salin Resi
                    </button>
                  </div>
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
                  <div className="rounded-xl bg-[#fbf6f0] p-5 text-sm">
                    <small>ALAMAT TUJUAN</small>
                    <p className="mt-2">{selectedAddress?.detail}</p>
                    <b className="mt-4 block">JNE Regular</b>
                    <strong className="mt-4 block text-[#2e7e4f]">2-3 hari kerja</strong>
                  </div>
                  <ol className="space-y-4 border-l-2 border-[#5c3d2e] pl-6">
                    {[
                      "Pesanan diterima",
                      "Pembayaran terkonfirmasi",
                      "Disangrai & dikemas",
                      "Diserahkan ke kurir",
                      "Dalam perjalanan",
                    ].map((x, i) => (
                      <li key={x} className={i === 4 ? "rounded-xl border border-[#5c3d2e] p-3" : ""}>
                        <b>{x}</b>
                        <small className="block text-[#8c8075]">12 Sep 2026 · 09:{12 + i * 3}</small>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            )}

            {activeNav === "Alamat Kirim" && (
              <section className={`${panel} p-6`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Alamat Pengiriman</h2>
                  <button
                    onClick={() => setEditingAddress(!editingAddress)}
                    className="text-sm font-semibold text-[#5c3d2e]"
                  >
                    {editingAddress ? "Simpan" : "Ubah"}
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {addresses.map((addr) => {
                    const isSelected = addr.id === selectedAddressId;
                    return (
                      <div
                        key={addr.id}
                        className={`rounded-xl border p-5 ${isSelected ? "border-[#5c3d2e]" : "border-[#eae2d9]"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <b>{addr.recipient}</b>
                            <span className="ml-2 rounded-full bg-[#fbf6f0] px-2.5 py-0.5 text-[10px] text-[#5c3d2e]">
                              {addr.label}
                            </span>
                          </div>
                          {!isSelected && (
                            <button
                              onClick={() => onSelectAddress(addr.id)}
                              className="text-xs font-semibold text-[#5c3d2e] hover:underline"
                            >
                              Jadikan Utama
                            </button>
                          )}
                        </div>
                        {editingAddress && isSelected ? (
                          <input
                            value={addr.detail}
                            onChange={(e) => onUpdateAddress(addr.id, e.target.value)}
                            className="mt-2 w-full rounded-lg border border-[#eae2d9] px-3 py-2 text-sm"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-[#5c4f45]">{addr.detail}</p>
                        )}
                        <small className="mt-1 block text-[#8c8075]">{addr.phone}</small>
                      </div>
                    );
                  })}
                </div>
                {addingAddress ? (
                  <form
                    onSubmit={(e) => {
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
                    }}
                    className="mt-4 space-y-3 rounded-xl border border-[#eae2d9] bg-[#fbf6f0] p-4"
                  >
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
                      placeholder="Nomor HP"
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
            )}

            {activeNav === "Metode Pembayaran" && (
              <section className={`${panel} space-y-4 p-6`}>
                <h2 className="text-lg font-bold">Metode Pembayaran Tersimpan</h2>
                {[
                  { title: "Transfer Virtual Account (BCA)", desc: "Otomatis terverifikasi" },
                  { title: "QRIS / e-Wallet (GoPay)", desc: "Terhubung · 0812-6644-2210" },
                ].map((m, idx) => (
                  <div key={m.title} className="flex items-center justify-between rounded-xl border p-4 text-sm">
                    <div>
                      <b>{m.title}</b>
                      <p className="text-xs text-[#8c8075]">
                        {primaryPayIndex === idx ? "Utama · " : ""}
                        {m.desc}
                      </p>
                    </div>
                    {primaryPayIndex === idx ? (
                      <span className="rounded-full bg-[#e5f2e8] px-3 py-1 text-xs text-[#2e7e4f]">Utama</span>
                    ) : (
                      <button
                        onClick={() => setPrimaryPayIndex(idx)}
                        className="text-xs font-semibold text-[#5c3d2e] hover:underline"
                      >
                        Jadikan Utama
                      </button>
                    )}
                  </div>
                ))}
              </section>
            )}

            {activeNav === "Ulasan Saya" && (
              <section className={`${panel} space-y-4 p-6 text-sm`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Ulasan Saya</h2>
                  <button onClick={() => setWritingReview(!writingReview)} className={secondary}>
                    {writingReview ? "Tutup" : "Tulis Ulasan"}
                  </button>
                </div>

                {writingReview && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!reviewText.trim()) return;
                      setReviews((prev) => [
                        { product: reviewProduct, rating: reviewRating, text: reviewText.trim() },
                        ...prev,
                      ]);
                      setReviewText("");
                      setWritingReview(false);
                      onNotify("review_added");
                    }}
                    className="space-y-3 rounded-xl border border-[#eae2d9] bg-[#fbf6f0] p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select
                        value={reviewProduct}
                        onChange={(e) => setReviewProduct(e.target.value)}
                        className="rounded-lg border border-[#eae2d9] bg-white px-3 py-2 text-sm"
                      >
                        {PRODUCTS.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="rounded-lg border border-[#eae2d9] bg-white px-3 py-2 text-sm"
                      >
                        {[5, 4, 3, 2, 1].map((r) => (
                          <option key={r} value={r}>
                            {"★".repeat(r)} ({r}/5)
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Tulis pengalaman seduhmu..."
                      rows={3}
                      required
                      className="w-full rounded-lg border border-[#eae2d9] bg-white px-3 py-2 text-sm"
                    />
                    <button type="submit" className={primary}>
                      Kirim Ulasan
                    </button>
                  </form>
                )}

                {reviews.map((rev, i) => (
                  <div key={`${rev.product}-${i}`} className="rounded-xl border p-4">
                    <b>{rev.product}</b>{" "}
                    <span className="text-[#c9963f]">{"★".repeat(rev.rating)}</span>
                    <p className="mt-1 text-[#5c4f45]">{rev.text}</p>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
