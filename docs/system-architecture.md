# System Architecture - KLeLite Luxury Bakery E-commerce Platform

## Table of Contents
- [1. Introduction](#1-introduction)
- [2. High-Level Architecture Diagram](#2-high-level-architecture-diagram)
- [3. Component Breakdown](#3-component-breakdown)
  - [3.1. Client Layer](#31-client-layer)
  - [3.2. API Gateway / Reverse Proxy (Planned: Nginx)](#32-api-gateway--reverse-proxy-planned-nginx)
  - [3.3. Backend Services (Node.js/Express.js)](#33-backend-services-node.jsexpress.js)
  - [3.4. Database Layer](#34-database-layer)
  - [3.5. Caching Layer (Implemented: Redis)](#35-caching-layer-implemented-redis)
  - [3.6. Background Jobs / Task Queue (Implemented: BullMQ)](#36-background-jobs--task-queue-implemented-bullmq)
  - [3.7. Notification & Real-time System (Implemented: SSE & Redis Pub/Sub)](#37-notification--real-time-system-implemented-sse--redis-pubsub)
  - [3.8. Payment Gateway (Planned)](#38-payment-gateway-planned)
- [4. Data Flow](#4-data-flow)
  - [4.1. User Registration/Login](#41-user-registrationlogin)
  - [4.2. Product Browsing](#42-product-browsing)
  - [4.3. Placing an Order](#43-placing-an-order)
  - [4.4. Flash Sale Stock Reservation](#44-flash-sale-stock-reservation)
  - [4.5. Real-time Notifications](#45-real-time-notifications)
- [5. Deployment Strategy](#5-deployment-strategy)
- [6. Security Considerations](#6-security-considerations)
- [7. Scalability Considerations](#7-scalability-considerations)
- [8. Future Enhancements](#8-future-enhancements)

---

## 1. Introduction

This document details the system architecture for the KLeLite Luxury Bakery E-commerce Platform. It describes the various components, their interactions, and the underlying technologies that power the application. The architecture is designed to be scalable, secure, and maintainable, supporting a rich user experience for customers and efficient management for administrators. Recent updates include the integration of **Flash Sales** functionality with real-time stock reservation and automated status updates.

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    User(Customer/Admin) --> |HTTP/HTTPS| Frontend[Frontend Application (Next.js/React)]
    Frontend --> |HTTP/HTTPS API Calls| API_Gateway[API Gateway / Reverse Proxy (Nginx)]
    API_Gateway --> Backend[Backend Services (Node.js/Express.js)]
    Backend --> Database(MySQL via Prisma)
    Backend --> LegacyDB(MongoDB - Migrating)
    Backend --> Caching[Caching Layer (Redis)]
    Backend --> |API Calls| PaymentGateway(External Payment Gateway)
    Backend --> BackgroundJobs[Background Jobs / Task Queue (BullMQ)]
    Backend --> RealTime[Real-time Notifications (SSE)]
    RealTime <--> RedisPubSub[Redis Pub/Sub]

    subgraph Infrastructure
        Database
        Caching
        BackgroundJobs
        RedisPubSub
        PaymentGateway
    end

    style User fill:#a2e0ff,stroke:#333,stroke-width:2px,color:#000
    style Frontend fill:#cceeff,stroke:#333,stroke-width:2px,color:#000
    style API_Gateway fill:#e0ffc2,stroke:#333,stroke-width:2px,color:#000
    style Backend fill:#ffe0a2,stroke:#333,stroke-width:2px,color:#000
    style Database fill:#ffccdd,stroke:#333,stroke-width:2px,color:#000
    style Caching fill:#ddccff,stroke:#333,stroke-width:2px,color:#000
    style PaymentGateway fill:#c2ffe0,stroke:#333,stroke-width:2px,color:#000
    style BackgroundJobs fill:#fffacc,stroke:#333,stroke-width:2px,color:#000
```

## 3. Component Breakdown

### 3.1. Client Layer

-   **Description:** The user-facing web application.
-   **Technology:** Next.js (React.js, TypeScript, SCSS Modules).
-   **Responsibilities:**
    -   Rendering UI components and pages.
    -   Handling user interactions.
    -   Making API requests to the backend.
    -   Client-side routing.
    - State management (Redux Toolkit, **TanStack Query for server state**, **Redux Slices for UI/Notification state**).
    - Authentication token management (e.g., storing JWTs in HTTP-only cookies).
    - Ensuring responsive design and accessibility.
    - Displaying real-time information for flash sales (countdowns, stock indicators) and **instant notifications (NotificationBell, Toast)**.

### 3.2. API Gateway / Reverse Proxy (Planned: Nginx)

-   **Description:** An entry point for all client requests, routing them to appropriate backend services.
-   **Technology:** Nginx (planned).
-   **Responsibilities:**
    -   Load balancing across multiple backend instances.
    -   SSL/TLS termination.
    -   Request routing and proxying.
    -   Security (WAF, rate limiting - can be configured in Nginx or backend).
    -   Caching of static assets or API responses.
    -   Serving static frontend files in production.

### 3.3. Backend Services (Node.js/Express.js)

-   **Description:** The core business logic and data manipulation layer.
-   **Technology:** Node.js, Express.js, TypeScript, **Prisma (ORM for MySQL)**, Mongoose (Legacy).
-   **Responsibilities:**
    -   Handling API requests from the frontend.
    -   Implementing business logic (e.g., order processing, product management, **flash sale management, stock reservation, and real-time notifications**).
    -   Interacting with the primary database (MySQL).
    -   User authentication and authorization (JWT).
    -   Input validation.
    -   Error handling and logging.
    -   Interfacing with external services (e.g., payment gateways, **email providers via BullMQ workers**).
    -   **Managing flash sales, loyalty programs, and notification delivery.**
-   **Key Modules:**
    -   `controllers`: Handle incoming requests and delegate to services. **Includes `flashSaleController` and `notificationController`.**
    -   `services`: Contain core business logic, interact with models. **Includes `flashSaleService`, `notificationService`, and `sseService`.**
    -   `lib`: Library instances. **Includes `prisma.ts` for the database client.**
    -   `models`: Prisma models (primary) and Mongoose schemas (legacy/specialized).
    -   `middleware`: Custom Express middleware (authentication, error handling).
    -   `routes`: Define API endpoints. **New routes: `flashSaleRoutes` and `notificationRoutes`.**
    -   `workers`: Background task processors. **Includes `emailWorker` for async email delivery.**
    -   `queues`: Task queue management. **Includes `emailQueue` and `notificationQueue` using BullMQ.**

### 3.4. Database Layer

-   **Description:** Persistent storage for application data.
-   **Technology:** **MySQL (Primary, accessed via Prisma)**, MongoDB (Legacy/Specialized).
-   **Responsibilities:**
    -   Storing user data, product information, orders, categories, reviews, **flash sale details, stock reservations, and user notifications**.
    -   Ensuring data integrity and consistency.
    -   Providing efficient data retrieval and storage operations.
    -   Replication for high availability and sharding for scalability (future consideration).
-   **Schema Design:** Uses Prisma Schema for structured MySQL storage, ensuring type safety and easy migrations. Mongoose is maintained for legacy compatibility or specific document-oriented data needs.

### 3.5. Caching Layer (Implemented: Redis)

-   **Description:** Improves performance by storing frequently accessed data in-memory. **Crucially used for real-time flash sale stock management.**
-   **Technology:** Redis (Implemented).
-   **Responsibilities:**
    -   Caching API responses to reduce database load.
    -   Storing session data for faster authentication checks.
    -   Implementing rate limiting.
    -   Managing temporary data like shopping cart contents for guest users.
    -   **Real-time stock reservation and availability tracking for flash sales to prevent overselling.**
    -   **Redis Pub/Sub for cross-server real-time notification broadcasting.**
    -   **Backing store for BullMQ asynchronous task queues.**

### 3.6. Background Jobs / Task Queue (Implemented: BullMQ)

-   **Description:** Handles long-running or asynchronous tasks outside the main request-response cycle.
-   **Technology:** `node-cron` and `BullMQ` (Redis-backed).
-   **Responsibilities:**
    -   **Automated Status Updates:** `node-cron` handles flash sale status transitions.
    -   **Asynchronous Email Delivery:** `BullMQ` processes email sending via dedicated workers to prevent blocking the API.
    -   **Notification Processing:** Offloads heavy notification logic (e.g., batch creation) to background workers.
    -   (Future) Image processing and complex report generation.

### 3.7. Notification & Real-time System (Implemented: SSE & Redis Pub/Sub)

-   **Description:** Delivers instant updates to connected clients.
-   **Technology:** Server-Sent Events (SSE) for client-server communication, Redis Pub/Sub for server-to-server synchronization.
-   **Responsibilities:**
    -   **Push Notifications:** Sending instant alerts for order status changes, points earned, or promotional alerts.
    -   **Multi-server Support:** Ensuring users receive notifications regardless of which backend instance they are connected to.
    -   **Connection Management:** Tracking active SSE connections and cleaning up on disconnect.
    -   **Unread Tracking:** Synchronizing unread counts between the database and the frontend UI.

### 3.8. Payment Gateway (Planned)

-   **Description:** External service for processing financial transactions.
-   **Technology:** (e.g., SePay, Stripe, PayPal).
-   **Responsibilities:**
    -   Securely handling credit card and other payment methods.
    -   Processing transactions and returning results to the backend.
    -   Compliance with PCI DSS standards.

## 4. Data Flow

### 4.1. User Registration/Login

1.  **Frontend:** User submits credentials to the Next.js application.
2.  **API Gateway:** Routes the request to the Backend.
3.  **Backend (Auth Controller):**
    -   Validates input.
    -   Hashes password (for registration) or compares hash (for login).
    -   Interacts with MongoDB to save/retrieve user.
    -   Generates a JWT token.
    -   Sends JWT (e.g., in an HTTP-only cookie) back to the Frontend.
4.  **Frontend:** Stores the JWT securely and updates UI.

### 4.2. Product Browsing

1.  **Frontend:** Requests product list/details from the API. For flash sales, `TanStack Query` fetches data and manages caching.
2.  **API Gateway:** Routes the request to the Backend.
3.  **Backend (Product Controller/Service or Flash Sale Service):**
    -   Checks Caching Layer (Redis) for cached product data or flash sale availability.
    -   If not cached, fetches data from MongoDB.
    -   Caches data in Redis for subsequent requests (e.g., flash sale stock).
    -   Returns product/flash sale data to the Frontend.
4.  **Frontend:** Displays products/flash sales with relevant information (e.g., countdown, stock).

### 4.3. Placing an Order

1.  **Frontend:** User confirms cart contents and shipping details, submits payment. This may involve flash sale items with prior stock reservation.
2.  **API Gateway:** Routes the request to the Backend.
3.  **Backend (Order Controller/Service):**
    -   Validates cart items and user details.
    -   **(For Flash Sale items):** Confirms existing stock reservation, or initiates a new one.
    -   (Planned) Interacts with Payment Gateway to process payment.
    -   Updates product stock in MongoDB and **updates `soldStock` for flash sales.**
    -   Creates a new order document in MongoDB.
    -   (Future) Sends order confirmation to Background Jobs for email notification.
    -   Returns order confirmation to the Frontend.
4.  **Frontend:** Displays order confirmation.

### 4.4. Flash Sale Stock Reservation

1.  **Frontend:** User attempts to add a flash sale item to cart.
2.  **API Gateway:** Routes `POST /api/v1/flash-sales/:id/reserve` to Backend.
3.  **Backend (Flash Sale Controller/Service):**
    -   **Rate Limiting:** Checks user quota (5 requests/minute).
    -   **Validation:** Validates request (sale active, quantity positive, user authenticated).
    -   **Atomic Check:** Uses Redis `MGET` to fetch `confirmed` and `reserved` counts for the user to prevent race conditions during purchase limit checks.
    -   **Atomic Stock Decrement:** Interacts with **Redis** to decrement available stock (`flash:saleId:product:productId:stock`).
    -   **Rollback:** If Redis stock goes negative, increments it back and throws 'sold out' error.
    -   **Atomic User Update:** Increments `reserved` count in Redis for the user.
    -   **Persistence:** Creates a `StockReservation` document in MongoDB with an `expiresAt` field (5 minutes expiry).
    -   **Response:** Returns reservation details to Frontend.
4.  **Frontend:** User proceeds to checkout with reserved item.
5.  **Payment Success (Confirm Reservation):**
    -   Frontend calls `POST /api/v1/flash-sales/:id/confirm-reservation/:reservationId`. (Note: Currently handled by `confirmReservation` in service)
    -   **Atomic Pipeline:** Uses Redis `pipeline` to atomically move stock from `reserved` to `confirmed` status in Redis.
    -   **Database Sync:** Updates reservation status to 'completed' and increments `soldCount` in `FlashSale` in MongoDB.
6.  **Payment Failure/Expiration (Release Reservation):**
    -   Handled via `releaseReservation` API or `cleanupExpiredReservations` cron.
    -   Increments available stock in **Redis** and decrements user's `reserved` count.
    -   Updates reservation status to 'expired' or 'cancelled'.

### 4.5. Real-time Notifications

1.  **Event Trigger:** A backend service (e.g., `orderService`) triggers a notification event (e.g., order status update).
2.  **Notification Creation:** `notificationService.create()` saves the notification to MongoDB.
3.  **Broadcasting:**
    -   `sseService.publish()` publishes the notification to a **Redis Pub/Sub** channel ('notifications').
    -   All active backend instances listening to this channel receive the message.
4.  **Delivery:**
    -   Each instance checks if the target `userId` has an active SSE connection on its node.
    -   If connected, the instance pushes the data to the client over the SSE stream.
5.  **UI Update:**
    -   Frontend `useNotifications` hook receives the event.
    -   Redux state is updated, and `NotificationBell` displays the unread count/new notification instantly.

## 5. Deployment Strategy

-   **Containerization:** Both frontend and backend applications are Dockerized. MongoDB and Redis also run as Docker containers in development.
-   **Docker Compose:** Used for local development to orchestrate multi-container application setup.
-   **Production (Future):**
    -   Frontend: Could be deployed as a Next.js standalone application on a server or a serverless platform (e.g., Vercel, AWS Amplify) or served via Nginx.
    -   Backend: Deployed to cloud VMs (e.g., GCP Compute Engine, AWS EC2) or container orchestration services (e.g., Kubernetes, Cloud Run). Multiple instances behind Nginx for load balancing.
    -   Database: Managed MongoDB service (e.g., MongoDB Atlas) for reliability and scalability.
    -   Caching: Managed Redis service (e.g., AWS ElastiCache, GCP Memorystore).

## 6. Security Considerations

-   **HTTPS:** All communication must be encrypted in transit.
-   **Authentication & Authorization:** JWTs, HTTP-only cookies, role-based access control (e.g., for admin flash sale management).
-   **Input Validation:** Strict validation on all backend inputs.
-   **Database Security:** Least privilege principle for database access, data encryption at rest.
-   **Secret Management:** Environment variables for sensitive keys, not hardcoded.
-   **Rate Limiting:** Protect against brute-force attacks and abuse.
-   **CORS:** Properly configured for trusted origins.

## 7. Scalability Considerations

-   **Stateless Backend:** Backend services are designed to be stateless to facilitate horizontal scaling.
-   **Load Balancing:** Nginx will distribute traffic across multiple backend instances.
-   **Database Sharding/Replication:** MongoDB's capabilities for replication sets (high availability) and sharding (horizontal scaling) will be considered for high load.
-   **Caching:** Redis reduces the load on the database and is critical for managing concurrent flash sale stock.
-   **Asynchronous Processing:** Background jobs offload heavy tasks from the main API process (e.g., cron jobs for status updates).

## 8. Future Enhancements

-   **Microservices Architecture:** As the platform grows, specific domains (e.g., payment, search, notifications, flash sales) could be extracted into independent microservices.
-   **Event-Driven Architecture:** Introduce a message broker (e.g., RabbitMQ, Kafka) for asynchronous communication between services.
-   **Advanced Analytics:** Integration with analytics platforms for business intelligence.
-   **CDN Integration:** Content Delivery Network for faster delivery of static assets.
-   **Serverless Functions:** For specific, event-driven tasks.
