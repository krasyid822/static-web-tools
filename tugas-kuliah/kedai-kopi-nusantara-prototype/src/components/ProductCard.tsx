import { ASSET_BASE, formatRupiah, panel, ProductItem } from "../data/products";

interface ProductCardProps {
  item: ProductItem;
  onSelect: (item: ProductItem) => void;
  onAddToCart: (item: ProductItem) => void;
}

export default function ProductCard({ item, onSelect, onAddToCart }: ProductCardProps) {
  return (
    <article className={`${panel} group overflow-hidden`}>
      <button onClick={() => onSelect(item)} className="relative block h-44 w-full overflow-hidden text-left">
        <img
          src={ASSET_BASE + item.image}
          alt={item.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-[#c9963f] px-2 py-1 text-[9px] font-bold text-white">
          FRESH ROAST
        </span>
      </button>
      <div className="p-4">
        <button onClick={() => onSelect(item)} className="text-left font-semibold hover:text-[#5c3d2e]">
          {item.name}
        </button>
        <p className="mt-1 text-xs text-[#8c8075]">
          {item.origin} · {item.roast} · 200 gr
        </p>
        <p className="mt-2 text-xs text-[#c9963f]">
          ★★★★★ <span className="text-[#5c4f45]">4.9 (128)</span>
        </p>
        <strong className="mt-2 block text-[#5c3d2e]">{formatRupiah(item.price)}</strong>
        <button
          onClick={() => onAddToCart(item)}
          className="mt-3 w-full rounded-lg border border-[#eae2d9] py-2 text-xs font-semibold text-[#5c3d2e] shadow-sm transition hover:bg-[#fbf6f0]"
        >
          Tambah ke Keranjang
        </button>
      </div>
    </article>
  );
}
