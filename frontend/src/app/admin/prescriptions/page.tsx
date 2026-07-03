"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { FileText, ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock, ChevronLeft, ChevronRight, X } from "lucide-react";

interface Prescription {
  id: number;
  userId: number;
  fileUrl: string;
  fileName: string | null;
  fileType: string | null;
  status: string;
  remarks: string | null;
  uploadDate: string;
  reviewedAt: string | null;
  patientName: string | null;
  patientEmail: string | null;
  patientPhone: string | null;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
  approved: { color: "bg-green-100 text-green-700", label: "Approved" },
  rejected: { color: "bg-red-100 text-red-700", label: "Rejected" },
  needs_clarification: { color: "bg-orange-100 text-orange-700", label: "Needs Clarification" },
};

export default function AdminPrescriptionsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: "approved", remarks: "" });
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "pharmacist")) {
      router.push("/");
      return;
    }
    fetchPrescriptions();
  }, [user, page, statusFilter]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "15", ...(statusFilter && { status: statusFilter }) });
    const res = await fetch(`/api/prescriptions?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setPrescriptions(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    }
    setLoading(false);
  };

  const handleReview = async () => {
    if (!selectedRx) return;
    setReviewing(true);
    await fetch(`/api/prescriptions/${selectedRx.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(reviewForm),
    });
    setSelectedRx(null);
    await fetchPrescriptions();
    setReviewing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText size={22} className="text-green-500" /> Prescription Management
            </h1>
            <p className="text-gray-500 text-sm">{total} prescriptions</p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: "pending", label: "⏳ Pending" },
            { key: "approved", label: "✅ Approved" },
            { key: "rejected", label: "❌ Rejected" },
            { key: "needs_clarification", label: "⚠️ Needs Clarification" },
            { key: "", label: "All" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                statusFilter === key ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">File</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Uploaded</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td colSpan={6} className="py-3 px-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : prescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-gray-400">
                      <FileText size={40} className="mx-auto mb-2 text-gray-200" />
                      No prescriptions found
                    </td>
                  </tr>
                ) : (
                  prescriptions.map((rx) => {
                    const status = statusConfig[rx.status];
                    return (
                      <tr key={rx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4 font-semibold text-gray-800">#{rx.id}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-800">{rx.patientName}</p>
                          <p className="text-xs text-gray-400">{rx.patientEmail}</p>
                          {rx.patientPhone && <p className="text-xs text-gray-400">{rx.patientPhone}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs text-gray-600">{rx.fileName || "prescription"}</p>
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{rx.fileType || "image"}</span>
                          {rx.remarks && (
                            <p className="text-xs text-gray-400 mt-0.5 italic line-clamp-1">{rx.remarks}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status?.color || "bg-gray-100 text-gray-700"}`}>
                            {status?.label || rx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs text-gray-600">
                            {new Date(rx.uploadDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          {rx.reviewedAt && (
                            <p className="text-xs text-gray-400">
                              Reviewed: {new Date(rx.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {rx.status === "pending" && (
                            <button
                              onClick={() => { setSelectedRx(rx); setReviewForm({ status: "approved", remarks: "" }); }}
                              className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg transition"
                            >
                              Review
                            </button>
                          )}
                          {rx.status !== "pending" && (
                            <button
                              onClick={() => { setSelectedRx(rx); setReviewForm({ status: "approved", remarks: rx.remarks || "" }); }}
                              className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1 rounded-lg transition"
                            >
                              Update
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
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

      {/* Review Modal */}
      {selectedRx && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Review Prescription #{selectedRx.id}</h3>
              <button onClick={() => setSelectedRx(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-sm font-medium text-gray-800">{selectedRx.patientName}</p>
              <p className="text-xs text-gray-500">{selectedRx.patientEmail}</p>
              <p className="text-xs text-gray-400 mt-1">File: {selectedRx.fileName}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "approved", label: "✅ Approve", color: "border-green-200 bg-green-50 text-green-700" },
                    { value: "rejected", label: "❌ Reject", color: "border-red-200 bg-red-50 text-red-700" },
                    { value: "needs_clarification", label: "⚠️ Needs Clarification", color: "border-orange-200 bg-orange-50 text-orange-700" },
                  ].map(({ value, label, color }) => (
                    <button
                      key={value}
                      onClick={() => setReviewForm({ ...reviewForm, status: value })}
                      className={`border py-2 px-3 rounded-xl text-xs font-medium transition ${
                        reviewForm.status === value ? color : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Remarks (optional)</label>
                <textarea
                  value={reviewForm.remarks}
                  onChange={(e) => setReviewForm({ ...reviewForm, remarks: e.target.value })}
                  placeholder="Add notes for the patient..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setSelectedRx(null)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleReview}
                disabled={reviewing}
                className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {reviewing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
