/**
 * Graph entry point — loaded only on pages with <content-network-graph>.
 * vis-network (~300KB) is only fetched when this script runs.
 */
import ContentNetworkGraph from "./components/ContentNetworkGraph";

if (!customElements.get("content-network-graph")) {
  customElements.define("content-network-graph", ContentNetworkGraph);
}
