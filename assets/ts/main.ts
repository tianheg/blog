import { initPagePreview } from "./components/PagePreview";
import { initCommandPalette } from "./components/CommandPalette";

window.addEventListener(
  "DOMContentLoaded",
  () => {
    initPagePreview();
    initCommandPalette();
  },
  { once: true }
);
