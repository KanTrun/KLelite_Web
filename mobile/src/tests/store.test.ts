import { store } from '../store';
import { setCart } from '../store/slices/cartSlice';

describe('Redux Store', () => {
  it('should initialize with correct state', () => {
    const state = store.getState();
    expect(state.auth).toBeDefined();
    expect(state.cart).toBeDefined();
    expect(state.products).toBeDefined();
  });

  it('should handle cart actions', () => {
    const mockCart = {
      _id: '1',
      user: 'user1',
      items: [],
      totalItems: 0,
      totalAmount: 0,
    };

    store.dispatch(setCart(mockCart));
    const state = store.getState();
    expect(state.cart.cart).toEqual(mockCart);
  });
});
