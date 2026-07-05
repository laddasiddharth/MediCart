"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Package,
  ClipboardList,
  BarChart3,
  Home,
  Pill,
  FileText,
  Heart,
  CalendarClock,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlistIds } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const isAdminOrPharmacist = user?.role === "admin" || user?.role === "pharmacist";

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Pill className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-gray-800">
              Medi<span className="text-green-600">Cart</span>
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-6">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicines, brands, generics..."
                className="w-full pl-4 pr-12 py-2 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 text-white rounded-full p-1.5 hover:bg-green-600 transition"
              >
                <Search size={14} />
              </button>
            </div>
          </form>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/shop" className="text-gray-600 hover:text-green-600 text-sm font-medium transition">
              Shop
            </Link>

            {isAdminOrPharmacist && (
              <Link href="/admin" className="text-gray-600 hover:text-green-600 text-sm font-medium transition">
                Dashboard
              </Link>
            )}

            {user ? (
              <>
                <Link href="/wishlist" className="relative p-2 text-gray-600 hover:text-red-500 transition">
                  <Heart size={20} />
                  {wishlistIds.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {wishlistIds.length > 99 ? "99+" : wishlistIds.length}
                    </span>
                  )}
                </Link>

                <Link href="/cart" className="relative p-2 text-gray-600 hover:text-green-600 transition">
                  <ShoppingCart size={20} />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-600 transition"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User size={16} className="text-green-600" />
                    </div>
                    <span className="font-medium max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
                    <ChevronDown size={14} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={15} /> My Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Package size={15} /> My Orders
                      </Link>
                      <Link
                        href="/subscriptions"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <CalendarClock size={15} /> Subscriptions
                      </Link>
                      <Link
                        href="/reminders"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Bell size={15} /> Pill Tracker
                      </Link>
                      <Link
                        href="/prescriptions"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FileText size={15} /> Prescriptions
                      </Link>
                      {isAdminOrPharmacist && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <BarChart3 size={15} /> Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth"
                  className="text-gray-600 hover:text-green-600 text-sm font-medium transition px-3 py-1.5 border border-gray-200 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth?tab=register"
                  className="bg-green-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-green-600 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu btn */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            <form onSubmit={handleSearch} className="px-2 mb-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search medicines..."
                  className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-full bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={16} />
                </button>
              </div>
            </form>
            <Link href="/" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              <Home size={16} /> Home
            </Link>
            <Link href="/shop" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              <Pill size={16} /> Shop
            </Link>
            {user ? (
              <>
                <Link href="/wishlist" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                  <Heart size={16} /> Wishlist {wishlistIds.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5">{wishlistIds.length}</span>}
                </Link>
                <Link href="/cart" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                  <ShoppingCart size={16} /> Cart {itemCount > 0 && <span className="bg-green-500 text-white text-xs rounded-full px-1.5">{itemCount}</span>}
                </Link>
                <Link href="/orders" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                  <Package size={16} /> Orders
                </Link>
                <Link href="/subscriptions" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                  <CalendarClock size={16} /> Subscriptions
                </Link>
                <Link href="/reminders" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                  <Bell size={16} /> Pill Tracker
                </Link>
                <Link href="/prescriptions" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                  <FileText size={16} /> Prescriptions
                </Link>
                {isAdminOrPharmacist && (
                  <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                    <BarChart3 size={16} /> Admin Panel
                  </Link>
                )}
                <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg w-full">
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-4 py-2">
                <Link href="/auth" className="flex-1 text-center border border-gray-200 text-gray-700 py-2 rounded-lg text-sm" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link href="/auth?tab=register" className="flex-1 text-center bg-green-500 text-white py-2 rounded-lg text-sm" onClick={() => setMobileOpen(false)}>Register</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
