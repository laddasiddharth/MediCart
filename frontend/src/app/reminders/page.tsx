"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Bell, Plus, Trash2, Edit2, CheckCircle2, Clock, CalendarDays, X } from "lucide-react";

interface Reminder {
  id: number;
  medicineName: string;
  dosage: string | null;
  reminderTime: string;
  daysOfWeek: string;
  isActive: boolean;
  note: string | null;
}

const DAYS = [
  { id: "1", label: "Mon" },
  { id: "2", label: "Tue" },
  { id: "3", label: "Wed" },
  { id: "4", label: "Thu" },
  { id: "5", label: "Fri" },
  { id: "6", label: "Sat" },
  { id: "7", label: "Sun" },
];

export default function RemindersPage() {
  const { user, token } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>(["1","2","3","4","5","6","7"]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    fetchReminders();
  }, [user]);

  const fetchReminders = async () => {
    try {
      const res = await fetch("/api/reminders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setMedicineName("");
    setDosage("");
    setTime("");
    setSelectedDays(["1","2","3","4","5","6","7"]);
    setNote("");
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setMedicineName(reminder.medicineName);
    setDosage(reminder.dosage || "");
    setTime(reminder.reminderTime);
    setSelectedDays(reminder.daysOfWeek.split(","));
    setNote(reminder.note || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!medicineName || !time || selectedDays.length === 0) {
      alert("Please fill all required fields");
      return;
    }
    
    setSaving(true);
    const payload = {
      medicineName,
      dosage,
      reminderTime: time,
      daysOfWeek: selectedDays.join(","),
      note,
    };

    try {
      const url = editingId ? `/api/reminders/${editingId}` : "/api/reminders";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchReminders();
        setShowModal(false);
        resetForm();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
    }
    setSaving(false);
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, isActive: !currentStatus } : r));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReminders(prev => prev.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    let hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${m} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
              <Bell size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Pill Tracker</h1>
              <p className="text-gray-500 text-sm">Never miss a dose again</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm shadow-teal-200"
          >
            <Plus size={18} /> Add Reminder
          </button>
        </div>

        {reminders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-teal-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No reminders set</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">Keep track of your medication schedule. We'll remind you when it's time to take your pills.</p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              <Plus size={18} /> Create First Reminder
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {reminders.map((reminder) => (
              <div key={reminder.id} className={`bg-white rounded-2xl p-5 shadow-sm border transition ${reminder.isActive ? 'border-teal-100' : 'border-gray-200 opacity-60'}`}>
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <button
                        onClick={() => handleToggleActive(reminder.id, reminder.isActive)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${reminder.isActive ? 'bg-teal-500' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${reminder.isActive ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{reminder.medicineName}</h3>
                      {reminder.dosage && <p className="text-teal-600 font-medium text-sm mb-2">{reminder.dosage}</p>}
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-2">
                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                          <Clock size={14} className="text-gray-400" />
                          <strong className="text-gray-700">{formatTime(reminder.reminderTime)}</strong>
                        </span>
                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                          <CalendarDays size={14} className="text-gray-400" />
                          {reminder.daysOfWeek.split(",").length === 7 ? "Everyday" : 
                           reminder.daysOfWeek.split(",").map(d => DAYS.find(x => x.id === d)?.label).join(", ")}
                        </span>
                      </div>
                      
                      {reminder.note && <p className="text-sm text-gray-500 italic mt-2">Note: {reminder.note}</p>}
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col justify-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-4">
                    <button
                      onClick={() => handleEdit(reminder)}
                      className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Reminder' : 'New Reminder'}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="e.g. Paracetamol"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 1 Pill"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week *</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day.id}
                      onClick={() => {
                        if (selectedDays.includes(day.id)) {
                          setSelectedDays(selectedDays.filter(d => d !== day.id));
                        } else {
                          setSelectedDays([...selectedDays, day.id]);
                        }
                      }}
                      className={`w-10 h-10 rounded-full text-xs font-semibold transition ${
                        selectedDays.includes(day.id) 
                          ? 'bg-teal-500 text-white shadow-md shadow-teal-200' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {day.label[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Take after food"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={saving || !medicineName || !time || selectedDays.length === 0}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Reminder"}
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
