# Code Standards

This document outlines the coding standards and best practices for the KLeLite Luxury Bakery E-commerce Platform. Adhering to these standards ensures consistency, readability, maintainability, and quality across the entire codebase. These standards align with the `development-rules.md` and provide specific guidelines for implementation.

## Table of Contents
- [General Principles](#general-principles)
- [TypeScript Standards](#typescript-standards)
- [Frontend Standards (React/Next.js)](#frontend-standards-reactnext.js)
  - [Component Design](#component-design)
  - [Styling (SCSS Modules)](#styling-scss-modules)
  - [State Management (Redux Toolkit)](#state-management-redux-toolkit)
  - [Accessibility (A11y)](#accessibility-a11y)
  - [Performance](#performance)
- [Backend Standards (Node.js/Express.js)](#backend-standards-node.jsexpress.js)
  - [API Design](#api-design)
  - [Error Handling](#error-handling)
  - [Validation](#validation)
  - [Database Interactions (Mongoose)](#database-interactions-mongoose)
  - [Authentication & Authorization](#authentication--authorization)
  - [Logging](#logging)
- [Git Commit Standards](#git-commit-standards)
- [File Naming and Structure](#file-naming-and-structure)
- [Security Best Practices](#security-best-practices)
- [Testing Standards](#testing-standards)

---

## General Principles

These principles are derived from the project's `development-rules.md`.
-   **YAGNI (You Ain't Gonna Need It):** Avoid implementing unnecessary features.
-   **KISS (Keep It Simple, Stupid):** Prioritize simple, understandable solutions.
-   **DRY (Don't Repeat Yourself):** Eliminate code duplication through abstraction.
-   **Readability:** Code must be clear, well-formatted, and easy to understand.
-   **Testability:** Design code to be easily testable, and ensure adequate test coverage.
-   **Maintainability:** Write code that is easy to modify and extend.
-   **Performance:** Optimize when necessary, focusing on identified bottlenecks.
-   **Security:** Integrate security best practices from design to deployment.
-   **Scalability:** Design for future growth and increased load.

## TypeScript Standards

-   **Strict Typing:** Enable and adhere to strict TypeScript mode.
-   **Explicit Types:** Use explicit types for function arguments, return values, and complex variables. Avoid `any` where possible.
-   **Interfaces/Types:** Use interfaces for defining object shapes and types for unions, intersections, and primitives.
-   **Enums:** Prefer `const enum` for performance or string enums for better readability in debuggers.
-   **Type Guards:** Use type guards for narrowing types in conditional blocks.
-   **Avoid `as` keyword:** Minimize the use of type assertions (`as Type`) unless absolutely necessary and type safety can be guaranteed.
-   **Consistent Linting:** Ensure ESLint is configured to enforce TypeScript best practices.

## Frontend Standards (React/Next.js)

### Component Design

-   **Functional Components & Hooks:** Prefer functional components and React Hooks for state and lifecycle management.
-   **Single Responsibility Principle:** Each component should ideally do one thing well.
-   **Prop Types/TypeScript Interfaces:** Clearly define component props using TypeScript interfaces.
-   **Decomposition:** Break down complex components into smaller, more manageable sub-components.
-   **Folder Structure:** Organize components logically, often by feature or shared utility.
    ```
    src/components/
    ├── Button/
    │   ├── Button.tsx
    │   ├── Button.module.scss
    │   └── index.ts # Export for easier import
    ├── FlashSale/
    │   ├── Countdown.tsx
    │   ├── StockIndicator.tsx
    │   ├── FlashSaleCard.tsx
    │   └── index.ts
    └── layout/
        ├── Header/
        │   ├── Header.tsx
        │   └── Header.module.scss
        └── Footer/
            ├── Footer.tsx
            └── Footer.module.scss
    ```
-   **Event Handlers:** Name event handlers clearly (e.g., `handleChange`, `handleClick`, `handleSubmit`).
-   **Key Prop:** Always provide a `key` prop for elements in lists.

### Styling (SCSS Modules)

-   **SCSS Modules:** Use `.module.scss` for component-scoped styles to prevent global conflicts.
-   **BEM or SMACSS Principles:** Apply naming conventions like BEM (Block Element Modifier) or SMACSS for class names within SCSS modules for consistency and clarity.
-   **Variables & Mixins:** Utilize SCSS variables for colors, spacing, etc., and mixins for reusable style blocks. Define global variables in `src/styles/abstracts/_variables.scss`.
-   **Responsive Design:** Use media queries within component-specific SCSS modules or global `_breakpoints.scss`.
-   **No Inline Styles:** Avoid inline styles (`style={{...}}`) unless for dynamic, calculated values.

### State Management (Redux Toolkit)

-   **Redux Toolkit:** Use Redux Toolkit for efficient and scalable state management.
-   **Slices:** Organize Redux logic into "slices" for each feature or domain, including reducers, actions, and selectors.
-   **Immutability:** Always update state immutably. Redux Toolkit's `createSlice` handles this automatically with Immer.
-   **Asynchronous Logic:** Use `createAsyncThunk` for handling asynchronous operations (e.g., API calls).
-   **Selectors:** Create memoized selectors (with `reselect` if needed) to derive data from the store, preventing unnecessary re-renders.

### Accessibility (A11y)

-   **Semantic HTML:** Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<article>`, etc.) correctly.
-   **ARIA Attributes:** Employ ARIA attributes (e.g., `aria-label`, `aria-describedby`, `role`) when semantic HTML is insufficient.
-   **Keyboard Navigation:** Ensure all interactive elements are keyboard accessible and have clear focus indicators.
-   **Color Contrast:** Maintain sufficient color contrast for text and interactive elements.
-   **Image Alt Text:** Provide descriptive `alt` text for all meaningful images.
-   **Form Labels:** Associate labels with form controls using `for`/`id` or nesting.

### Performance

-   **Lazy Loading/Code Splitting:** Use `React.lazy` and dynamic imports for route-based or component-based code splitting. Next.js handles this automatically for pages.
-   **Memoization:** Use `React.memo`, `useMemo`, and `useCallback` to prevent unnecessary re-renders of components and recalculations.
-   **Image Optimization:** Optimize images for web (compression, responsive images via `srcset`, WebP format, Next.js `Image` component).
-   **Virtualization:** For long lists, implement virtualization (e.g., `react-window`, `react-virtualized`) to render only visible items.
-   **Data Fetching:** Use efficient data fetching strategies with tools like **TanStack Query** for caching, background revalidation, and error handling for server state.
-   **Minimize Re-renders:** Identify and fix common causes of unnecessary re-renders (e.g., passing new object/array literals as props, context value changes).

## Backend Standards (Node.js/Express.js)

### API Design

-   **RESTful Principles:** Design APIs around resources, using standard HTTP methods (GET, POST, PUT, PATCH, DELETE) appropriately.
-   **Clear Endpoints:** Use meaningful, pluralized resource names for URLs (e.g., `/api/products`, `/api/users`). For flash sales, this includes `/api/v1/flash-sales` and nested routes like `/api/v1/flash-sales/:id/reserve-stock`.
-   **Version Control:** Version APIs (e.g., `/api/v1/products`) to allow for backward compatibility.
-   **Consistent Response Formats:** Use a consistent JSON structure for API responses (e.g., `{ data: ..., message: ..., errors: ... }`).
-   **Pagination, Filtering, Sorting:** Implement these features for list endpoints.
-   **Idempotency:** Ensure PUT/DELETE requests are idempotent.

### Error Handling

-   **Centralized Error Middleware:** Implement a global error handling middleware in Express to catch all unhandled errors and send consistent error responses.
-   **Custom Error Classes:** Create custom error classes (e.g., `AppError`, `NotFoundError`, `BadRequestError`) for specific error scenarios.
-   **Meaningful Error Messages:** Provide clear, user-friendly error messages (avoid leaking sensitive internal details).
-   **HTTP Status Codes:** Use appropriate HTTP status codes (e.g., 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error).
-   **Asynchronous Error Handling:** Wrap async route handlers in a `try-catch` block or use an async error handling library/utility.

### Validation

-   **Joi/Zod:** Use schema validation libraries like Joi or Zod for all incoming request payloads (body, params, query).
-   **Server-Side Validation:** All validation must occur on the server-side, even if client-side validation is also present.
-   **Clear Error Responses:** Return detailed validation error messages to the client, indicating which fields are invalid and why.

### Database Interactions (Mongoose)

-   **Schema Definition:** Clearly define Mongoose schemas with types, validators, and default values. This includes new schemas for `FlashSale` and `StockReservation`.
-   **Indexes:** Create appropriate indexes for frequently queried fields to optimize performance (e.g., `FlashSale.index({ startDate: 1, endDate: 1 })`, `StockReservation.index({ expiresAt: 1 }, { expires: 0 })` for TTL).
-   **Virtuals:** Use Mongoose virtuals for derived properties that are not stored in the database.
-   **Population:** Utilize Mongoose population for fetching related documents efficiently (e.g., populating `product` in `FlashSale`).
-   **Transactions:** Employ MongoDB transactions for operations requiring atomicity across multiple documents or collections, particularly important in stock management scenarios.
-   **Error Handling:** Catch and handle database-specific errors (e.g., validation errors, duplicate key errors).

### Authentication & Authorization

-   **JWT:** Use JSON Web Tokens for stateless authentication.
-   **Bcrypt:** Hash all passwords using a strong hashing algorithm like Bcrypt before storing them.
-   **Secure Token Storage:** Store JWTs securely (e.g., HTTP-only cookies for web, secure storage for mobile).
-   **Role-Based Access Control (RBAC):** Implement middleware to check user roles and permissions for protected routes (e.g., `restrictTo(UserRole.Admin)` for flash sale creation/management).
-   **Rate Limiting:** Protect authentication endpoints (login, register) with rate limiting to prevent brute-force attacks.
-   **Input Sanitization:** Sanitize all user-provided credentials.

### Logging

-   **Winston:** Use Winston for structured and flexible logging.
-   **Log Levels:** Utilize appropriate log levels (debug, info, warn, error) for different types of messages.
-   **Centralized Logging:** Configure logs to be sent to a centralized logging service in production.
-   **Sensitive Data:** Never log sensitive information (passwords, API keys, PII).

## Git Commit Standards

Follow the Conventional Commits specification.
-   **Format:** `<type>(<scope>): <description>`
-   **Types:**
    -   `feat`: A new feature
    -   `fix`: A bug fix
    -   `docs`: Documentation only changes
    -   `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
    -   `refactor`: A code change that neither fixes a bug nor adds a feature
    -   `perf`: A code change that improves performance
    -   `test`: Adding missing tests or correcting existing tests
    -   `build`: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
    -   `ci`: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
    -   `chore`: Other changes that don't modify src or test files
    -   `revert`: Reverts a previous commit
-   **Scope (Optional):** Contextual scope of the commit (e.g., `auth`, `products`, `frontend`, `backend`, `docs`, `flash-sale`).
-   **Description:** Short, imperative, lowercase subject line (max 50 chars).
-   **Body (Optional):** More detailed explanatory text, wrapped at 72 characters.
-   **Footer (Optional):** Reference issues or PRs (e.g., `Closes #123`).

**Example:**
```
feat(flash-sale): implement flash sale functionality

This commit introduces flash sale functionality including:
- Backend models, services, controllers, and routes for flash sales.
- Redis integration for real-time stock reservation to prevent overselling.
- Cron jobs for automatic flash sale status updates.
- Frontend components and pages to display active/upcoming flash sales, countdowns, and stock indicators.

Closes #45
```

## File Naming and Structure

-   **`kebab-case` for directories and most files:** `product-list.tsx`, `user-controller.ts`, `flash-sale.model.ts`
-   **`PascalCase` for React components/pages:** `ProductCard.tsx`, `LoginPage.tsx`, `FlashSalePage.tsx`, `FlashSaleDetail.tsx`
-   **`camelCase` for variables and functions.**
-   **`PascalCase` for classes and interfaces.**
-   **`snake_case` for database fields (if not overridden by ORM/ODM conventions).**
-   **Consistency:** Maintain the established project structure.

## Security Best Practices

-   **OWASP Top 10:** Continuously review and implement mitigations for common web application security risks.
-   **Dependency Scanning:** Regularly update dependencies and scan for vulnerabilities using tools like `npm audit`.
-   **Environment Variables:** Store all sensitive information (API keys, database credentials, JWT secrets) in environment variables. Never hardcode them.
-   **Input Validation & Sanitization:** Validate and sanitize all user inputs on the server-side to prevent injection attacks (SQL, XSS, NoSQL).
-   **Authentication & Authorization:**
    -   Use strong, salted password hashing (Bcrypt).
    -   Implement rate limiting on login attempts.
    -   Enforce proper role-based access control.
    -   Use secure JWT practices (short expiry, refresh tokens, HTTP-only cookies).
-   **CORS:** Properly configure CORS headers to restrict access to trusted origins.
-   **HTTPS:** Enforce HTTPS for all communication in production.
-   **Helmet:** Use Helmet.js for Express to set various HTTP headers for security.

## Testing Standards

-   **Frameworks:** Jest for unit/integration tests, React Testing Library for React components.
-   **Location:** Tests should reside in a `tests/` directory within the respective `backend/` or `frontend/` project, mirroring the `src/` directory structure.
-   **Naming:** Test files should follow `*.test.ts` or `*.spec.ts` conventions.
-   **Coverage:** Aim for high test coverage, particularly for critical business logic and complex components.
-   **Meaningful Tests:** Tests should be clear, concise, and test a single, well-defined piece of functionality.
-   **Arrange-Act-Assert (AAA):** Structure tests using the AAA pattern.
-   **Mocking:** Use Jest's mocking capabilities to isolate units under test and manage external dependencies (e.g., database calls, API requests, Redis interactions).

By strictly following these code standards, we ensure a high-quality, maintainable, and secure e-commerce platform.
