"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface CartItem {
  id: number;
  cartId: number;
  medicineId: number;
  quantity: number;
  prescriptionId?: number | null;
  medicineName?: string | null;
  medicinePrice?: string | null;
  medicineDiscount?: string | null;
  medicineImage?: string | null;
  medicinePrescriptionRequired?: boolean | null;
  medicineStock?: number | null;
  medicineBrand?: string | null;
}

interface CartContextType {
  items: CartItem[];
  cartId: number | null;
  addItem: (medicineId: number, quantity?: number, prescriptionId?: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => void;
  fetchCart: () => Promise<void>;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<number | null>(null);

  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setCartId(data.cartId || null);
      }
    } catch {}
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const addItem = async (medicineId: number, quantity = 1, prescriptionId?: number) => {
    if (!token) return;
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ medicineId, quantity, prescriptionId }),
    });
    if (res.ok) await fetchCart();
  };

  const removeItem = async (itemId: number) => {
    if (!token) return;
    await fetch(`/api/cart?itemId=${itemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchCart();
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!token) return;
    await fetch("/api/cart", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itemId, quantity }),
    });
    await fetchCart();
  };

  const clearCart = () => {
    setItems([]);
    setCartId(null);
  };

  const total = items.reduce((sum, item) => {
    const price = parseFloat(item.medicinePrice || "0");
    const discount = parseFloat(item.medicineDiscount || "0");
    const discountedPrice = price * (1 - discount / 100);
    return sum + discountedPrice * item.quantity;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, cartId, addItem, removeItem, updateQuantity, clearCart, fetchCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
