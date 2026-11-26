export type Page = "home" | "catalog" | "product" | "cart" | "checkout" | "account";
export type AccountTab =
  | "Dashboard"
  | "Langganan Saya"
  | "Riwayat Pesanan"
  | "Alamat Kirim"
  | "Metode Pembayaran"
  | "Ulasan Saya";
export type InfoModalType =
  | "story"
  | "help-order"
  | "help-shipping"
  | "help-return"
  | "help-faq"
  | "gift-card"
  | "terms"
  | "privacy"
  | "cookies"
  | null;
export type Notice =
  | "subscribe"
  | "tracking"
  | "added"
  | "plan_updated"
  | "logged_out"
  | "logged_in"
  | "ship_early"
  | "address_saved"
  | "review_added"
  | "social_copied"
  | null;
export type Weight = "200 gr" | "500 gr" | "1 kg";

export interface AddressItem {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  detail: string;
}

export interface ProductItem {
  id: string;
  name: string;
  origin: string;
  roast: "Light" | "Medium" | "Dark";
  category: "Single Origin" | "Blend";
  price: number;
  image: string;
  description: string;
  process: string;
  altitude: string;
  roastDate: string;
}

export interface CartItem {
  product: ProductItem;
  weight: Weight;
  qty: number;
}

export interface SubscriptionPlanOption {
  name: "Hemat" | "Regular" | "Rutin";
  monthlyPrice: number;
  quarterlyPrice: number;
  weightLabel: string;
  variants: number;
}

export interface SubscriptionState {
  planName: "Hemat" | "Regular" | "Rutin";
  cycle: "Bulanan" | "3 Bulan";
  price: number;
  weightLabel: string;
  status: "AKTIF" | "DIJEDA";
  nextDelivery: string;
  variantIds: string[];
}

export interface OrderSummary {
  id: string;
  date: string;
  status: "Dikirim" | "Diproses" | "Selesai";
  total: number;
  shippingLabel: string;
  eta: string;
}

export const ASSET_BASE = "./assets/";
export const FREE_SHIPPING_MIN = 250000;

export const PRODUCTS: ProductItem[] = [
  {
    id: "gayo-wine-natural",
    name: "Gayo Wine Natural",
    origin: "Aceh Tengah, Gayo",
    roast: "Light",
    category: "Single Origin",
    price: 129000,
    image: "c9794.png",
    description:
      "Biji arabika Gayo dari ketinggian 1.400 mdpl, diproses natural dengan penjemuran alami 14 hari. Profil rasa: berry merah, gula aren, dan aroma bunga yang pekat.",
    process: "Natural",
    altitude: "1.400 mdpl",
    roastDate: "12 September 2026",
  },
  {
    id: "toraja-sapan",
    name: "Toraja Sapan",
    origin: "Sulawesi Selatan",
    roast: "Medium",
    category: "Single Origin",
    price: 119000,
    image: "f6728.png",
    description:
      "Arabika Toraja Sapan berkarakter bersih dengan sentuhan cokelat hitam, rempah hangat, dan aftertaste manis yang panjang.",
    process: "Washed",
    altitude: "1.500 mdpl",
    roastDate: "12 September 2026",
  },
  {
    id: "kintamani-honey",
    name: "Kintamani Honey",
    origin: "Bali",
    roast: "Light",
    category: "Single Origin",
    price: 135000,
    image: "89048.png",
    description:
      "Diproses honey di dataran tinggi Kintamani, menghadirkan keasaman jeruk segar, madu hutan, dan body yang ringan.",
    process: "Honey",
    altitude: "1.300 mdpl",
    roastDate: "12 September 2026",
  },
  {
    id: "java-preanger",
    name: "Java Preanger",
    origin: "Jawa Barat",
    roast: "Medium",
    category: "Single Origin",
    price: 124000,
    image: "f5188.png",
    description:
      "Kopi klasik Jawa Barat dengan keseimbangan rasa karamel, kacang panggang, dan sentuhan teh hitam yang lembut.",
    process: "Full Washed",
    altitude: "1.450 mdpl",
    roastDate: "11 September 2026",
  },
  {
    id: "sidikalang-bold",
    name: "Sidikalang Bold",
    origin: "Sumatera Utara",
    roast: "Dark",
    category: "Single Origin",
    price: 109000,
    image: "c9201.png",
    description:
      "Sangrai gelap khas Sidikalang dengan body tebal, aroma kakao pekat, dan karakter rendah asam — cocok untuk kopi susu.",
    process: "Semi Washed",
    altitude: "1.200 mdpl",
    roastDate: "11 September 2026",
  },
  {
    id: "bajawa-natural",
    name: "Bajawa Natural",
    origin: "Flores, NTT",
    roast: "Light",
    category: "Single Origin",
    price: 142000,
    image: "db054.png",
    description:
      "Arabika Flores Bajawa yang ditanam di tanah vulkanik, menghasilkan aroma floral, buah tropis, dan rasa manis tebu.",
    process: "Natural",
    altitude: "1.550 mdpl",
    roastDate: "10 September 2026",
  },
  {
    id: "blend-rumah",
    name: "Blend Rumah",
    origin: "House Blend",
    roast: "Medium",
    category: "Blend",
    price: 99000,
    image: "4151d.png",
    description:
      "Racikan seimbang arabika Sumatera dan Jawa untuk seduhan harian, baik manual brew maupun mesin espresso rumahan.",
    process: "Blend",
    altitude: "1.250 mdpl",
    roastDate: "12 September 2026",
  },
  {
    id: "wamena-heritage",
    name: "Wamena Heritage",
    origin: "Papua",
    roast: "Medium",
    category: "Single Origin",
    price: 155000,
    image: "e90ea.png",
    description:
      "Kopi organik pegunungan Jayawijaya dengan profil rasa cokelat susu, buah pir, dan tekstur lembut.",
    process: "Washed",
    altitude: "1.700 mdpl",
    roastDate: "10 September 2026",
  },
  {
    id: "solok-honey",
    name: "Solok Honey",
    origin: "Sumatera Barat",
    roast: "Light",
    category: "Single Origin",
    price: 132000,
    image: "b5064.png",
    description:
      "Arabika Solok Selatan dengan proses honey, menonjolkan rasa mangga matang, gula merah, dan keasaman cerah.",
    process: "Honey",
    altitude: "1.400 mdpl",
    roastDate: "11 September 2026",
  },
];

export const INITIAL_CART: CartItem[] = [
  { product: PRODUCTS[0], weight: "200 gr", qty: 2 },
  { product: PRODUCTS[1], weight: "200 gr", qty: 1 },
  { product: PRODUCTS[2], weight: "200 gr", qty: 1 },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlanOption[] = [
  { name: "Hemat", monthlyPrice: 99000, quarterlyPrice: 84000, weightLabel: "200 gr / bulan", variants: 1 },
  { name: "Regular", monthlyPrice: 149000, quarterlyPrice: 127000, weightLabel: "500 gr / bulan", variants: 2 },
  { name: "Rutin", monthlyPrice: 265000, quarterlyPrice: 225000, weightLabel: "1 kg / bulan", variants: 3 },
];

export const INITIAL_ORDERS: OrderSummary[] = [
  { id: "KKN-260912", date: "12 Sep 2026", status: "Dikirim", total: 512000, shippingLabel: "JNE Regular", eta: "15-16 Sep 2026" },
  { id: "KKN-260812", date: "12 Agu 2026", status: "Selesai", total: 268000, shippingLabel: "JNE Regular", eta: "15 Agu 2026" },
  { id: "KKN-260712", date: "12 Jul 2026", status: "Selesai", total: 149000, shippingLabel: "Gratis Ongkir", eta: "15 Jul 2026" },
  { id: "KKN-260612", date: "12 Jun 2026", status: "Selesai", total: 149000, shippingLabel: "Gratis Ongkir", eta: "15 Jun 2026" },
];

export const INITIAL_ADDRESSES: AddressItem[] = [
  {
    id: "addr-1",
    label: "Rumah",
    recipient: "Rian Pratama",
    phone: "0812-6644-2210",
    detail: "Jl. Merdeka No. 123, Kec. Medan Baru, Kota Medan, Sumatera Utara, 20115",
  },
];

export const btn =
  "rounded-xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 active:translate-y-0";
export const primary = `${btn} bg-[#5c3d2e] text-white shadow-md`;
export const secondary = `${btn} border border-[#eae2d9] bg-white text-[#5c3d2e] shadow-sm`;
export const panel =
  "rounded-2xl border border-[#eae2d9] bg-white shadow-[0_6px_18px_rgba(36,23,18,.08)]";

export function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}

export function getUnitPrice(basePrice: number, weight: Weight): number {
  const multiplier = weight === "500 gr" ? 2.32 : weight === "1 kg" ? 5 : 1;
  return Math.round(basePrice * multiplier);
}
