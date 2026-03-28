import { IdType, Network, NodeOptions, type Options } from 'vis-network';
import Graph from '../lib/Graph';
import { GraphData } from '../lib/types';
import { SPINNER_SVG, ERROR_SVG, EXPAND_SVG, SHRINK_SVG } from '../lib/icons';

// ============== Configuration Constants ==============

/**
 * Default network visualization options for vis-network.
 * Defines the appearance and behavior of nodes, edges, and interactions.
 */
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

/**
 * Visual styling options for nodes that are not directly connected to the hovered node.
 * These nodes are faded out to emphasize the connection path.
 */
const FADED_NODE_OPTIONS: NodeOptions = {
  color: {
    background: '#d4d4d4',
    border: '#d4d4d4'
  },
  font: {
    color: '#d4d4d4'
  }
};

/**
 * Configuration for the Intersection Observer used to implement lazy loading.
 * The graph only loads when it becomes visible in the viewport.
 */
const OBSERVER_OPTIONS = {
  rootMargin: '0px',
  threshold: 0.3
};

/**
 * Tailwind CSS classes applied when the graph is expanded to full screen.
 */
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

// ============== Component Class ==============

/**
 * A custom web component that renders an interactive network graph visualization
 * showing the relationships between blog posts and notes.
 * 
 * Features:
 * - Lazy loading (loads only when scrolled into view)
 * - Interactive node hovering with connection highlighting
 * - Click navigation to linked posts
 * - Expandable full-screen view
 * - Loading and error states
 */
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

  /**
   * Cleanup when the element is removed from the DOM.
   * Destroys the network instance and disconnects the intersection observer.
   */
  disconnectedCallback() {
    this._network?.destroy();
    this._observer?.disconnect();
  }

  // ============== Initialization Methods ==============

  /**
   * Extracts the height class (e.g., 'h-64') from the element's class list.
   * This is used to restore the original height when collapsing from full screen.
   */
  private extractHeightClass(): string {
    return Array.from(this.classList).find((cls) => /^h-/.test(cls)) ?? '';
  }

  /**
   * Applies base Tailwind CSS styles to the component container.
   */
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

  /**
   * Creates and initializes the DOM elements for the graph, message display, and action buttons.
   */
  private createElements(): void {
    this._networkEl = document.createElement('div');
    this._messageEl = document.createElement('div');
    this._actionsEl = document.createElement('ul');
    this.replaceChildren(this._networkEl, this._messageEl, this._actionsEl);
  }

  /**
   * Sets up the Intersection Observer to enable lazy loading.
   * The graph data is only fetched when the element becomes visible.
   */
  private observe(): void {
    this._observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        this.load();
      }
    }, OBSERVER_OPTIONS);
    this._observer.observe(this);
  }

  // ============== Core Loading Logic ==============

  /**
   * Main loading sequence: fetches data, renders the network, and sets up interactions.
   */
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

  /**
   * Stops observing for intersection once loading begins to prevent duplicate loads.
   */
  private stopObserving(): void {
    this._observer?.disconnect();
    this._observer = null;
  }

  /**
   * Fetches graph data from the JSON endpoint.
   * Uses the data-endpoint attribute or defaults to '/graph/index.json'.
   */
  private async fetchGraphData(): Promise<Graph> {
    const dataEndpoint = this.getAttribute('data-endpoint') || '/graph/index.json';
    const resp = await fetch(dataEndpoint);
    const rawData = await resp.json() as GraphData;
    return new Graph(rawData);
  }

  /**
   * Prepares network data based on context:
   * - If 'page' attribute is set: shows the subgraph for that specific page
   * - Otherwise: shows the full graph
   */
  private prepareNetworkData(graph: Graph): ReturnType<Graph['data'] | Graph['dataForPage']> {
    const permalink = this.getAttribute('page');
    return permalink ? graph.dataForPage(permalink) : graph.data();
  }

  /**
   * Renders the vis-network visualization with the prepared data.
   */
  private renderNetwork(data: ReturnType<Graph['data']>): void {
    this._networkEl.classList.add('absolute', 'h-full', 'w-full', 'z-40');
    this._network = new Network(this._networkEl, data, NETWORK_OPTIONS);
  }

  /**
   * Sets up all network interaction handlers: click, hover, focus, and stabilization.
   */
  private setupNetworkInteractions(data: ReturnType<Graph['data']>): void {
    this.setupClickHandler();
    this.setupHoverHandlers(data);
    this.setupFocusOnCurrentPage();
    this.setupStabilizationHandler();
  }

  /**
   * Handles click events on nodes by navigating to the corresponding page.
   */
  private setupClickHandler(): void {
    this._network!.on('click', (event) => {
      const nodeId = event.nodes.at(0);
      if (nodeId) {
        document.location.href = nodeId;
      }
    });
  }

  /**
   * Sets up hover effects:
   * - Highlights the hovered node and its direct connections
   * - Fades out all other nodes to emphasize the connection path
   */
  private setupHoverHandlers(data: ReturnType<Graph['data']>): void {
    // Highlight the hovered node and its connected neighbors
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

    // Restore all nodes to their original appearance when no longer hovering
    this._network!.on('blurNode', () => {
      data.nodes.forEach((node) => {
        data.nodes.update({ id: node.id, ...NETWORK_OPTIONS.nodes });
      });
    });
  }

  /**
   * Focuses the network view on the current page's node if specified.
   */
  private setupFocusOnCurrentPage(): void {
    const permalink = this.getAttribute('page');
    if (permalink) {
      this._network!.focus(permalink);
    }
  }

  /**
   * Hides the loading message and shows action buttons once the network stabilizes.
   */
  private setupStabilizationHandler(): void {
    this._network!.once('stabilized', () => {
      this.hideMessage();
      this.drawActions();
    });
  }

  /**
   * Handles loading errors by displaying an error message.
   */
  private handleLoadError(error: unknown): void {
    this.showError();
    console.error('Failed to load network graph:', error);
  }

  // ============== UI Display Methods ==============

  /**
   * Displays the loading spinner with a message.
   */
  private showLoading(): void {
    this.showMessage(`${SPINNER_SVG} <span>loading graph…</span>`);
  }

  /**
   * Displays an error message when loading fails.
   */
  private showError(): void {
    this.showMessage(`${ERROR_SVG} <span>failed loading graph</span>`, 'text-red-600');
  }

  /**
   * Displays a message in the center of the component.
   * Used for loading and error states.
   */
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

  /**
   * Hides the message display with a fade-out animation.
   */
  private hideMessage(): void {
    const messageEl = this.querySelector('.message');
    if (messageEl) {
      messageEl.classList.add('opacity-0');
      setTimeout(() => messageEl.remove(), 500);
    }
  }

  /**
   * Shows the graph and renders action buttons after successful loading.
   */
  private showGraph(): void {
    this.hideMessage();
    this.drawActions();
  }

  // ============== Action Buttons ==============

  /**
   * Renders the action button bar (expand/collapse button).
   */
  private drawActions(): void {
    this.setupActionsContainer();
    const expandBtn = this.createExpandButton();
    this._actionsEl.replaceChildren(this.wrapInListItem(expandBtn));
  }

  /**
   * Applies positioning styles to the actions container.
   */
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

  /**
   * Creates the expand/collapse button based on current state.
   */
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

  /**
   * Wraps a button element in a list item for semantic HTML structure.
   */
  private wrapInListItem(element: HTMLElement): HTMLLIElement {
    const li = document.createElement('li');
    li.appendChild(element);
    return li;
  }

  // ============== Expand/Collapse Functionality ==============

  /**
   * Expands the graph to full-screen overlay mode.
   */
  private expand(): void {
    this.classList.remove('relative', this._heightClass);
    this.classList.add(...EXPANDED_CLASSES);
    this._expanded = true;
    this.drawActions();
  }

  /**
   * Collapses the graph back to its original embedded size.
   */
  private contract(): void {
    this.classList.remove(...EXPANDED_CLASSES);
    this.classList.add('relative', this._heightClass);
    this._expanded = false;
    this.drawActions();
  }
}