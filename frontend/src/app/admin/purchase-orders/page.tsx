"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Truck, Plus, CheckCircle, Package, Search, Filter, Edit2, Archive } from "lucide-react";

interface PurchaseOrder {
  id: number;
  quantity: number;
  unitCost: string;
  totalCost: string;
  status: string;
  notes: string | null;
  expectedDelivery: string | null;
  createdAt: string;
  supplier: { id: number; name: string; contactEmail: string } | null;
  medicine: { id: number; name: string; sku: string; stock: number } | null;
  createdBy: { id: number; name: string } | null;
}

export default function AdminPurchaseOrders() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Create PO Modal
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState<{id:number, name:string}[]>([]);
  const [medicines, setMedicines] = useState<{id:number, name:string}[]>([]);
  
  const [form, setForm] = useState({ supplierId: "", medicineId: "", quantity: "", unitCost: "", expectedDelivery: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/auth"); return; }
    if (user.role !== "admin" && user.role !== "pharmacist") { router.push("/"); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [poRes, supRes, medRes] = await Promise.all([
        fetch("/api/admin/purchase-orders", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/suppliers", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/medicines", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      if (poRes.ok) setPos(await poRes.json());
      // For suppliers and medicines, we might need to handle errors or empty cases. Assuming APIs exist.
      // If we haven't implemented /api/admin/suppliers yet, let's mock or skip. 
      // Actually, wait, we haven't implemented /api/admin/suppliers. Let's gracefully handle that.
      if (supRes.ok) setSuppliers(await supRes.json());
      if (medRes.ok) {
        const data = await medRes.json();
        setMedicines(data.medicines || data); // handle both object with medicines key or array
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ supplierId: "", medicineId: "", quantity: "", unitCost: "", expectedDelivery: "", notes: "" });
      fetchData();
    }
    setSaving(false);
  };

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/admin/purchase-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setPos(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      alert(`PO marked as ${status}`);
    }
  };

  const filteredPos = pos.filter(po => 
    po.medicine?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: any = {
    draft: "bg-gray-100 text-gray-700",
    ordered: "bg-blue-100 text-blue-700",
    shipped: "bg-yellow-100 text-yellow-700",
    received: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700"
  };

  if (!user || loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="text-indigo-600" /> Purchase Orders
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage stock refills and suppliers</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2"
          >
            <Plus size={18} /> Draft New PO
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by medicine or supplier..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-semibold">PO #</th>
                  <th className="p-4 font-semibold">Medicine</th>
                  <th className="p-4 font-semibold">Supplier</th>
                  <th className="p-4 font-semibold text-center">Qty / Cost</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPos.map(po => (
                  <tr key={po.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 text-sm font-medium text-gray-900">#{po.id}</td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-gray-800">{po.medicine?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">Current Stock: {po.medicine?.stock}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{po.supplier?.name || "Unknown"}</td>
                    <td className="p-4 text-center">
                      <p className="text-sm font-bold text-gray-800">{po.quantity} units</p>
                      <p className="text-xs text-gray-500">₹{parseFloat(po.totalCost).toFixed(0)}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[po.status]}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {po.status === "draft" && (
                        <button 
                          onClick={() => updateStatus(po.id, "ordered")}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          Place Order
                        </button>
                      )}
                      {po.status === "ordered" && (
                        <button 
                          onClick={() => updateStatus(po.id, "shipped")}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Mark Shipped
                        </button>
                      )}
                      {po.status === "shipped" && (
                        <button 
                          onClick={() => updateStatus(po.id, "received")}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Mark Received
                        </button>
                      )}
                      {po.status === "received" && (
                        <span className="text-gray-400 text-xs">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No purchase orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Draft Purchase Order</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medicine *</label>
                <select 
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  value={form.medicineId}
                  onChange={e => setForm({...form, medicineId: e.target.value})}
                >
                  <option value="">Select Medicine</option>
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                {suppliers.length > 0 ? (
                  <select 
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                    value={form.supplierId}
                    onChange={e => setForm({...form, supplierId: e.target.value})}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                ) : (
                  <input 
                    type="number"
                    placeholder="Enter Supplier ID (since suppliers API isn't built yet)"
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                    value={form.supplierId}
                    onChange={e => setForm({...form, supplierId: e.target.value})}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input 
                    type="number" 
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                    value={form.quantity}
                    onChange={e => setForm({...form, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (₹) *</label>
                  <input 
                    type="number" 
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                    value={form.unitCost}
                    onChange={e => setForm({...form, unitCost: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
                <input 
                  type="date" 
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  value={form.expectedDelivery}
                  onChange={e => setForm({...form, expectedDelivery: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                disabled={saving || !form.medicineId || !form.supplierId || !form.quantity || !form.unitCost}
                className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg disabled:opacity-50"
              >
                {saving ? "Drafting..." : "Draft PO"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
