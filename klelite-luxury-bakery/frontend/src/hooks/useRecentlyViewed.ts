import { useState, useEffect } from 'react';
import { Product } from '@/types/product.types';

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 10;

export const useRecentlyViewed = () => {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Load from local storage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentProducts(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing recently viewed products:', e);
      }
    }
  }, []);

  const addToRecent = (product: Product) => {
    setRecentProducts(prev => {
      // Remove if exists (to move to front)
      const filtered = prev.filter(p => p.id !== product.id);

      // Add to front
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);

      // Save to local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      return updated;
    });
  };

  const clearRecent = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRecentProducts([]);
  };

  return {
    recentProducts,
    addToRecent,
    clearRecent
  };
};
