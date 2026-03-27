import type { PageSection, PageData } from './types';

/** 页面数据不完整错误 */
export class IncompletePageDataError extends Error {
  constructor() {
    super('Received page data without a permalink');
    this.name = 'IncompletePageDataError';
  }
}

/** 无法确定页面类型错误 */
export class UnknownPageSectionError extends Error {
  constructor(permalink: string) {
    super(`Unable to determine page section from '${permalink}' permalink`);
    this.name = 'UnknownPageSectionError';
  }
}

/**
 * 页面实体类
 * 封装页面元数据和类型推断逻辑
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

  private validate(pageData: Partial<PageData>): asserts pageData is { permalink: string } {
    if (!pageData.permalink) {
      throw new IncompletePageDataError();
    }
  }

  /** 使用 permalink 作为唯一标识 */
  get id(): string {
    return this.permalink;
  }

  /**
   * 页面类型（posts/notes）
   * 优先使用显式声明的类型，否则从 permalink 推断
   */
  get section(): PageSection {
    if (this._section) {
      return this._section;
    }

    this._section = this.inferSectionFromPermalink();
    return this._section;
  }

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