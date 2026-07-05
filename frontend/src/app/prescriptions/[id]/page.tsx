"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Send, CheckCircle, Clock, XCircle, AlertCircle, Image, File } from "lucide-react";

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
}

interface Message {
  id: number;
  senderId: number;
  message: string;
  createdAt: string;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Clock size={14} />, label: "Pending Review" },
  approved: { color: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle size={14} />, label: "Approved" },
  rejected: { color: "bg-red-100 text-red-700 border-red-200", icon: <XCircle size={14} />, label: "Rejected" },
  needs_clarification: { color: "bg-orange-100 text-orange-700 border-orange-200", icon: <AlertCircle size={14} />, label: "Needs Clarification" },
};

export default function PrescriptionChatPage() {
  const { user, token } = useAuth();
  const params = useParams();
  const router = useRouter();
  
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { router.push("/auth"); return; }
    fetchData();
  }, [user, params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchData = async () => {
    try {
      const rxRes = await fetch(`/api/prescriptions/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (rxRes.ok) {
        setPrescription(await rxRes.json());
      } else {
        router.push("/prescriptions");
      }

      const msgRes = await fetch(`/api/prescriptions/${params.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (msgRes.ok) {
        setMessages(await msgRes.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/prescriptions/${params.id}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data.data]);
        setNewMessage("");
      }
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
        </div>
      </div>
    );
  }

  if (!prescription) return null;

  const status = statusConfig[prescription.status] || statusConfig.pending;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex flex-col h-[calc(100vh-64px)]">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-sm hover:shadow transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Prescription Details</h1>
            <p className="text-gray-500 text-sm">#{prescription.id} - Uploaded on {new Date(prescription.uploadDate).toLocaleDateString()}</p>
          </div>
          <div className="ml-auto">
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${status.color} whitespace-nowrap`}>
              {status.icon} {status.label}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
          {/* Prescription Viewer */}
          <div className="w-full md:w-1/2 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                {prescription.fileType === "pdf" ? <File size={18} className="text-red-500" /> : <Image size={18} className="text-blue-500" />}
                {prescription.fileName || "Prescription Document"}
              </h3>
            </div>
            <div className="flex-1 bg-gray-100 overflow-auto p-4 flex justify-center items-start">
              {prescription.fileType === "pdf" ? (
                <iframe src={prescription.fileUrl} className="w-full h-full min-h-[500px] rounded-xl border border-gray-200" />
              ) : (
                <img src={prescription.fileUrl} alt="Prescription" className="max-w-full rounded-xl shadow-sm" />
              )}
            </div>
            {prescription.remarks && (
              <div className="p-4 bg-blue-50 border-t border-blue-100 text-sm text-blue-800">
                <strong>Pharmacist Notes:</strong> {prescription.remarks}
              </div>
            )}
          </div>

          {/* Chat Interface */}
          <div className="w-full md:w-1/2 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-[600px] md:h-auto">
            <div className="p-4 border-b border-gray-100 bg-indigo-50 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                P
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900">Pharmacist Support</h3>
                <p className="text-xs text-indigo-600">Ask questions about your prescription</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <AlertCircle size={40} className="mb-2 opacity-20" />
                  <p className="text-sm">No messages yet. Send a message to the pharmacist.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  // Assuming user is sender if msg.senderId === user.userId
                  const isUser = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        isUser 
                          ? "bg-indigo-600 text-white rounded-br-sm" 
                          : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-[10px] mt-1 text-right ${isUser ? "text-indigo-200" : "text-gray-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
