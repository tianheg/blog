import type { PageSection, PageData } from './types';

/**
 * Error thrown when page data is missing a required permalink.
 */
export class IncompletePageDataError extends Error {
  constructor() {
    super('Received page data without a permalink');
    this.name = 'IncompletePageDataError';
  }
}

/**
 * Error thrown when the page section cannot be determined from the permalink.
 */
export class UnknownPageSectionError extends Error {
  constructor(permalink: string) {
    super(`Unable to determine page section from '${permalink}' permalink`);
    this.name = 'UnknownPageSectionError';
  }
}

/**
 * Represents a blog page with its metadata and inferred properties.
 * 
 * This class encapsulates page data and provides logic to:
 * - Validate required fields
 * - Infer the page section (posts/notes) from the permalink if not explicitly set
 * - Provide consistent access to page properties
 */
export default class Page {
  public readonly permalink: string;
  public readonly title: string;
  public readonly summary: string;
  public readonly categories: string[];
  public readonly tags: string[];
  private _section: PageSection | null;

  constructor(pageData: Partial<PageData>) {
    this.validate(pageData);

    this.permalink = pageData.permalink!;
    this.title = pageData.title ?? '';
    this.summary = pageData.summary ?? '';
    this._section = pageData.section ?? null;
    this.categories = pageData.categories ?? [];
    this.tags = pageData.tags ?? [];
  }

  /**
   * Validates that the page data includes a required permalink.
   * 
   * @throws {IncompletePageDataError} When permalink is missing
   */
  private validate(pageData: Partial<PageData>): asserts pageData is { permalink: string } {
    if (!pageData.permalink) {
      throw new IncompletePageDataError();
    }
  }

  /**
   * Unique identifier for the page.
   * Uses the permalink as the canonical ID.
   */
  get id(): string {
    return this.permalink;
  }

  /**
   * The page section/category: either 'posts' or 'notes'.
   * 
   * If explicitly set in the data, uses that value. Otherwise, infers from the permalink structure:
   * - URLs containing '/posts/' -> 'posts'
   * - URLs containing '/notes/' -> 'notes'
   * 
   * @throws {UnknownPageSectionError} When section cannot be determined
   */
  get section(): PageSection {
    if (this._section) {
      return this._section;
    }

    this._section = this.inferSectionFromPermalink();
    return this._section;
  }

  /**
   * Infers the page section from the permalink URL structure.
   * 
   * @returns The inferred section type
   * @throws {UnknownPageSectionError} When permalink doesn't match known patterns
   */
  private inferSectionFromPermalink(): PageSection {
    if (this.permalink.includes('/posts/')) {
      return 'posts';
    }
    if (this.permalink.includes('/notes/')) {
      return 'notes';
    }
    throw new UnknownPageSectionError(this.permalink);
  }
}
