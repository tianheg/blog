import Page from './Page';
import type { GraphData, PageGraph, Permalink } from './types';
import { DataSet } from 'vis-network/standalone';
import type { Edge, Node } from 'vis-network/standalone';

/**
 * Minimum node size for graph visualization.
 * Used for nodes with few or no incoming links.
 */
const NODE_MIN_SIZE = 4;

/**
 * Maximum node size for graph visualization.
 * Used for nodes with many incoming links.
 */
const NODE_MAX_SIZE = 16;

/**
 * Highlighted node size for the current/focused page.
 * Makes the active page stand out in the visualization.
 */
const NODE_FOCUS_SIZE = 8;

/**
 * Error thrown when a requested page cannot be found in the graph data.
 */
export class PageNotFoundError extends Error {
  constructor(permalink: string) {
    super(`Page '${permalink}' not found in graph data`);
    this.name = 'PageNotFoundError';
  }
}

/**
 * Manages the content graph structure and provides data for visualization.
 * 
 * This class handles:
 * - Parsing graph data from JSON
 * - Building nodes and edges for the network visualization
 * - Calculating node sizes based on link popularity
 * - Extracting subgraphs for specific pages
 */
export default class Graph {
  public readonly pages: Map<Permalink, Page>;
  public readonly graph: Map<Permalink, PageGraph>;

  constructor(private _data: GraphData) {
    this.pages = new Map<Permalink, Page>();
    this.graph = new Map<Permalink, PageGraph>();

    this.initializePages();
    this.initializeGraph();
  }

  // ============== Initialization ==============

  private initializePages(): void {
    for (const [permalink, pageData] of Object.entries(this._data.pages)) {
      this.pages.set(permalink, new Page(pageData));
    }
  }

  private initializeGraph(): void {
    for (const [permalink, pageGraph] of Object.entries(this._data.graph)) {
      this.graph.set(permalink, pageGraph);
    }
  }

  // ============== Query Methods ==============

  /**
   * Retrieves a specific page by its permalink.
   * 
   * @param permalink - The unique identifier for the page
   * @returns The Page instance
   * @throws {PageNotFoundError} When the page doesn't exist in the graph
   */
  page(permalink: Permalink): Page {
    const page = this.pages.get(permalink);
    if (!page) {
      throw new PageNotFoundError(permalink);
    }
    return page;
  }

  /**
   * Gets all pages that link to the specified page (incoming links).
   * 
   * @param permalink - The target page's permalink
   * @returns Array of pages that link to the target
   */
  incomingFor(permalink: Permalink): Page[] {
    const pageGraph = this.graph.get(permalink);
    if (!pageGraph) return [];

    return pageGraph.in.map((fromPermalink) => this.page(fromPermalink));
  }

  /**
   * Gets all pages that the specified page links to (outgoing links).
   * 
   * @param permalink - The source page's permalink
   * @returns Array of pages linked from the source
   */
  outgoingFor(permalink: Permalink): Page[] {
    const pageGraph = this.graph.get(permalink);
    if (!pageGraph) return [];

    return pageGraph.out.map((toPermalink) => this.page(toPermalink));
  }

  // ============== Data Generation ==============

  /**
   * Generates a subgraph centered on a specific page.
   * Includes the current page and all directly connected pages (both incoming and outgoing links).
   * 
   * @param permalink - The permalink of the page to center the subgraph on
   * @returns Network data with nodes and edges for visualization
   */
  dataForPage(permalink: Permalink): {
    nodes: DataSet<Node>;
    edges: DataSet<Edge>;
  } {
    const currentPage = this.page(permalink);
    const nodes = new DataSet<Node>();
    const edges = new DataSet<Edge>();

    // Collect related pages: current page + incoming links + outgoing links
    const relatedPages = [
      ...new Set([
        currentPage,
        ...this.incomingFor(permalink),
        ...this.outgoingFor(permalink)
      ])
    ];

    // Create nodes for all related pages
    for (const page of relatedPages) {
      const isCurrentPage = permalink === page.permalink;
      nodes.add({
        id: page.id,
        label: page.title,
        group: page.section,
        size: isCurrentPage ? NODE_FOCUS_SIZE : NODE_MIN_SIZE
      });
    }

    // Create edges (only connections between related pages)
    for (const page of relatedPages) {
      for (const incoming of this.incomingFor(page.permalink)) {
        if (relatedPages.includes(incoming)) {
          edges.add({ from: incoming.id, to: page.id });
        }
      }
    }

    return { nodes, edges };
  }

  /**
   * Generates data for the complete graph including all pages.
   * Node sizes are calculated based on the number of incoming links (popularity).
   * 
   * @returns Network data with all nodes and edges
   */
  data(): { nodes: DataSet<Node>; edges: DataSet<Edge> } {
    const nodes = new DataSet<Node>();
    const edges = new DataSet<Edge>();

    // Create all nodes and edges
    for (const page of this.pages.values()) {
      nodes.add({
        id: page.id,
        label: page.title,
        group: page.section
      });

      for (const incoming of this.incomingFor(page.permalink)) {
        edges.add({ from: incoming.id, to: page.id });
      }
    }

    // Calculate node sizes based on incoming link count
    const inDegreeCount = this.calculateInDegree(nodes, edges);
    this.scaleNodeSizes(nodes, inDegreeCount);

    return { nodes, edges };
  }

  // ============== Private Helper Methods ==============

  /**
   * Calculates the number of incoming links (in-degree) for each node.
   * This metric indicates how popular or central a page is in the graph.
   */
  private calculateInDegree(
    nodes: DataSet<Partial<Node>>,
    edges: DataSet<Partial<Edge>>
  ): Record<string, number> {
    const count: Record<string, number> = {};

    // Initialize all node counts to zero
    nodes.forEach((node) => {
      count[node.id!] = 0;
    });

    // Count incoming links for each node
    edges.forEach((edge) => {
      if (count[edge.to] !== undefined) {
        count[edge.to] += 1;
      }
    });

    return count;
  }

  /**
   * Scales node sizes proportionally based on their in-degree count.
   * More popular pages (with more incoming links) get larger nodes.
   */
  private scaleNodeSizes(
    nodes: DataSet<Partial<Node>>,
    inDegreeCount: Record<string, number>
  ): void {
    const degrees = Object.values(inDegreeCount);
    const minDegree = Math.min(...degrees);
    const maxDegree = Math.max(...degrees);
    const degreeRange = maxDegree - minDegree;
    const sizeRange = NODE_MAX_SIZE - NODE_MIN_SIZE;

    nodes.forEach((node) => {
      const degree = inDegreeCount[node.id!];
      const normalizedDegree = degreeRange === 0
        ? 0
        : (degree - minDegree) / degreeRange;

      const size = NODE_MIN_SIZE + (normalizedDegree * sizeRange);
      node.size = isNaN(size) ? NODE_MIN_SIZE : size;
    });
  }
}