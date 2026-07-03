"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import {
  Package, Plus, Edit, AlertTriangle, Clock, ChevronLeft, ChevronRight,
  Search, Filter, CheckCircle, XCircle, TrendingDown, ArrowLeft, Save, X
} from "lucide-react";

interface InventoryItem {
  id: number;
  name: string;
  brand: string | null;
  sku: string | null;
  batchNumber: string | null;
  categoryName: string | null;
  stock: number;
  minStockLevel: number;
  expiryDate: string | null;
  manufacturingDate: string | null;
  price: string;
  purchasePrice: string | null;
  prescriptionRequired: boolean;
  isActive: boolean;
  updatedAt: string;
}

function getExpiryStatus(expiryDate: string | null) {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: "Expired", color: "bg-red-100 text-red-700 border-red-200" };
  if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: "bg-orange-100 text-orange-700 border-orange-200" };
  if (daysLeft <= 60) return { label: `${daysLeft}d left`, color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
  if (daysLeft <= 90) return { label: `${daysLeft}d left`, color: "bg-blue-100 text-blue-700 border-blue-200" };
  return { label: `${daysLeft}d left`, color: "bg-green-100 text-green-700 border-green-200" };
}

function InventoryContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState(searchParams.get("filter") || "");
  const [search, setSearch] = useState("");
  const [showStockModal, setShowStockModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockForm, setStockForm] = useState({ quantityAdded: 0, quantityRemoved: 0, reason: "" });
  const [saving, setSaving] = useState(false);

  const [newMedicine, setNewMedicine] = useState({
    name: "", genericName: "", brand: "", price: "", purchasePrice: "",
    stock: 0, minStockLevel: 10, sku: "", batchNumber: "",
    expiryDate: "", prescriptionRequired: false, description: "",
    dosage: "", manufacturer: "",
  });

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "pharmacist")) {
      router.push("/");
      return;
    }
    fetchInventory();
  }, [user, page, filter]);

  const fetchInventory = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "15", ...(filter && { filter }) });
    const res = await fetch(`/api/inventory?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setItems(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    }
    setLoading(false);
  };

  const handleUpdateStock = async () => {
    if (!selectedItem) return;
    setSaving(true);
    await fetch("/api/inventory", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ medicineId: selectedItem.id, ...stockForm }),
    });
    setShowStockModal(false);
    setStockForm({ quantityAdded: 0, quantityRemoved: 0, reason: "" });
    await fetchInventory();
    setSaving(false);
  };

  const handleAddMedicine = async () => {
    setSaving(true);
    await fetch("/api/medicines", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(newMedicine),
    });
    setShowAddModal(false);
    await fetchInventory();
    setSaving(false);
  };

  const filteredItems = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || (i.brand || "").toLowerCase().includes(search.toLowerCase()))
    : items;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
            <p className="text-gray-500 text-sm">{total} medicines total</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition"
          >
            <Plus size={16} /> Add Medicine
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: "", label: "All Medicines" },
            { key: "low_stock", label: "⚠️ Low Stock" },
            { key: "expiring", label: "⏰ Expiring (90d)" },
            { key: "expired", label: "❌ Expired" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                filter === key ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicine name or brand..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Medicine</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">SKU / Batch</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Stock</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Expiry</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Price</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td colSpan={7} className="py-3 px-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400">
                      <Package size={40} className="mx-auto mb-2 text-gray-200" />
                      No medicines found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLowStock = item.stock <= item.minStockLevel;
                    const expiryStatus = getExpiryStatus(item.expiryDate);
                    return (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.brand} • {item.categoryName}</p>
                          {item.prescriptionRequired && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mt-0.5 inline-block">Rx</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs text-gray-600 font-mono">{item.sku || "-"}</p>
                          <p className="text-xs text-gray-400">{item.batchNumber || "-"}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-bold text-sm ${isLowStock ? "text-red-600" : "text-gray-800"}`}>
                            {item.stock}
                          </span>
                          <p className="text-xs text-gray-400">min: {item.minStockLevel}</p>
                          {isLowStock && (
                            <span className="flex items-center justify-center gap-0.5 text-xs text-red-500 mt-0.5">
                              <TrendingDown size={10} /> Low
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs text-gray-600">{item.expiryDate || "N/A"}</p>
                          {expiryStatus && (
                            <span className={`text-xs border px-1.5 py-0.5 rounded mt-0.5 inline-block ${expiryStatus.color}`}>
                              {expiryStatus.label}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className="font-semibold text-gray-800">₹{parseFloat(item.price).toFixed(2)}</p>
                          {item.purchasePrice && (
                            <p className="text-xs text-gray-400">Cost: ₹{parseFloat(item.purchasePrice).toFixed(2)}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.isActive ? (
                            <span className="flex items-center justify-center gap-1 text-green-600 text-xs">
                              <CheckCircle size={12} /> Active
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1 text-red-500 text-xs">
                              <XCircle size={12} /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => { setSelectedItem(item); setShowStockModal(true); }}
                              className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition"
                            >
                              Update Stock
                            </button>
                            <Link
                              href={`/medicine/${item.id}`}
                              className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition"
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

      {/* Update Stock Modal */}
      {showStockModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Update Stock</h3>
              <button onClick={() => setShowStockModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedItem.name} — Current stock: <strong>{selectedItem.stock}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity Added</label>
                <input
                  type="number"
                  min="0"
                  value={stockForm.quantityAdded}
                  onChange={(e) => setStockForm({ ...stockForm, quantityAdded: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity Removed</label>
                <input
                  type="number"
                  min="0"
                  value={stockForm.quantityRemoved}
                  onChange={(e) => setStockForm({ ...stockForm, quantityRemoved: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Reason</label>
                <input
                  type="text"
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  placeholder="e.g. New stock received, Expired items removed..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <span className="text-gray-500">New stock will be: </span>
                <strong className="text-gray-800">
                  {selectedItem.stock + stockForm.quantityAdded - stockForm.quantityRemoved}
                </strong>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowStockModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleUpdateStock}
                disabled={saving}
                className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Add New Medicine</h3>
                <button onClick={() => setShowAddModal(false)}><X size={18} className="text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "name", label: "Medicine Name *", type: "text", placeholder: "e.g. Paracetamol 500mg" },
                  { key: "genericName", label: "Generic Name", type: "text", placeholder: "e.g. Paracetamol" },
                  { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Calpol" },
                  { key: "manufacturer", label: "Manufacturer", type: "text", placeholder: "e.g. GSK" },
                  { key: "sku", label: "SKU", type: "text", placeholder: "e.g. PCM-500-001" },
                  { key: "batchNumber", label: "Batch Number", type: "text", placeholder: "e.g. BATCH2024001" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
                    <input
                      type={type}
                      value={(newMedicine as Record<string, unknown>)[key] as string || ""}
                      onChange={(e) => setNewMedicine({ ...newMedicine, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Selling Price (₹) *</label>
                    <input
                      type="number"
                      value={newMedicine.price}
                      onChange={(e) => setNewMedicine({ ...newMedicine, price: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Stock Quantity</label>
                    <input
                      type="number"
                      value={newMedicine.stock}
                      onChange={(e) => setNewMedicine({ ...newMedicine, stock: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Expiry Date</label>
                  <input
                    type="date"
                    value={newMedicine.expiryDate}
                    onChange={(e) => setNewMedicine({ ...newMedicine, expiryDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                  <textarea
                    value={newMedicine.description}
                    onChange={(e) => setNewMedicine({ ...newMedicine, description: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMedicine.prescriptionRequired}
                    onChange={(e) => setNewMedicine({ ...newMedicine, prescriptionRequired: e.target.checked })}
                    className="accent-green-500"
                  />
                  <span className="text-sm text-gray-700">Prescription Required</span>
                </label>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAddModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleAddMedicine}
                  disabled={saving || !newMedicine.name || !newMedicine.price}
                  className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Add Medicine</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>}>
      <InventoryContent />
    </Suspense>
  );
}
