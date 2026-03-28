/**
 * Unique permalink identifier for a page.
 * Used as the primary key throughout the graph system.
 */
export type Permalink = string;

/**
 * Page section/category type.
 * - 'posts': Blog posts/articles
 * - 'notes': Shorter notes or observations
 */
export type PageSection = 'posts' | 'notes';

/**
 * Complete metadata for a blog page.
 * 
 * Contains all properties needed to represent a page in the graph,
 * including content metadata and link relationships.
 */
export interface PageData {
  /** Unique identifier for the page */
  id: string;
  /** Permanent URL path for the page */
  permalink: Permalink;
  /** Display title of the page */
  title: string;
  /** Brief summary or description */
  summary: string;
  /** Section/category classification */
  section: PageSection;
  /** Content categories/tags */
  categories: string[];
  /** Content tags */
  tags: string[];
  /** List of permalinks that link to this page (incoming) */
  in: string[];
  /** List of permalinks this page links to (outgoing) */
  out: string[];
}

/**
 * Represents the link relationships for a specific page in the graph.
 * 
 * This structure maps how pages are interconnected through hyperlinks,
 * forming the edges of the content graph.
 */
export interface PageGraph {
  /** Pages that link to this page (incoming connections) */
  in: Permalink[];
  /** Pages this page links to (outgoing connections) */
  out: Permalink[];
}

/**
 * Complete graph data structure exported from the blog build process.
 * 
 * Contains two main components:
 * - pages: Metadata for all pages in the site
 * - graph: Link relationships between all pages
 */
export interface GraphData {
  /** Map of permalinks to their connection relationships */
  graph: {
    [key: Permalink]: PageGraph;
  };
  /** Map of permalinks to their metadata */
  pages: {
    [key: Permalink]: Partial<PageData>;
  };
}
