import { createGlass, supportsHtmlInCanvas, type GlassOptions } from "./canvas-ui/glass";

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("glass-container");
  const contentRoot = document.getElementById("glass-content-root");
  const output = document.getElementById("glass-output") as HTMLCanvasElement | null;

  if (!container || !contentRoot || !output) return;

  const native = supportsHtmlInCanvas();
  let source: HTMLCanvasElement;
  let contentEl: HTMLElement;

  if (native) {
    // html-in-canvas: wrap content inside a canvas with layoutsubtree
    source = document.createElement("canvas");
    source.id = "glass-source";
    source.setAttribute("layoutsubtree", "true");
    Object.assign(source.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
    });

    const inner = document.createElement("div");
    inner.id = "glass-content";
    Object.assign(inner.style, {
      position: "relative",
      width: "100%",
      height: "100%",
    });

    // Move content children into the canvas wrapper
    const children = [...contentRoot.children];
    for (const child of children) {
      inner.appendChild(child);
    }
    source.appendChild(inner);
    container.insertBefore(source, output);
    container.removeChild(contentRoot);

    contentEl = inner;
  } else {
    // Fallback: content stays as-is, create an invisible canvas for the API
    source = document.createElement("canvas");
    source.id = "glass-source";
    Object.assign(source.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      opacity: "0",
      pointerEvents: "none",
    });
    container.insertBefore(source, output);
    contentEl = contentRoot;
  }

  const options: GlassOptions = {
    shape: "circle",
    size: 150,
    ior: 1.5,
    aberration: 1.0,
    reflection: 1.0,
    shine: 0.3,
    blur: 0.5,
    zoom: 1.8,
    follow: 0.25,
  };

  const instance = createGlass({ source, content: contentEl, output }, options);

  if (!instance) {
    console.warn("Canvas UI Glass: WebGL2 not available, removing canvas wrappers");
    // Restore original content if we moved it
    if (native && source.parentNode) {
      const restored = document.createElement("div");
      restored.id = "glass-content-root";
      while (contentEl.firstChild) {
        restored.appendChild(contentEl.firstChild);
      }
      source.parentNode.insertBefore(restored, source);
      source.parentNode.removeChild(source);
    }
    return;
  }

  // Expose for experimentation via console
  (window as any).__glass = instance;
}, { once: true });
