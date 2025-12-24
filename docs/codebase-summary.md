# Codebase Summary

## Directory Structure

```
klelite-luxury-bakery/
├── backend/                 # Node.js + Express API
│   └── src/
│       ├── config/          # Environment and DB configuration
│       ├── controllers/     # Request handlers
│       ├── middleware/      # Auth, error handling, async wrapper
│       ├── models/          # Mongoose schemas
│       ├── routes/          # API endpoint definitions
│       ├── scripts/         # Database seeding
│       ├── types/           # TypeScript interfaces
│       ├── utils/           # Helpers and error classes
│       └── server.ts        # Application entry point
│
├── frontend/                # React + TypeScript SPA
│   └── src/
│       ├── components/      # Reusable UI components
│       │   ├── common/      # Button, Input, Loading, ProductCard
│       │   └── layout/      # Header, Footer
│       ├── hooks/           # Custom React hooks
│       ├── pages/           # View components by feature
│       │   ├── Home/
│       │   ├── Products/
│       │   ├── Auth/
│       │   ├── Admin/
│       │   └── Manager/
│       ├── routes/          # Route definitions and guards
│       ├── services/        # API client and service layer
│       ├── store/           # Redux store and slices
│       ├── styles/          # Global SCSS (variables, mixins)
│       ├── types/           # TypeScript interfaces
│       ├── utils/           # Formatters, validators, constants
│       └── App.tsx          # Root component
│
└── docker-compose.yml       # Container orchestration
```

## Backend Key Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Express app setup, middleware, DB connection |
| `src/config/index.ts` | Environment variables and settings |
| `src/config/database.ts` | MongoDB connection logic |
| `src/routes/index.ts` | Route aggregator |
| `src/middleware/auth.ts` | JWT verification, role authorization |
| `src/middleware/errorHandler.ts` | Global error catching |
| `src/utils/asyncHandler.ts` | Async/await wrapper |
| `src/utils/AppError.ts` | Custom error class |

## Backend Models

| Model | Description |
|-------|-------------|
| User | Authentication, roles, wishlist, addresses |
| Product | Catalog items, sizes, nutrition, reviews, stock |
| Order | Order lifecycle, shipping, payment status |
| Cart | User shopping cart items |
| Category | Product classification hierarchy |
| Voucher | Discount codes and rules |
| Counter | Sequential ID generation (order numbers) |

## Frontend Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Provider hierarchy, layout wrapper |
| `src/routes/index.tsx` | Route definitions with lazy loading |
| `src/routes/PrivateRoute.tsx` | Auth-required route guard |
| `src/routes/AdminRoute.tsx` | Admin role route guard |
| `src/services/api.ts` | Axios instance with interceptors |
| `src/store/index.ts` | Redux store configuration |

## Frontend State (Redux Slices)

| Slice | Purpose |
|-------|---------|
| authSlice | User authentication state |
| cartSlice | Shopping cart items |
| productSlice | Product catalog state |
| uiSlice | UI state (modals, loading) |

## Component Pattern

Each component follows this structure:
```
ComponentName/
├── ComponentName.tsx        # Logic and JSX
├── ComponentName.module.scss # Scoped styles
└── index.ts                 # Export
```

## Dependencies

### Backend
- express, cors, helmet, express-rate-limit
- mongoose, mongodb
- jsonwebtoken, bcryptjs
- cloudinary, multer
- stripe
- nodemailer

### Frontend
- react, react-dom, react-router-dom
- @reduxjs/toolkit, react-redux
- axios
- formik, yup
- framer-motion
- swiper
- recharts (admin charts)
