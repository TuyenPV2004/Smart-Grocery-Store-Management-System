import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const PublicLayout = () => {
  return (
    <div className="font-poppins text-slate-600 bg-[#F8FAFC]">
      <Navbar />

      <main className="min-h-screen">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                  G
                </div>
                <span className="text-xl font-bold text-slate-800">
                  Grocery Store
                </span>
              </div>
              <p className="text-slate-500 mb-6">
                Mang đến những sản phẩm tươi ngon nhất cho gia đình bạn mỗi
                ngày.
              </p>
              <div className="flex gap-4">
                {[Facebook, Twitter, Instagram].map((Icon, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-6">Liên kết nhanh</h3>
              <ul className="space-y-4">
                {["Về chúng tôi", "Sản phẩm", "Blog", "Liên hệ"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-slate-500 hover:text-green-600 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-6">
                Hỗ trợ khách hàng
              </h3>
              <ul className="space-y-4">
                {[
                  "Trung tâm trợ giúp",
                  "Chính sách đổi trả",
                  "Chính sách bảo mật",
                  "Điều khoản dịch vụ",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-slate-500 hover:text-green-600 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-6">Liên hệ</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin size={20} className="text-green-600 shrink-0" />
                  <span className="text-slate-500">
                    Trần Phú, Hà Đông, Hà Nội
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={20} className="text-green-600 shrink-0" />
                  <span className="text-slate-500">1900 1234</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={20} className="text-green-600 shrink-0" />
                  <span className="text-slate-500">support@grocery.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © 2026 Grocery Store. All rights reserved.
            </p>
            <div className="flex gap-6">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEv2OVDSh2Tsc_LefB1f5sFFOy3BUx6eOk_w&s"
                className="h-4 opacity-50 gray-scale"
                alt="Visa"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                className="h-4 opacity-50 gray-scale"
                alt="Mastercard"
              />
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKgYNSZSsp_IoaexKIiIPj2MOClxCVkxRpgg&s"
                className="h-4 opacity-50 gray-scale"
                alt="Momo"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
