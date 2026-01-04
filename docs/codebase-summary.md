# Codebase Summary - KLeLite Luxury Bakery E-commerce Platform

This document provides an overview of the project's codebase, generated from the `repomix` tool. It aims to give a high-level understanding of the project's structure, key components, and their relationships.

## Table of Contents
- [Project Overview](#project-overview)
- [Backend Structure](#backend-structure)
- [Frontend Structure](#frontend-structure)
- [Key Features Implemented](#key-features-implemented)
- [Technology Stack Highlights](#technology-stack-highlights)
- [Configuration and Environment](#configuration-and-environment)
- [Testing Strategy](#testing-strategy)
- [Documentation and Workflows](#documentation-and-workflows)

---

## Project Overview
The KLeLite Luxury Bakery E-commerce Platform is a full-stack application designed to provide a seamless online shopping experience for luxury baked goods. It leverages a Node.js/Express.js/TypeScript backend and a React.js/Next.js/TypeScript frontend, with Docker for containerization. The platform includes features such as user authentication, product catalog, shopping cart, order management, and administrative functionalities. Recent developments include the integration of **Flash Sales**, **Stock Reservation** mechanisms, and a migration to **MySQL via Prisma** for the primary database.

## Backend Structure
The `backend/` directory contains the Node.js/Express.js application.
-   `prisma/`: Contains Prisma ORM configuration. **`schema.prisma` defines the MySQL database schema.**
-   `src/config/`: Contains configuration files for database connections, JWT secrets, Redis, and other environment-dependent settings. **`database.ts` has been updated to handle MySQL connection via Prisma.**
-   `src/controllers/`: Houses the request handlers for various API endpoints.
-   `src/lib/`: Reusable library instances. **`prisma.ts` provides the global Prisma client instance.**
-   `src/middleware/`: Custom Express middleware (authentication, error handling, request logging).
-   `src/models/`: Defines Mongoose schemas and models (legacy - migrating to Prisma).
-   `src/routes/`: Groups API endpoints.
-   `src/services/`: Encapsulates business logic.
-   `src/queues/`: Task queue management.
-   `src/workers/`: Background task processors.
-   `src/utils/`: Generic utility functions.
-   `tests/`: Unit and integration tests.
-   `.env.example`: Template for environment variables. Updated with `DATABASE_URL`.

**Current Models:**
-   User
-   Product
-   Category
-   Order
-   Review
-   Address
-   Wishlist
-   FlashSale
-   StockReservation
-   **Notification**

**Key Controllers:**
-   `authController`
-   `userController`
-   `productController`
-   `categoryController`
-   `orderController` (Updated to trigger notifications)
-   `reviewController`
-   `addressController`
-   `wishlistController`
-   `loyaltyController`
-   `searchController`
-   `flashSaleController`
-   **`notificationController`**

## Frontend Structure
The `frontend/` directory contains the React.js/Next.js application.
-   `public/`: Static assets.
-   `src/api/`: Centralized location for defining API service calls.
-   `src/assets/`: Stores images, fonts, and icons.
-   `src/components/`: Reusable UI components. **`FlashSale` components, `Notifications` (NotificationBell.tsx), and updated `Header` (Sticky behavior, CSS vars).**
-   `src/contexts/`: React Context API providers.
-   `src/hooks/`: Custom React hooks. **`useNotifications.ts` added for SSE connection and state management.**
-   `src/layouts/`: Defines main page layouts.
-   `src/pages/`: Page-level components. **FlashSale pages added.**
-   `src/store/`: Redux Toolkit setup. **`notificationSlice.ts` added for notification state.**
-   `src/styles/`: Global CSS.
-   `src/types/`: TypeScript definitions. **`notification.ts` added.**
-   `src/utils/`: Frontend utility functions.
-   `tests/`: Unit and integration tests. **`tests/` for frontend added.**
-   `.env.example`: Template for environment variables.

**Key Pages/Features:**
-   Home Page (`/`)
-   Product Listing (`/products`)
-   Product Detail Page (`/products/:id`)
-   Shopping Cart (`/cart`)
-   User Authentication (Login `/login`, Register `/register`)
-   User Profile (`/profile`)
-   Admin Product Management (`/admin/products`)
-   Wishlist (`/wishlist`)
-   **Flash Sale Listing (`/flash-sale`)**
-   **Flash Sale Detail (`/flash-sale/:id`)**

## Key Features Implemented (from `README.md` and recent changes)
-   User Authentication & Authorization
-   Product Catalog
-   Shopping Cart
-   Wishlist
-   Order Management
-   Admin Panel
-   Responsive Design
-   Accessibility (A11y)
-   Animations
-   Skeleton Loading
-   **Flash Sales & Promotions** (Stock reservation, countdowns, status management)
-   **Real-time Notifications** (SSE delivery, Redis Pub/Sub sync, BullMQ email worker, unread tracking)

**Planned Features:**
-   Payment Integration
-   Search Functionality
-   Loyalty Program expansion

## Technology Stack Highlights
-   **Backend:** Node.js, Express.js, TypeScript, **MySQL (via Prisma ORM)**, MongoDB (Legacy/Mongoose), JWT, **Redis (Caching, Flash Sales, Pub/Sub for SSE, BullMQ backing)**, **BullMQ (Task Queue)**.
-   **Frontend:** React.js, Next.js, TypeScript, SCSS Modules, **Redux Toolkit (UI/Notification State)**, **TanStack Query (Server State)**, Framer Motion, SSE.
-   **Containerization:** Docker & Docker Compose.
-   **Linting & Formatting:** ESLint & Prettier.
-   **Scheduling:** `node-cron` for backend tasks.

## Configuration and Environment
-   Environment variables are managed using `.env` files.
-   Docker Compose (`docker-compose.yml`) orchestrates services (backend, frontend, MongoDB, Redis).
-   `backend/src/config/index.ts` now includes Redis configuration.

## Testing Strategy
-   Backend and Frontend both have dedicated `tests/` directories.
-   Uses Jest and React Testing Library for testing.
-   Aims for high test coverage for critical paths.

## Documentation and Workflows
-   `README.md`: Project overview, setup, and general information.
-   `CLAUDE.md`: Guidelines for Claude Code.
-   `.claude/workflows/`: Detailed workflow definitions.
-   `docs/`: Directory for project documentation, including this codebase summary, code standards, project overview, and system architecture.
-   `repomix`: Tool used for generating comprehensive codebase compaction.

---

This summary will be updated as the project evolves.
