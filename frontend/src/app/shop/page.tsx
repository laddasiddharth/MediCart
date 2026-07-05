"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Filter, Star, ShoppingCart, FileText, ChevronLeft, ChevronRight, SlidersHorizontal, X, Heart } from "lucide-react";
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
  description: string | null;
}

interface Category {
  id: number;
  name: string;
  icon: string | null;
}

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

  const handleAdd = async () => {
    if (!user) { window.location.href = "/auth"; return; }
    setAdding(true);
    await addItem(medicine.id);
    setAdded(true);
    setAdding(false);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
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
          <span className="absolute top-10 right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
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
        <p className="text-xs text-green-600 font-medium mb-1">{medicine.categoryName}</p>
        <Link href={`/medicine/${medicine.id}`}>
          <h3 className="font-semibold text-gray-800 text-sm hover:text-green-600 transition line-clamp-2 leading-tight mb-1">
            {medicine.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mb-1">{medicine.brand}</p>
        {medicine.genericName && (
          <p className="text-xs text-gray-400 mb-2 italic">({medicine.genericName})</p>
        )}
        <div className="flex items-center gap-1 mb-3">
          <Star size={11} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-medium">{parseFloat(medicine.rating || "0").toFixed(1)}</span>
          <span className="text-xs text-gray-400">({medicine.reviewCount})</span>
          {medicine.stock > 0 && medicine.stock <= 10 && (
            <span className="ml-auto text-xs text-orange-500 font-medium">Only {medicine.stock} left</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-gray-900">₹{discountedPrice.toFixed(0)}</span>
            {discount > 0 && (
              <span className="text-xs text-gray-400 line-through ml-1">₹{price.toFixed(0)}</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || medicine.stock === 0}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition ${
              added ? "bg-green-100 text-green-700" : medicine.stock === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            <ShoppingCart size={13} />
            {added ? "Added!" : adding ? "..." : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoryId") || "");
  const [prescriptionFilter, setPrescriptionFilter] = useState(searchParams.get("prescriptionRequired") || "");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);

  const fetchMedicines = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "12",
      sortBy,
      sortOrder,
      ...(search && { search }),
      ...(selectedCategory && { categoryId: selectedCategory }),
      ...(prescriptionFilter && { prescriptionRequired: prescriptionFilter }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      ...(inStock && { inStock: "true" }),
    });

    const res = await fetch(`/api/medicines?${params}`);
    const data = await res.json();
    setMedicines(data.data || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, [page, sortBy, sortOrder, selectedCategory, prescriptionFilter, inStock, fetchTrigger]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMedicines();
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setPrescriptionFilter("");
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    setPage(1);
    setFetchTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Medicine Store</h1>
            <p className="text-gray-500 text-sm">{total} products found</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split("-");
                setSortBy(s);
                setSortOrder(o);
                setPage(1);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-A</option>
              <option value="price-asc">Price: Low-High</option>
              <option value="price-desc">Price: High-Low</option>
              <option value="rating-desc">Top Rated</option>
              <option value="newest-desc">Newest</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <div className={`${showFilters ? "block" : "hidden"} lg:block w-64 flex-shrink-0`}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Filters</h3>
                <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">Clear all</button>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="mb-5">
                <label className="text-xs font-medium text-gray-600 mb-2 block">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Medicine name..."
                    className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={14} />
                  </button>
                </div>
              </form>

              {/* Categories */}
              <div className="mb-5">
                <label className="text-xs font-medium text-gray-600 mb-2 block">Category</label>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  <button
                    onClick={() => { setSelectedCategory(""); setPage(1); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition ${!selectedCategory ? "bg-green-50 text-green-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id.toString()); setPage(1); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition ${selectedCategory === cat.id.toString() ? "bg-green-50 text-green-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-5">
                <label className="text-xs font-medium text-gray-600 mb-2 block">Price Range (₹)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  onClick={() => { setPage(1); fetchMedicines(); }}
                  className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-1.5 rounded-lg transition"
                >
                  Apply
                </button>
              </div>

              {/* Prescription */}
              <div className="mb-5">
                <label className="text-xs font-medium text-gray-600 mb-2 block">Prescription</label>
                <div className="space-y-1">
                  {[
                    { label: "All", value: "" },
                    { label: "OTC (No Rx Needed)", value: "false" },
                    { label: "Prescription Required", value: "true" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setPrescriptionFilter(opt.value); setPage(1); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition ${prescriptionFilter === opt.value ? "bg-green-50 text-green-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* In Stock */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                    className="accent-green-500"
                  />
                  <span className="text-sm text-gray-700">In Stock Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100">
                    <div className="h-44 bg-gray-200 rounded-t-2xl" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : medicines.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">💊</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No medicines found</h3>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your filters or search query</p>
                <button onClick={clearFilters} className="bg-green-500 text-white px-5 py-2 rounded-lg text-sm hover:bg-green-600 transition">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {medicines.map((med) => (
                    <MedicineCard key={med.id} medicine={med} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition ${page === p ? "bg-green-500 text-white" : "border border-gray-200 hover:bg-gray-50"}`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>}>
      <ShopContent />
    </Suspense>
  );
}
