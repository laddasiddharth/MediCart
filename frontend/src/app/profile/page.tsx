"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Phone, MapPin, Save, Edit2, Package, FileText, Shield } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", state: "", pincode: "" });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/auth"); return; }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const res = await fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(prev => prev ? { ...prev, ...data } : null);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 w-full flex-1">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
            ✅ Profile updated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">{profile?.name?.[0]?.toUpperCase()}</span>
              </div>
              <h2 className="font-bold text-gray-800 text-lg">{profile?.name}</h2>
              <p className="text-gray-500 text-sm">{profile?.email}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                profile?.role === "admin" ? "bg-purple-100 text-purple-700" :
                profile?.role === "pharmacist" ? "bg-blue-100 text-blue-700" :
                "bg-green-100 text-green-700"
              }`}>
                {profile?.role?.charAt(0).toUpperCase()}{profile?.role?.slice(1)}
              </span>
              <p className="text-xs text-gray-400 mt-3">
                Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : ""}
              </p>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mt-4 space-y-2">
              <Link href="/orders" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700 text-sm transition">
                <Package size={16} className="text-green-500" /> My Orders
              </Link>
              <Link href="/prescriptions" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700 text-sm transition">
                <FileText size={16} className="text-blue-500" /> Prescriptions
              </Link>
              {(user.role === "admin" || user.role === "pharmacist") && (
                <Link href="/admin" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700 text-sm transition">
                  <Shield size={16} className="text-purple-500" /> Admin Panel
                </Link>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-800">Personal Information</h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                ) : (
                  <button
                    onClick={() => setEditing(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block flex items-center gap-1">
                    <User size={12} /> Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={!editing}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block flex items-center gap-1">
                    <Mail size={12} /> Email Address
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block flex items-center gap-1">
                    <Phone size={12} /> Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={!editing}
                    placeholder="+91 98765 43210"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block flex items-center gap-1">
                    <MapPin size={12} /> Address
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    disabled={!editing}
                    placeholder="Enter your full address"
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-600 resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      disabled={!editing}
                      placeholder="Mumbai"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">State</label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      disabled={!editing}
                      placeholder="Maharashtra"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">PIN Code</label>
                    <input
                      type="text"
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      disabled={!editing}
                      placeholder="400001"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>

                {editing && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save Changes</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
