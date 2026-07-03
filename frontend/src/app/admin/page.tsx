"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import {
  TrendingUp, Package, Users, AlertTriangle, FileText, DollarSign,
  ShoppingBag, Clock, ChevronRight, Activity, Archive, Pill,
  ArrowUp, ArrowDown, RefreshCw
} from "lucide-react";

interface Analytics {
  overview: {
    totalRevenue: number;
    todayOrders: number;
    monthRevenue: number;
    pendingPrescriptions: number;
    totalUsers: number;
    lowStockCount: number;
    inventoryValue: number;
  };
  expiry: {
    expired: number;
    expiring30: number;
    expiring60: number;
    expiring90: number;
  };
  recentOrders: Array<{
    id: number;
    status: string;
    totalAmount: string;
    paymentMethod: string;
    orderDate: string;
    customerName: string | null;
  }>;
  topMedicines: Array<{
    medicineId: number;
    medicineName: string | null;
    totalQuantity: number;
    totalRevenue: string;
  }>;
  monthlySales: Array<{ month: string; order_count: number; revenue: number }>;
  categoryRevenue: Array<{ category: string; revenue: number; orders: number }>;
}

const COLORS = ["#22c55e", "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/auth"); return; }
    if (user.role !== "admin" && user.role !== "pharmacist") { router.push("/"); return; }
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    setRefreshing(true);
    const res = await fetch("/api/analytics", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setAnalytics(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  if (!user || (user.role !== "admin" && user.role !== "pharmacist")) return null;

  const statCards = analytics ? [
    {
      title: "Total Revenue",
      value: `₹${analytics.overview.totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Today's Orders",
      value: analytics.overview.todayOrders.toString(),
      icon: ShoppingBag,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      trend: "+5%",
      trendUp: true,
    },
    {
      title: "Monthly Revenue",
      value: `₹${analytics.overview.monthRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Pending Prescriptions",
      value: analytics.overview.pendingPrescriptions.toString(),
      icon: FileText,
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
      trend: analytics.overview.pendingPrescriptions > 0 ? "Action needed" : "All clear",
      trendUp: false,
    },
    {
      title: "Active Customers",
      value: analytics.overview.totalUsers.toString(),
      icon: Users,
      color: "bg-teal-500",
      lightColor: "bg-teal-50",
      textColor: "text-teal-600",
      trend: "+3%",
      trendUp: true,
    },
    {
      title: "Low Stock Items",
      value: analytics.overview.lowStockCount.toString(),
      icon: AlertTriangle,
      color: analytics.overview.lowStockCount > 0 ? "bg-red-500" : "bg-green-500",
      lightColor: analytics.overview.lowStockCount > 0 ? "bg-red-50" : "bg-green-50",
      textColor: analytics.overview.lowStockCount > 0 ? "text-red-600" : "text-green-600",
      trend: analytics.overview.lowStockCount > 0 ? "Restock needed" : "All stocked",
      trendUp: false,
    },
    {
      title: "Inventory Value",
      value: `₹${analytics.overview.inventoryValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      icon: Archive,
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      trend: "Current value",
      trendUp: true,
    },
    {
      title: "Medicines Expiring",
      value: analytics.expiry.expiring30.toString(),
      icon: Clock,
      color: "bg-yellow-500",
      lightColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      trend: "Within 30 days",
      trendUp: false,
    },
  ] : [];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-indigo-100 text-indigo-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAnalytics}
              disabled={refreshing}
              className="flex items-center gap-2 border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition text-sm"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            {/* Quick Nav Links */}
            <div className="flex gap-2">
              <Link href="/admin/inventory" className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition flex items-center gap-1.5">
                <Package size={15} /> Inventory
              </Link>
              <Link href="/admin/orders" className="border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition flex items-center gap-1.5">
                <ShoppingBag size={15} /> Orders
              </Link>
              <Link href="/admin/prescriptions" className="border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition flex items-center gap-1.5">
                <FileText size={15} /> Prescriptions
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 ${card.lightColor} rounded-xl flex items-center justify-center`}>
                        <Icon size={18} className={card.textColor} />
                      </div>
                      <span className={`text-xs flex items-center gap-0.5 ${card.trendUp ? "text-green-500" : "text-gray-400"}`}>
                        {card.trendUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                        {card.trend}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{card.title}</p>
                  </div>
                );
              })}
            </div>

            {/* Expiry Alerts */}
            {analytics && (analytics.expiry.expired > 0 || analytics.expiry.expiring30 > 0) && (
              <div className="bg-white rounded-2xl border border-red-100 p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" /> Expiry Alerts
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Expired", count: analytics.expiry.expired, color: "bg-red-100 text-red-700 border-red-200" },
                    { label: "Expiring in 30 days", count: analytics.expiry.expiring30, color: "bg-orange-100 text-orange-700 border-orange-200" },
                    { label: "Expiring in 60 days", count: analytics.expiry.expiring60, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
                    { label: "Expiring in 90 days", count: analytics.expiry.expiring90, color: "bg-blue-100 text-blue-700 border-blue-200" },
                  ].map(({ label, count, color }) => (
                    <Link key={label} href="/admin/inventory?filter=expiring" className={`border rounded-xl p-3 hover:opacity-80 transition ${color}`}>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs mt-0.5">{label}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Monthly Sales */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-green-500" /> Monthly Sales Trend
                </h3>
                {analytics && analytics.monthlySales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value) => [`₹${Number(value).toFixed(0)}`, "Revenue"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                      />
                      <Bar dataKey="revenue" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    No sales data available yet
                  </div>
                )}
              </div>

              {/* Category Revenue */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Pill size={16} className="text-green-500" /> Revenue by Category
                </h3>
                {analytics && analytics.categoryRevenue.filter((c) => parseFloat(c.revenue as unknown as string) > 0).length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analytics.categoryRevenue
                          .filter((c) => parseFloat(c.revenue as unknown as string) > 0)
                          .slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        dataKey="revenue"
                        nameKey="category"
                        label={false}
                        labelLine={false}
                      >
                        {analytics.categoryRevenue.slice(0, 6).map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${Number(value).toFixed(0)}`, "Revenue"]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    No category revenue data yet
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Recent Orders</h3>
                  <Link href="/admin/orders" className="text-xs text-green-600 flex items-center gap-0.5 hover:underline">
                    View all <ChevronRight size={13} />
                  </Link>
                </div>
                {analytics && analytics.recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.recentOrders.slice(0, 5).map((order) => (
                      <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Order #{order.id}</p>
                          <p className="text-xs text-gray-500">{order.customerName}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}>
                            {order.status}
                          </span>
                          <p className="text-sm font-semibold text-gray-900 mt-1">₹{parseFloat(order.totalAmount).toFixed(0)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">No orders yet</p>
                )}
              </div>

              {/* Top Medicines */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Top Selling Medicines</h3>
                  <Link href="/admin/inventory" className="text-xs text-green-600 flex items-center gap-0.5 hover:underline">
                    View all <ChevronRight size={13} />
                  </Link>
                </div>
                {analytics && analytics.topMedicines.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topMedicines.map((med, idx) => (
                      <div key={med.medicineId} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                          idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-orange-600" : "bg-gray-200"
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{med.medicineName}</p>
                          <p className="text-xs text-gray-500">{Number(med.totalQuantity)} units sold</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">₹{parseFloat(med.totalRevenue).toFixed(0)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">No sales data available</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
