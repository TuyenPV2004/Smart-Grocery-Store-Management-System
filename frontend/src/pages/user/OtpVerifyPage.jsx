import { toast } from "react-toastify";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import userService from "../../services/userService";

const OtpVerifyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email; // Lấy email từ trang trước truyền qua
  const [otp, setOtp] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await userService.verifyOtp({ email, otp });
      toast.success("Xác thực thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data || "Mã OTP không đúng hoặc đã hết hạn.");
    }
  };

  if (!email)
    return (
      <div className="text-center mt-10">
        Lỗi: Không tìm thấy email đăng ký.
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96 text-center">
        <h2 className="text-xl font-bold mb-4">Xác thực OTP</h2>
        <p className="mb-4 text-sm text-gray-600">
          Mã xác thực đã được gửi đến: <b>{email}</b>
        </p>
        <form onSubmit={handleVerify}>
          <input
            type="text"
            maxLength="6"
            placeholder="Nhập mã OTP"
            className="w-full p-2 border rounded mb-4 text-center text-xl tracking-widest"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded"
          >
            Xác nhận
          </button>
        </form>
      </div>
    </div>
  );
};
export default OtpVerifyPage;
