import { useEffect, useState } from 'react';

/**
 * Returns `value` after waiting `delayMs`. Pass 0 to disable debouncing and
 * read the value directly. Used to keep global search cheap when a fetch
 * happens per keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (delayMs <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return delayMs > 0 ? debounced : value;
}
