import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Cart, CartItem } from '@/types';
import { cartService, localCartService } from '@/services';

interface CartState {
  cart: Cart | null;
  localCart: { productId: string; quantity: number }[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  localCart: localCartService.getCart(),
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
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Không thể tải giỏ hàng');
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
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Không thể thêm vào giỏ hàng');
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
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Không thể cập nhật giỏ hàng');
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
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Không thể xóa sản phẩm');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await cartService.clearCart();
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Không thể xóa giỏ hàng');
    }
  }
);

// Slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Local cart actions (for guests)
    addToLocalCart: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const { productId, quantity } = action.payload;
      state.localCart = localCartService.addItem(productId, quantity);
    },
    updateLocalCartItem: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const { productId, quantity } = action.payload;
      state.localCart = localCartService.updateItem(productId, quantity);
    },
    removeFromLocalCart: (state, action: PayloadAction<string>) => {
      state.localCart = localCartService.removeItem(action.payload);
    },
    clearLocalCart: (state) => {
      localCartService.clearCart();
      state.localCart = [];
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
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update cart item
    builder
      .addCase(updateCartItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove from cart
    builder
      .addCase(removeFromCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Clear cart
    builder
      .addCase(clearCart.fulfilled, (state) => {
        state.cart = null;
      });
  },
});

export const {
  clearError,
  addToLocalCart,
  updateLocalCartItem,
  removeFromLocalCart,
  clearLocalCart,
  setCart,
} = cartSlice.actions;

export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state: { cart: CartState }): CartItem[] => 
  state.cart.cart?.items || [];

export const selectCartTotal = (state: { cart: CartState }): number => 
  state.cart.cart?.totalAmount || 0;

export const selectCartItemsCount = (state: { cart: CartState }): number => 
  state.cart.cart?.totalItems || 0;
