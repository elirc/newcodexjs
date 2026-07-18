import { useEffect, useState } from "react";

/**
 * Returns a value only after it has stayed unchanged for the given delay.
 * @param {unknown} value Value to debounce.
 * @param {number} delay Milliseconds to wait.
 * @returns {unknown} Debounced value.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
