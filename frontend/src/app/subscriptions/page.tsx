"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { CalendarClock, Package, AlertCircle, RefreshCw, X, Play, Pause, Trash2 } from "lucide-react";

interface Subscription {
  id: number;
  quantity: number;
  frequency: string;
  status: string;
  nextDeliveryDate: string;
  createdAt: string;
  medicine: {
    id: number;
    name: string;
    brand: string | null;
    price: string;
    discountPercent: string | null;
    imageUrl: string | null;
  };
}

export default function SubscriptionsPage() {
  const { user, token } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    fetchSubscriptions();
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("/api/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSubscriptions(prev => 
          prev.map(sub => sub.id === id ? { ...sub, status: newStatus } : sub)
        );
      }
    } catch (error) {
      console.error(error);
    }
    setUpdating(null);
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) return;
    setUpdating(id);
    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSubscriptions(prev => 
          prev.map(sub => sub.id === id ? { ...sub, status: "cancelled" } : sub)
        );
      }
    } catch (error) {
      console.error(error);
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <CalendarClock size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Subscriptions</h1>
            <p className="text-gray-500 text-sm">Manage your auto-refill deliveries</p>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw size={32} className="text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No active subscriptions</h2>
            <p className="text-gray-500 mb-6">Never run out of important medications by setting up an auto-refill.</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              Explore Medicines
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => {
              const price = parseFloat(sub.medicine.price);
              const discount = parseFloat(sub.medicine.discountPercent || "0");
              const discountedPrice = price * (1 - discount / 100);
              const total = discountedPrice * sub.quantity;

              return (
                <div key={sub.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-32 h-32 shrink-0">
                      <img
                        src={sub.medicine.imageUrl || "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=200"}
                        alt={sub.medicine.name}
                        className="w-full h-full object-cover rounded-xl bg-gray-50"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${
                              sub.status === "active" ? "bg-green-100 text-green-700" :
                              sub.status === "paused" ? "bg-orange-100 text-orange-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {sub.status}
                            </span>
                            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md capitalize">
                              {sub.frequency} Refill
                            </span>
                          </div>
                          <Link href={`/medicine/${sub.medicine.id}`} className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition">
                            {sub.medicine.name}
                          </Link>
                          <p className="text-sm text-gray-500">{sub.medicine.brand}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-2xl font-bold text-gray-900">₹{total.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">per delivery ({sub.quantity} units)</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Package className="text-gray-400" size={20} />
                          <div>
                            <p className="text-xs text-gray-500">Next Delivery Date</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {sub.status === "cancelled" ? "Cancelled" : sub.nextDeliveryDate ? new Date(sub.nextDeliveryDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Pending"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {sub.status !== "cancelled" && (
                        <div className="flex flex-wrap gap-3">
                          {sub.status === "active" ? (
                            <button
                              onClick={() => handleUpdateStatus(sub.id, "paused")}
                              disabled={updating === sub.id}
                              className="flex items-center gap-2 px-4 py-2 border-2 border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                            >
                              <Pause size={16} /> Pause
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(sub.id, "active")}
                              disabled={updating === sub.id}
                              className="flex items-center gap-2 px-4 py-2 border-2 border-green-200 text-green-600 hover:bg-green-50 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                            >
                              <Play size={16} /> Resume
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleCancel(sub.id)}
                            disabled={updating === sub.id}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-lg text-sm font-semibold transition ml-auto disabled:opacity-50"
                          >
                            <Trash2 size={16} /> Cancel Subscription
                          </button>
                        </div>
                      )}
                    </div>
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
