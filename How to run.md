# 🏪 Hướng Dẫn Chạy Dự Án Quản Lý Cửa Hàng Tạp Hóa

## 📋 Yêu Cầu Hệ Thống

## 🗄️ Cấu Hình Cơ Sở Dữ Liệu

### 1. Tạo Database

Mở MySQL và chạy lệnh:

```sql
CREATE DATABASE grocery_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Kiểm Tra Cấu Hình Kết Nối

Mở file `backend/src/main/resources/application.properties` và đảm bảo các thông tin:

```properties
# Địa chỉ database (mặc định)
spring.datasource.url=jdbc:mysql://localhost:3306/grocery_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC

# Username MySQL (mặc định)
spring.datasource.username=root

# Password MySQL (thay đổi nếu cần)
spring.datasource.password=123456
```

Nếu cấu hình MySQL khác, hãy cập nhật giá trị tương ứng.

---

## 🚀 Chạy Backend

### Cách 1: Sử dụng Maven (Được Khuyên Dùng)

Mở PowerShell/Terminal, di chuyển vào thư mục `backend`:

```bash
cd backend

# Cài đặt dependencies và chạy ứng dụng
mvn spring-boot:run
```

### Cách 2: Sử dụng Maven Wrapper

```bash
cd backend
./mvnw.cmd spring-boot:run
```

### Cách 3: Build JAR và Chạy

```bash
cd backend

# Build dự án
mvn clean package

# Chạy JAR file
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Kiểm Tra Backend Đã Chạy

Nếu thành công, bạn sẽ thấy:
- Ứng dụng chạy trên `http://localhost:8080`
- Console sẽ hiển thị: `Tomcat started on port(s): 8080`

---

## 💻 Chạy Frontend

### Mở Terminal Mới

Mở PowerShell/Terminal mới, di chuyển vào thư mục `frontend`:

```bash
cd frontend
```

### Cài Đặt Dependencies

```bash
# Sử dụng npm (khuyên dùng)
npm install

# Hoặc sử dụng yarn
yarn install
```

### Chạy Ứng Dụng Development

```bash
# Sử dụng npm
npm run dev

# Hoặc sử dụng yarn
yarn dev

# Hoặc
npm start
```

### Kiểm Tra Frontend Đã Chạy

Nếu thành công:
- Ứng dụng chạy trên `http://localhost:8000` hoặc tương tự
- Console sẽ hiển thị link để truy cập
- Tự động mở trình duyệt (hoặc bạn có thể mở thủ công)

---

## 🔐 Cấu Hình JWT (Tùy Chọn)

Nếu muốn sử dụng JWT token khác với mặc định, hãy cập nhật trong `application.properties`:

```properties
# JWT Secret Key (nên thay đổi trong production)
jwt.secret.key=your_super_secret_key_that_is_at_least_256_bits_long_change_this_in_production_environment_12345

# JWT Expiration (ms) - 24 giờ
jwt.expiration=86400000
```

**Lưu ý:** Luôn sử dụng JWT secret key mạnh trong môi trường production.

---

## 🌐 CORS Configuration

Frontend và Backend đã được cấu hình CORS để giao tiếp:

```properties
spring.web.cors.allowed-origins=http://localhost:3000,http://localhost:4000
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
spring.web.cors.allow-credentials=true
```

Nếu frontend chạy trên port khác, hãy thêm port đó vào `allowed-origins`.

---

## 📱 Truy Cập Ứng Dụng

### Backend API
- **URL**: `http://localhost:8080`
- **Swagger/API Docs** (nếu có): `http://localhost:8080/swagger-ui.html`

### Frontend
- **URL**: `http://localhost:3000` hoặc `http://localhost:8000`

---

## 🔧 Troubleshooting

### Backend không khởi động

**Lỗi**: `Connection refused` hoặc `Communications link failure`
- **Nguyên nhân**: MySQL chưa chạy hoặc cấu hình sai
- **Giải pháp**:
  1. Kiểm tra MySQL đã khởi động: `mysql -u root -p`
  2. Kiểm tra database tồn tại: `SHOW DATABASES;`
  3. Kiểm tra lại `application.properties`

**Lỗi**: `Port 8080 already in use`
- **Giải pháp**: 
  - Đóng ứng dụng khác đang sử dụng port 8080
  - Hoặc thay đổi port trong `application.properties`: `server.port=8081`

### Frontend không khởi động

**Lỗi**: `npm: not found` hoặc `Node not found`
- **Giải pháp**: Cài đặt Node.js từ https://nodejs.org

**Lỗi**: `Port 3000 already in use`
- **Giải pháp**: Đóng ứng dụng khác hoặc thay đổi port trong `.env` hoặc cấu hình Umi

### Lỗi Dependencies

```bash
# Xóa node_modules và package-lock
rm -r node_modules package-lock.json

# Cài đặt lại
npm install
```

---

## 📚 Cấu Trúc Dự Án

```
Grocery Store Management System/
├── backend/                 # Spring Boot Backend
│   ├── src/
│   ├── pom.xml
│   └── mvnw
├── frontend/               # React Frontend (Umi Max)
│   ├── src/
│   ├── package.json
│   └── README.md
├── ARCHITECTURE.md         # Kiến trúc dự án
├── STRUCTURE.md           # Cấu trúc thư mục
└── RUN_GUIDE.md          # Hướng dẫn này
```

---

## ✅ Kiểm Tra Kết Nối

### 1. Kiểm Tra Backend

Mở trình duyệt hoặc Postman, gửi request:

```
GET http://localhost:8080/
```

### 2. Kiểm Tra Frontend

Truy cập: `http://localhost:3000`

### 3. Kiểm Tra Database

```bash
mysql -u root -p
mysql> USE grocery_db;
mysql> SHOW TABLES;
```

---

## 🛑 Dừng Ứng Dụng

- **Backend**: Nhấn `Ctrl + C` trong terminal backend
- **Frontend**: Nhấn `Ctrl + C` trong terminal frontend
- **MySQL**: Sử dụng Service Manager hoặc command line

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra các file: `HELP.md`, `JWT_SETUP_GUIDE.md`, `ARCHITECTURE.md`
2. Kiểm tra console logs
3. Xem phần Troubleshooting ở trên

---

## 🎉 Hoàn Tất!

Nếu cả backend và frontend đều chạy thành công, bạn đã sẵn sàng phát triển dự án!

**Happy Coding!** 🚀
