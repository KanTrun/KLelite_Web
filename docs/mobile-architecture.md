# Mobile Application Architecture

This document outlines the architecture and key components of the mobile application.

## 1. Dynamic API URL Configuration

The mobile application is designed to be flexible in its API endpoint configuration. This allows for easy switching between development, staging, and production environments without requiring a new app build.

- **Configuration Source:** The API URL is configured dynamically, typically through:
    - Environment variables at build time.
    - A configuration file (e.g., `config.json`, `.env`) that can be updated remotely or bundled with the app.
    - A mechanism within the app settings for users or administrators to specify a custom API endpoint (less common for production, more for testing/internal builds).
- **Implementation Details:**
    - A dedicated module or service is responsible for providing the current API base URL to all network requests.
    - This module might expose a function like `getApiBaseUrl()` that returns the appropriate URL.
    - Example:
        ```typescript
        // shared/config/api.ts
        export const getApiBaseUrl = (): string => {
          if (process.env.NODE_ENV === 'production') {
            return 'https://api.yourproductionapp.com';
          } else if (process.env.NODE_ENV === 'staging') {
            return 'https://api.yourstagingapp.com';
          }
          return 'http://localhost:3000'; // Default for development
        };
        ```

## 2. Redux Store Structure

The application utilizes Redux for state management, providing a predictable state container. The store is structured to manage various domains, including `Cart` and `Products`.

### Root Reducer

The root reducer combines individual slice reducers.

```typescript
// store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';
import productReducer from './slices/productSlice';
// import other reducers...

const rootReducer = combineReducers({
  cart: cartReducer,
  products: productReducer,
  // other slices...
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
```

### Cart Slice (`cartSlice.ts`)

Manages the state related to the user's shopping cart.

- **State:**
    - `items`: An array of cart items (product ID, quantity, price, etc.).
    - `totalQuantity`: Total number of items in the cart.
    - `totalAmount`: Total monetary value of items in the cart.
    - `isLoading`: Boolean to indicate if cart operations (e.g., adding, updating) are in progress.
    - `error`: Any error messages related to cart operations.
- **Actions (Example):**
    - `addItemToCart(payload: { productId: string; quantity: number; price: number; })`: Adds a product to the cart.
    - `removeItemFromCart(payload: { productId: string; })`: Removes a product from the cart.
    - `updateItemQuantity(payload: { productId: string; quantity: number; })`: Updates the quantity of an item.
    - `clearCart()`: Empties the cart.
- **Selectors (Example):**
    - `selectCartItems`: Returns the array of cart items.
    - `selectTotalQuantity`: Returns the total quantity of items.

### Products Slice (`productSlice.ts`)

Manages the state related to product data, such as listings, details, and search results.

- **State:**
    - `list`: An array of product objects (id, name, description, price, imageUrl, etc.).
    - `selectedProduct`: Details of a single product when viewed.
    - `isLoading`: Boolean to indicate if product data is being fetched.
    - `error`: Any error messages related to product data fetching.
- **Actions (Example):**
    - `fetchProductsStart()`: Initiates fetching products.
    - `fetchProductsSuccess(payload: Product[])`: Updates state with fetched products.
    - `fetchProductsFailure(payload: string)`: Stores error message.
    - `selectProduct(payload: string)`: Sets the currently selected product by ID.
- **Selectors (Example):
    - `selectAllProducts`: Returns all products.
    - `selectProductById(id: string)`: Returns a specific product by ID.

## 3. Navigation Structure

The application employs a clear and intuitive navigation structure, typically using a library like React Navigation.

- **Main Navigators:**
    - **AppStack:** The primary navigation stack for authenticated users.
        - `ShopStack`: Nested stack for browsing products, product details, etc.
            - `ShopScreen`: Displays product categories or a list of all products.
            - `ProductDetailScreen`: Shows detailed information for a selected product.
        - `CartStack`: Nested stack for managing the shopping cart and checkout process.
            - `CartScreen`: Displays items in the cart, allows quantity adjustments, and initiates checkout.
            - `CheckoutScreen`: Guides the user through the checkout steps (address, payment, etc.).
        - Other screens: Profile, Orders, Settings, etc.
    - **AuthStack:** For unauthenticated users (Login, Register, Forgot Password).
        - `LoginScreen`
        - `RegisterScreen`
        - `ForgotPasswordScreen`
- **Tab Navigator (Optional):** Often used within the `AppStack` to switch between main sections like Shop, Cart, Profile.

```typescript
// navigation/AppNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ShopScreen from '../screens/ShopScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
// Import other screens...

const ShopStack = createStackNavigator();
function ShopStackScreen() {
  return (
    <ShopStack.Navigator>
      <ShopStack.Screen name="Shop" component={ShopScreen} />
      <ShopStack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </ShopStack.Navigator>
  );
}

const CartStack = createStackNavigator();
function CartStackScreen() {
  return (
    <CartStack.Navigator>
      <CartStack.Screen name="Cart" component={CartScreen} />
      <CartStack.Screen name="Checkout" component={CheckoutScreen} />
    </CartStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();
function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={ShopStackScreen} />
      <Tab.Screen name="CartTab" component={CartStackScreen} />
      {/* Other tabs like Profile, Settings */}
    </Tab.Navigator>
  );
}

const RootStack = createStackNavigator();
function AppNavigator() {
  // Logic for checking authentication and rendering AuthStack vs AppTabs
  const isAuthenticated = false; // Replace with actual auth check
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name="App" component={AppTabs} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthStackScreen} /> // Assuming AuthStackScreen exists
      )}
    </RootStack.Navigator>
  );
}
```

## 4. Code Sharing Strategy

To maximize code reuse and maintain consistency across different platforms (e.g., web, mobile, backend if applicable), a clear code sharing strategy is implemented.

- **`shared/types` Directory:**
    - This directory is dedicated to defining common TypeScript interfaces, types, and enums that are used across multiple parts of the application or even different projects (e.g., frontend, backend).
    - **Benefits:**
        - **Type Safety:** Ensures consistency of data structures.
        - **Reduced Duplication:** Avoids redefining types in different places.
        - **Easier Maintenance:** Changes to core data models only need to be made in one place.
        - **Improved Collaboration:** Provides a single source of truth for data structures for all developers.
    - **Examples:**
        ```typescript
        // shared/types/product.ts
        export interface Product {
          id: string;
          name: string;
          description: string;
          price: number;
          imageUrl: string;
          category: string;
        }

        // shared/types/cart.ts
        export interface CartItem {
          productId: string;
          quantity: number;
          price: number;
          productName: string;
          productImage: string;
        }

        // shared/types/user.ts
        export interface User {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
        }
        ```
- **Other Shared Components/Logic:**
    - **Utility Functions:** Common helper functions (e.g., date formatting, validation, API call wrappers).
    - **Constants:** Application-wide constants (e.g., API endpoints, magic numbers).
    - **Theming/Styling (if applicable):** Design tokens, color palettes, typography.
    - **Business Logic:** Core logic that is independent of the UI or specific platform.

This strategy promotes a modular and maintainable codebase, facilitating efficient development and consistent behavior.