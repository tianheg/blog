/**
 * SVG 图标集合
 * 用于 ContentNetworkGraph 组件
 */

export const SPINNER_SVG = `<svg
  xmlns="http://www.w3.org/2000/svg"
  class="h-5 w-5 opacity-80"
  viewBox="0 0 24 24"
  aria-hidden="true"
>
  <path
    d="M10.14 1.16a11 11 0 0 0-9 8.92A1.59 1.59 0 0 0 2.46 12a1.52 1.52 0 0 0 1.65-1.3 8 8 0 0 1 6.66-6.61A1.42 1.42 0 0 0 12 2.69a1.57 1.57 0 0 0-1.86-1.53Z"
  >
    <animateTransform
      attributeName="transform"
      dur="0.75s"
      repeatCount="indefinite"
      type="rotate"
      values="0 12 12;360 12 12"
    />
  </path>
</svg>`;

export const ERROR_SVG = `<svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  stroke="currentColor"
  stroke-linecap="round"
  stroke-linejoin="round" stroke-width="2"
  class="lucide lucide-circle-x h-5 w-5"
  viewBox="0 0 24 24"
  aria-hidden="true"
>
  <circle cx="12" cy="12" r="10"/>
  <path d="m15 9-6 6M9 9l6 6"/>
</svg>`;

export const EXPAND_SVG = `<svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  stroke="currentColor"
  stroke-linecap="round"
  stroke-linejoin="round"
  stroke-width="2"
  class="lucide lucide-expand h-4 w-4"
  viewBox="0 0 24 24"
  aria-hidden="true"
>
  <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8M3 16.2V21m0 0h4.8M3 21l6-6M21 7.8V3m0 0h-4.8M21 3l-6 6M3 7.8V3m0 0h4.8M3 3l6 6"/>
</svg>`;

export const SHRINK_SVG = `<svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  stroke="currentColor"
  stroke-linecap="round"
  stroke-linejoin="round"
  stroke-width="2"
  class="lucide lucide-shrink h-4 w-4"
  viewBox="0 0 24 24"
  aria-hidden="true"
>
  <path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8M9 19.8V15m0 0H4.2M9 15l-6 6M15 4.2V9m0 0h4.8M15 9l6-6M9 4.2V9m0 0H4.2M9 9 3 3"/>
</svg>`;