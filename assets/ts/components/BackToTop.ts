import { throttle, SCROLL_THROTTLE_DELAY } from "../lib/utils";

/**
 * Scroll position threshold (in pixels) at which the back-to-top button becomes visible.
 * When the user scrolls more than this value from the top, the button will appear.
 */
const SHOW_THRESHOLD = 100;

/**
 * Initializes the "back to top" button functionality.
 * 
 * This function sets up a scroll listener that shows or hides the back-to-top button
 * based on the user's scroll position. The button appears when the user scrolls past
 * the SHOW_THRESHOLD and disappears when they scroll back up.
 * 
 * The scroll handler is throttled to improve performance by limiting how often
 * the visibility check runs during scrolling.
 */
export const setupBackToTop = (): void => {
  // Get the back-to-top button element from the DOM
  const backToTop = document.getElementById("back-to-top");
  if (!backToTop) return;

  /**
   * Toggles the visibility of the back-to-top button based on scroll position.
   * Adds or removes the 'show' class to control CSS transitions.
   */
  const toggleVisibility = () => {
    const shouldShow = window.scrollY > SHOW_THRESHOLD;
    backToTop.classList.toggle("show", shouldShow);
  };

  // Attach the throttled scroll listener to the window
  // Throttling prevents excessive function calls during rapid scrolling
  window.addEventListener(
    "scroll",
    throttle(toggleVisibility, SCROLL_THROTTLE_DELAY),
  );
};
