# KL'élite Luxury Bakery 🍰

Premium bakery e-commerce platform built with React + TypeScript (Frontend) and Node.js + Express + MongoDB (Backend).

## 📁 Project Structure

```
klelite-luxury-bakery/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Node.js + Express + MongoDB
└── docker-compose.yml # Docker configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- MongoDB >= 6.x (local hoặc Atlas)
- npm hoặc yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd klelite-luxury-bakery

# Install Backend dependencies
cd backend
npm install
cp .env.example .env
# Update .env with your configuration

# Install Frontend dependencies
cd ../frontend
npm install
cp .env.example .env.local
```

## 🗃️ Database Setup (MongoDB)

### Option 1: MongoDB Local (Development)

#### Windows
1. Tải MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Cài đặt và chọn "Run as Windows Service"
3. MongoDB sẽ tự chạy trên `localhost:27017`

#### macOS (Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

### Option 2: MongoDB Atlas (Cloud - Miễn phí)
1. Đăng ký tại https://www.mongodb.com/cloud/atlas
2. Tạo cluster miễn phí (M0 Sandbox)
3. Network Access → Whitelist IP: `0.0.0.0/0`
4. Database Access → Tạo user
5. Connect → Get connection string
6. Cập nhật `MONGODB_URI` trong `.env`:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/klelite_bakery
```

### Seed Database (Dữ liệu mẫu)
```bash
cd backend
npx ts-node src/scripts/seed.ts
```

**Kết quả mong đợi:**
```
Connected to MongoDB
Cleared all collections
Created admin user: admin@klelite.com
Created test user: user@test.com
Created 6 categories
Created 3 products
Created 2 vouchers

===========================================
Database seeded successfully!
===========================================

Test credentials:
Admin: admin@klelite.com / admin123
User: user@test.com / user123
```

## 🏃 Running the Application

```bash
# Terminal 1 - Start Backend (port 5000)
cd backend
npx ts-node src/server.ts

# Terminal 2 - Start Frontend (port 5173)
cd frontend
npm run dev
```

## 👀 Xem Database

### MongoDB Compass (GUI - Khuyến nghị)
1. Download: https://www.mongodb.com/try/download/compass
2. Connect: `mongodb://localhost:27017`
3. Chọn database: `klelite_bakery`
4. Xem collections: users, products, categories, orders, carts, vouchers

### MongoDB Shell (Command line)
```bash
mongosh
use klelite_bakery
db.users.find().pretty()
db.products.find().pretty()
db.categories.find().pretty()
```

## 🎨 Features

### Customer Features
- 🏠 Homepage with hero section, featured products, categories
- 🍰 Product listing with filters, search, sorting, pagination
- 🔍 Product detail with image gallery, reviews
- 🛒 Shopping cart with add/remove/update functionality
- 💳 Checkout with shipping and payment
- 👤 User authentication (Login/Register/Reset password)
- ⭐ Product reviews and ratings
- 💝 Wishlist

### Admin Features
- 📊 Dashboard with real-time statistics
- 📦 Product management (CRUD + image upload)
- 📑 Order management (confirm, ship, deliver, cancel)
- 👥 Customer management
- 🏷️ Category management
- 💰 Voucher management

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/logout` | Đăng xuất |
| GET | `/api/auth/me` | Thông tin user hiện tại |
| POST | `/api/auth/forgot-password` | Quên mật khẩu |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Danh sách sản phẩm |
| GET | `/api/products/featured` | Sản phẩm nổi bật |
| GET | `/api/products/:slug` | Chi tiết sản phẩm |
| POST | `/api/products` | [Admin] Tạo sản phẩm |
| PUT | `/api/products/:id` | [Admin] Cập nhật |
| DELETE | `/api/products/:id` | [Admin] Xóa |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Giỏ hàng |
| POST | `/api/cart/items` | Thêm vào giỏ |
| PUT | `/api/cart/items/:id` | Cập nhật số lượng |
| DELETE | `/api/cart/items/:id` | Xóa khỏi giỏ |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Đơn hàng của tôi |
| POST | `/api/orders` | Tạo đơn hàng |
| PUT | `/api/orders/:id/cancel` | Hủy đơn |
| PUT | `/api/orders/:id/status` | [Admin] Cập nhật trạng thái |

## 🧪 Test API với curl

```bash
# Đăng nhập
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@klelite.com","password":"admin123"}'

# Lấy danh sách sản phẩm
curl http://localhost:5000/api/products

# Lấy danh mục
curl http://localhost:5000/api/categories
```

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (Build tool)
- Redux Toolkit (State management)
- React Router v6
- SCSS Modules
- Framer Motion (Animations)

### Backend
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT Authentication
- Cloudinary (Image upload)
- Nodemailer (Emails)

## 📄 License

ISC License
