"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { FileText, Upload, CheckCircle, XCircle, Clock, AlertCircle, Image, File } from "lucide-react";

interface Prescription {
  id: number;
  fileUrl: string;
  fileName: string | null;
  fileType: string | null;
  status: string;
  remarks: string | null;
  uploadDate: string;
  reviewedAt: string | null;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Clock size={14} />, label: "Pending Review" },
  approved: { color: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle size={14} />, label: "Approved" },
  rejected: { color: "bg-red-100 text-red-700 border-red-200", icon: <XCircle size={14} />, label: "Rejected" },
  needs_clarification: { color: "bg-orange-100 text-orange-700 border-orange-200", icon: <AlertCircle size={14} />, label: "Needs Clarification" },
};

export default function PrescriptionsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFileType, setUploadFileType] = useState("image");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/auth"); return; }
    fetchPrescriptions();
  }, [user]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    const res = await fetch("/api/prescriptions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPrescriptions(data.data || []);
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    const fileUrl = uploadUrl || `https://prescription-demo.medicart.com/${Date.now()}-prescription.jpg`;

    const res = await fetch("/api/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        fileUrl,
        fileName: uploadFileName || "prescription.jpg",
        fileType: uploadFileType,
      }),
    });

    if (res.ok) {
      setUploadSuccess(true);
      setShowUpload(false);
      setUploadUrl("");
      setUploadFileName("");
      await fetchPrescriptions();
      setTimeout(() => setUploadSuccess(false), 3000);
    }
    setUploading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText size={24} className="text-green-500" /> My Prescriptions
            </h1>
            <p className="text-gray-500 text-sm mt-1">Upload and manage your medical prescriptions</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-xl flex items-center gap-2 transition text-sm"
          >
            <Upload size={16} /> Upload Prescription
          </button>
        </div>

        {uploadSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700">
            <CheckCircle size={18} />
            <p className="text-sm font-medium">Prescription uploaded successfully! Our pharmacist will review it within 2-4 hours.</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
          <h3 className="font-semibold text-blue-700 mb-2">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { step: "1", text: "Upload your prescription" },
              { step: "2", text: "Pharmacist reviews (2-4 hrs)" },
              { step: "3", text: "Get approval notification" },
              { step: "4", text: "Purchase Rx medicines" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{step}</div>
                <p className="text-xs text-blue-600">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={56} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No prescriptions uploaded</h3>
            <p className="text-gray-500 text-sm mb-6">Upload your doctor's prescription to order Rx medicines</p>
            <button
              onClick={() => setShowUpload(true)}
              className="bg-green-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-600 transition inline-flex items-center gap-2"
            >
              <Upload size={16} /> Upload Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx) => {
              const status = statusConfig[rx.status] || statusConfig.pending;
              return (
                <div key={rx.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        {rx.fileType === "pdf" ? (
                          <File size={24} className="text-red-400" />
                        ) : (
                          <Image size={24} className="text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{rx.fileName || "Prescription"}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Uploaded on {new Date(rx.uploadDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        {rx.reviewedAt && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Reviewed on {new Date(rx.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        )}
                        {rx.remarks && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">
                            <span className="font-medium">Pharmacist note:</span> {rx.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${status.color} whitespace-nowrap`}>
                      {status.icon} {status.label}
                    </span>
                    <button
                      onClick={() => router.push(`/prescriptions/${rx.id}`)}
                      className="ml-4 text-green-600 hover:text-green-700 font-medium text-sm transition underline"
                    >
                      View & Chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <Upload size={20} className="text-green-500" /> Upload Prescription
              </h2>

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Simulated Upload UI */}
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50">
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Upload size={24} className="text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Upload prescription file</p>
                  <p className="text-xs text-gray-500 mb-4">JPG, PNG, or PDF (max 10MB)</p>
                  <div className="flex gap-2 justify-center">
                    {["Image (JPG/PNG)", "PDF"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setUploadFileType(type.startsWith("PDF") ? "pdf" : "image")}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                          uploadFileType === (type.startsWith("PDF") ? "pdf" : "image")
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">File Name</label>
                  <input
                    type="text"
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    placeholder="e.g. Dr_Smith_Prescription_Jan2024"
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Prescription URL (optional - for demo)</label>
                  <input
                    type="url"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">In production, this would upload directly to cloud storage</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-yellow-700">
                  ⚠️ Ensure the prescription is clearly readable and includes doctor's signature, date, and medicine details.
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUpload(false)}
                    className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Upload size={14} /> Submit</>}
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
