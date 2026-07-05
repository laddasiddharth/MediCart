"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Phone, MapPin, Save, Edit2, Package, FileText, Shield, Users, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface FamilyMember {
  id: number;
  name: string;
  relation: string | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  medicalHistory: string | null;
}

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
  
  // Family Members State
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyForm, setFamilyForm] = useState({ name: "", relation: "", dateOfBirth: "", bloodGroup: "", allergies: "", medicalHistory: "" });
  const [savingFamily, setSavingFamily] = useState(false);

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
    
    // Fetch family members
    const familyRes = await fetch("/api/family-members", { headers: { Authorization: `Bearer ${token}` } });
    if (familyRes.ok) {
      const familyData = await familyRes.json();
      setFamilyMembers(familyData);
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

  const handleSaveFamilyMember = async () => {
    if (!familyForm.name) {
      alert("Name is required");
      return;
    }
    setSavingFamily(true);
    const res = await fetch("/api/family-members", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(familyForm),
    });
    if (res.ok) {
      const data = await res.json();
      setFamilyMembers(prev => [data.member, ...prev]);
      setShowFamilyModal(false);
      setFamilyForm({ name: "", relation: "", dateOfBirth: "", bloodGroup: "", allergies: "", medicalHistory: "" });
    }
    setSavingFamily(false);
  };

  const handleDeleteFamilyMember = async (id: number) => {
    if (!confirm("Are you sure you want to remove this family member?")) return;
    const res = await fetch(`/api/family-members/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setFamilyMembers(prev => prev.filter(m => m.id !== id));
    }
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

            {/* Family Members Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-blue-500" />
                  <h3 className="font-semibold text-gray-800">Family Health Profiles</h3>
                </div>
                <button
                  onClick={() => setShowFamilyModal(true)}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                >
                  <Plus size={14} /> Add Member
                </button>
              </div>

              {familyMembers.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-gray-500 text-sm">No family members added yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {familyMembers.map(member => (
                    <div key={member.id} className="border border-gray-100 rounded-xl p-4 flex justify-between items-start hover:border-blue-100 transition">
                      <div>
                        <h4 className="font-semibold text-gray-800">{member.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                          {member.relation && <span className="bg-gray-100 px-2 py-1 rounded-md">{member.relation}</span>}
                          {member.bloodGroup && <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md">Blood: {member.bloodGroup}</span>}
                          {member.dateOfBirth && <span className="bg-gray-100 px-2 py-1 rounded-md">DOB: {member.dateOfBirth}</span>}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteFamilyMember(member.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Family Member Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Add Family Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={familyForm.name}
                  onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Relation</label>
                  <input
                    type="text"
                    value={familyForm.relation}
                    onChange={(e) => setFamilyForm({ ...familyForm, relation: e.target.value })}
                    placeholder="e.g. Mother, Son"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Blood Group</label>
                  <select
                    value={familyForm.bloodGroup}
                    onChange={(e) => setFamilyForm({ ...familyForm, bloodGroup: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={familyForm.dateOfBirth}
                  onChange={(e) => setFamilyForm({ ...familyForm, dateOfBirth: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Allergies (if any)</label>
                <input
                  type="text"
                  value={familyForm.allergies}
                  onChange={(e) => setFamilyForm({ ...familyForm, allergies: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowFamilyModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFamilyMember}
                  disabled={savingFamily || !familyForm.name}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {savingFamily ? "Saving..." : "Add Member"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
