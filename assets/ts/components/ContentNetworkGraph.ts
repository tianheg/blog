import { IdType, Network, NodeOptions, type Options } from 'vis-network';
import Graph from '../lib/Graph';
import { GraphData } from '../lib/types';
import { SPINNER_SVG, ERROR_SVG, EXPAND_SVG, SHRINK_SVG } from '../lib/icons';

// ============== 配置常量 ==============

const NETWORK_OPTIONS: Options = {
  nodes: {
    shape: 'dot',
    color: {
      background: '#404040',
      border: '#404040',
      hover: {
        background: '#3b82f6',
        border: '#2563eb'
      }
    },
    font: {
      face: "'LatoLatinWeb', sans-serif",
      color: '#0f172a',
      size: 11
    },
    scaling: {
      min: 4,
      max: 30
    }
  },
  edges: {
    color: {
      color: '#d4d4d4',
      hover: '#3b82f6'
    },
    hoverWidth: 0,
    smooth: false
  },
  groups: {
    useDefaultGroups: false,
    posts: {},
    notes: {}
  },
  interaction: {
    hover: true
  }
};

const FADED_NODE_OPTIONS: NodeOptions = {
  color: {
    background: '#d4d4d4',
    border: '#d4d4d4'
  },
  font: {
    color: '#d4d4d4'
  }
};

const OBSERVER_OPTIONS = {
  rootMargin: '0px',
  threshold: 0.3
};

const EXPANDED_CLASSES = [
  'fixed',
  'top-1/2',
  'left-1/2',
  'w-5/6',
  'h-5/6',
  'z-50',
  '-translate-x-1/2',
  '-translate-y-1/2',
  'shadow-lg'
] as const;

// ============== 组件类 ==============

export default class ContentNetworkGraph extends HTMLElement {
  private _networkEl: HTMLDivElement;
  private _messageEl: HTMLDivElement;
  private _actionsEl: HTMLUListElement;
  private _network: Network | null = null;
  private _observer: IntersectionObserver | null = null;
  private _heightClass: string;
  private _expanded: boolean = false;

  constructor() {
    super();
    this._heightClass = this.extractHeightClass();
    this.setupBaseStyles();
    this.createElements();
    this.observe();
  }

  disconnectedCallback() {
    this._network?.destroy();
    this._observer?.disconnect();
  }

  // ============== 初始化方法 ==============

  private extractHeightClass(): string {
    return Array.from(this.classList).find((cls) => /^h-/.test(cls)) ?? '';
  }

  private setupBaseStyles(): void {
    this.classList.add(
      'relative',
      'border',
      'border-neutral-200',
      'rounded-sm',
      'block',
      'bg-white'
    );
  }

  private createElements(): void {
    this._networkEl = document.createElement('div');
    this._messageEl = document.createElement('div');
    this._actionsEl = document.createElement('ul');
    this.replaceChildren(this._networkEl, this._messageEl, this._actionsEl);
  }

  private observe(): void {
    this._observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        this.load();
      }
    }, OBSERVER_OPTIONS);
    this._observer.observe(this);
  }

  // ============== 核心加载逻辑 ==============

  private async load(): Promise<void> {
    this.stopObserving();
    this.showLoading();

    try {
      const graphData = await this.fetchGraphData();
      const networkData = this.prepareNetworkData(graphData);
      this.renderNetwork(networkData);
      this.setupNetworkInteractions(networkData);
      this.showGraph();
    } catch (error) {
      this.handleLoadError(error);
    }
  }

  private stopObserving(): void {
    this._observer?.disconnect();
    this._observer = null;
  }

  private async fetchGraphData(): Promise<Graph> {
    const dataEndpoint = this.getAttribute('data-endpoint') || '/graph/index.json';
    const resp = await fetch(dataEndpoint);
    const rawData = await resp.json() as GraphData;
    return new Graph(rawData);
  }

  private prepareNetworkData(graph: Graph): ReturnType<Graph['data'] | Graph['dataForPage']> {
    const permalink = this.getAttribute('page');
    return permalink ? graph.dataForPage(permalink) : graph.data();
  }

  private renderNetwork(data: ReturnType<Graph['data']>): void {
    this._networkEl.classList.add('absolute', 'h-full', 'w-full', 'z-40');
    this._network = new Network(this._networkEl, data, NETWORK_OPTIONS);
  }

  private setupNetworkInteractions(data: ReturnType<Graph['data']>): void {
    this.setupClickHandler();
    this.setupHoverHandlers(data);
    this.setupFocusOnCurrentPage();
    this.setupStabilizationHandler();
  }

  private setupClickHandler(): void {
    this._network!.on('click', (event) => {
      const nodeId = event.nodes.at(0);
      if (nodeId) {
        document.location.href = nodeId;
      }
    });
  }

  private setupHoverHandlers(data: ReturnType<Graph['data']>): void {
    // 高亮当前节点及其连接节点
    this._network!.on('hoverNode', (event) => {
      const hoveredNodeId = event.node;
      const connectedNodes = this._network!.getConnectedNodes(hoveredNodeId) as IdType[];
      connectedNodes.push(hoveredNodeId);

      data.nodes.forEach((node) => {
        if (node.id && !connectedNodes.includes(node.id)) {
          data.nodes.update({ id: node.id, ...FADED_NODE_OPTIONS });
        }
      });
    });

    // 恢复所有节点样式
    this._network!.on('blurNode', () => {
      data.nodes.forEach((node) => {
        data.nodes.update({ id: node.id, ...NETWORK_OPTIONS.nodes });
      });
    });
  }

  private setupFocusOnCurrentPage(): void {
    const permalink = this.getAttribute('page');
    if (permalink) {
      this._network!.focus(permalink);
    }
  }

  private setupStabilizationHandler(): void {
    this._network!.once('stabilized', () => {
      this.hideMessage();
      this.drawActions();
    });
  }

  private handleLoadError(error: unknown): void {
    this.showError();
    console.error('Failed to load network graph:', error);
  }

  // ============== UI 显示方法 ==============

  private showLoading(): void {
    this.showMessage(`${SPINNER_SVG} <span>loading graph…</span>`);
  }

  private showError(): void {
    this.showMessage(`${ERROR_SVG} <span>failed loading graph</span>`, 'text-red-600');
  }

  private showMessage(html: string, ...addClasses: string[]): void {
    this._messageEl.classList.add(
      'message',
      'flex',
      'flex-row',
      'space-x-2',
      'items-center',
      'absolute',
      'bg-white',
      'w-full',
      'h-full',
      'text-lg',
      'font-semibold',
      'italic',
      'justify-center',
      'z-50',
      'transition-opacity',
      ...addClasses
    );
    this._messageEl.innerHTML = html;
  }

  private hideMessage(): void {
    const messageEl = this.querySelector('.message');
    if (messageEl) {
      messageEl.classList.add('opacity-0');
      setTimeout(() => messageEl.remove(), 500);
    }
  }

  private showGraph(): void {
    this.hideMessage();
    this.drawActions();
  }

  // ============== 操作按钮 ==============

  private drawActions(): void {
    this.setupActionsContainer();
    const expandBtn = this.createExpandButton();
    this._actionsEl.replaceChildren(this.wrapInListItem(expandBtn));
  }

  private setupActionsContainer(): void {
    this._actionsEl.classList.add(
      'absolute',
      'right-1',
      'top-1',
      'z-50',
      'flex',
      'flex-row',
      'space-x-1',
      'items-center',
      'not-prose'
    );
  }

  private createExpandButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.classList.add(
      'bg-white',
      'border',
      'rounded-sm',
      'p-1',
      'opacity-60',
      'hover:opacity-100'
    );

    if (this._expanded) {
      btn.title = 'Minimize view';
      btn.innerHTML = SHRINK_SVG;
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        this.contract();
      });
    } else {
      btn.title = 'Expand view';
      btn.innerHTML = EXPAND_SVG;
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        this.expand();
      });
    }

    return btn;
  }

  private wrapInListItem(element: HTMLElement): HTMLLIElement {
    const li = document.createElement('li');
    li.appendChild(element);
    return li;
  }

  // ============== 展开/收缩功能 ==============

  private expand(): void {
    this.classList.remove('relative', this._heightClass);
    this.classList.add(...EXPANDED_CLASSES);
    this._expanded = true;
    this.drawActions();
  }

  private contract(): void {
    this.classList.remove(...EXPANDED_CLASSES);
    this.classList.add('relative', this._heightClass);
    this._expanded = false;
    this.drawActions();
  }
}