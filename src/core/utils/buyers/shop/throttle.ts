// src/utils/throttle.ts

/**
 * Throttle function to limit function calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Debounce function to delay function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  // ✅ FIX: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Alternative: Using number type (works in both React Native and Node)
 */
export const debounceAlternative = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay) as unknown as number;
  };
};

/**
 * Advanced debounce with leading/trailing options
 */
export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export const debounceAdvanced = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: DebounceOptions = { leading: false, trailing: true },
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Parameters<T> | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime: number | undefined;

  const shouldInvoke = (time: number): boolean => {
    if (lastInvokeTime === undefined) return true;
    const timeSinceLastInvoke = time - lastInvokeTime;
    return timeSinceLastInvoke >= delay;
  };

  const invokeFunc = (time: number): void => {
    if (lastArgs) {
      lastInvokeTime = time;
      func(...lastArgs);
      lastArgs = undefined;
    }
  };

  const startTimer = (pendingFunc: () => void, wait: number): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(pendingFunc, wait);
  };

  const remainingWait = (time: number): number => {
    if (lastCallTime === undefined) return delay;
    const timeSinceLastCall = time - lastCallTime;
    const timeWaiting = delay - timeSinceLastCall;
    return timeWaiting;
  };

  const trailingEdge = (time: number): void => {
    timeoutId = undefined;
    if (options.trailing && lastArgs) {
      invokeFunc(time);
    }
  };

  const timerExpired = (): void => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      trailingEdge(time);
    } else {
      const wait = remainingWait(time);
      startTimer(timerExpired, wait);
    }
  };

  const leadingEdge = (time: number): void => {
    if (options.leading) {
      invokeFunc(time);
    }
    startTimer(timerExpired, delay);
  };

  return (...args: Parameters<T>): void => {
    lastArgs = args;
    lastCallTime = Date.now();

    if (timeoutId === undefined) {
      leadingEdge(lastCallTime);
    } else {
      const time = Date.now();
      const wait = remainingWait(time);
      startTimer(timerExpired, wait);
    }
  };
};

/**
 * Generate idempotency key in format: Idem-{timestamp}-{randomNo}-{randomAlphabet}
 * Example: Idem-1781240086125-83472-KxYzW
 */
export const generateIdempotencyKey = (userId?: string): string => {
  const timestamp = Date.now();
  const randomNo = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  const randomAlphabet = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();
  const idempotencyKey = `Idem-${timestamp}-${randomNo}-${randomAlphabet}`;

  console.log('🔑 [Idempotency Key Generated]:', idempotencyKey);
  return idempotencyKey;
};

// Example outputs:
// Idem-1781240086125-83472-KxYzW
// Idem-1781240086126-12345-ABCDEF
// Idem-1781240086127-99887-ZxYwVt
