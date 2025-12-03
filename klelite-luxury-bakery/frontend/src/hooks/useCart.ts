import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchCart,
  addToCart as addToCartAction,
  updateCartItem as updateCartItemAction,
  removeFromCart as removeFromCartAction,
  clearCart as clearCartAction,
  addToLocalCart,
  updateLocalCartItem,
  removeFromLocalCart,
  clearLocalCart,
} from '@/store/slices/cartSlice';
import { localCartService } from '@/services';

export const useCart = () => {
  const dispatch = useAppDispatch();
  const { cart, localCart, isLoading, error } = useAppSelector((state) => state.cart);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Get cart items count
  const cartItemsCount = isAuthenticated 
    ? cart?.totalItems || 0 
    : localCart.reduce((sum, item) => sum + item.quantity, 0);

  // Get cart total
  const cartTotal = cart?.totalAmount || 0;

  // Fetch cart (for authenticated users)
  const getCart = useCallback(async () => {
    if (isAuthenticated) {
      await dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  // Add to cart
  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    if (isAuthenticated) {
      await dispatch(addToCartAction({ productId, quantity }));
    } else {
      dispatch(addToLocalCart({ productId, quantity }));
    }
  }, [dispatch, isAuthenticated]);

  // Update cart item
  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    if (isAuthenticated) {
      await dispatch(updateCartItemAction({ itemId, quantity }));
    } else {
      dispatch(updateLocalCartItem({ productId: itemId, quantity }));
    }
  }, [dispatch, isAuthenticated]);

  // Remove from cart
  const removeItem = useCallback(async (itemId: string) => {
    if (isAuthenticated) {
      await dispatch(removeFromCartAction(itemId));
    } else {
      dispatch(removeFromLocalCart(itemId));
    }
  }, [dispatch, isAuthenticated]);

  // Clear cart
  const clearAll = useCallback(async () => {
    if (isAuthenticated) {
      await dispatch(clearCartAction());
    } else {
      dispatch(clearLocalCart());
    }
  }, [dispatch, isAuthenticated]);

  // Merge local cart to server (after login)
  const mergeCart = useCallback(async () => {
    if (isAuthenticated && localCart.length > 0) {
      const mergedCart = await localCartService.mergeToServerCart();
      if (mergedCart) {
        dispatch(clearLocalCart());
        await dispatch(fetchCart());
      }
    }
  }, [dispatch, isAuthenticated, localCart]);

  return {
    cart,
    localCart,
    cartItemsCount,
    cartTotal,
    isLoading,
    error,
    getCart,
    addToCart,
    updateItem,
    removeItem,
    clearAll,
    mergeCart,
  };
};
