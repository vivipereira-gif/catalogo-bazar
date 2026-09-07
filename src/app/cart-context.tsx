"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { CartItem, CatalogProduct } from "@/lib/catalog/types";
import styles from "./catalogo.module.css";

type CartContextValue = {
  cart: CartItem[];
  addToCart: (product: CatalogProduct) => boolean;
  changeQuantity: (id: string | number, delta: number) => void;
  showToast: (message: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const addToCart = useCallback((product: CatalogProduct) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing && existing.cartQuantity >= product.quantity) {
      showToast("Essa é toda a quantidade disponível");
      return false;
    }

    setCart((current) => existing
      ? current.map((item) => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item)
      : [...current, { ...product, cartQuantity: 1 }],
    );
    showToast(`${product.name} foi para a sacola`);
    return true;
  }, [cart, showToast]);

  const changeQuantity = useCallback((id: string | number, delta: number) => {
    setCart((current) => current
      .map((item) => item.id === id ? { ...item, cartQuantity: Math.min(item.quantity, Math.max(0, item.cartQuantity + delta)) } : item)
      .filter((item) => item.cartQuantity > 0),
    );
  }, []);

  const value = useMemo(() => ({ cart, addToCart, changeQuantity, showToast }), [cart, addToCart, changeQuantity, showToast]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {toast && <div className={styles.toast}><Check size={17} />{toast}</div>}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de CartProvider");
  return context;
}
