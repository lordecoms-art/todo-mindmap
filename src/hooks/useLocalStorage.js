import { useState, useCallback } from 'react';

/**
 * Hook pour persister un état dans localStorage
 * @param {string} key - Clé localStorage
 * @param {*} defaultValue - Valeur par défaut si rien n'est stocké
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  });

  const setStoredValue = useCallback((newValue) => {
    setValue(prev => {
      const resolved = typeof newValue === 'function' ? newValue(prev) : newValue;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch (e) { /* quota exceeded — silent fail */ }
      return resolved;
    });
  }, [key]);

  return [value, setStoredValue];
}
