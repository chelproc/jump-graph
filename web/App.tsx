import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type DefaultEdgeOptions,
  MarkerType,
  getIncomers,
} from "reactflow";
import type {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from "../types";
import { v4 as uuidV4 } from "uuid";
import NodeRenderer, { nodeRendererHandleIds } from "./NodeRenderer";
import type { Edge, Node } from "./types";

const vscode = window.acquireVsCodeApi();
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

export default function App() {
  const [graph, setGraph] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });

  const onNodesChange: OnNodesChange = useCallback(
    (changes) =>
      setGraph((previous) => ({
        ...previous,
        nodes: applyNodeChanges(changes, previous.nodes),
      })),
    [setGraph]
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) =>
      setGraph((previous) => ({
        ...previous,
        edges: applyEdgeChanges(changes, previous.edges),
      })),
    [setGraph]
  );
  const onConnect: OnConnect = useCallback(
    (params) =>
      setGraph((previous) => ({
        ...previous,
        edges: addEdge(params, previous.edges),
      })),
    [setGraph]
  );

  useEffect(() => {
    const handler = ({
      data: message,
    }: MessageEvent<ExtensionToWebviewMessage>) => {
      switch (message.type) {
        case "PUSH": {
          setGraph((previous) => {
            const previousHeadNode =
              previous.nodes.find((node) => node.data.isHead) ??
              previous.nodes.reduce<Node | null>(
                (a, b) => (a && a.position.y > b.position.y ? a : b),
                null
              );
            const newNodeId = uuidV4();
            return {
              nodes: [
                ...previous.nodes.map((node) => ({
                  ...node,
                  data: { ...node.data, isHead: false },
                })),
                {
                  id: newNodeId,
                  data: {
                    isHead: true,
                    sourceLocation: message.sourceLocation,
                    preview: message.preview,
                  },
                  position: previousHeadNode
                    ? {
                        x: previousHeadNode.position.x,
                        y: previousHeadNode.position.y + 90,
                      }
                    : { x: 40, y: 40 },
                },
              ],
              edges: previousHeadNode
                ? previous.edges.concat({
                    id: uuidV4(),
                    source: previousHeadNode.id,
                    sourceHandle: nodeRendererHandleIds.bottom,
                    target: newNodeId,
                    targetHandle: nodeRendererHandleIds.top,
                  })
                : previous.edges,
            };
          });
          break;
        }
        case "POP": {
          setGraph((previous) => {
            const headNode = previous.nodes.find((node) => node.data.isHead);
            if (!headNode) return previous;
            const lastNode = getIncomers(
              headNode,
              previous.nodes,
              previous.edges
            ).at(-1);
            if (lastNode) {
              const message: WebviewToExtensionMessage = {
                type: "JUMP",
                sourceLocation: lastNode.data.sourceLocation,
              };
              vscode.postMessage(message);
            }
            return {
              ...previous,
              nodes: previous.nodes
                .filter((node) => node.id !== headNode.id)
                .map((previousNode) => ({
                  ...previousNode,
                  data: {
                    ...previousNode.data,
                    isHead: previousNode.id === lastNode?.id,
                  },
                })),
            };
          });
          break;
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  });

  return (
    <div
      style={{ width: "100%", height: "100%" }}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node: Node) => {
          setGraph((previous) => ({
            ...previous,
            nodes: previous.nodes.map((previousNode) => ({
              ...previousNode,
              data: {
                ...previousNode.data,
                isHead: previousNode.id === node.id,
              },
            })),
          }));
        }}
        onNodeDoubleClick={(_, node: Node) => {
          const message: WebviewToExtensionMessage = {
            type: "JUMP",
            sourceLocation: node.data.sourceLocation,
          };
          vscode.postMessage(message);
        }}
        defaultEdgeOptions={defaultEdgeOptions}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode="Shift"
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
