/** 页面永久链接 */
export type Permalink = string;

/** 页面分类：文章或笔记 */
export type PageSection = 'posts' | 'notes';

/**
 * 页面元数据
 */
export interface PageData {
  id: string;
  permalink: Permalink;
  title: string;
  summary: string;
  section: PageSection;
  categories: string[];
  tags: string[];
  in: string[];
  out: string[];
}

/**
 * 页面的图谱连接关系
 */
export interface PageGraph {
  /** 指向该页面的页面列表（入链） */
  in: Permalink[];
  /** 该页面指向的页面列表（出链） */
  out: Permalink[];
}

/**
 * 完整图谱数据结构
 */
export interface GraphData {
  graph: {
    [key: Permalink]: PageGraph;
  };
  pages: {
    [key: Permalink]: Partial<PageData>;
  };
}