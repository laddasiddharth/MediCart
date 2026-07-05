"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  ArrowRight,
  Star,
  ShoppingCart,
  FileText,
  Shield,
  Truck,
  Clock,
  ChevronRight,
  Zap,
  Heart,
  Pill,
  Activity,
  Eye,
  BandageIcon,
  Leaf,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";

interface Medicine {
  id: number;
  name: string;
  genericName: string | null;
  brand: string | null;
  price: string;
  discountPercent: string | null;
  stock: number;
  imageUrl: string | null;
  rating: string | null;
  reviewCount: number | null;
  prescriptionRequired: boolean;
  categoryName: string | null;
}

interface Category {
  id: number;
  name: string;
  icon: string | null;
  medicineCount: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Antibiotics": <Zap size={24} />,
  "Pain Relief": <Activity size={24} />,
  "Vitamins & Supplements": <Leaf size={24} />,
  "Diabetes Care": <Heart size={24} />,
  "Heart & Blood Pressure": <Heart size={24} />,
  "Digestive Health": <Shield size={24} />,
  "Cold & Flu": <Shield size={24} />,
  "Skin Care": <Leaf size={24} />,
  "Eye Care": <Eye size={24} />,
  "First Aid": <BandageIcon size={24} />,
};

function MedicineCard({ medicine }: { medicine: Medicine }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const price = parseFloat(medicine.price);
  const discount = parseFloat(medicine.discountPercent || "0");
  const discountedPrice = price * (1 - discount / 100);
  const isWishlisted = wishlistIds.includes(medicine.id);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = "/auth"; return; }
    setWishlistLoading(true);
    await toggleWishlist(medicine.id);
    setWishlistLoading(false);
  };

  const handleAddToCart = async () => {
    if (!user) { window.location.href = "/auth"; return; }
    setAdding(true);
    await addItem(medicine.id);
    setAdded(true);
    setAdding(false);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group">
      <div className="relative overflow-hidden bg-gray-50 h-44">
        <img
          src={medicine.imageUrl || "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400"}
          alt={medicine.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button
          onClick={handleWishlist}
          disabled={wishlistLoading}
          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition disabled:opacity-50"
        >
          <Heart size={16} className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-500"} />
        </button>
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        {medicine.prescriptionRequired && (
          <span className="absolute top-10 right-2 bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <FileText size={10} /> Rx
          </span>
        )}
        {medicine.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-sm font-semibold px-3 py-1 rounded-lg">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-green-600 font-medium mb-1">{medicine.categoryName || "General"}</p>
        <Link href={`/medicine/${medicine.id}`}>
          <h3 className="font-semibold text-gray-800 text-sm leading-tight hover:text-green-600 transition line-clamp-2 mb-1">
            {medicine.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mb-2">{medicine.brand}</p>

        <div className="flex items-center gap-1 mb-3">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-medium text-gray-700">{parseFloat(medicine.rating || "0").toFixed(1)}</span>
          <span className="text-xs text-gray-400">({medicine.reviewCount || 0})</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">₹{discountedPrice.toFixed(0)}</span>
            {discount > 0 && (
              <span className="text-xs text-gray-400 line-through ml-1">₹{price.toFixed(0)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding || medicine.stock === 0}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition ${
              added
                ? "bg-green-100 text-green-700"
                : medicine.stock === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            <ShoppingCart size={13} />
            {added ? "Added!" : adding ? "..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medRes, catRes] = await Promise.all([
          fetch("/api/medicines?limit=8&sortBy=rating&sortOrder=desc"),
          fetch("/api/categories"),
        ]);
        const [medData, catData] = await Promise.all([medRes.json(), catRes.json()]);
        setMedicines(medData.data || []);
        setCategories(catData || []);
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section
        className="relative bg-gradient-to-br from-green-600 via-teal-600 to-cyan-700 text-white overflow-hidden"
        style={{ minHeight: "520px" }}
      >
        {/* BG decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-white/5 rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Zap size={14} className="text-yellow-300" />
                India's Trusted Online Pharmacy
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Your Health,
                <br />
                <span className="text-yellow-300">Delivered Fast</span>
              </h1>
              <p className="text-lg text-green-100 mb-8 max-w-md leading-relaxed">
                Order genuine medicines online, upload prescriptions, and get doorstep delivery.
                Licensed pharmacists verify every prescription.
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="flex bg-white rounded-2xl overflow-hidden shadow-xl max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search medicines, brands..."
                    className="flex-1 px-5 py-3.5 text-gray-800 text-sm focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-5 py-3.5 flex items-center gap-2 text-sm font-medium transition"
                  >
                    <Search size={16} />
                    Search
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="bg-white text-green-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-green-50 transition flex items-center gap-2"
                >
                  Shop Now <ArrowRight size={16} />
                </Link>
                <Link
                  href="/prescriptions"
                  className="border border-white/40 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-white/10 transition flex items-center gap-2"
                >
                  <FileText size={16} /> Upload Prescription
                </Link>
              </div>
            </div>

            {/* Hero stats */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { label: "Medicines", value: "10,000+", icon: Pill },
                { label: "Customers", value: "50,000+", icon: Heart },
                { label: "Deliveries", value: "99.9%", icon: Truck },
                { label: "Pharmacists", value: "50+", icon: Shield },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon size={24} className="text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-green-100 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            {[
              { icon: Shield, text: "100% Authentic" },
              { icon: Truck, text: "Fast Delivery" },
              { icon: Clock, text: "24/7 Support" },
              { icon: FileText, text: "Easy Prescription Upload" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={16} className="text-green-500" />
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Shop by Category</h2>
              <p className="text-gray-500 text-sm mt-1">Find medicines by health concern</p>
            </div>
            <Link href="/shop" className="flex items-center gap-1 text-green-600 text-sm font-medium hover:underline">
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.slice(0, 10).map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?categoryId=${cat.id}`}
                className="bg-white rounded-2xl p-4 text-center hover:shadow-md hover:border-green-200 border border-transparent transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-green-50 group-hover:bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 transition text-2xl">
                  {cat.icon || "💊"}
                </div>
                <h3 className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition leading-tight">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{Number(cat.medicineCount)} items</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Medicines */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Popular Medicines</h2>
              <p className="text-gray-500 text-sm mt-1">Top rated products our customers love</p>
            </div>
            <Link href="/shop" className="flex items-center gap-1 text-green-600 text-sm font-medium hover:underline">
              View All <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100">
                  <div className="h-44 bg-gray-200 rounded-t-2xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/3 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {medicines.map((med) => (
                <MedicineCard key={med.id} medicine={med} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Prescription Banner */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Need Prescription Medicines?</h2>
              <p className="text-blue-100 max-w-lg">
                Upload your doctor's prescription and our certified pharmacists will verify it within 2-4
                hours. Get your medicines delivered safely.
              </p>
            </div>
            <Link
              href="/prescriptions"
              className="flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition whitespace-nowrap"
            >
              <FileText size={18} />
              Upload Prescription
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">How MediCart Works</h2>
          <p className="text-gray-500 mb-12">Order medicines in 3 simple steps</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Search,
                title: "Search & Add",
                desc: "Browse our catalog of 10,000+ medicines and add them to cart",
              },
              {
                step: "02",
                icon: FileText,
                title: "Upload Prescription",
                desc: "Upload prescription for Rx medicines. Our pharmacists verify within hours",
              },
              {
                step: "03",
                icon: Truck,
                title: "Fast Delivery",
                desc: "Get your medicines delivered at your doorstep within 24-48 hours",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="text-5xl font-black text-gray-100 mb-4">{step}</div>
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon size={26} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
