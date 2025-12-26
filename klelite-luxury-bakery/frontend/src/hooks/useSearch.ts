import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { searchService } from '@/services/searchService';
import { getErrorMessage } from '@/services/api';

/**
 * Custom hook for product search with auto-suggestions and debouncing
 */
export function useSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce query for auto-suggestions (300ms)
  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await searchService.suggest(debouncedQuery);
        setSuggestions(results);
      } catch (err) {
        setError(getErrorMessage(err));
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset search
  const resetSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    clearSuggestions,
    clearError,
    resetSearch,
  };
}
