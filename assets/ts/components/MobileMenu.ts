/**
 * Mobile hamburger menu control.
 *
 * Toggles the mobile navigation panel on/off when the hamburger button is clicked.
 * Closes on: nav link click, outside click, or Escape key.
 */

export const setupMobileMenu = (): void => {
  const btn = document.getElementById("menu-btn");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;

  const lines = btn.querySelectorAll<SVGPathElement>(".menu-line");
  const xes = btn.querySelectorAll<SVGPathElement>(".menu-x");

  const open = () => {
    btn.setAttribute("aria-expanded", "true");
    menu.classList.remove("hidden");
    lines.forEach((el) => el.classList.add("hidden"));
    xes.forEach((el) => el.classList.remove("hidden"));
  };

  const close = () => {
    btn.setAttribute("aria-expanded", "false");
    menu.classList.add("hidden");
    lines.forEach((el) => el.classList.remove("hidden"));
    xes.forEach((el) => el.classList.add("hidden"));
  };

  btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    if (isOpen) close();
    else open();
  });

  // Close on nav link click
  menu.querySelectorAll<HTMLAnchorElement>("a").forEach((a) => {
    a.addEventListener("click", () => close());
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target as Node) && !menu.contains(e.target as Node)) {
      if (btn.getAttribute("aria-expanded") === "true") close();
    }
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") close();
  });

  // Close on window resize from mobile to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 640 && btn.getAttribute("aria-expanded") === "true") close();
  });
};
