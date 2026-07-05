"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface WishlistContextType {
  wishlistIds: number[];
  toggleWishlist: (medicineId: number) => Promise<boolean>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistIds: [],
  toggleWishlist: async () => false,
  loading: false,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      fetchWishlist();
    } else {
      setWishlistIds([]);
      setLoading(false);
    }
  }, [user, token]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wishlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistIds(data.map((item: any) => item.medicine.id));
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    }
    setLoading(false);
  };

  const toggleWishlist = async (medicineId: number) => {
    if (!user || !token) return false;
    try {
      const res = await fetch("/api/wishlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicineId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.added) {
          setWishlistIds((prev) => [...prev, medicineId]);
        } else {
          setWishlistIds((prev) => prev.filter((id) => id !== medicineId));
        }
        return data.added;
      }
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
    }
    return false;
  };

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
