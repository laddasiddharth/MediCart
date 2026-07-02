import Link from "next/link";
import { Pill, Phone, Mail, MapPin, Share2, Shield, Truck, Clock, Award } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Trust Badges */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, text: "100% Authentic Medicines" },
              { icon: Truck, text: "Free Delivery on ₹500+" },
              { icon: Clock, text: "24/7 Pharmacist Support" },
              { icon: Award, text: "Licensed Pharmacy" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="text-green-400" size={18} />
                </div>
                <span className="text-sm font-medium text-gray-300">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Pill className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-white">
                Medi<span className="text-green-400">Cart</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Your trusted online pharmacy. We provide quality medicines with verified prescriptions and
              professional pharmacist support.
            </p>
            <div className="flex gap-3">
              {[Share2, Share2, Share2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-green-600 transition"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/shop", label: "Shop Medicines" },
                { href: "/shop?filter=prescriptionRequired=false", label: "OTC Medicines" },
                { href: "/prescriptions", label: "Upload Prescription" },
                { href: "/orders", label: "Track Orders" },
                { href: "/auth", label: "Login / Register" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-gray-400 hover:text-green-400 transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              {[
                "Antibiotics",
                "Pain Relief",
                "Vitamins & Supplements",
                "Diabetes Care",
                "Heart & BP",
                "Digestive Health",
              ].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/shop?search=${encodeURIComponent(cat)}`}
                    className="text-gray-400 hover:text-green-400 transition"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">123 Pharmacy Street, Mumbai, Maharashtra 400001</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-green-400 flex-shrink-0" />
                <span className="text-gray-400">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-green-400 flex-shrink-0" />
                <span className="text-gray-400">support@medicart.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© 2024 MediCart. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-300">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300">Terms of Service</a>
            <a href="#" className="hover:text-gray-300">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
