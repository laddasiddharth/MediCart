"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, FileText, Tag, Truck, CreditCard } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart();
  const { user, token } = useAuth();
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [form, setForm] = useState({
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "cash_on_delivery" as string,
  });

  const tax = total * 0.05;
  const delivery = total > 500 ? 0 : 40;
  const finalTotal = total + tax + delivery;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/auth"); return; }
    setCheckoutLoading(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ medicineId: i.medicineId, quantity: i.quantity })),
        paymentMethod: form.paymentMethod,
        deliveryAddress: form.address,
        deliveryCity: form.city,
        deliveryState: form.state,
        deliveryPincode: form.pincode,
      }),
    });

    if (res.ok) {
      const order = await res.json();
      router.push(`/orders/${order.id}?success=true`);
    }
    setCheckoutLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <div>
            <ShoppingCart size={64} className="text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Please sign in</h2>
            <p className="text-gray-500 mb-6">Sign in to view your cart</p>
            <Link href="/auth" className="bg-green-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-600 transition">
              Sign In
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <div>
            <ShoppingCart size={64} className="text-gray-200 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add medicines to get started</p>
            <Link href="/shop" className="bg-green-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-600 transition inline-flex items-center gap-2">
              Shop Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <ShoppingCart size={24} className="text-green-500" />
          Shopping Cart
          <span className="text-base font-normal text-gray-500">({itemCount} items)</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const price = parseFloat(item.medicinePrice || "0");
              const discount = parseFloat(item.medicineDiscount || "0");
              const discountedPrice = price * (1 - discount / 100);
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.medicineImage || "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=200"}
                      alt={item.medicineName || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm leading-tight">{item.medicineName}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{item.medicineBrand}</p>
                        {item.medicinePrescriptionRequired && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <FileText size={10} /> Prescription Required
                          </span>
                        )}
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-gray-50 text-gray-600"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-3 text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.medicineStock || 99)}
                          className="p-1.5 hover:bg-gray-50 text-gray-600 disabled:opacity-40"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{(discountedPrice * item.quantity).toFixed(2)}</p>
                        {discount > 0 && (
                          <p className="text-xs text-gray-400 line-through">₹{(price * item.quantity).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1"><Tag size={13} /> Tax (5%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1"><Truck size={13} /> Delivery</span>
                  <span className={delivery === 0 ? "text-green-600 font-medium" : ""}>
                    {delivery === 0 ? "FREE" : `₹${delivery}`}
                  </span>
                </div>
                {delivery > 0 && (
                  <p className="text-xs text-gray-400">Add ₹{(500 - total).toFixed(2)} more for free delivery</p>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 text-sm">
              <p className="text-blue-700 font-medium mb-1">⚠️ Prescription Medicines</p>
              <p className="text-blue-600 text-xs">Some items may require a prescription. Upload it before checkout.</p>
              <Link href="/prescriptions" className="text-blue-700 underline text-xs mt-1 inline-block">Upload Prescription</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <CreditCard size={20} className="text-green-500" /> Checkout
              </h2>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Delivery Address *</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Enter your full address"
                    required
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">City *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Mumbai"
                      required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">State *</label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="Maharashtra"
                      required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">PIN Code *</label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    placeholder="400001"
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="cash_on_delivery">Cash on Delivery</option>
                    <option value="upi">UPI</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="net_banking">Net Banking</option>
                  </select>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-sm">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Order Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {checkoutLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Place Order"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
