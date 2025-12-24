# Project Overview - KL'elite Luxury Bakery

## 1. Project Summary

KL'elite Luxury Bakery is a premium e-commerce platform for a luxury bakery business. The platform enables customers to browse, order, and purchase high-end bakery products online while providing administrators with comprehensive tools for inventory, order, and customer management.

## 2. Business Goals

- Establish online presence for premium bakery brand
- Enable seamless e-commerce experience for luxury bakery products
- Provide efficient order management and fulfillment tracking
- Build customer loyalty through user accounts and wishlists
- Support promotional campaigns via voucher system

## 3. Target Users

### Customers
- High-end consumers seeking premium bakery products
- Gift buyers looking for luxury food items
- Regular patrons of the bakery brand

### Administrators
- Store managers handling daily operations
- Inventory managers tracking products and stock
- Marketing staff managing promotions and vouchers

## 4. Key Features

### Customer-Facing
| Feature | Description |
|---------|-------------|
| Product Catalog | Browse products with filtering, search, pagination |
| Product Details | Image gallery, reviews, ratings, nutrition info |
| Shopping Cart | Add/remove items, quantity management |
| Checkout | Shipping address, payment integration (Stripe) |
| User Accounts | Registration, login, profile management |
| Wishlist | Save favorite products for later |
| Reviews | Rate and review purchased products |

### Administrative
| Feature | Description |
|---------|-------------|
| Dashboard | Real-time statistics and analytics |
| Product Management | CRUD operations, image upload via Cloudinary |
| Order Management | Status updates (confirm, ship, deliver, cancel) |
| Customer Management | User overview and management |
| Category Management | Organize product hierarchy |
| Voucher Management | Create and manage discount codes |

## 5. Technical Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| Redux Toolkit | State management |
| React Router v6 | Client-side routing |
| SCSS Modules | Component styling |
| Framer Motion | Animations |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express | Web framework |
| TypeScript | Type safety |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| Cloudinary | Image storage |
| Stripe | Payment processing |
| Nodemailer | Email notifications |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Redis | Caching layer |
| Vercel | Frontend deployment |
| MongoDB Atlas | Cloud database (production) |

## 6. Development Requirements

### Prerequisites
- Node.js >= 18.x
- MongoDB >= 6.x (local or Atlas)
- npm or yarn
- Docker (optional, for containerized setup)

### Environment Variables
Backend requires configuration for:
- MongoDB connection URI
- JWT secret and expiration
- Cloudinary credentials
- Stripe API keys
- Email service credentials

Frontend requires:
- API base URL
- Google OAuth client ID

## 7. Non-Functional Requirements

### Performance
- Lazy loading for routes and components
- Image optimization via Cloudinary
- Redis caching for frequently accessed data
- Compound indexes on MongoDB collections

### Security
- JWT-based authentication
- Role-based access control (user/admin)
- Input sanitization (mongoSanitize)
- HTTP security headers (helmet)
- Rate limiting on API endpoints
- CORS configuration

### Reliability
- Atomic operations for order numbering
- Cascade delete hooks for data integrity
- Global error handling middleware

## 8. Deployment

### Production Architecture
- Frontend: Vercel (static hosting with edge CDN)
- Backend: Cloud provider (Render, Railway, or similar)
- Database: MongoDB Atlas
- Media: Cloudinary CDN

### Development
- Local MongoDB or Docker container
- Backend on port 5000
- Frontend on port 5173 (Vite dev server)
