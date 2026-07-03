"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import {
  Star, ShoppingCart, FileText, ChevronLeft, Package, AlertCircle,
  CheckCircle, Clock, Info, Pill, Tag, Hash
} from "lucide-react";

interface Medicine {
  id: number;
  name: string;
  genericName: string | null;
  brand: string | null;
  categoryId: number | null;
  categoryName: string | null;
  description: string | null;
  dosage: string | null;
  sideEffects: string | null;
  ingredients: string | null;
  manufacturer: string | null;
  sku: string | null;
  batchNumber: string | null;
  price: string;
  discountPercent: string | null;
  purchasePrice: string | null;
  stock: number;
  minStockLevel: number;
  expiryDate: string | null;
  manufacturingDate: string | null;
  prescriptionRequired: boolean;
  isActive: boolean;
  imageUrl: string | null;
  rating: string | null;
  reviewCount: number | null;
}

export default function MedicinePage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const id = params.id;
    fetch(`/api/medicines/${id}`)
      .then((r) => r.json())
      .then((data) => { setMedicine(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!user) { router.push("/auth"); return; }
    if (!medicine) return;
    setAdding(true);
    await addItem(medicine.id, quantity);
    setAdded(true);
    setAdding(false);
    setTimeout(() => setAdded(false), 2000);
  };

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

  if (!medicine) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Medicine not found</h2>
            <Link href="/shop" className="text-green-600 hover:underline">Back to Shop</Link>
          </div>
        </div>
      </div>
    );
  }

  const price = parseFloat(medicine.price);
  const discount = parseFloat(medicine.discountPercent || "0");
  const discountedPrice = price * (1 - discount / 100);
  const savings = price - discountedPrice;

  const isExpired = medicine.expiryDate && new Date(medicine.expiryDate) < new Date();
  const isExpiringSoon = medicine.expiryDate && !isExpired &&
    new Date(medicine.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-green-600">Shop</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate">{medicine.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <div className="relative">
            <div className="bg-gray-50 rounded-3xl overflow-hidden h-80 md:h-96">
              <img
                src={medicine.imageUrl || "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=600"}
                alt={medicine.name}
                className="w-full h-full object-cover"
              />
            </div>
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1.5 rounded-xl text-sm">
                {discount}% OFF
              </span>
            )}
            {medicine.prescriptionRequired && (
              <span className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1.5 rounded-xl text-sm flex items-center gap-1">
                <FileText size={14} /> Prescription Required
              </span>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {medicine.categoryName || "General"}
              </span>
              {medicine.stock > 0 ? (
                <span className="flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">
                  <CheckCircle size={11} /> In Stock ({medicine.stock} units)
                </span>
              ) : (
                <span className="bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-full">Out of Stock</span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{medicine.name}</h1>
            {medicine.genericName && (
              <p className="text-gray-500 mb-1 italic">Generic: {medicine.genericName}</p>
            )}
            <p className="text-gray-600 mb-4">{medicine.brand} | {medicine.manufacturer}</p>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.round(parseFloat(medicine.rating || "0")) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">{parseFloat(medicine.rating || "0").toFixed(1)}</span>
              <span className="text-sm text-gray-400">({medicine.reviewCount || 0} reviews)</span>
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">₹{discountedPrice.toFixed(2)}</span>
                {discount > 0 && (
                  <>
                    <span className="text-lg text-gray-400 line-through">₹{price.toFixed(2)}</span>
                    <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-0.5 rounded-lg">
                      Save ₹{savings.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>

            {/* Alerts */}
            {isExpired && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
                <AlertCircle size={16} /> This medicine has expired on {medicine.expiryDate}
              </div>
            )}
            {isExpiringSoon && !isExpired && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-3 mb-4 text-sm">
                <Clock size={16} /> Expires soon: {medicine.expiryDate}
              </div>
            )}
            {medicine.prescriptionRequired && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-3 mb-4 text-sm">
                <Info size={16} /> A valid prescription is required to purchase this medicine.
                <Link href="/prescriptions" className="underline ml-1 font-medium">Upload Prescription</Link>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium text-gray-700">Quantity:</label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-50 text-gray-600"
                >
                  -
                </button>
                <span className="px-4 py-2 font-medium text-gray-800 border-x border-gray-200">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(medicine.stock, quantity + 1))}
                  className="px-3 py-2 hover:bg-gray-50 text-gray-600"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">Total: <strong>₹{(discountedPrice * quantity).toFixed(2)}</strong></span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={adding || medicine.stock === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${
                  added ? "bg-green-100 text-green-700" : medicine.stock === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                <ShoppingCart size={18} />
                {added ? "Added to Cart!" : adding ? "Adding..." : "Add to Cart"}
              </button>
              <Link
                href="/cart"
                className="border-2 border-green-500 text-green-600 hover:bg-green-50 px-5 py-3 rounded-xl font-semibold transition"
              >
                Buy Now
              </Link>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              {[
                { icon: Package, label: "SKU", value: medicine.sku || "N/A" },
                { icon: Hash, label: "Batch", value: medicine.batchNumber || "N/A" },
                { icon: Tag, label: "Expires", value: medicine.expiryDate || "N/A" },
                { icon: Pill, label: "Mfg Date", value: medicine.manufacturingDate || "N/A" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <Icon size={15} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {["overview", "dosage", "sideEffects", "ingredients"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3.5 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                  activeTab === tab ? "border-green-500 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "overview" ? "Overview" : tab === "dosage" ? "Dosage" : tab === "sideEffects" ? "Side Effects" : "Ingredients"}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === "overview" && (
              <p className="text-gray-600 leading-relaxed">{medicine.description || "No description available."}</p>
            )}
            {activeTab === "dosage" && (
              <p className="text-gray-600 leading-relaxed">{medicine.dosage || "Please consult your doctor for proper dosage."}</p>
            )}
            {activeTab === "sideEffects" && (
              <p className="text-gray-600 leading-relaxed">{medicine.sideEffects || "No known side effects listed."}</p>
            )}
            {activeTab === "ingredients" && (
              <p className="text-gray-600 leading-relaxed">{medicine.ingredients || "Ingredient information not available."}</p>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
