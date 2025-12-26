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
  - [3.6. Background Jobs / Task Queue (Implemented for Flash Sales)](#36-background-jobs--task-queue-implemented-for-flash-sales)
  - [3.7. Payment Gateway (Planned)](#37-payment-gateway-planned)
- [4. Data Flow](#4-data-flow)
  - [4.1. User Registration/Login](#41-user-registrationlogin)
  - [4.2. Product Browsing](#42-product-browsing)
  - [4.3. Placing an Order](#43-placing-an-order)
  - [4.4. Flash Sale Stock Reservation](#44-flash-sale-stock-reservation)
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
    Backend --> Database(MongoDB)
    Backend --> Caching[Caching Layer (Redis)]
    Backend --> |API Calls| PaymentGateway(External Payment Gateway)
    Backend --> BackgroundJobs[Background Jobs / Task Queue]

    subgraph Infrastructure
        Database
        Caching
        BackgroundJobs
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
    -   State management (Redux Toolkit, **TanStack Query for server state caching like flash sales**).
    -   Authentication token management (e.g., storing JWTs in HTTP-only cookies).
    -   Ensuring responsive design and accessibility.
    -   Displaying real-time information for flash sales (countdowns, stock indicators).

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
-   **Technology:** Node.js, Express.js, TypeScript, Mongoose (ODM).
-   **Responsibilities:**
    -   Handling API requests from the frontend.
    -   Implementing business logic (e.g., order processing, product management, **flash sale management and stock reservation**).
    -   Interacting with the database (MongoDB).
    -   User authentication and authorization (JWT).
    -   Input validation.
    -   Error handling and logging.
    -   Interfacing with external services (e.g., payment gateways).
    -   **Managing flash sales and loyalty programs.**
-   **Key Modules:**
    -   `controllers`: Handle incoming requests and delegate to services. **Includes `flashSaleController` for flash sale CRUD and user interactions.**
    -   `services`: Contain core business logic, interact with models. **Includes `flashSaleService` for all flash sale related business logic, including Redis interactions for stock.**
    -   `models`: Mongoose schemas defining database document structure. **New models: `FlashSale` and `StockReservation`.**
    -   `middleware`: Custom Express middleware (authentication, error handling).
    -   `routes`: Define API endpoints. **New routes: `flashSaleRoutes`.**

### 3.4. Database Layer

-   **Description:** Persistent storage for application data.
-   **Technology:** MongoDB.
-   **Responsibilities:**
    -   Storing user data, product information, orders, categories, reviews, **flash sale details, and stock reservations**.
    -   Ensuring data integrity and consistency.
    -   Providing efficient data retrieval and storage operations.
    -   Replication for high availability and sharding for scalability (future consideration).
-   **Schema Design:** Uses Mongoose schemas for structured document storage, including `FlashSale` and `StockReservation` with appropriate indexes and TTL for reservations.

### 3.5. Caching Layer (Implemented: Redis)

-   **Description:** Improves performance by storing frequently accessed data in-memory. **Crucially used for real-time flash sale stock management.**
-   **Technology:** Redis (Implemented).
-   **Responsibilities:**
    -   Caching API responses to reduce database load.
    -   Storing session data for faster authentication checks.
    -   Implementing rate limiting.
    -   Managing temporary data like shopping cart contents for guest users.
    -   **Real-time stock reservation and availability tracking for flash sales to prevent overselling.**

### 3.6. Background Jobs / Task Queue (Implemented for Flash Sales)

-   **Description:** Handles long-running or asynchronous tasks outside the main request-response cycle. **Currently used for automated flash sale status updates.**
-   **Technology:** `node-cron` (Implemented).
-   **Responsibilities:**
    -   **Automatically updating flash sale statuses (e.g., from 'upcoming' to 'active', and 'active' to 'completed') based on start/end dates and stock levels.**
    -   (Future) Processing order fulfillment (e.g., sending notifications).
    -   (Future) Generating reports.
    -   (Future) Image processing.
    -   (Future) Email/SMS notifications.
    -   (Future) Loyalty point calculation.
    -   (Future) Cleaning up expired flash sale reservations if not handled by TTL index.

### 3.7. Payment Gateway (Planned)

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
