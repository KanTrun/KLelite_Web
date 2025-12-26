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
The KLeLite Luxury Bakery E-commerce Platform is a full-stack application designed to provide a seamless online shopping experience for luxury baked goods. It leverages a Node.js/Express.js/TypeScript backend and a React.js/Next.js/TypeScript frontend, with Docker for containerization. The platform includes features such as user authentication, product catalog, shopping cart, order management, and administrative functionalities. Recent developments include the integration of **Flash Sales** and **Stock Reservation** mechanisms to handle limited-time offers.

## Backend Structure
The `backend/` directory contains the Node.js/Express.js application.
-   `src/config/`: Contains configuration files for database connections, JWT secrets, Redis, and other environment-dependent settings. **`redis.ts` has been added for Redis client setup and helper functions.**
-   `src/controllers/`: Houses the request handlers for various API endpoints. **`flashSaleController.ts` has been added to manage flash sale creation, retrieval, updates, deletions, and user-facing actions like stock reservation.**
-   `src/middleware/`: Custom Express middleware (authentication, error handling, request logging).
-   `src/models/`: Defines Mongoose schemas and models for interacting with the MongoDB database. **`FlashSale.ts` and `StockReservation.ts` have been added to define the schemas for flash sales and their associated stock reservations.**
-   `src/routes/`: Groups API endpoints logically. **`flashSaleRoutes.ts` has been added and integrated into `index.ts` to expose flash sale related endpoints.**
-   `src/services/`: Encapsulates business logic, database operations, and external API integrations. **`flashSaleService.ts` handles the core logic for flash sales, including atomic stock management with Redis pipelines and multi-get race condition prevention.**
-   `src/utils/`: Generic utility functions used across the backend.
-   `tests/`: Unit and integration tests for backend components.
-   `.env.example`: Template for environment variables.

**Current Models:**
-   User
-   Product
-   Category
-   Order
-   Review
-   Address
-   Wishlist
-   **FlashSale**
-   **StockReservation**

**Key Controllers:**
-   `authController`
-   `userController`
-   `productController`
-   `categoryController`
-   `orderController`
-   `reviewController`
-   `addressController`
-   `wishlistController`
-   `loyaltyController`
-   `searchController`
-   **`flashSaleController`**

## Frontend Structure
The `frontend/` directory contains the React.js/Next.js application.
-   `public/`: Static assets.
-   `src/api/`: Centralized location for defining API service calls.
-   `src/assets/`: Stores images, fonts, and icons.
-   `src/components/`: Reusable UI components. **`FlashSale` directory has been added, containing `Countdown.tsx`, `FlashSaleCard.tsx`, and `StockIndicator.tsx` to display flash sale information.**
-   `src/contexts/`: React Context API providers.
-   `src/hooks/`: Custom React hooks.
-   `src/layouts/`: Defines main page layouts.
-   `src/pages/`: Page-level components that map to routes in Next.js. **`FlashSale` directory has been added with `index.tsx` (listing) and `FlashSaleDetail.tsx` (individual sale page).**
-   `src/store/`: Redux Toolkit setup.
-   `src/styles/`: Global CSS, variables, and utility classes.
-   `src/types/`: TypeScript type definitions and interfaces. **`flashSale.ts` has been added to define `IFlashSale` and `IStockReservation` interfaces.**
-   `src/utils/`: Frontend utility functions.
-   `tests/`: Unit and integration tests for frontend components.
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
-   **Flash Sales & Promotions** (Implemented with stock reservation, countdowns, and status management)

**Planned Features:**
-   Payment Integration
-   Search Functionality
-   Loyalty Program

## Technology Stack Highlights
-   **Backend:** Node.js, Express.js, TypeScript, MongoDB (Mongoose), JWT, Bcrypt, Multer, **Redis (for caching and flash sale stock management)**.
-   **Frontend:** React.js, Next.js, TypeScript, SCSS Modules, Redux Toolkit, Axios, Framer Motion, React-Helmet-Async, **TanStack Query (for data fetching and caching on flash sales)**.
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
