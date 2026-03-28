/**
 * Main entry point for the blog's client-side JavaScript.
 * This module initializes all interactive components and registers custom elements.
 */

// Import custom web components and utility functions
import ContentNetworkGraph from "./components/ContentNetworkGraph";
import { setupBackToTop } from "./components/BackToTop";

/**
 * Register the ContentNetworkGraph as a custom element.
 * Custom elements allow us to use <content-network-graph> tags in HTML.
 * The check prevents duplicate registration errors if the script runs multiple times.
 */
if (!customElements.get("content-network-graph")) {
  customElements.define("content-network-graph", ContentNetworkGraph);
}

/**
 * Initialize all features when the DOM is fully loaded.
 * The 'once: true' option ensures the listener is automatically removed after execution,
 * preventing memory leaks and unnecessary function calls.
 */
window.addEventListener(
  "DOMContentLoaded",
  () => {
    // Set up the "back to top" button functionality
    setupBackToTop();
  },
  { once: true },
);
