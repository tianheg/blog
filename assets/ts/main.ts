/**
 * Main entry point for the blog's client-side JavaScript.
 * This module initializes all interactive components and registers custom elements.
 *
 * NOTE: ContentNetworkGraph (vis-network ~300KB) is loaded separately via graph.ts
 * only on pages that include the graph component. See components/graph.html.
 */

import { setupBackToTop } from "./components/BackToTop";
import { initBacklinks } from "./components/Backlinks";

/**
 * Initialize all features when the DOM is fully loaded.
 */
window.addEventListener(
  "DOMContentLoaded",
  () => {
    setupBackToTop();
    initBacklinks();
  },
  { once: true },
);