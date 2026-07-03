"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, AlertCircle } from "lucide-react";

interface Order {
  id: number;
  status: string;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryCity: string;
  deliveryState: string;
  estimatedDelivery: string | null;
  orderDate: string;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-700", icon: <Clock size={13} />, label: "Pending" },
  confirmed: { color: "bg-blue-100 text-blue-700", icon: <CheckCircle size={13} />, label: "Confirmed" },
  processing: { color: "bg-indigo-100 text-indigo-700", icon: <AlertCircle size={13} />, label: "Processing" },
  shipped: { color: "bg-purple-100 text-purple-700", icon: <Truck size={13} />, label: "Shipped" },
  delivered: { color: "bg-green-100 text-green-700", icon: <CheckCircle size={13} />, label: "Delivered" },
  cancelled: { color: "bg-red-100 text-red-700", icon: <XCircle size={13} />, label: "Cancelled" },
};

export default function OrdersPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!user) { router.push("/auth"); return; }
    fetchOrders();
  }, [user, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams({ ...(statusFilter && { status: statusFilter }) });
    const res = await fetch(`/api/orders?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setOrders(data.data || []);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package size={24} className="text-green-500" /> My Orders
          </h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package size={56} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No orders found</h3>
            <p className="text-gray-500 text-sm mb-6">Start shopping to place your first order</p>
            <Link href="/shop" className="bg-green-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-600 transition inline-block">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800">Order #{order.id}</h3>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(order.orderDate).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {order.deliveryCity}, {order.deliveryState}
                          {order.estimatedDelivery && ` • Est. delivery: ${new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-lg">₹{parseFloat(order.totalAmount).toFixed(2)}</p>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">{order.paymentMethod.replace(/_/g, " ")}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex gap-2">
                        {order.status !== "cancelled" && order.status !== "delivered" && (
                          <button
                            onClick={async () => {
                              if (confirm("Cancel this order?")) {
                                await fetch(`/api/orders/${order.id}`, {
                                  method: "PUT",
                                  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "cancelled" }),
                                });
                                fetchOrders();
                              }
                            }}
                            className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                      <Link
                        href={`/orders/${order.id}`}
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        View Details <ChevronRight size={15} />
                      </Link>
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
