/**
 * Throttle function - limits the rate at which a function can fire
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

/** 滚动事件节流延迟（毫秒） */
export const SCROLL_THROTTLE_DELAY = 420;