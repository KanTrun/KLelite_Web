# KL'élite Luxury Bakery - Backend API

API server cho ứng dụng thương mại điện tử bánh ngọt cao cấp.

## Công nghệ sử dụng

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL + Prisma ORM
- **Authentication**: JWT (Access + Refresh Token)
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Payment**: Stripe (planned)

## Cài đặt

### Yêu cầu
- Node.js 18+
- MySQL 8+
- npm hoặc yarn

### Bước 1: Cài đặt dependencies

```bash
npm install
```

### Bước 2: Cấu hình môi trường

Copy file `.env.example` thành `.env` và điền các giá trị:

```bash
cp .env.example .env
```

Các biến môi trường cần thiết:
- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Secret key cho access token
- `JWT_REFRESH_SECRET`: Secret key cho refresh token
- `CLOUDINARY_*`: Thông tin Cloudinary account
- `SMTP_*`: Thông tin SMTP server

### Bước 3: Chạy Prisma migrations

```bash
npx prisma migrate dev
```

### Bước 4: Seed dữ liệu mẫu

```bash
npx prisma db seed
```

### Bước 5: Chạy server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database (warning: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database
npx prisma db seed
```

## API Endpoints

### Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/auth/register | Đăng ký |
| POST | /api/auth/login | Đăng nhập |
| POST | /api/auth/logout | Đăng xuất |
| POST | /api/auth/refresh-token | Làm mới token |
| GET | /api/auth/me | Lấy thông tin user hiện tại |
| GET | /api/auth/verify-email/:token | Xác thực email |
| POST | /api/auth/forgot-password | Quên mật khẩu |
| POST | /api/auth/reset-password/:token | Đặt lại mật khẩu |
| PUT | /api/auth/update-password | Cập nhật mật khẩu |

### Products
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/products | Danh sách sản phẩm |
| GET | /api/products/featured | Sản phẩm nổi bật |
| GET | /api/products/new | Sản phẩm mới |
| GET | /api/products/bestsellers | Sản phẩm bán chạy |
| GET | /api/products/:slug | Chi tiết sản phẩm (theo slug) |
| GET | /api/products/id/:id | Chi tiết sản phẩm (theo ID) |
| POST | /api/products | Tạo sản phẩm (Admin) |
| PUT | /api/products/:id | Cập nhật sản phẩm (Admin) |
| DELETE | /api/products/:id | Xóa sản phẩm (Admin) |
| POST | /api/products/:id/images | Upload ảnh sản phẩm (Admin) |
| DELETE | /api/products/:id/images/:imageId | Xóa ảnh sản phẩm (Admin) |
| GET | /api/products/:id/reviews | Đánh giá sản phẩm |
| POST | /api/products/:id/reviews | Thêm đánh giá |

### Categories
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/categories | Danh sách danh mục |
| GET | /api/categories/:slug | Chi tiết danh mục |
| POST | /api/categories | Tạo danh mục (Admin) |
| PUT | /api/categories/:id | Cập nhật danh mục (Admin) |
| DELETE | /api/categories/:id | Xóa danh mục (Admin) |

### Cart
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/cart | Lấy giỏ hàng |
| POST | /api/cart/items | Thêm vào giỏ hàng |
| PUT | /api/cart/items/:itemId | Cập nhật số lượng |
| DELETE | /api/cart/items/:itemId | Xóa khỏi giỏ hàng |
| DELETE | /api/cart | Xóa giỏ hàng |
| POST | /api/cart/sync | Đồng bộ giỏ hàng |

### Orders
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/orders | Danh sách đơn hàng của user |
| GET | /api/orders/:id | Chi tiết đơn hàng |
| POST | /api/orders | Tạo đơn hàng |
| PUT | /api/orders/:id/cancel | Hủy đơn hàng |
| GET | /api/orders/admin/all | Tất cả đơn hàng (Admin) |
| GET | /api/orders/admin/stats | Thống kê (Admin) |
| PUT | /api/orders/:id/status | Cập nhật trạng thái (Admin) |
| PUT | /api/orders/:id/payment | Cập nhật thanh toán (Admin) |

### Users
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/users/profile | Lấy profile |
| PUT | /api/users/profile | Cập nhật profile |
| PUT | /api/users/avatar | Cập nhật avatar |
| POST | /api/users/addresses | Thêm địa chỉ |
| PUT | /api/users/addresses/:id | Cập nhật địa chỉ |
| DELETE | /api/users/addresses/:id | Xóa địa chỉ |
| GET | /api/users/wishlist | Danh sách yêu thích |
| POST | /api/users/wishlist/:productId | Thêm vào yêu thích |
| DELETE | /api/users/wishlist/:productId | Xóa khỏi yêu thích |

### Vouchers
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/vouchers/validate | Kiểm tra mã voucher |
| GET | /api/vouchers/available | Danh sách voucher khả dụng |
| GET | /api/vouchers | Tất cả voucher (Admin) |
| POST | /api/vouchers | Tạo voucher (Admin) |
| PUT | /api/vouchers/:id | Cập nhật voucher (Admin) |
| DELETE | /api/vouchers/:id | Xóa voucher (Admin) |

## Cấu trúc thư mục

```
src/
├── config/         # Cấu hình (database, cloudinary, etc.)
├── controllers/    # Request handlers
├── middleware/     # Custom middleware
├── models/         # Mongoose schemas
├── routes/         # API routes
├── scripts/        # Seed scripts
├── types/          # TypeScript types
├── utils/          # Helper functions
└── server.ts       # Entry point
```

## Test credentials

Sau khi chạy `npm run seed`:

- **Admin**: admin@klelite.com / admin123
- **User**: user@test.com / user123

## Scripts

```bash
npm run dev          # Development mode với hot reload
npm run build        # Build TypeScript
npm start            # Production mode
npm run lint         # Kiểm tra linting
npm run lint:fix     # Sửa lỗi linting
npm run seed         # Seed tất cả dữ liệu
npm run seed:categories # Chỉ seed categories
npm run seed:products   # Chỉ seed products
```

## License

ISC © KL'élite Team
