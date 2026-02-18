# Cấu trúc Frontend - Grocery Store Management System

## Tổng quan thay đổi

Đã tái cấu trúc frontend theo module nghiệp vụ để dễ dàng quản lý và mở rộng. Các module chính bao gồm:

### Auth Module
- **Login**: Đăng nhập hệ thống
- **ForgotPassword**: Quên mật khẩu
- **Services**: login(), logout(), register(), getCurrentUser(), forgotPassword(), resetPassword()

### Product Module
- **ProductList**: Danh sách sản phẩm với CRUD operations
- **Category**: Quản lý danh mục sản phẩm
- **Services**: 
  - Products: getProductList(), getProductDetail(), addProduct(), updateProduct(), deleteProduct()
  - Categories: getCategoryList(), addCategory(), updateCategory(), deleteCategory()

### Order Module
- **Order**: Quản lý đơn hàng, tạo đơn mới
- **Services**: getOrderList(), getOrderDetail(), createOrder(), updateOrderStatus(), cancelOrder(), deleteOrder(), getOrderStatistics()

### System Module
- **User**: Quản lý nhân viên
- **Setting**: Cài đặt hệ thống
- **Services**: getUserList(), getUserDetail(), addUser(), updateUser(), deleteUser(), changePassword(), updateUserStatus()

### Dashboard Module
- **Dashboard**: Trang chủ với thống kê doanh thu, đơn hàng, khách hàng

## Các trang còn lại từ cấu trúc cũ

- `Home/`: Trang chủ hiện tại (có thể thay thế bằng Dashboard)
- `Access/`: Trang kiểm tra quyền truy cập

## Hướng dẫn sử dụng

### Import Services

```typescript
// Import auth service
import { login, logout, getCurrentUser } from '@/services/auth';

// Import product service
import { getProductList, addProduct } from '@/services/product';

// Import order service
import { createOrder, getOrderList } from '@/services/order';

// Import user service
import { getUserList, addUser } from '@/services/user';
```

### Sử dụng trong Component

```typescript
import React, { useEffect, useState } from 'react';
import { getProductList } from '@/services/product';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const response = await getProductList({
      current: 1,
      pageSize: 10,
    });
    if (response.success) {
      setProducts(response.data);
    }
  };

  return <div>{/* Render products */}</div>;
};
```

## Lưu ý

1. **Folder `demo/`**: Vẫn giữ lại để tham khảo, có thể xóa sau khi hoàn thiện
2. **API Endpoints**: Các endpoint trong services cần điều chỉnh theo backend thực tế
3. **Type Definitions**: Đã tạo sẵn các type definitions cơ bản, cần bổ sung theo yêu cầu
4. **Components**: CreateForm và UpdateForm trong ProductList có thể tái sử dụng cho các module khác

## Roadmap tiếp theo

- [ ] Triển khai đầy đủ các form trong từng module
- [ ] Kết nối thực tế với Backend APIs
- [ ] Xây dựng các components dùng chung (Table, Form, Modal)
- [ ] Thêm state management (Redux/MobX) nếu cần
- [ ] Xử lý authentication và authorization
- [ ] Thêm unit tests cho services
