import { useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  type NodeTypes,
  type DefaultEdgeOptions,
  MarkerType,
} from "reactflow";
import type { ExtensionToWebviewMessage } from "../types";
import NodeRenderer from "./NodeRenderer";
import type { Edge, Node } from "./types";
import { useThrottleFn } from "react-use";
import { postMessage } from "./vscode";
import { useEditorContext } from "./context";

const nodeTypes: NodeTypes = { default: NodeRenderer };
const defaultEdgeOptions: DefaultEdgeOptions = {
  interactionWidth: 30,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 10,
    height: 10,
    color: "#777",
  },
  style: {
    stroke: "#777",
    strokeWidth: 2,
  },
};

export type Graph = {
  nodes: Node[];
  edges: Edge[];
};

export default function Editor() {
  const {
    graph,
    setGraph,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodeAsHead,
    pushNode,
    popNode,
  } = useEditorContext();

  useThrottleFn(
    (latestGraph) => {
      postMessage({
        type: "SYNC",
        data: latestGraph,
      });
    },
    300,
    [graph]
  );

  useEffect(() => {
    const handler = ({
      data: message,
    }: MessageEvent<ExtensionToWebviewMessage>) => {
      switch (message.type) {
        case "SYNC": {
          setGraph(message.data);
          break;
        }
        case "PUSH": {
          pushNode(message.sourceLocation, message.note);
          break;
        }
        case "POP": {
          popNode((newHeadNode) => {
            postMessage({
              type: "JUMP",
              sourceLocation: newHeadNode.data.sourceLocation,
            });
          });
          break;
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <ReactFlow
      style={{ width: "100%", height: "100%" }}
      nodes={graph.nodes}
      edges={graph.edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node: Node) => {
        setNodeAsHead(node.id);
      }}
      onNodeDoubleClick={(_, node: Node) => {
        postMessage({
          type: "JUMP",
          sourceLocation: node.data.sourceLocation,
        });
      }}
      defaultEdgeOptions={defaultEdgeOptions}
      deleteKeyCode={["Backspace", "Delete"]}
      multiSelectionKeyCode="Shift"
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
}
