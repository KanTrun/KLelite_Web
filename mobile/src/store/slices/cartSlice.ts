import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Cart, CartItem } from '@shared/types/cart';
import { cartService } from '../../services/cartService';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCart = createAsyncThunk<Cart>(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const cart = await cartService.getCart();
      return cart;
    } catch (error) {
      return rejectWithValue('Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk<Cart, { productId: string; quantity: number }>(
  'cart/addToCart',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const cart = await cartService.addToCart(productId, quantity);
      return cart;
    } catch (error) {
      return rejectWithValue('Failed to add to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk<Cart, { itemId: string; quantity: number }>(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const cart = await cartService.updateCartItem(itemId, quantity);
      return cart;
    } catch (error) {
      return rejectWithValue('Failed to update cart');
    }
  }
);

export const removeFromCart = createAsyncThunk<Cart, string>(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue }) => {
    try {
      const cart = await cartService.removeFromCart(itemId);
      return cart;
    } catch (error) {
      return rejectWithValue('Failed to remove item');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await cartService.clearCart();
    } catch (error) {
      return rejectWithValue('Failed to clear cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCart: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add to cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update
    builder
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.cart = action.payload;
      });

    // Remove
    builder
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.cart = action.payload;
      });

    // Clear
    builder
      .addCase(clearCart.fulfilled, (state) => {
        state.cart = null;
      });
  },
});

export const { clearError, setCart } = cartSlice.actions;
export default cartSlice.reducer;
