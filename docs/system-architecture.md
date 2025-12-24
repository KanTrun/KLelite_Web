# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │   Mobile     │  │   Admin      │          │
│  │  (Customer)  │  │  (Future)    │  │   Panel      │          │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘          │
└─────────┼────────────────────────────────────┼──────────────────┘
          │                                    │
          ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React SPA)                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐  │
│  │   Pages    │ │ Components │ │   Redux    │ │  Services   │  │
│  │            │ │            │ │   Store    │ │  (API)      │  │
│  └────────────┘ └────────────┘ └────────────┘ └──────┬──────┘  │
└──────────────────────────────────────────────────────┼──────────┘
                                                       │
                              HTTPS/REST API           │
                                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express API)                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐  │
│  │   Routes   │→│ Middleware │→│ Controllers│→│   Models    │  │
│  │            │ │ (Auth,Err) │ │            │ │ (Mongoose)  │  │
│  └────────────┘ └────────────┘ └────────────┘ └──────┬──────┘  │
└──────────────────────────────────────────────────────┼──────────┘
                                                       │
          ┌────────────────────────────────────────────┼────────┐
          │                                            │        │
          ▼                                            ▼        ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│     MongoDB      │  │    Cloudinary    │  │      Redis       │
│   (Database)     │  │   (Image CDN)    │  │    (Cache)       │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Data Flow

### Customer Purchase Flow
```
1. Browse Products
   Client → GET /api/products → MongoDB → Response

2. Add to Cart
   Client → POST /api/cart/items → Validate → MongoDB → Response

3. Checkout
   Client → POST /api/orders → Validate Stock → Create Order →
   → Process Payment (Stripe) → Update Inventory → Send Email → Response

4. Order Status
   Client → GET /api/orders/:id → MongoDB → Response
```

### Admin Management Flow
```
1. Create Product
   Admin → POST /api/products → Auth Middleware →
   → Upload Image (Cloudinary) → MongoDB → Response

2. Process Order
   Admin → PUT /api/orders/:id/status → Auth Middleware →
   → Update Status → Send Notification → Response
```

## API Structure

### Route Organization
```
/api
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   ├── GET  /me
│   └── POST /forgot-password
│
├── /products
│   ├── GET  /              (list, filter, search)
│   ├── GET  /featured
│   ├── GET  /:slug
│   ├── POST /              [Admin]
│   ├── PUT  /:id           [Admin]
│   └── DELETE /:id         [Admin]
│
├── /categories
│   ├── GET  /
│   ├── POST /              [Admin]
│   ├── PUT  /:id           [Admin]
│   └── DELETE /:id         [Admin]
│
├── /cart
│   ├── GET  /
│   ├── POST /items
│   ├── PUT  /items/:id
│   └── DELETE /items/:id
│
├── /orders
│   ├── GET  /              (user orders)
│   ├── POST /              (create order)
│   ├── PUT  /:id/cancel
│   └── PUT  /:id/status    [Admin]
│
├── /vouchers
│   ├── GET  /
│   ├── POST /validate
│   ├── POST /              [Admin]
│   └── DELETE /:id         [Admin]
│
└── /users
    ├── GET  /profile
    ├── PUT  /profile
    └── GET  /              [Admin]
```

## Database Schema

### Collections Overview
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Users    │────<│   Orders    │>────│  Products   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                                       │
      │                                       │
      ▼                                       ▼
┌─────────────┐                        ┌─────────────┐
│    Carts    │                        │ Categories  │
└─────────────┘                        └─────────────┘
      │
      │
      ▼
┌─────────────┐     ┌─────────────┐
│  Vouchers   │     │  Counters   │
└─────────────┘     └─────────────┘
```

### Key Relationships
- User → Cart (1:1)
- User → Orders (1:many)
- User → Wishlist items (many:many with Products)
- Order → OrderItems → Products
- Product → Category (many:1)
- Product → Reviews (embedded)

### Indexes
- Products: compound index on (category, price, createdAt)
- Orders: compound index on (user, status, createdAt)
- Users: unique index on email
- Categories: unique index on slug
- Products: unique index on slug

## Security Architecture

### Authentication Flow
```
1. Login Request
   POST /api/auth/login → Validate → Generate JWT → Set Cookie

2. Protected Request
   Request → Extract Token → Verify JWT → Attach User → Next

3. Role Authorization
   Request → Check User Role → Allow/Deny
```

### Security Layers
| Layer | Implementation |
|-------|----------------|
| Transport | HTTPS only |
| Headers | helmet middleware |
| Input | mongoSanitize, express-validator |
| Query | Parameter pollution protection (hpp) |
| Rate | express-rate-limit |
| Auth | JWT with HTTP-only cookies |
| CORS | Whitelist configured origins |

## Deployment Architecture

### Production
```
┌──────────────────┐     ┌──────────────────┐
│  Vercel (CDN)    │     │  Cloud Provider  │
│  - Frontend SPA  │────→│  - Backend API   │
│  - Edge caching  │     │  - Node.js       │
└──────────────────┘     └────────┬─────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  MongoDB Atlas   │  │    Cloudinary    │  │   Redis Cloud    │
│  (Database)      │  │   (Media CDN)    │  │   (Cache)        │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Local Development (Docker)
```yaml
services:
  mongodb:   port 27017
  backend:   port 5000
  frontend:  port 3000
  redis:     port 6379
```
