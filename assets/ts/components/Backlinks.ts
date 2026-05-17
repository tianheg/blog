/**
 * Backlinks component - loads pre-computed link relationships from graph JSON.
 * This replaces the former link-relationships.html partial that parsed org-mode
 * links at page render time, eliminating repeated computation per page.
 */

const BACKLINKS_CONTAINER_ID = "backlinks-container";
const GRAPH_JSON_ENDPOINT = "/graph/index.json";

/**
 * Initializes the backlinks component by fetching graph data and rendering
 * incoming/outgoing link sections for the current page.
 */
async function initBacklinks(): Promise<void> {
  const container = document.getElementById(BACKLINKS_CONTAINER_ID);
  if (!container) return;

  const currentPermalink = container.dataset.pagePermalink;
  if (!currentPermalink) return;

  try {
    const response = await fetch(GRAPH_JSON_ENDPOINT);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const graph = data.graph?.[currentPermalink];

    if (!graph) return;

    const incoming: string[] = graph.in || [];
    const outgoing: string[] = graph.out || [];

    if (incoming.length === 0 && outgoing.length === 0) return;

    const pages = data.pages || {};
    const html = buildBacklinksHTML(incoming, outgoing, pages);
    container.innerHTML = html;
  } catch (error) {
    console.error("Backlinks error:", error);
  }
}

/**
 * URL-encodes a permalink to prevent XSS in href attributes.
 */
function escapeHref(permalink: string): string {
  return permalink.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Builds the backlinks section HTML string.
 */
function buildBacklinksHTML(
  incoming: string[],
  outgoing: string[],
  pages: Record<string, { title?: string }>
): string {
  let html = `
    <section class="backlinks mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <h2 class="flex flex-row items-center space-x-2 text-lg font-semibold mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <span>Links</span>
      </h2>
      <div class="space-y-4">
  `;

  if (outgoing.length > 0) {
    html += buildLinkSection("Outgoing", outgoing, pages, "M5 10l7-7m0 0l7 7m-7-7v18");
  }

  if (incoming.length > 0) {
    html += buildLinkSection("Incoming", incoming, pages, "M19 14l-7 7m0 0l-7-7m7 7V3");
  }

  html += "</div></section>";
  return html;
}

/**
 * Builds a single link section (incoming or outgoing).
 */
function buildLinkSection(
  label: string,
  links: string[],
  pages: Record<string, { title?: string }>,
  iconPath: string
): string {
  let html = `
    <div>
      <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center space-x-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}" />
        </svg>
        <span>${label} (${links.length})</span>
      </h3>
      <ul class="space-y-1 ml-5">
  `;

  for (const permalink of links) {
    const pageData = pages[permalink];
    const title = pageData?.title || permalink;
    html += `<li><a href="${escapeHref(permalink)}" class="text-blue-600 dark:text-blue-400 hover:underline">${title}</a></li>`;
  }

  html += "</ul></div>";
  return html;
}

export { initBacklinks };