import { throttle, SCROLL_THROTTLE_DELAY } from "../lib/utils";

const SHOW_THRESHOLD = 100;

/**
 * 初始化"返回顶部"按钮功能
 * 当页面滚动超过阈值时显示按钮
 */
export const setupBackToTop = (): void => {
  const backToTop = document.getElementById("back-to-top");
  if (!backToTop) return;

  const toggleVisibility = () => {
    const shouldShow = window.scrollY > SHOW_THRESHOLD;
    backToTop.classList.toggle("show", shouldShow);
  };

  window.addEventListener(
    "scroll",
    throttle(toggleVisibility, SCROLL_THROTTLE_DELAY),
  );
};