// Import components
import ContentNetworkGraph from "./components/ContentNetworkGraph";
import { setupBackToTop } from "./components/BackToTop";

// Register custom elements
if (!customElements.get("content-network-graph")) {
  customElements.define("content-network-graph", ContentNetworkGraph);
}

// Initialize features
window.addEventListener(
  "DOMContentLoaded",
  () => {
    setupBackToTop();
  },
  { once: true },
);
