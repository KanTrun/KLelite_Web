# Code Standards and Guidelines

This document outlines the coding standards, best practices, and guidelines to be followed across the Klelite Luxury Bakery E-commerce Platform project. Adhering to these standards ensures code consistency, readability, maintainability, and quality.

## 1. General Principles

-   **Readability:** Code should be easy to read and understand by anyone on the team.
-   **Maintainability:** Code should be easy to modify, debug, and extend.
-   **Consistency:** Follow established patterns and styles throughout the codebase.
-   **DRY (Don't Repeat Yourself):** Avoid redundant code. Abstract common logic into reusable components or functions.
-   **KISS (Keep It Simple, Stupid):** Favor simple, straightforward solutions over complex ones.
-   **YAGNI (You Ain't Gonna Need It):** Do not add functionality until it's actually required.
-   **Testability:** Write code that is easy to test.
-   **Performance:** Optimize for performance where critical, but prioritize readability and maintainability first.

## 2. Naming Conventions

Consistent naming makes code easier to read and understand.

-   **Variables:** `camelCase` (e.g., `userName`, `productId`).
-   **Functions/Methods:** `camelCase` (e.g., `getUserData`, `calculateTotalPrice`).
-   **Classes/Interfaces/Types:** `PascalCase` (e.g., `UserInterface`, `ProductModel`, `ShoppingCart`).
-   **Constants:** `SCREAMING_SNAKE_CASE` (e.g., `API_BASE_URL`, `MAX_RETRIES`).
-   **Files:** `kebab-case` for components, modules, and utilities (e.g., `user-list.tsx`, `api-service.ts`, `date-utils.ts`). Use `index.ts` for barrel files.
-   **Folders:** `kebab-case` (e.g., `components`, `services`, `utils`).

## 3. Formatting

We use ESLint and Prettier to enforce consistent code formatting. All developers should configure their IDEs to use these tools for automatic formatting on save.

-   **Indentation:** 2 spaces (no tabs).
-   **Line Length:** Max 120 characters per line.
-   **Quotes:** Single quotes for strings (`'string'`).
-   **Semicolons:** Always use semicolons at the end of statements.
-   **Trailing Commas:** Use trailing commas where appropriate (e.g., in objects, arrays, function calls).
-   **Braces:** K&R style (opening brace on the same line).

```typescript
// Good
if (condition) {
  // ...
}

// Bad
if (condition)
{
  // ...
}
```

## 4. TypeScript Specific Guidelines

-   **Type Annotations:** Explicitly type function parameters, return values, and complex variables. Leverage type inference where it makes sense for simple cases.
-   **Interfaces vs. Types:**
    -   Use `interface` for defining object shapes and `class` implementations.
    -   Use `type` for aliases, unions, intersections, and mapped types.
-   **Enums:** Use `const enum` for performance benefits, or union types for string enums.
-   **Any Type:** Avoid `any` as much as possible. Use `unknown` if you truly don't know the type and perform type narrowing.
-   **Strict Null Checks:** Enable `strictNullChecks` in `tsconfig.json`.

## 5. JavaScript/TypeScript Best Practices

### 5.1. Imports

-   **Order:**
    1.  Third-party libraries (e.g., `react`, `redux`).
    2.  Project-level shared modules (e.g., `src/shared`).
    3.  Relative imports.
-   **Absolute Imports:** Prefer absolute imports where possible (configured via `tsconfig.json` `baseUrl` or webpack aliases) to avoid long relative paths.
-   **Destructuring:** Destructure imports where only specific exports are needed.

```typescript
import React from 'react';
import { useSelector } from 'react-redux';
import { Product } from '@/shared/types/product';
import { getApiBaseUrl } from '../config/api';
```

### 5.2. Functions

-   **Pure Functions:** Prefer pure functions that produce the same output for the same input and have no side effects.
-   **Arrow Functions:** Use arrow functions for anonymous functions and when `this` context binding is important.
-   **Avoid Nested Callbacks:** Use `async/await` for asynchronous operations to improve readability and avoid "callback hell."
-   **Single Responsibility Principle (SRP):** Each function should do one thing and do it well.

### 5.3. Error Handling

-   **Explicit Error Handling:** Handle errors gracefully. Don't suppress errors.
-   **Try-Catch:** Use `try-catch` blocks for synchronous error handling.
-   **Async/Await with Try-Catch:** Wrap `await` calls in `try-catch` blocks for asynchronous error handling.
-   **Custom Error Classes:** Create custom error classes for domain-specific errors.
-   **Logging:** Log errors with sufficient context (stack trace, relevant data).

### 5.4. Comments

-   **Why, Not What:** Comments should explain *why* a piece of code exists or its complex logic, rather than *what* it does (which should be clear from the code itself).
-   **JSDoc:** Use JSDoc for functions, classes, and complex types to provide comprehensive documentation that IDEs can leverage.
-   **TODO/FIXME:** Use `// TODO:` for future tasks and `// FIXME:` for identified bugs that need resolution.

## 6. Frontend Specific Guidelines (React/Next.js)

### 6.1. Component Structure

-   **Functional Components:** Prefer functional components with React Hooks over class components.
-   **Folder by Feature:** Organize components by feature or domain, rather than by type.
    ```
    components/
    ├── product/
    │   ├── ProductCard.tsx
    │   ├── ProductDetail.tsx
    │   └── index.ts // Barrel file
    ├── cart/
    │   ├── CartItem.tsx
    │   └── CartSummary.tsx
    └── common/
        ├── Button.tsx
        └── LoadingSpinner.tsx
    ```
-   **Props:**
    -   Destructure props at the top of the component.
    -   Use TypeScript interfaces for props validation.
    -   Pass only necessary props.
-   **State Management (Redux Toolkit):**
    -   Use Redux Toolkit for global state.
    -   Organize state into logical "slices."
    -   Use `createSlice` for reducers and actions.
    -   Use selectors for accessing state.
-   **Styling:**
    -   Use CSS Modules or a CSS-in-JS solution (e.g., styled-components, Emotion) for component-scoped styles.
    -   Avoid inline styles unless dynamic.
    -   Follow a consistent naming convention for CSS classes (e.g., BEM, utility-first).

### 6.2. Hooks

-   **Custom Hooks:** Extract reusable stateful logic into custom hooks.
-   **Dependencies Array:** Always correctly specify dependencies for `useEffect`, `useCallback`, `useMemo` to prevent stale closures and unnecessary re-renders.
-   **Avoid `useContext` for frequent updates:** For frequently updated data, consider Redux or Prop Drilling before `useContext` to avoid re-renders of all consumers.

### 6.3. API Calls

-   **Centralized API Service:** Abstract API calls into a dedicated service (e.g., `apiService.ts`) or use a library like `TanStack Query` for data fetching, caching, and synchronization.
-   **Error Handling:** Implement global and local error handling for API requests.
-   **Loading States:** Manage loading states for data fetching.

## 7. Backend Specific Guidelines (Node.js/Express/Prisma)

### 7.1. Project Structure

-   **Layered Architecture:** Separate concerns into distinct layers:
    -   `routes` (API endpoints)
    -   `controllers` (handle request/response, call services)
    -   `services` (business logic)
    -   `repositories` (database interactions, using Prisma)
    -   `models` (Prisma schema definitions)
    -   `middleware` (authentication, validation)
    -   `utils` (helper functions)
-   **Modular Design:** Organize code into modules based on features or domains.

### 7.2. Database Interactions (Prisma)

-   **Prisma Client:** Use the generated Prisma Client for all database operations.
-   **Transactions:** Use Prisma transactions for atomic operations that involve multiple database writes.
-   **Error Handling:** Catch and handle Prisma-specific errors (e.g., `PrismaClientKnownRequestError`).

### 7.3. Authentication & Authorization

-   **JWT:** Use JSON Web Tokens for authentication.
-   **Bcrypt:** Hash all passwords using a strong hashing algorithm like Bcrypt before storing them.
-   **Secure Storage:** Store sensitive tokens securely (e.g., HTTP-only cookies on the client, environment variables on the server).
-   **Role-Based Access Control (RBAC):** Implement middleware to check user roles and permissions for protected routes.

## 8. Testing

-   **Unit Tests:** Test individual functions, components, or modules in isolation. Use Jest/Vitest.
-   **Integration Tests:** Test the interaction between different units (e.g., API endpoints and services).
-   **End-to-End Tests:** Test the entire application flow from a user's perspective (e.g., Cypress, Playwright).
-   **Coverage:** Strive for high test coverage for critical paths.

## 9. Version Control (Git)

-   **Branching Strategy:** Use a feature-branch workflow (e.g., Git Flow or GitHub Flow).
-   **Commit Messages:** Write clear, concise, and descriptive commit messages following Conventional Commits (e.g., `feat: add new user registration flow`, `fix: resolve login bug`).
-   **Pull Requests (PRs):** Require PRs for all new features and bug fixes. Ensure PRs are reviewed by at least one other team member.

## 10. Documentation

-   **Inline Documentation:** Use JSDoc for functions, classes, and complex types.
-   **Markdown Files:** Maintain comprehensive Markdown documentation in the `docs` directory for project overview, architecture, setup guides, and API documentation.
-   **README.md:** Keep the project `README.md` updated with essential information for setup and getting started.

By adhering to these standards, we aim to build a high-quality, maintainable, and scalable e-commerce platform.