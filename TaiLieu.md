# Grocery Store Management System 🛒

## Giới thiệu
Hệ thống quản lý cửa hàng tạp hóa - Một ứng dụng web toàn diện giúp quản lý và vận hành cửa hàng tạp hóa một cách hiệu quả.

## Danh sách chức năng chính

### 1. 👤 Quản lý người dùng & Xác thực
- **Đăng nhập/Đăng xuất**: Xác thực người dùng an toàn
- **Quản lý tài khoản**: 
  - Tạo tài khoản mới
  - Cập nhật thông tin người dùng
  - Đổi mật khẩu
  - Xóa tài khoản
- **Phân quyền người dùng**:
  - Admin: Toàn quyền quản lý hệ thống
  - Staff: Nhân viên bán hàng
- **Quản lý profile**: Xem và chỉnh sửa thông tin cá nhân

### 2. 📦 Quản lý sản phẩm
- **Thêm sản phẩm mới**:
  - Thông tin cơ bản (tên, mô tả, mã SKU)
  - Giá bán, giá nhập
  - Hình ảnh sản phẩm
  - Đơn vị tính (kg, lít, chai, hộp...)
- **Cập nhật sản phẩm**: Chỉnh sửa thông tin sản phẩm
- **Xóa sản phẩm**: Xóa hoặc vô hiệu hóa sản phẩm
- **Tìm kiếm sản phẩm**:
  - Theo tên
  - Theo mã SKU
  - Theo danh mục
  - Theo giá
- **Quản lý danh mục sản phẩm**:
  - Thêm/sửa/xóa danh mục
  - Phân loại sản phẩm theo nhóm
- **Quản lý giá**: 
  - Giá thường 
  - Giá khuyến mãi
  - Giá theo thời gian
- **Barcode/QR Code**: 
  - Tạo mã vạch cho sản phẩm
  - Quét mã để tra cứu nhanh

### 3. 📊 Quản lý kho hàng
- **Nhập kho**:
  - Tạo phiếu nhập hàng
  - Ghi nhận nhà cung cấp
  - Cập nhật số lượng tồn kho
  - Ghi chú về lô hàng
- **Xuất kho**:
  - Tạo phiếu xuất hàng
  - Cập nhật tồn kho tự động
- **Kiểm kê kho**:
  - Đối chiếu số liệu thực tế
  - Báo cáo chênh lệch
  - Điều chỉnh tồn kho
- **Cảnh báo tồn kho**:
  - Hàng sắp hết
  - Hàng tồn kho quá nhiều
  - Hàng hết hạn/sắp hết hạn
- **Quản lý hạn sử dụng**:
  - Theo dõi ngày hết hạn
  - Cảnh báo sản phẩm gần hết hạn
  - Báo cáo hàng hết hạn
- **Quản lý vị trí kho**: Sắp xếp hàng hóa trong kho

### 4. 💰 Quản lý bán hàng
- **Tạo hóa đơn**:
  - Quét mã vạch sản phẩm
  - Thêm sản phẩm thủ công
  - Điều chỉnh số lượng
  - Áp dụng giảm giá
- **Thanh toán**:
  - Tiền mặt
  - Thẻ ATM/Credit
  - Chuyển khoản
  - Ví điện tử
  - Thanh toán kết hợp
- **Xử lý đơn hàng**:
  - Lưu đơn tạm
  - Hủy đơn hàng
  - In hóa đơn
  - Gửi hóa đơn qua email
- **Trả hàng/Hoàn tiền**:
  - Tạo phiếu trả hàng
  - Hoàn tiền cho khách
  - Cập nhật tồn kho
- **Quản lý ca làm việc**:
  - Mở ca
  - Đóng ca
  - Đối chiếu tiền cuối ca

### 5. 👥 Quản lý khách hàng
- **Thông tin khách hàng**:
  - Thêm khách hàng mới
  - Cập nhật thông tin
  - Phân loại khách hàng
- **Lịch sử mua hàng**:
  - Xem đơn hàng đã mua
  - Thống kê chi tiêu
  - Sản phẩm yêu thích
- **Chương trình khách hàng thân thiết**:
  - Tích điểm thưởng
  - Đổi điểm lấy quà
  - Ưu đãi riêng
- **Công nợ khách hàng**:
  - Ghi nhận công nợ
  - Theo dõi thanh toán
  - Nhắc nở công nợ

### 6. 🏢 Quản lý nhà cung cấp
- **Thông tin nhà cung cấp**:
  - Thêm NCC mới
  - Cập nhật thông tin liên hệ
  - Đánh giá NCC
- **Quản lý đơn đặt hàng**:
  - Tạo đơn đặt hàng
  - Theo dõi trạng thái
  - Xác nhận nhận hàng
- **Công nợ nhà cung cấp**:
  - Ghi nhận công nợ
  - Lịch sử thanh toán
  - Báo cáo công nợ
- **Hợp đồng & thỏa thuận**:
  - Lưu trữ hợp đồng
  - Điều khoản giá cả
  - Thời hạn hợp tác

### 7. 👨‍💼 Quản lý nhân viên
- **Thông tin nhân viên**:
  - Hồ sơ cá nhân
  - Chức vụ, bộ phận
  - Lịch sử công tác
- **Chấm công**:
  - Ghi nhận giờ làm việc
  - Tính công tháng
  - Quản lý nghỉ phép
- **Phân ca làm việc**:
  - Lập lịch làm việc
  - Gán nhân viên vào ca
  - Thay đổi ca
- **Lương & thưởng**:
  - Tính lương cơ bản
  - Phụ cấp, thưởng
  - Khấu trừ
- **Đánh giá hiệu suất**:
  - KPI nhân viên
  - Doanh số cá nhân
  - Đánh giá định kỳ

### 8. 💵 Quản lý tài chính
- **Thu chi**:
  - Ghi nhận thu nhập
  - Ghi nhận chi phí
  - Phân loại thu chi
- **Sổ quỹ**:
  - Quỹ tiền mặt
  - Tài khoản ngân hàng
  - Chuyển tiền giữa các quỹ
- **Công nợ**:
  - Phải thu khách hàng
  - Phải trả nhà cung cấp
  - Theo dõi thanh toán
- **Báo cáo tài chính**:
  - Doanh thu theo ngày/tháng/năm
  - Chi phí vận hành
  - Lợi nhuận
  - Báo cáo tổng hợp

### 9. 🎯 Khuyến mãi & Marketing
- **Chương trình khuyến mãi**:
  - Giảm giá theo %
  - Giảm giá cố định
  - Mua X tặng Y
  - Combo sản phẩm
- **Mã giảm giá (Coupon)**:
  - Tạo mã giảm giá
  - Điều kiện áp dụng
  - Hạn sử dụng
  - Giới hạn số lần dùng
- **Flash Sale**:
  - Sale theo giờ
  - Số lượng giới hạn
  - Đếm ngược
- **Quảng cáo & thông báo**:
  - Gửi thông báo cho khách hàng
  - Email marketing
  - SMS marketing

### 10. 📈 Báo cáo & Thống kê
- **Báo cáo doanh thu**:
  - Theo ngày/tuần/tháng/năm
  - Theo sản phẩm
  - Theo danh mục
  - Theo nhân viên
- **Báo cáo tồn kho**:
  - Giá trị tồn kho
  - Hàng tồn kho theo danh mục
  - Hàng hết/sắp hết
  - Hàng bán chạy/chậm
- **Báo cáo khách hàng**:
  - Khách hàng mới
  - Khách hàng trung thành
  - Top khách hàng
  - Phân tích hành vi mua
- **Báo cáo nhân viên**:
  - Doanh số bán hàng
  - Hiệu suất làm việc
  - Chấm công
- **Dashboard tổng quan**:
  - Doanh thu hôm nay
  - Đơn hàng
  - Khách hàng mới
  - Biểu đồ trực quan
- **Export báo cáo**:
  - PDF
  - Excel
  - CSV

### 11. ⚙️ Cấu hình hệ thống
- **Thông tin cửa hàng**:
  - Tên cửa hàng
  - Logo, địa chỉ
  - Thông tin liên hệ
  - Thông tin thuế
- **Cấu hình thanh toán**:
  - Phương thức thanh toán
  - Tích hợp payment gateway
  - Cấu hình in hóa đơn
- **Cấu hình thuế**:
  - Tỷ lệ thuế VAT
  - Sản phẩm chịu thuế
  - Báo cáo thuế
- **Sao lưu & khôi phục**:
  - Backup database
  - Restore database
  - Lịch backup tự động
- **Nhật ký hoạt động**:
  - Log đăng nhập
  - Log thao tác quan trọng
  - Log lỗi hệ thống

### 12. 📱 Tính năng bổ sung
- **Đa chi nhánh**: Quản lý nhiều cửa hàng
- **Multi-language**: Hỗ trợ đa ngôn ngữ
- **Mobile responsive**: Giao diện responsive
- **Real-time notification**: Thông báo thời gian thực
- **API Integration**: Tích hợp với các hệ thống khác
- **Import/Export data**: Nhập xuất dữ liệu Excel
- **Search & Filter**: Tìm kiếm và lọc nâng cao

## Trình tự thực hiện các chức năng chính (flow gợi ý)

### 0. Khởi tạo & chuẩn bị
- Cấu hình database, môi trường backend, frontend theo mục "Cài đặt".
- Tạo tài khoản admin đầu tiên trực tiếp trong DB hoặc qua API `auth/register`.
- Đăng nhập admin để lấy JWT, kiểm tra quyền với một API bất kỳ (ví dụ `GET /api/v1/products`).

### 1. Quản lý người dùng & phân quyền
- Admin đăng nhập → lấy JWT token.
- Tạo mới user: `POST /api/v1/auth/register` với role phù hợp (Admin/Manager/Staff/Cashier).
- Cập nhật thông tin hoặc đổi mật khẩu: `PUT /api/v1/users/{id}` / endpoint đổi mật khẩu riêng nếu có.
- Kích hoạt/vô hiệu hóa tài khoản khi nhân sự thay đổi.
- Kiểm tra profile đang đăng nhập qua API `GET /api/v1/auth/me` (nếu có) hoặc thông tin nhúng trong JWT.

### 2. Quản lý sản phẩm & danh mục
- Tạo danh mục gốc: `POST /api/v1/categories`.
- Thêm sản phẩm mới: `POST /api/v1/products` (tên, SKU, giá nhập, giá bán, đơn vị tính, hình ảnh).
- Thiết lập giá khuyến mãi hoặc giá theo thời gian (nếu hỗ trợ) qua trường cấu hình giá.
- In/hiển thị mã vạch từ SKU hoặc mã sinh tự động để phục vụ quét bán hàng.
- Tìm kiếm/loc sản phẩm để kiểm tra dữ liệu: `GET /api/v1/products?name=...` hoặc theo mã SKU.

### 3. Quản lý kho hàng
- Nhập kho lần đầu: `POST /api/v1/inventory/import` kèm danh sách sản phẩm, số lượng, nhà cung cấp, ghi chú lô hàng.
- Thiết lập cảnh báo tồn kho tối thiểu/tối đa (nếu có trường cấu hình tồn).
- Thực hiện kiểm kê định kỳ: gọi `GET /api/v1/inventory` để đối chiếu, sau đó điều chỉnh lệch qua `POST /api/v1/inventory/import` hoặc `export` tùy trường hợp.
- Quản lý hạn sử dụng: lưu ngày hết hạn theo lô; bật cảnh báo sản phẩm sắp hết hạn.

### 4. Quản lý nhà cung cấp
- Tạo nhà cung cấp: `POST /api/v1/suppliers` (nếu đã hiện diện trong API; nếu chưa, lưu tạm trong ghi chú nhập kho).
- Lập đơn đặt hàng nhập: `POST /api/v1/purchase-orders` (hoặc dùng import inventory nếu hệ thống gộp).
- Khi nhận hàng, xác nhận nhập kho và cập nhật công nợ với NCC.
- Ghi nhận thanh toán cho NCC và đối chiếu công nợ định kỳ.

### 5. Quản lý khách hàng
- Thêm khách hàng mới khi phát sinh giao dịch: `POST /api/v1/customers`.
- Cập nhật phân loại (thân thiết/VIP) để áp dụng ưu đãi.
- Theo dõi lịch sử mua: `GET /api/v1/orders?customerId=...` và tích điểm/ưu đãi (nếu có).

### 6. Bán hàng tại quầy (POS)
- Mở ca làm việc cho thu ngân (log ca, số tiền đầu ca nếu có tính năng).
- Tạo hóa đơn: quét mã vạch SKU → thêm vào giỏ → chỉnh số lượng/giảm giá dòng hoặc hóa đơn.
- Tính tiền và chọn phương thức thanh toán: tiền mặt/thẻ/chuyển khoản/ví điện tử hoặc kết hợp.
- Ghi nhận thanh toán, in hoặc gửi hóa đơn (email).
- Nếu khách trả hàng: tạo phiếu trả, hoàn tiền và tự động cập nhật tồn kho.
- Đóng ca: đối chiếu tiền, xuất báo cáo ca.

### 7. Quản lý đơn hàng online/đặt trước (nếu có)
- Tạo đơn đặt hàng: `POST /api/v1/orders` với trạng thái `PENDING`.
- Xác nhận và chuẩn bị hàng: cập nhật trạng thái `CONFIRMED` → `PACKED`.
- Giao hàng/nhận tại quầy: cập nhật `DELIVERED`/`COMPLETED`; xử lý hủy `CANCELLED` nếu phát sinh.

### 8. Khuyến mãi & voucher
- Tạo chương trình khuyến mãi hoặc mã giảm giá: `POST /api/v1/coupons` (hoặc endpoint khuyến mãi nếu có).
- Đặt điều kiện áp dụng (đơn tối thiểu, danh mục, thời gian hiệu lực, số lần dùng).
- Kiểm tra áp dụng trên giỏ hàng trước khi thanh toán; lưu log sử dụng mã.

### 9. Báo cáo & thống kê
- Doanh thu: `GET /api/v1/reports/sales` theo ngày/tuần/tháng.
- Tồn kho: `GET /api/v1/reports/inventory` để xem hàng sắp hết/hết hạn.
- Khách hàng: `GET /api/v1/reports/customers` để xem top khách, tần suất mua.
- Nhân viên/ca làm việc: `GET /api/v1/reports/employees` để đánh giá hiệu suất.
- Xuất file CSV/PDF/Excel nếu endpoint hỗ trợ; lưu lịch sử tải báo cáo.

### 10. Cấu hình hệ thống
- Cập nhật thông tin cửa hàng (tên, logo, địa chỉ, thuế) trong phần cài đặt.
- Cấu hình phương thức thanh toán và kết nối gateway (nếu có). 
- Thiết lập tỷ lệ thuế VAT mặc định và đánh dấu sản phẩm chịu thuế.
- Bật tính năng sao lưu định kỳ; kiểm tra restore thử trên môi trường dev.
- Kiểm tra log hoạt động để giám sát thay đổi quan trọng.

### 11. Quy trình vận hành định kỳ
- Hàng ngày: kiểm tra tồn kho cảnh báo, đối chiếu doanh thu ca, backup ngắn hạn.
- Hàng tuần: kiểm kê nhanh nhóm hàng bán chạy/chậm, rà soát khuyến mãi, đối chiếu công nợ NCC.
- Hàng tháng: kiểm kê toàn kho, chốt sổ quỹ/nhân viên, xuất báo cáo tài chính và thuế.

### 12. Kiểm thử nhanh (sanity)
- Auth: đăng nhập sai → từ chối; đúng → trả JWT.
- Sản phẩm: tạo mới → xem danh sách → cập nhật → xóa/vô hiệu hóa.
- Kho: nhập + bán → tồn giảm đúng; trả hàng → tồn tăng lại.
- POS: tạo hóa đơn với nhiều phương thức thanh toán → lưu đơn; hủy đơn → tồn phục hồi.
- Báo cáo: gọi các endpoint report trả dữ liệu, không lỗi 5xx.


## Cài đặt
### 2. Cấu hình Database
```bash
# Tạo database
mysql -u root -p
CREATE DATABASE grocery_store;

# Import schema
mysql -u root -p grocery_store < database/schema.sql

# Import dữ liệu mẫu
mysql -u root -p grocery_store < database/data.sql
```

### 3. Cấu hình Backend
Chỉnh sửa file `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/grocery_store
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### 4. Chạy Backend
```bash
cd backend
mvnw spring-boot:run
```
Backend sẽ chạy tại: `http://localhost:8080`

### 5. Chạy Frontend
Mở file `frontend/index.html` bằng trình duyệt hoặc sử dụng web server:
```bash
cd frontend
# Sử dụng Python simple HTTP server
python -m http.server 3000
```
Frontend sẽ chạy tại: `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/register
```

### Products
```
GET    /api/v1/products           # Lấy danh sách sản phẩm
GET    /api/v1/products/{id}      # Lấy chi tiết sản phẩm
POST   /api/v1/products           # Tạo sản phẩm mới
PUT    /api/v1/products/{id}      # Cập nhật sản phẩm
DELETE /api/v1/products/{id}      # Xóa sản phẩm
```

### Categories
```
GET    /api/v1/categories         # Lấy danh sách danh mục
POST   /api/v1/categories         # Tạo danh mục mới
PUT    /api/v1/categories/{id}    # Cập nhật danh mục
DELETE /api/v1/categories/{id}    # Xóa danh mục
```

### Orders
```
GET    /api/v1/orders             # Lấy danh sách đơn hàng
GET    /api/v1/orders/{id}        # Lấy chi tiết đơn hàng
POST   /api/v1/orders             # Tạo đơn hàng mới
PUT    /api/v1/orders/{id}        # Cập nhật đơn hàng
DELETE /api/v1/orders/{id}        # Hủy đơn hàng
```

### Customers
```
GET    /api/v1/customers          # Lấy danh sách khách hàng
GET    /api/v1/customers/{id}     # Lấy chi tiết khách hàng
POST   /api/v1/customers          # Tạo khách hàng mới
PUT    /api/v1/customers/{id}     # Cập nhật khách hàng
DELETE /api/v1/customers/{id}     # Xóa khách hàng
```

### Inventory
```
GET    /api/v1/inventory          # Lấy thông tin tồn kho
POST   /api/v1/inventory/import   # Nhập kho
POST   /api/v1/inventory/export   # Xuất kho
GET    /api/v1/inventory/report   # Báo cáo tồn kho
```

### Reports
```
GET    /api/v1/reports/sales      # Báo cáo doanh thu
GET    /api/v1/reports/inventory  # Báo cáo tồn kho
GET    /api/v1/reports/customers  # Báo cáo khách hàng
GET    /api/v1/reports/employees  # Báo cáo nhân viên
```

## Security

- **Authentication**: JWT Token
- **Authorization**: Role-based access control (RBAC)
- **Password**: BCrypt encryption
- **SQL Injection**: Prepared statements
- **XSS Protection**: Input sanitization

## Testing

```bash
# Chạy unit tests
cd backend
mvnw test

# Chạy integration tests
mvnw verify
```

## Deployment

### Docker (Khuyến nghị)
```bash
# Build Docker image
docker build -t grocery-store-backend ./backend
docker build -t grocery-store-frontend ./frontend

# Run with Docker Compose
docker-compose up -d
```

### Traditional
1. Build backend JAR file
```bash
cd backend
mvnw clean package
```

2. Deploy JAR file to server
```bash
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

3. Deploy frontend files to web server (Nginx, Apache)

## Contributing

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

- **Author**: TuyenPV2004
- **Email**: [your-email@example.com]
- **Project Link**: https://github.com/TuyenPV2004/Grocery-Store-System

## Acknowledgments

- Spring Boot Documentation
- MySQL Documentation
- Bootstrap
- Font Awesome Icons
