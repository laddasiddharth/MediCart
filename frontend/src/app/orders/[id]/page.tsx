"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Package, CheckCircle, Truck, Clock, XCircle, MapPin, CreditCard, ArrowLeft } from "lucide-react";

interface OrderItem {
  id: number;
  medicineId: number;
  medicineName: string | null;
  medicineBrand: string | null;
  medicineImage: string | null;
  quantity: number;
  unitPrice: string;
  discountPercent: string | null;
  totalPrice: string;
}

interface Order {
  id: number;
  status: string;
  totalAmount: string;
  discountAmount: string;
  taxAmount: string;
  deliveryCharge: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryPincode: string;
  estimatedDelivery: string | null;
  notes: string | null;
  orderDate: string;
  items: OrderItem[];
}

const statusSteps = [
  { key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

function OrderDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const isSuccess = searchParams.get("success") === "true";

  useEffect(() => {
    if (!user) { router.push("/auth"); return; }
    fetch(`/api/orders/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { setOrder(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p>Order not found</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">
        {isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
            <div>
              <p className="font-semibold text-green-700">Order placed successfully! 🎉</p>
              <p className="text-sm text-green-600">Your order has been confirmed and will be processed shortly.</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <Link href="/orders" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Order #{order.id}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            order.status === "delivered" ? "bg-green-100 text-green-700" :
            order.status === "cancelled" ? "bg-red-100 text-red-700" :
            order.status === "shipped" ? "bg-purple-100 text-purple-700" :
            "bg-blue-100 text-blue-700"
          }`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Tracking */}
            {!isCancelled && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-5">Order Tracking</h3>
                <div className="relative">
                  <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gray-100" />
                  <div className="space-y-6">
                    {statusSteps.map((step, idx) => {
                      const isCompleted = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex items-start gap-4">
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                          }`}>
                            <Icon size={15} />
                          </div>
                          <div className="pt-0.5">
                            <p className={`font-medium text-sm ${isCompleted ? "text-gray-800" : "text-gray-400"}`}>
                              {step.label}
                            </p>
                            {isCurrent && (
                              <p className="text-xs text-green-600 mt-0.5">Current Status</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {order.estimatedDelivery && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={15} className="text-green-500" />
                    Estimated Delivery: <strong>{new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={item.medicineImage || "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=200"}
                        alt={item.medicineName || ""}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 text-sm">{item.medicineName}</h4>
                      <p className="text-xs text-gray-500">{item.medicineBrand}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{parseFloat(item.unitPrice).toFixed(2)}</p>
                        <p className="font-semibold text-gray-900 text-sm">₹{parseFloat(item.totalPrice).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Delivery */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-green-500" /> Delivery Address
              </h3>
              <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
              <p className="text-sm text-gray-600">{order.deliveryCity}, {order.deliveryState}</p>
              <p className="text-sm text-gray-600">{order.deliveryPincode}</p>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CreditCard size={16} className="text-green-500" /> Payment
              </h3>
              <p className="text-sm text-gray-600 capitalize">{order.paymentMethod.replace(/_/g, " ")}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {order.paymentStatus}
              </span>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Price Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{(parseFloat(order.totalAmount) - parseFloat(order.taxAmount) - parseFloat(order.deliveryCharge)).toFixed(2)}</span>
                </div>
                {parseFloat(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{parseFloat(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>₹{parseFloat(order.taxAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{parseFloat(order.deliveryCharge) === 0 ? "FREE" : `₹${parseFloat(order.deliveryCharge).toFixed(2)}`}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{parseFloat(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Ordered on {new Date(order.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>}>
      <OrderDetailContent />
    </Suspense>
  );
}
