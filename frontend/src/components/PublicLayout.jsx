import React from "react";
import { Link, Outlet } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import Navbar from "./Navbar";

const PublicLayout = () => {
  const quickLinks = [
    { label: "About us", to: "/" },
    { label: "Products", to: "/products" },
    { label: "Cart", to: "/cart" },
    { label: "Orders", to: "/order-history" },
  ];

  const supportLinks = [
    "Help center",
    "Return policy",
    "Privacy policy",
    "Terms of service",
  ];

  return (
    <div className="public-shell font-poppins text-slate-600">
      <Navbar />

      <main className="min-h-[calc(100vh-300px)]">
        <Outlet />
      </main>

      <footer className="border-t border-emerald-950/20 bg-[#047857] pb-5 pt-10 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-lg font-bold text-white">
                  G
                </div>
                <span className="text-xl font-medium text-white">
                  Grocery Store
                </span>
              </div>
              <p className="mb-5 text-sm leading-7 text-white/82">
                Fresh groceries and daily essentials delivered with a clean,
                reliable shopping experience.
              </p>
              <div className="flex gap-3">
                {[FaFacebookF, FaTwitter, FaInstagram].map((Icon, idx) => (
                  <Link
                    key={idx}
                    to="/"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/18 hover:text-white"
                    aria-label="Social link"
                  >
                    <Icon size={17} />
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 font-medium text-white">Quick links</h3>
              <ul className="space-y-2">
                {quickLinks.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-sm text-white/78 transition-colors hover:text-emerald-100"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-medium text-white">Customer support</h3>
              <ul className="space-y-2">
                {supportLinks.map((item) => (
                  <li key={item}>
                    <span className="text-sm text-white/78">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-medium text-white">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <FiMapPin size={19} className="shrink-0 text-emerald-100" />
                  <span className="text-white/82">Tran Phu, Ha Dong, Ha Noi</span>
                </li>
                <li className="flex items-center gap-3">
                  <FiPhone size={19} className="shrink-0 text-emerald-100" />
                  <span className="text-white/82">1900 1234</span>
                </li>
                <li className="flex items-center gap-3">
                  <FiMail size={19} className="shrink-0 text-emerald-100" />
                  <span className="text-white/82">support@grocery.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4">
            <p className="text-center text-sm text-white/72">
              © 2026 Grocery Store. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
