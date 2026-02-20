# Hướng Dẫn Tích Hợp Tạo Mã QR Chuyển Khoản (VietQR)

## Tổng Quan

Tài liệu này mô tả chi tiết cách tích hợp tính năng tự động sinh mã QR ngân hàng để chuyển khoản một cách nhanh chóng, chính xác vào dự án Frontend ReactJS. Chúng ta sử dụng API của **img.vietqr.io** để trả về mã QR trực tiếp từ STK (số tài khoản) và Mã Ngân hàng (BIN code).

## Nguyên lý hoạt động

VietQR cung cấp một API định dạng ảnh trả về ảnh QR theo cấu trúc URL:

```text
https://img.vietqr.io/image/<BANK_BIN>-<ACCOUNT_NUMBER>-<TEMPLATE>.png
```

- `BANK_BIN`: Mã BIN hoặc tên rút gọn của ngân hàng (Ví dụ: `MB`, `VCB`, `TCB`).
- `ACCOUNT_NUMBER`: Số tài khoản nhận tiền.
- `TEMPLATE`: Giao diện của mã QR (được sử dụng `compact2` để mã nhỏ gọn, bo góc thẩm mỹ).

## Bước 1: Khai Báo Dữ Liệu Ngân Hàng

Chúng ta cần chuẩn bị danh sách hiển thị cho người dùng và một `Mapping` (từ điển) để dịch tên ngân hàng thành mã gửi lên Cổng VietQR.

```javascript
// Các tuỳ chọn hiển thị trên UI Dropdown
const bankOptions = [
  "MB Bank",
  "ViettinBank",
  "TechComBank",
  "BIDV",
  "VietCombank",
  "ví MOMO",
  "ví ZaloPay",
  "VNPay",
];

const getQrUrl = (bankName, accountNumber) => {
  const bankMap = {
    "MB Bank": "MB",
    ViettinBank: "CTG",
    TechComBank: "TCB",
    BIDV: "BIDV",
    VietCombank: "VCB",
    "ví MOMO": "MOMO", 
    "ví ZaloPay": "ZALOPAY", 
    VNPay: "VNPAY", 
  };
  const code = bankMap[bankName] || "MB";

  return `https://img.vietqr.io/image/${code}-${accountNumber}-compact2.png`;
};
```

## Bước 2: Tích hợp vào UI Bảng Hiển thị

Trên một bảng tính năng thông thường, bạn có thể gọi API url trên thẻ `<img />` trực tiếp bằng cách truyền vào dữ liệu người dùng từ Database:

```jsx
<td className="py-4 px-6 text-center">
  <div className="flex items-center justify-center">
    <img
      src={getQrUrl(acc.bankName, acc.accountNumber)}
      alt="QR Code"
      className="w-12 h-12 rounded-lg cursor-pointer hover:scale-110 transition-transform shadow-sm object-cover bg-white"
      onClick={() => setSelectedQR(getQrUrl(acc.bankName, acc.accountNumber))}
      title="Nhấn để phóng to"
    />
  </div>
</td>
```

> **Lưu ý:** Việc render ảnh diễn ra hoàn toàn ở Client-side, do đó server của bạn không cần lưu trữ bất kỳ file ảnh vật lý nào vào CSDL, tiết kiệm rất nhiều dung lượng. Trên CSDL (Database) chỉ giữ lại 2 trường là `bank_name` dạng chuỗi và `account_number` dạng chuỗi là đủ.

## Bước 3: Xem ảnh QR Full-Screen

Để tiện cho người dùng có thể cầm điện thoại lên quét, ta sẽ cho phóng lớn mã QR qua một cơ chế trạng thái `selectedQR`

## Các Ngân hàng hỗ trợ bổ sung

Ngoài các tên ở trên, Cổng API NAPAS (VietQR) hỗ trợ quét toàn bộ mã của mọi ngân hàng nội địa tại việt nam, bạn chỉ cần mở rộng mảng `bankOptions` và thêm mapping từ khoá `bankMap` tương ứng (Ví dụ `Agribank` -> `VBA`, `ACB` -> `ACB`, `Sacombank` -> `STB` v.v...) là hệ thống tự động chạy được luôn. Mọi thông số tham khảo có thể xem ở trang `https://vietqr.net/`.
