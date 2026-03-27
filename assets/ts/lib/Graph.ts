import Page from './Page';
import type { GraphData, PageGraph, Permalink } from './types';
import { DataSet } from 'vis-network/standalone';
import type { Edge, Node } from 'vis-network/standalone';

/** 节点最小尺寸 */
const NODE_MIN_SIZE = 4;
/** 节点最大尺寸 */
const NODE_MAX_SIZE = 16;
/** 当前页面节点的突出显示尺寸 */
const NODE_FOCUS_SIZE = 8;

/** 页面不存在错误 */
export class PageNotFoundError extends Error {
  constructor(permalink: string) {
    super(`Page '${permalink}' not found in graph data`);
    this.name = 'PageNotFoundError';
  }
}

/**
 * 内容图谱管理类
 * 负责解析图谱数据、构建节点和边、计算节点大小等
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

  // ============== 初始化 ==============

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

  // ============== 查询方法 ==============

  /**
   * 获取指定页面
   * @throws {PageNotFoundError} 当页面不存在时抛出
   */
  page(permalink: Permalink): Page {
    const page = this.pages.get(permalink);
    if (!page) {
      throw new PageNotFoundError(permalink);
    }
    return page;
  }

  /**
   * 获取指向该页面的所有页面（入链）
   */
  incomingFor(permalink: Permalink): Page[] {
    const pageGraph = this.graph.get(permalink);
    if (!pageGraph) return [];

    return pageGraph.in.map((fromPermalink) => this.page(fromPermalink));
  }

  /**
   * 获取该页面指向的所有页面（出链）
   */
  outgoingFor(permalink: Permalink): Page[] {
    const pageGraph = this.graph.get(permalink);
    if (!pageGraph) return [];

    return pageGraph.out.map((toPermalink) => this.page(toPermalink));
  }

  // ============== 数据生成 ==============

  /**
   * 生成特定页面的局部图谱数据（包含当前页面及其关联页面）
   */
  dataForPage(permalink: Permalink): {
    nodes: DataSet<Node>;
    edges: DataSet<Edge>;
  } {
    const currentPage = this.page(permalink);
    const nodes = new DataSet<Node>();
    const edges = new DataSet<Edge>();

    // 收集相关页面：当前页面 + 入链页面 + 出链页面
    const relatedPages = [
      ...new Set([
        currentPage,
        ...this.incomingFor(permalink),
        ...this.outgoingFor(permalink)
      ])
    ];

    // 创建节点
    for (const page of relatedPages) {
      const isCurrentPage = permalink === page.permalink;
      nodes.add({
        id: page.id,
        label: page.title,
        group: page.section,
        size: isCurrentPage ? NODE_FOCUS_SIZE : NODE_MIN_SIZE
      });
    }

    // 创建边（只包含相关页面之间的连接）
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
   * 生成完整图谱数据
   */
  data(): { nodes: DataSet<Node>; edges: DataSet<Edge> } {
    const nodes = new DataSet<Node>();
    const edges = new DataSet<Edge>();

    // 创建所有节点和边
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

    // 根据入链数量计算节点大小
    const inDegreeCount = this.calculateInDegree(nodes, edges);
    this.scaleNodeSizes(nodes, inDegreeCount);

    return { nodes, edges };
  }

  // ============== 私有辅助方法 ==============

  /**
   * 计算每个节点的入链数量
   */
  private calculateInDegree(
    nodes: DataSet<Partial<Node>>,
    edges: DataSet<Partial<Edge>>
  ): Record<string, number> {
    const count: Record<string, number> = {};

    // 初始化所有节点的计数为0
    nodes.forEach((node) => {
      count[node.id!] = 0;
    });

    // 统计入链
    edges.forEach((edge) => {
      if (count[edge.to] !== undefined) {
        count[edge.to] += 1;
      }
    });

    return count;
  }

  /**
   * 根据入链数量按比例缩放节点大小
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