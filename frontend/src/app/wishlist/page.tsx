"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface WishlistItem {
  id: number;
  createdAt: string;
  medicine: {
    id: number;
    name: string;
    brand: string | null;
    price: string;
    discountPercent: string | null;
    imageUrl: string | null;
    stock: number;
    prescriptionRequired: boolean;
    categoryName: string | null;
  };
}

export default function WishlistPage() {
  const { user, token } = useAuth();
  const { toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch("/api/wishlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleRemove = async (medicineId: number) => {
    await toggleWishlist(medicineId);
    setItems((prev) => prev.filter((item) => item.medicine.id !== medicineId));
  };

  const handleAddToCart = async (medicineId: number) => {
    setAddingToCart(medicineId);
    await addItem(medicineId);
    setAddingToCart(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart size={28} className="text-red-500 fill-red-500" />
          <h1 className="text-2xl font-bold text-gray-800">My Wishlist</h1>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save items you want to buy later by clicking the heart icon.</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              Explore Medicines <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const price = parseFloat(item.medicine.price);
              const discount = parseFloat(item.medicine.discountPercent || "0");
              const discountedPrice = price * (1 - discount / 100);

              return (
                <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4">
                  <Link href={`/medicine/${item.medicine.id}`} className="w-24 h-24 shrink-0">
                    <img
                      src={item.medicine.imageUrl || "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=150"}
                      alt={item.medicine.name}
                      className="w-full h-full object-cover rounded-xl bg-gray-50"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link href={`/medicine/${item.medicine.id}`} className="truncate font-semibold text-gray-800 hover:text-green-600 transition">
                        {item.medicine.name}
                      </Link>
                      <button
                        onClick={() => handleRemove(item.medicine.id)}
                        className="text-gray-400 hover:text-red-500 transition p-1"
                        title="Remove from wishlist"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 truncate">{item.medicine.brand}</p>
                    
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-bold text-gray-900">₹{discountedPrice.toFixed(0)}</span>
                      {discount > 0 && <span className="text-xs text-gray-400 line-through">₹{price.toFixed(0)}</span>}
                    </div>

                    <button
                      onClick={() => handleAddToCart(item.medicine.id)}
                      disabled={addingToCart === item.medicine.id || item.medicine.stock === 0}
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
                        item.medicine.stock === 0
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      <ShoppingCart size={14} />
                      {item.medicine.stock === 0
                        ? "Out of Stock"
                        : addingToCart === item.medicine.id
                        ? "Adding..."
                        : "Add to Cart"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
