import { useEffect } from "react";
import { formatRupiah, InfoModalType, Notice, OrderSummary, Page, primary, secondary } from "../data/products";

interface OverlayProps {
  type: "success" | Notice;
  infoModal: InfoModalType;
  order: OrderSummary | null;
  close: () => void;
  closeInfo: () => void;
  onOpenInfo: (info: InfoModalType) => void;
  onViewOrders: () => void;
  go: (page: Page, sectionId?: string) => void;
}

const TOAST_COPY: Record<Exclude<Notice, null>, { title: string; body: string }> = {
  subscribe: {
    title: "Berlangganan berhasil!",
    body: "Tips seduh & promo akan kami kirim ke emailmu.",
  },
  tracking: {
    title: "Resi disalin",
    body: "Nomor resi 0087654321 berhasil disalin ke papan klip.",
  },
  added: {
    title: "Ditambahkan ke keranjang",
    body: "Produk berhasil masuk ke keranjang belanjamu.",
  },
  plan_updated: {
    title: "Paket langganan diperbarui",
    body: "Pengaturan langgananmu berhasil disimpan.",
  },
  logged_out: {
    title: "Berhasil keluar",
    body: "Kamu telah keluar dari akun Rian Pratama.",
  },
  logged_in: {
    title: "Berhasil masuk",
    body: "Selamat datang kembali, Rian Pratama.",
  },
  ship_early: {
    title: "Pengiriman dipercepat",
    body: "Paket langgananmu dijadwalkan dikirim besok.",
  },
  address_saved: {
    title: "Alamat tersimpan",
    body: "Alamat pengiriman baru berhasil ditambahkan.",
  },
  review_added: {
    title: "Ulasan terkirim",
    body: "Terima kasih atas ulasanmu untuk Kedai Kopi Nusantara.",
  },
  social_copied: {
    title: "Akun disalin",
    body: "@kedaikopinusantara berhasil disalin ke papan klip.",
  },
};

const HELP_TABS: { id: Exclude<InfoModalType, "story" | "gift-card" | "terms" | "privacy" | "cookies" | null>; label: string; title: string; items: string[] }[] = [
  {
    id: "help-order",
    label: "Cara Pesan",
    title: "Cara Memesan Kopi",
    items: [
      "1. Pilih biji kopi favoritmu di halaman Katalog atau langsung dari Beranda.",
      "2. Tentukan ukuran kemasan (200 gr, 500 gr, atau 1 kg) dan jumlah pesanan.",
      "3. Masukkan ke keranjang, gunakan kode promo KopiHemat15 jika ada, lalu lanjut ke Checkout.",
      "4. Pilih alamat, kurir pengiriman, dan metode pembayaran. Pesanan diproses fresh roast.",
    ],
  },
  {
    id: "help-shipping",
    label: "Pengiriman",
    title: "Informasi Pengiriman",
    items: [
      "• Jadwal sangrai rutin setiap Senin & Kamis; pesanan dikirim maksimal 24 jam setelah sangrai.",
      "• Gratis ongkir reguler untuk total belanja minimal Rp 250.000.",
      "• JNE Regular: estimasi 2–3 hari kerja. JNE Express: estimasi 1 hari kerja (area Medan & sekitarnya).",
    ],
  },
  {
    id: "help-return",
    label: "Tukar & Retur",
    title: "Kebijakan Tukar & Retur",
    items: [
      "• Garansi penggantian 100% jika kemasan rusak, bocor, atau salah varian saat diterima.",
      "• Ajukan klaim maksimal 3×24 jam setelah paket diterima dengan menyertakan foto/video unboxing.",
      "• Hubungi admin di 0812-6644-2210 untuk proses penukaran cepat tanpa biaya tambahan.",
    ],
  },
  {
    id: "help-faq",
    label: "FAQ",
    title: "Pertanyaan Umum (FAQ)",
    items: [
      "• Apakah kopi bisa dijeda saat berlangganan? Ya, bisa dijeda atau diubah kapan saja di menu Akun > Langganan Saya.",
      "• Apakah biji kopi dijual dalam bentuk bubuk? Saat ini tersedia biji utuh (whole bean) agar kesegaran terjaga.",
      "• Berapa lama masa simpan kopi? Terbaik diseduh 7–45 hari setelah tanggal sangrai.",
    ],
  },
];

const INFO_COPY: Record<"story" | "gift-card" | "terms" | "privacy" | "cookies", { title: string; body: string[] }> = {
  story: {
    title: "Cerita Kopi Nusantara",
    body: [
      "Kedai Kopi Nusantara bermitra langsung dengan petani kopi pilihan dari dataran tinggi Gayo, Toraja, Kintamani, Java Preanger, hingga Wamena.",
      "Setiap minggu kami menyangrai biji kopi secara fresh roast setiap hari Senin & Kamis agar aroma dan karakter rasa asli Nusantara tetap terjaga hingga ke cangkirmu.",
    ],
  },
  "gift-card": {
    title: "Gift Card Kedai Kopi Nusantara",
    body: [
      "Berikan hadiah biji kopi Nusantara pilihan untuk rekan, keluarga, atau kolega.",
      "Tersedia nominal Rp 150.000, Rp 300.000, dan Rp 500.000 yang dapat ditukarkan untuk seluruh produk katalog maupun paket langganan.",
    ],
  },
  terms: {
    title: "Syarat & Ketentuan",
    body: [
      "Dengan berbelanja di Kedai Kopi Nusantara, Anda menyetujui bahwa seluruh pesanan diproses sesuai jadwal sangrai Senin & Kamis.",
      "Harga yang tertera sudah termasuk pajak yang berlaku. Pembatalan pesanan hanya dapat dilakukan sebelum status berubah menjadi Diproses.",
    ],
  },
  privacy: {
    title: "Kebijakan Privasi",
    body: [
      "Kami menjaga kerahasiaan data pribadi Anda (nama, alamat, nomor telepon, dan email) dan hanya menggunakannya untuk keperluan pengiriman serta layanan pelanggan.",
      "Data pembayaran diproses melalui payment gateway terenkripsi dan tidak disimpan di server kami.",
    ],
  },
  cookies: {
    title: "Kebijakan Cookies",
    body: [
      "Situs ini menggunakan cookies dan penyimpanan lokal browser untuk menjaga isi keranjang belanja, preferensi filter, serta status akun Anda selama sesi berlangsung.",
    ],
  },
};

export default function Overlay({
  type,
  infoModal,
  order,
  close,
  closeInfo,
  onOpenInfo,
  onViewOrders,
  go,
}: OverlayProps) {
  useEffect(() => {
    if (!type && !infoModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (infoModal) closeInfo();
        if (type) close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [type, infoModal, close, closeInfo]);

  if (!type && !infoModal) return null;

  const isHelpModal =
    infoModal === "help-order" ||
    infoModal === "help-shipping" ||
    infoModal === "help-return" ||
    infoModal === "help-faq";

  if (type === "success") {
    return (
      <div
        className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5"
        onClick={close}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-success-title"
      >
        <div
          className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-2xl sm:p-12"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="mx-auto grid size-24 place-items-center rounded-full bg-[#e5f2e8] text-6xl text-[#2e7e4f]">
            ✓
          </span>
          <h2 id="order-success-title" className="mt-7 text-3xl font-bold">
            Pesanan Berhasil!
          </h2>
          <p className="mt-3 text-[#5c4f45]">
            Pesanan {order?.id ?? "KKN-260912"} sedang disiapkan. Konfirmasi dikirim ke email dan WhatsApp kamu.
          </p>
          <div className="mt-8 rounded-2xl bg-[#fbf6f0] p-5 text-left">
            <div className="flex justify-between">
              <span>Total pembayaran</span>
              <b className="text-xl text-[#5c3d2e]">{formatRupiah(order?.total ?? 0)}</b>
            </div>
            <div className="my-3 border-t" />
            <div className="flex justify-between">
              <span>Estimasi tiba</span>
              <b>
                {order?.eta ?? "15-16 Sep 2026"} - {order?.shippingLabel ?? "JNE Regular"}
              </b>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <button onClick={() => go("catalog")} className={secondary}>
              Lanjut Belanja
            </button>
            <button onClick={onViewOrders} className={primary}>
              Lihat Pesanan
            </button>
          </div>
        </div>
      </div>
    );
  }

  const copy = type ? TOAST_COPY[type] : null;
  const activeHelp = isHelpModal ? HELP_TABS.find((t) => t.id === infoModal) : null;
  const activeInfo =
    infoModal && !isHelpModal ? INFO_COPY[infoModal as "story" | "gift-card" | "terms" | "privacy" | "cookies"] : null;

  return (
    <>
      {infoModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5"
          onClick={closeInfo}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl sm:p-9"
            onClick={(e) => e.stopPropagation()}
          >
            {isHelpModal && (
              <div className="mb-5 flex flex-wrap gap-2 border-b border-[#eae2d9] pb-4">
                {HELP_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onOpenInfo(tab.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                      infoModal === tab.id ? "bg-[#5c3d2e] text-white" : "bg-[#fbf6f0] text-[#5c4f45]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            <h2 className="text-2xl font-bold text-[#241812]">{activeHelp?.title ?? activeInfo?.title}</h2>
            <div className="mt-4 space-y-2.5 text-sm text-[#5c4f45]">
              {(activeHelp?.items ?? activeInfo?.body ?? []).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {infoModal === "story" && (
                <button
                  onClick={() => {
                    closeInfo();
                    go("catalog");
                  }}
                  className={primary}
                >
                  Jelajahi Katalog
                </button>
              )}
              {infoModal === "gift-card" && (
                <button
                  onClick={() => {
                    closeInfo();
                    go("catalog");
                  }}
                  className={primary}
                >
                  Belanja di Katalog
                </button>
              )}
              <button onClick={closeInfo} className={secondary}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {copy && (
        <div
          className="pointer-events-none fixed right-5 top-5 z-50 w-full max-w-md pl-5 sm:pl-0"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto flex w-full gap-4 rounded-2xl border border-[#eae2d9] bg-white p-6 shadow-2xl">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#2e7e4f] text-xl text-white">
              ✓
            </span>
            <div className="flex-1">
              <b>{copy.title}</b>
              <p className="mt-2 text-sm text-[#8c8075]">{copy.body}</p>
              <button onClick={close} className={`${secondary} float-right mt-4 !py-2`}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
