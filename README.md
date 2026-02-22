# 🔗 BioLink - Trang Bio cá nhân (như heylink.me)

## Cấu trúc dự án

```
biolink/
├── backend/                 # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── index.js         # Entry point
│   │   ├── models/Profile.js
│   │   ├── routes/auth.js
│   │   ├── routes/profile.js
│   │   └── middleware/auth.js
│   ├── .env                 # ⚠️ Cấu hình MongoDB & JWT
│   └── package.json
└── frontend/
    ├── public/index.html    # Trang bio công khai
    └── admin/
        ├── index.html       # Trang đăng nhập admin
        ├── dashboard.html   # Bảng điều khiển admin
        └── dashboard.css
```

## 🚀 Cài đặt và chạy

### 1. Cài dependencies backend

```bash
cd backend
npm install
```

### 2. Cấu hình `.env`

```env
PORT=5000
MONGODB_URI=mongodb://your-mongodb-uri/biolink
JWT_SECRET=your_secret_key_here
FRONTEND_URL=https://your-domain.com
```

### 3. Khởi động backend

```bash
npm run dev   # development
npm start     # production
```

### 4. Deploy frontend

Copy thư mục `frontend/` lên hosting của bạn.

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Tạo tài khoản (chỉ lần đầu) |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/change-password` | Đổi mật khẩu *(cần token)* |

### Public
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/profile/:username` | Xem trang bio công khai |
| POST | `/api/profile/:username/click/:linkId` | Track click |

### Admin *(cần Bearer Token)*
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/profile/admin/me` | Lấy thông tin đầy đủ |
| PUT | `/api/profile/admin/info` | Cập nhật bio, tên |
| PUT | `/api/profile/admin/theme` | Cập nhật giao diện |
| POST | `/api/profile/admin/upload/avatar` | Upload avatar |
| POST | `/api/profile/admin/links` | Thêm link |
| PUT | `/api/profile/admin/links/:id` | Sửa link |
| DELETE | `/api/profile/admin/links/:id` | Xóa link |
| PUT | `/api/profile/admin/socials` | Cập nhật mạng xã hội |
| GET | `/api/profile/admin/stats` | Thống kê |

---

## 🌍 Deploy với Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    root /var/www/biolink/frontend;
    index public/index.html;

    location / {
        try_files /public$uri /public$uri/ /public/index.html;
    }

    location /admin {
        alias /var/www/biolink/frontend/admin;
        try_files $uri $uri/ /admin/index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Uploaded files
    location /uploads {
        proxy_pass http://localhost:5000;
    }
}
```

## 🔧 Sử dụng

1. Truy cập `https://yourdomain.com/admin/` để đăng nhập
2. Lần đầu chọn tab **"Tạo tài khoản"**
3. Sau khi đăng nhập vào Dashboard:
   - **Hồ sơ**: Cập nhật tên, bio, ảnh đại diện
   - **Links**: Thêm/sửa/xóa các đường dẫn
   - **Mạng xã hội**: Thêm link Facebook, Instagram...
   - **Giao diện**: Chọn theme, tuỳ chỉnh màu sắc
4. Trang bio công khai: `https://yourdomain.com/username`

## ✨ Tính năng

- 🎨 **8 preset themes** + tùy chỉnh màu sắc đầy đủ
- 🔗 **Quản lý links** với icon picker, bật/tắt từng link
- 📱 **Mạng xã hội**: 12 nền tảng phổ biến
- 📊 **Thống kê**: Lượt xem, lượt click theo link
- 🖼️ **Upload ảnh** đại diện
- 📐 **4 kiểu nút**: Rounded, Pill, Square, Glassmorphism
- ✨ **Hiệu ứng animation** tắt/bật
- 📱 **Responsive** hoàn toàn
- 🔐 **Bảo mật JWT**
