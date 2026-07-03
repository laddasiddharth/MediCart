"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { ShoppingBag, ArrowLeft, ChevronLeft, ChevronRight, Eye } from "lucide-react";

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
  customerName: string | null;
  customerEmail: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "pharmacist")) {
      router.push("/");
      return;
    }
    fetchOrders();
  }, [user, page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "15", ...(statusFilter && { status: statusFilter }) });
    const res = await fetch(`/api/orders?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setOrders(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchOrders();
    setUpdatingId(null);
  };

  const nextStatuses: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag size={22} className="text-green-500" /> Order Management
            </h1>
            <p className="text-gray-500 text-sm">{total} orders total</p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {["", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                statusFilter === s ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Order</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Customer</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Payment</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Update Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td colSpan={7} className="py-3 px-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400">No orders found</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">#{order.id}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(order.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{order.customerName || "Unknown"}</p>
                        <p className="text-xs text-gray-400">{order.deliveryCity}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-semibold text-gray-800">₹{parseFloat(order.totalAmount).toFixed(2)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-gray-600 capitalize">{order.paymentMethod.replace(/_/g, " ")}</p>
                        <span className={`text-xs ${order.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex gap-1 justify-center flex-wrap">
                          {nextStatuses[order.status]?.map((nextStatus) => (
                            <button
                              key={nextStatus}
                              onClick={() => updateOrderStatus(order.id, nextStatus)}
                              disabled={updatingId === order.id}
                              className={`text-xs px-2.5 py-1 rounded-lg transition ${
                                nextStatus === "cancelled" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"
                              } disabled:opacity-50`}
                            >
                              → {nextStatus}
                            </button>
                          ))}
                          {nextStatuses[order.status]?.length === 0 && (
                            <span className="text-xs text-gray-400">Final</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link href={`/orders/${order.id}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition">
                          <Eye size={12} /> View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border disabled:opacity-50 hover:bg-gray-50">
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border disabled:opacity-50 hover:bg-gray-50">
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
