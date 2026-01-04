# Project Overview and Product Development Requirements (PDR) - KLeLite Luxury Bakery E-commerce Platform

## Table of Contents
- [1. Introduction](#1-introduction)
- [2. Project Goals](#2-project-goals)
- [3. Target Audience](#3-target-audience)
- [4. Functional Requirements](#4-functional-requirements)
  - [4.1. User Management](#41-user-management)
  - [4.2. Product Catalog](#42-product-catalog)
  - [4.3. Shopping Cart & Checkout](#43-shopping-cart--checkout)
  - [4.4. Order Management](#44-order-management)
  - [4.5. Wishlist](#45-wishlist)
  - [4.6. Reviews & Ratings](#46-reviews--ratings)
  - [4.7. Admin Panel](#47-admin-panel)
  - [4.8. Search & Filtering (Planned)](#48-search--filtering-planned)
  - [4.9. Flash Sales & Promotions (Implemented)](#49-flash-sales--promotions-implemented)
  - [4.10. Loyalty Program (Planned)](#410-loyalty-program-planned)
  - [4.11. Real-time Notifications (Implemented)](#411-real-time-notifications-implemented)
- [5. Non-Functional Requirements](#5-non-functional-requirements)
  - [5.1. Performance](#51-performance)
  - [5.2. Security](#52-security)
  - [5.3. Scalability](#53-scalability)
  - [5.4. Usability & Accessibility](#54-usability--accessibility)
  - [5.5. Maintainability](#55-maintainability)
  - [5.6. Deployment](#56-deployment)
- [6. Technical Stack](#6-technical-stack)
  - [6.1. Backend](#61-backend)
  - [6.2. Frontend](#62-frontend)
  - [6.3. Infrastructure](#63-infrastructure)
- [7. Architectural Decisions](#7-architectural-decisions)
- [8. Development Phases & Roadmap](#8-development-phases--roadmap)
- [9. Open Questions / Future Considerations](#9-open-questions--future-considerations)

---

## 1. Introduction

This document outlines the Project Overview and Product Development Requirements (PDR) for the KLeLite Luxury Bakery E-commerce Platform. The platform aims to provide a premium online experience for customers to browse, select, and purchase luxury baked goods. This PDR serves as a guiding document for development, ensuring all features align with business objectives and technical standards.

## 2. Project Goals

-   **Establish Online Presence:** Create a robust and visually appealing online store for KLeLite Luxury Bakery.
-   **Increase Sales & Reach:** Expand customer base beyond physical locations.
-   **Streamline Ordering Process:** Provide an intuitive and efficient purchasing journey.
-   **Enhance Customer Experience:** Offer features like wishlists, order tracking, and personalized recommendations (future).
-   **Efficient Management:** Enable bakery staff to easily manage products, orders, and customer data.

## 3. Target Audience

-   **Customers:** Individuals looking for high-quality, luxury baked goods, often for special occasions or gifts. They expect a smooth, secure, and aesthetically pleasing shopping experience.
-   **Admins (Bakery Staff):** Employees responsible for managing the e-commerce operations, including product updates, order fulfillment, and customer support. They require an intuitive and powerful administrative interface.

## 4. Functional Requirements

### 4.1. User Management
-   **REQ-UM-1:** Users must be able to register for a new account with email, password, and name.
    -   *Acceptance Criteria:* Successful registration creates a user profile and issues an authentication token.
-   **REQ-UM-2:** Users must be able to log in with their registered credentials.
    -   *Acceptance Criteria:* Successful login provides an authentication token for subsequent requests.
-   **REQ-UM-3:** Users must be able to view and update their profile information (name, email, password).
    -   *Acceptance Criteria:* Profile updates reflect immediately and securely.
-   **REQ-UM-4:** Users must be able to manage multiple shipping addresses.
    -   *Acceptance Criteria:* Users can add, edit, and delete addresses.
-   **REQ-UM-5:** System must support role-based authorization (Customer, Admin).
    -   *Acceptance Criteria:* Admin users have access to administrative functionalities, while customers do not.

### 4.2. Product Catalog
-   **REQ-PC-1:** Customers must be able to browse all available products.
    -   *Acceptance Criteria:* Products are displayed with images, names, prices, and brief descriptions.
-   **REQ-PC-2:** Customers must be able to view detailed information for each product.
    -   *Acceptance Criteria:* Product detail page includes multiple images, full description, ingredients, pricing, availability, and customer reviews.
-   **REQ-PC-3:** Products can be organized into categories (e.g., Cakes, Pastries, Breads).
    -   *Acceptance Criteria:* Customers can filter products by category.
-   **REQ-PC-4:** Products must have stock management.
    -   *Acceptance Criteria:* Products show "In Stock" or "Out of Stock" status. Quantity available is updated after purchase.

### 4.3. Shopping Cart & Checkout
-   **REQ-SC-1:** Customers must be able to add products to a shopping cart.
    -   *Acceptance Criteria:* Adding an item updates the cart summary.
-   **REQ-SC-2:** Customers must be able to update quantities of items in the cart.
    -   *Acceptance Criteria:* Cart total recalculates automatically.
-   **REQ-SC-3:** Customers must be able to remove items from the cart.
    -   *Acceptance Criteria:* Cart total updates upon removal.
-   **REQ-SC-4:** The shopping cart content must be persistent across sessions for logged-in users.
    -   *Acceptance Criteria:* Items remain in cart even after closing and reopening the browser.
-   **REQ-SC-5:** Customers must be able to proceed to checkout from the cart.
    -   *Acceptance Criteria:* Checkout process guides user through shipping address, payment, and order confirmation.
-   **REQ-SC-6:** (Planned) Customers must be able to select a shipping address from their saved addresses or add a new one during checkout.
-   **REQ-SC-7:** (Planned) Integrate with a secure payment gateway (e.g., SePay, Stripe) for processing payments.
    -   *Acceptance Criteria:* Successful payment confirms the order and triggers order creation.

### 4.4. Order Management
-   **REQ-OM-1:** Customers must be able to view their order history.
    -   *Acceptance Criteria:* Order history lists past orders with status and summary.
-   **REQ-OM-2:** Customers must be able to view detailed information for a specific order.
    -   *Acceptance Criteria:* Order detail page shows items, quantities, total, shipping address, and current status.
-   **REQ-OM-3:** Admin users must be able to update order statuses (e.g., Pending, Processing, Shipped, Delivered, Cancelled).
    -   *Acceptance Criteria:* Status updates are reflected for both admin and customer views.

### 4.5. Wishlist
-   **REQ-WL-1:** Logged-in users must be able to add products to a wishlist.
    -   *Acceptance Criteria:* Products are saved to a personalized wishlist.
-   **REQ-WL-2:** Users must be able to view their wishlist.
    -   *Acceptance Criteria:* Wishlist displays saved products with option to move to cart.
-   **REQ-WL-3:** Users must be able to remove products from their wishlist.

### 4.6. Reviews & Ratings
-   **REQ-RR-1:** Logged-in customers must be able to submit text reviews and star ratings for purchased products.
    -   *Acceptance Criteria:* Reviews are associated with the product and the submitting user.
-   **REQ-RR-2:** Customers must be able to view aggregated star ratings and individual reviews on product detail pages.
    -   *Acceptance Criteria:* Average rating and list of reviews are displayed.
-   **REQ-RR-3:** Admin users must be able to moderate (approve/reject/delete) customer reviews.

### 4.7. Admin Panel
-   **REQ-AP-1:** Admin users must have a dedicated administrative dashboard.
    -   *Acceptance Criteria:* Dashboard provides an overview of orders, products, and users.
-   **REQ-AP-2:** Admin users must be able to create, read, update, and delete (CRUD) products.
    -   *Acceptance Criteria:* Full control over product catalog content and details.
-   **REQ-AP-3:** Admin users must be able to CRUD product categories.
-   **REQ-AP-4:** Admin users must be able to view and manage all customer orders.
-   **REQ-AP-5:** Admin users must be able to manage user accounts (e.g., view, block, change roles).
-   **REQ-AP-6:** Admin users must be able to manage promotions and discounts (if applicable).

### 4.8. Search & Filtering (Planned)
-   **REQ-SF-1:** Customers must be able to search for products by keywords.
-   **REQ-SF-2:** Customers must be able to filter products by price range, category, and other attributes.

### 4.9. Flash Sales & Promotions (Implemented)
-   **REQ-FS-1:** Admin users must be able to create and manage flash sales for specific products or categories, defining discount percentages, start/end dates, and allocated stock.
    -   *Acceptance Criteria:* Flash sales are created, updated, and deleted via an admin interface. Overlapping sales for the same product are prevented.
-   **REQ-FS-2:** The system must automatically update flash sale statuses (upcoming, active, completed) based on start/end dates and stock availability.
    -   *Acceptance Criteria:* A cron job runs regularly to synchronize sale statuses.
-   **REQ-FS-3:** During an active flash sale, customers should see discounted prices, a countdown timer, and a stock indicator.
    -   *Acceptance Criteria:* Frontend displays real-time sale information and remaining stock.
-   **REQ-FS-4:** Implement a robust stock reservation mechanism for flash sale products using Redis to prevent overselling and manage concurrent purchases.
    -   *Acceptance Criteria:*
        - Atomic stock decrement in Redis.
        - Race condition prevention using atomic `MGET` for user limits.
        - Rate limiting on reservation attempts (5 requests per minute per user).
        - Redis pipelines for atomic confirmation operations (moving from reserved to confirmed keys).
-   **REQ-FS-5:** Users must be able to reserve, confirm, and cancel stock for flash sale items.
    -   *Acceptance Criteria:* API endpoints exist for these actions, and frontend integrates them into the checkout flow.

### 4.10. Loyalty Program (Planned)
-   **REQ-LP-1:** Customers earn loyalty points for purchases.
-   **REQ-LP-2:** Customers can redeem loyalty points for discounts or exclusive products.
-   **REQ-LP-3:** Admin users can manage loyalty program rules and customer points.

### 4.11. Real-time Notifications (Implemented)
-   **REQ-NOTI-1:** Users must receive instant notifications for critical events (order status updates, points earned).
    -   *Acceptance Criteria:* Notifications appear in real-time without page refresh using SSE.
-   **REQ-NOTI-2:** The system must support multi-server environments for real-time delivery.
    -   *Acceptance Criteria:* Redis Pub/Sub synchronizes notification broadcasting across all backend instances.
-   **REQ-NOTI-3:** Users must be able to view their notification history and mark them as read.
    -   *Acceptance Criteria:* NotificationBell displays unread count; dropdown shows recent notifications with 'read' status toggle.
-   **REQ-NOTI-4:** System must offload notification and email processing to background tasks.
    -   *Acceptance Criteria:* BullMQ handles email workers and notification queues to ensure API responsiveness.
-   **REQ-NOTI-5:** Unread counts must be persistent and synchronized across devices.
    -   *Acceptance Criteria:* Database stores notification status, and frontend fetches/updates state via API and SSE.

## 5. Non-Functional Requirements

### 5.1. Performance
-   **NFR-PERF-1:** Page load times should be under 3 seconds on a typical broadband connection.
-   **NFR-PERF-2:** API response times for critical operations (login, add to cart, checkout) should be under 500ms.
-   **NFR-PERF-3:** Frontend rendering should be smooth, utilizing skeleton loaders and lazy loading where appropriate. **Caching with Redis and `TanStack Query` on the frontend improve performance for flash sale data.**

### 5.2. Security
-   **NFR-SEC-1:** All sensitive data (passwords, payment info) must be encrypted at rest and in transit (HTTPS).
-   **NFR-SEC-2:** Application must be protected against common web vulnerabilities (OWASP Top 10) including XSS, CSRF, SQL/NoSQL injection.
-   **NFR-SEC-3:** User authentication tokens (JWTs) must be securely generated, stored (HTTP-only cookies), and validated.
-   **NFR-SEC-4:** Implement rate limiting on critical endpoints (login, registration, password reset) to prevent brute-force attacks.

### 5.3. Scalability
-   **NFR-SCL-1:** The backend should be designed to scale horizontally to handle increased user load.
-   **NFR-SCL-2:** Database operations should be optimized with indexing and efficient queries.
-   **NFR-SCL-3:** Utilize caching mechanisms (e.g., Redis) to reduce database load. **Redis is now actively used for flash sale stock management, contributing to scalability.**

### 5.4. Usability & Accessibility
-   **NFR-USA-1:** The user interface must be intuitive and easy to navigate for all user types.
-   **NFR-USA-2:** The platform must be fully responsive, adapting to various screen sizes (desktop, tablet, mobile).
-   **NFR-USA-3:** The application must adhere to WCAG 2.1 AA accessibility guidelines, including keyboard navigation and screen reader compatibility.

### 5.5. Maintainability
-   **NFR-MNT-1:** Codebase must be well-documented and follow established coding standards (`code-standards.md`).
-   **NFR-MNT-2:** A clear project structure and separation of concerns must be maintained.
-   **NFR-MNT-3:** Automated tests (unit, integration) must be in place for critical functionalities.

### 5.6. Deployment
-   **NFR-DPL-1:** The application should be containerized using Docker for consistent development and production environments.
-   **NFR-DPL-2:** A CI/CD pipeline (future) should automate testing and deployment processes.

## 6. Technical Stack

### 6.1. Backend
-   **Language:** TypeScript
-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Database:** **MySQL (Primary, via Prisma)**, MongoDB (Legacy/Mongoose)
-   **ORM/Database Client:** **Prisma**
-   **Authentication:** JWT, Bcrypt
-   **File Uploads:** Multer
-   **Validation:** Joi/Zod
-   **Caching/Session/PubSub:** **Redis (Flash Sale stock, SSE broadcasting, BullMQ backing)**
-   **Task Queue:** **BullMQ (Email delivery, background jobs)**
-   **Logging:** Winston
-   **Scheduling:** **`node-cron` (Flash Sale status updates)**

### 6.2. Frontend
-   **Language:** TypeScript
-   **Library/Framework:** React.js, Next.js
-   **Styling:** SCSS Modules
-   **State Management:** Redux Toolkit (UI/Notification State)
-   **HTTP Client:** Axios
-   **Animations:** Framer Motion
-   **Data Fetching:** **TanStack Query (Flash Sale/Server state)**
-   **Real-time:** **Server-Sent Events (SSE)**

### 6.3. Infrastructure
-   **Containerization:** Docker, Docker Compose
-   **Reverse Proxy/Load Balancer:** Nginx (Planned)
-   **Cloud Provider:** (To be determined)

## 7. Architectural Decisions

-   **Monolithic (initially) with modular design:** Start with a well-structured monolithic architecture to allow for rapid development, with clear separation of concerns to enable future migration to microservices if needed.
-   **API-first approach:** Design backend APIs before frontend implementation to ensure a clear contract between services.
-   **Database:** **MySQL** chosen for its relational structure and strong consistency, managed via **Prisma** for type-safe database access and automated migrations. MongoDB is maintained for legacy compatibility and specialized document storage.
-   **Frontend Framework:** Next.js for SSR/SSG benefits, performance, and developer experience.
-   **Containerization:** Docker for consistent environments and simplified deployment.
-   **Redis for Flash Sale Stock:** Employ Redis for real-time, high-performance stock management during flash sales to prevent overselling and handle high concurrency.

## 8. Development Phases & Roadmap

-   **Phase 01: Core Foundation** (Completed/In Progress)
    -   User Authentication (Registration, Login, Profile)
    -   Product Catalog (CRUD products, categories)
    -   Shopping Cart (Add, Update, Remove items)
    -   Basic Order Placement
    -   Initial UI/UX setup
    -   Accessibility & Animations integration
    -   Skeleton Loading
-   **Phase 02: Enhancements** (Current Focus)
    -   Wishlist functionality
    -   Product Reviews & Ratings
    -   Address Management
    -   Admin Panel improvements
    -   Refine error handling and logging
-   **Phase 03: Payment & Search** (Future)
    -   Payment Gateway Integration
    -   Advanced Search & Filtering
-   **Phase 04: Flash Sales & Promotions** (Implemented)
    -   Flash Sale creation and management (Admin)
    -   Stock reservation and management for flash sales (Backend with Redis)
    -   Automatic flash sale status updates (Cron Jobs)
    -   Frontend display of flash sales with countdowns and stock indicators
-   **Phase 05: Loyalty Program & Personalization** (Future)
    -   Loyalty points system
    -   Personalized recommendations
    -   User segmentation for marketing
-   **Phase 06: Admin Interface & Management System** (Completed)
    -   Comprehensive Dashboard
    -   Detailed Management for Orders, Products, Users
-   **Phase 07: Real-time Notifications & Background Tasks** (Completed)
    -   Real-time SSE Notifications
    -   Redis Pub/Sub multi-server synchronization
    -   BullMQ task queue for emails and async jobs
    -   NotificationBell UI component & unread tracking
-   **Phase 08: Loyalty Program & Personalization** (Future)

## 9. Open Questions / Future Considerations

-   Specific payment gateway provider (Stripe, SePay, etc.).
-   Cloud provider for deployment (AWS, GCP, Azure).
-   Detailed analytics and reporting requirements.
-   Integration with external marketing tools.
-   Plan for internationalization/localization.
