import { useCallback, useEffect, useState } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Overlay from "./components/Overlay";
import SplashScreen from "./components/SplashScreen";
import {
  AccountTab,
  AddressItem,
  CartItem,
  InfoModalType,
  INITIAL_ADDRESSES,
  INITIAL_CART,
  INITIAL_ORDERS,
  Notice,
  OrderSummary,
  Page,
  ProductItem,
  PRODUCTS,
  SubscriptionPlanOption,
  SubscriptionState,
  Weight,
} from "./data/products";
import Account from "./pages/Account";
import Cart from "./pages/Cart";
import Catalog from "./pages/Catalog";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import Product from "./pages/Product";

const VALID_PAGES: Page[] = ["home", "catalog", "product", "cart", "checkout", "account"];

function parseHash(): { page: Page; productId?: string } {
  const raw = window.location.hash.replace("#", "");
  if (raw.startsWith("product/")) {
    const productId = raw.slice("product/".length);
    return { page: "product", productId };
  }
  const page = raw as Page;
  return { page: VALID_PAGES.includes(page) ? page : "home" };
}

function getInitialProduct(): ProductItem {
  const { productId } = parseHash();
  return PRODUCTS.find((p) => p.id === productId) ?? PRODUCTS[0];
}

export default function App() {
  const [page, setPage] = useState<Page>(() => parseHash().page);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem>(getInitialProduct);
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);
  const [promoCode, setPromoCode] = useState("");
  const [discountRate, setDiscountRate] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [overlay, setOverlay] = useState<"success" | Notice>(null);
  const [infoModal, setInfoModal] = useState<InfoModalType>(null);
  const [lastOrder, setLastOrder] = useState<OrderSummary | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>(INITIAL_ORDERS);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [accountTab, setAccountTab] = useState<AccountTab>("Langganan Saya");
  const [addresses, setAddresses] = useState<AddressItem[]>(INITIAL_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(INITIAL_ADDRESSES[0].id);
  const [subscription, setSubscription] = useState<SubscriptionState>({
    planName: "Regular",
    cycle: "Bulanan",
    price: 149000,
    weightLabel: "500 gr / bulan",
    status: "AKTIF",
    nextDelivery: "12 Okt 2026",
    variantIds: ["gayo-wine-natural", "toraja-sapan"],
  });

  const go = useCallback((target: Page, sectionId?: string) => {
    setOverlay(null);
    setInfoModal(null);
    setPage(target);
    if (target !== "product" && window.location.hash !== `#${target}`) {
      window.location.hash = target;
    }
    if (sectionId) {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const openAccount = useCallback(
    (tab: AccountTab) => {
      setAccountTab(tab);
      go("account");
    },
    [go]
  );

  const handleLogin = () => {
    setIsLoggedIn(true);
    openAccount("Dashboard");
    setOverlay("logged_in");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    go("home");
    setOverlay("logged_out");
  };

  const handleUpdateAddress = (id: string, detail: string) => {
    setAddresses((prev) => prev.map((a) => (a.id === id ? { ...a, detail } : a)));
  };

  const handleAddAddress = (addr: Omit<AddressItem, "id">) => {
    const newAddr: AddressItem = { ...addr, id: `addr-${Date.now()}` };
    setAddresses((prev) => [...prev, newAddr]);
    setSelectedAddressId(newAddr.id);
    setOverlay("address_saved");
  };

  const handleUpdateSubscription = (patch: Partial<SubscriptionState>) => {
    setSubscription((prev) => ({ ...prev, ...patch }));
  };

  useEffect(() => {
    const onHashChange = () => {
      const { page: nextPage, productId } = parseHash();
      setPage(nextPage);
      if (productId) {
        const found = PRODUCTS.find((p) => p.id === productId);
        if (found) setSelectedProduct(found);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (overlay && overlay !== "success") {
      const t = setTimeout(() => setOverlay(null), 4000);
      return () => clearTimeout(t);
    }
  }, [overlay]);

  const handleSelectProduct = (item: ProductItem) => {
    setSelectedProduct(item);
    setOverlay(null);
    setPage("product");
    const targetHash = `#product/${item.id}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = `product/${item.id}`;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = (item: ProductItem, weight: Weight = "200 gr", qty = 1, redirect?: Page) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.id === item.id && c.weight === weight);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { product: item, weight, qty }];
    });
    if (redirect) {
      go(redirect);
    } else {
      setOverlay("added");
    }
  };

  const handleUpdateQty = (productId: string, weight: Weight, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === productId && c.weight === weight ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const handleRemoveItem = (productId: string, weight: Weight) => {
    setCart((prev) => prev.filter((c) => !(c.product.id === productId && c.weight === weight)));
  };

  const handleApplyPromo = (code: string) => {
    if (code.toLowerCase() === "kopihemat15") {
      setPromoCode(code);
      setDiscountRate(0.15);
      return true;
    }
    setPromoCode("");
    setDiscountRate(0);
    return false;
  };

  const handleSelectPlan = (plan: SubscriptionPlanOption, cycle: "Bulanan" | "3 Bulan") => {
    setSubscription((prev) => ({
      ...prev,
      planName: plan.name,
      cycle,
      price: cycle === "3 Bulan" ? plan.quarterlyPrice : plan.monthlyPrice,
      weightLabel: plan.weightLabel,
      status: "AKTIF",
    }));
    openAccount("Langganan Saya");
    setOverlay("plan_updated");
  };

  const handleToggleSubscription = () => {
    setSubscription((prev) => ({
      ...prev,
      status: prev.status === "AKTIF" ? "DIJEDA" : "AKTIF",
    }));
    setOverlay("plan_updated");
  };

  const handleCompleteOrder = (order: OrderSummary) => {
    setLastOrder(order);
    setOrders((prev) => [order, ...prev]);
    setCart([]);
    setPromoCode("");
    setDiscountRate(0);
    setOverlay("success");
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const renderPage = () => {
    switch (page) {
      case "home":
        return (
          <Home
            go={go}
            onSelectProduct={handleSelectProduct}
            onAddToCart={(item) => handleAddToCart(item)}
            onSelectPlan={handleSelectPlan}
          />
        );
      case "catalog":
        return (
          <Catalog
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectProduct={handleSelectProduct}
            onAddToCart={(item) => handleAddToCart(item)}
            go={go}
          />
        );
      case "product":
        return (
          <Product
            product={selectedProduct}
            go={go}
            onSelectProduct={handleSelectProduct}
            onAddToCart={handleAddToCart}
          />
        );
      case "cart":
        return (
          <Cart
            items={cart}
            promoCode={promoCode}
            discountRate={discountRate}
            go={go}
            onSelectProduct={handleSelectProduct}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onApplyPromo={handleApplyPromo}
          />
        );
      case "checkout":
        return (
          <Checkout
            items={cart}
            discountRate={discountRate}
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={setSelectedAddressId}
            onUpdateAddress={handleUpdateAddress}
            onAddAddress={handleAddAddress}
            go={go}
            onCompleteOrder={handleCompleteOrder}
          />
        );
      case "account":
        return (
          <Account
            activeNav={accountTab}
            onChangeNav={setAccountTab}
            subscription={subscription}
            orders={orders}
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={setSelectedAddressId}
            onUpdateAddress={handleUpdateAddress}
            onAddAddress={handleAddAddress}
            go={go}
            onNotify={(notice: Notice) => setOverlay(notice)}
            onToggleSubscription={handleToggleSubscription}
            onUpdateSubscription={handleUpdateSubscription}
            onCopyTracking={() => setOverlay("tracking")}
            onLogout={handleLogout}
            onSelectProduct={handleSelectProduct}
          />
        );
    }
  };

  return (
    <div className="min-h-dvh bg-white text-[#241812]">
      <SplashScreen />
      <Header
        page={page}
        go={go}
        cartCount={cartCount}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
        onOpenAccount={openAccount}
        onOpenInfo={setInfoModal}
      />
      <div className="page-enter" key={page}>
        {renderPage()}
      </div>
      <Footer
        go={go}
        subscribe={() => setOverlay("subscribe")}
        onOpenInfo={setInfoModal}
        onNotify={(notice: Notice) => setOverlay(notice)}
      />
      <Overlay
        type={overlay}
        infoModal={infoModal}
        order={lastOrder}
        close={() => setOverlay(null)}
        closeInfo={() => setInfoModal(null)}
        onOpenInfo={setInfoModal}
        onViewOrders={() => openAccount("Riwayat Pesanan")}
        go={go}
      />
    </div>
  );
}
