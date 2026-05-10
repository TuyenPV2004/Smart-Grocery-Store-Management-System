import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";

const PublicLayout = () => {
  return (
    <div className="public-shell font-poppins text-slate-600">
      <Navbar />

      <main className="min-h-[calc(100vh-300px)]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#10521d] text-white border-t border-transparent pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white font-bold">
                  G
                </div>
                <span className="text-xl font-bold text-white">
                  Grocery Store
                </span>
              </div>
              <p className="text-white/90 mb-4">
                Mang đến những sản phẩm tươi ngon nhất cho gia đình bạn mỗi
                ngày.
              </p>
              <div className="flex gap-4">
                {[FaFacebookF, FaTwitter, FaInstagram].map((Icon, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/90 hover:bg-white/20 hover:text-white transition-colors"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-white mb-4">Liên kết nhanh</h3>
              <ul className="space-y-2">
                {["Về chúng tôi", "Sản phẩm", "Blog", "Liên hệ"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-white/90 hover:text-emerald-200 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-4">Hỗ trợ khách hàng</h3>
              <ul className="space-y-2">
                {[
                  "Trung tâm trợ giúp",
                  "Chính sách đổi trả",
                  "Chính sách bảo mật",
                  "Điều khoản dịch vụ",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-white/90 hover:text-emerald-200 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-4">Liên hệ</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <FiMapPin size={20} className="text-white shrink-0" />
                  <span className="text-white/90">Trần Phú, Hà Đông, Hà Nội</span>
                </li>
                <li className="flex items-center gap-3">
                  <FiPhone size={20} className="text-white shrink-0" />
                  <span className="text-white/90">1900 1234</span>
                </li>
                <li className="flex items-center gap-3">
                  <FiMail size={20} className="text-white shrink-0" />
                  <span className="text-white/90">support@grocery.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 flex items-center justify-center gap-4">
            <p className="w-full text-center text-sm text-white/80">© 2026 Grocery Store. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
