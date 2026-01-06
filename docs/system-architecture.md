# System Architecture

This document provides a high-level overview of the system architecture for the Klelite Luxury Bakery E-commerce Platform. It describes the main components, their interactions, and the underlying technologies used to build a scalable, reliable, and maintainable application.

## 1. High-Level Overview

The Klelite Luxury Bakery E-commerce Platform follows a multi-tiered architecture, primarily consisting of a client-side frontend (Web and Mobile), a backend API service, and a database layer, complemented by caching, background processing, and real-time notification services.

```mermaid
graph TD
    User((User)) --> |Accesses| WebClient[Web Client (Next.js)]
    User --> |Accesses| MobileClient[Mobile Client (React Native)]

    WebClient --> |API Requests| CDN[CDN]
    MobileClient --> |API Requests| CDN[CDN]
    CDN --> |Routes to| LoadBalancer[Load Balancer]
    LoadBalancer --> BackendAPI[Backend API (Node.js/Express)]

    BackendAPI --> |DB Operations| MySQL(MySQL Database)
    BackendAPI --> |Caching/PubSub| Redis(Redis Cache/PubSub)
    BackendAPI --> |Background Tasks| BullMQ[BullMQ Queue]

    BullMQ --> |Processes Jobs| BackgroundWorkers[Background Workers]
    BackendAPI --> |Sends Events| SSE[SSE (Server-Sent Events)]

    SSE --> |Real-time Updates| WebClient
    SSE --> |Real-time Updates| MobileClient

    Admin((Admin)) --> AdminPanel[Admin Panel (Next.js)]
    AdminPanel --> BackendAPI
```

## 2. Core Components

### 2.1. Client Applications

-   **Web Client (Next.js/React):**
    -   Serves as the primary web interface for customers to browse products, manage their cart, and checkout.
    -   Leverages Next.js for server-side rendering (SSR) and static site generation (SSG) for performance and SEO.
    -   Uses React for building interactive UI components.
    -   State management with Redux Toolkit and data fetching with TanStack Query.
    -   Authentication managed via JWTs, stored securely.
    -   Receives real-time notifications via SSE.
-   **Mobile Client (React Native):**
    -   Provides a native-like experience for iOS and Android users.
    -   Shares a significant portion of business logic and types with the web client (`shared/types`).
    -   Utilizes Redux Toolkit for local state management and API interactions.
    -   Implements dynamic API URL configuration for different environments.
    -   Navigation structured with React Navigation (Shop, Cart flows).
    -   Receives real-time notifications via SSE.
-   **Admin Panel (Next.js/React):**
    -   A separate web application for bakery staff and administrators.
    -   Provides functionalities for managing products, orders, users, flash sales, and loyalty programs.
    -   Secured with role-based access control (RBAC).

### 2.2. Backend Services

-   **Backend API (Node.js/Express):**
    -   Developed with Node.js and the Express.js framework.
    -   Exposes RESTful APIs for all client applications.
    -   Implements business logic for user authentication, product management, cart operations, order processing, flash sales, and loyalty programs.
    -   Uses Prisma ORM for database interactions.
    -   Authentication via JWTs and bcrypt for password hashing.
    -   Includes middleware for authentication, authorization, and validation.
    -   **Key Services:**
        -   `AuthService`: Handles user registration, login, token management.
        -   `UserService`: Manages user profiles and roles.
        -   `ProductService`: Handles product CRUD operations, search, and categorization.
        -   `CartService`: Manages shopping cart state and logic.
        -   `OrderService`: Processes orders, updates status, and manages order history.
        -   `FlashSaleService`: Manages flash sale creation, updates, and stock reservation logic using Redis.
        -   `LoyaltyService`: Manages loyalty points accumulation and redemption.

## 3. Data Layer

-   **MySQL Database:**
    -   The primary relational database used for storing persistent application data, including:
        -   User accounts and profiles
        -   Product information (details, categories, stock)
        -   Order details and history
        -   Cart contents (for logged-in users)
        -   Flash sale configurations and historical data
        -   Loyalty program data
    -   Managed via **Prisma ORM**, providing type-safe database access and automated migrations.
-   **Redis Cache/PubSub:**
    -   Used for high-speed data caching and real-time messaging.
    -   **Flash Sale Stock Management:** Crucial for preventing overselling and handling high concurrency during flash sales. Stores reserved and confirmed stock counts.
    -   **Real-time Notifications (Pub/Sub):** Facilitates broadcasting real-time events across multiple backend instances to clients via SSE.
    -   **Session Management:** Can be used for storing user session data.
    -   **Rate Limiting:** Implemented using Redis to protect critical endpoints.

## 4. Supporting Services

-   **BullMQ Queue:**
    -   A robust job queue for Node.js, backed by Redis.
    -   Used for offloading non-critical, time-consuming tasks from the main API thread.
    -   **Examples:**
        -   Sending email confirmations (order, registration).
        -   Processing loyalty point updates.
        -   Generating reports.
        -   Processing large data imports/exports.
        -   Retrying failed operations.
-   **Background Workers:**
    -   Dedicated processes that consume jobs from the BullMQ queue.
    -   Ensure that the API remains responsive by executing heavy tasks asynchronously.
-   **Server-Sent Events (SSE):**
    -   A technology for real-time, one-way communication from the server to the client over a single HTTP connection.
    -   Used to push real-time notifications to web and mobile clients (e.g., order status updates, flash sale alerts, loyalty point changes).
    -   Leverages Redis Pub/Sub for multi-server synchronization of events.
-   **Google Gemini API:**
    -   Integrated for AI-powered features such as personalized product recommendations and a chatbot for customer support.
    -   Interacts with the Backend API to process requests and deliver AI-driven responses.
-   **Containerization (Docker):**
    -   All services (Backend API, Redis, MySQL, BullMQ workers) are containerized using Docker.
    -   Ensures consistent development, staging, and production environments.
    -   Facilitates easy deployment and scaling.
-   **Load Balancer (Nginx/Cloud Load Balancer):**
    -   Distributes incoming client requests across multiple instances of the Backend API.
    -   Ensures high availability and fault tolerance.
    -   Can also handle SSL termination and static content serving.
-   **Content Delivery Network (CDN):**
    -   Used to cache and deliver static assets (images, CSS, JS) closer to the users.
    -   Improves page load times and reduces origin server load.

## 5. Architectural Characteristics

-   **Scalability:** Designed for horizontal scaling of stateless backend API services and background workers. Database scaling (read replicas, sharding) can be implemented as needed. Redis provides high-performance caching and Pub/Sub.
-   **Reliability:** Redundant backend instances behind a load balancer. BullMQ ensures critical background tasks are processed even if a worker fails. Data backups are crucial.
-   **Maintainability:** Modular codebase, adherence to coding standards, comprehensive documentation, and use of well-established frameworks/libraries.
-   **Security:** JWT-based authentication, RBAC, input validation, HTTPS, environment variable management, and protection against common web vulnerabilities.
-   **Observability:** Integrated logging (Winston), monitoring, and tracing (planned) for system health and performance.

This architecture provides a solid foundation for a performant, reliable, and extensible e-commerce platform.