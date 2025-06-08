// https://www.30secondsofcode.org/js/s/throttle/

const throttle = (fn, wait) => {
  let inThrottle;
  let lastFn;
  let lastTime;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFn);
      lastFn = setTimeout(
        () => {
          if (Date.now() - lastTime >= wait) {
            fn.apply(this, args);
            lastTime = Date.now();
          }
        },
        Math.max(wait - (Date.now() - lastTime), 0),
      );
    }
  };
};

const delayTime = 420;
