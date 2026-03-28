/**
 * Throttle function - limits the rate at which a function can fire.
 * 
 * Creates a throttled version of the provided function that will only execute
 * at most once per specified wait period. Useful for optimizing performance
 * of event handlers that fire frequently (like scroll or resize events).
 * 
 * @param fn - The function to throttle
 * @param wait - The minimum time (in milliseconds) between executions
 * @returns A throttled version of the function
 * @see https://www.30secondsofcode.org/js/s/throttle/
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  let lastFn: ReturnType<typeof setTimeout> | undefined;
  let lastTime: number;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
    if (!inThrottle) {
      fn.apply(this, args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      if (lastFn !== undefined) {
        clearTimeout(lastFn);
      }
      lastFn = setTimeout(() => {
        if (Date.now() - lastTime >= wait) {
          fn.apply(this, args);
          lastTime = Date.now();
        }
      }, Math.max(wait - (Date.now() - lastTime), 0));
    }
  };
};

/**
 * Delay interval (in milliseconds) for throttling scroll events.
 * 
 * This value balances responsiveness with performance:
 * - Too low: Frequent updates may cause performance issues
 * - Too high: UI may feel unresponsive
 * 
 * 420ms provides a good balance for the back-to-top button visibility toggle.
 */
export const SCROLL_THROTTLE_DELAY = 420;
