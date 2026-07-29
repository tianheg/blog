import { createGlass, supportsHtmlInCanvas, type GlassOptions } from "./canvas-ui/glass";

window.addEventListener("DOMContentLoaded", () => {
  const output = document.getElementById("glass-output") as HTMLCanvasElement | null;
  if (!output) return;

  const pageContent = document.getElementById("page-content")!;
  const native = supportsHtmlInCanvas();

  let source: HTMLCanvasElement;
  let contentEl: HTMLElement;

  if (native) {
    // Move all page content inside a source canvas with layoutsubtree
    source = document.createElement("canvas");
    source.id = "glass-source";
    source.setAttribute("layoutsubtree", "true");
    Object.assign(source.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      display: "block",
      border: "none",
      overflow: "hidden",
    });

    const inner = document.createElement("div");
    inner.id = "glass-content";
    Object.assign(inner.style, {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "auto",
    });

    // Move children from page-content into the canvas inner div
    const children = [...pageContent.children];
    for (const child of children) {
      inner.appendChild(child);
    }
    source.appendChild(inner);
    document.body.insertBefore(source, output);

    contentEl = inner;
  } else {
    // Fallback: invisible source canvas, use body as content
    source = document.createElement("canvas");
    source.id = "glass-source";
    Object.assign(source.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      opacity: "0",
      pointerEvents: "none",
    });
    document.body.insertBefore(source, output);
    contentEl = pageContent;
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
    console.warn("Canvas UI Glass: WebGL2 not available");
    if (native && source.parentNode) {
      // Restore content
      const restored = document.createElement("div");
      restored.id = "page-content";
      while (contentEl.firstChild) {
        restored.appendChild(contentEl.firstChild);
      }
      document.body.insertBefore(restored, source);
      document.body.removeChild(source);
    }
    output.style.display = "none";
    return;
  }

  (window as any).__glass = instance;
}, { once: true });
