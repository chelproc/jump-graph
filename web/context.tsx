import {
  createContext,
  useContext,
  type ReactNode,
  useState,
  useCallback,
} from "react";
import type { Graph, Node } from "./types";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  getIncomers,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "reactflow";
import { v4 as uuidV4 } from "uuid";
import { nodeRendererHandleIds } from "./NodeRenderer";
import type { SourceLocation } from "../types";

type EditorContext = {
  graph: Graph;
  setGraph: (graph: Graph) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodeAsHead: (nodeId: string) => void;
  pushNode: (sourceLocation: SourceLocation, note: string) => void;
  popNode: (onDidReturnToNode: (node: Node) => void) => void;
  updateNodeNote: (nodeId: string, note: string) => void;
};

const editorContext = createContext<EditorContext | null>(null);

export function EditorContextProvider({
  children,
  initialGraph,
}: {
  children: ReactNode;
  initialGraph: Graph;
}) {
  const [graph, setGraph] = useState(initialGraph);

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

  const setNodeAsHead = useCallback(
    (nodeId: string) =>
      setGraph((previous) => ({
        ...previous,
        nodes: previous.nodes.map((previousNode) => ({
          ...previousNode,
          data: {
            ...previousNode.data,
            isHead: previousNode.id === nodeId,
          },
        })),
      })),
    [setGraph]
  );

  const pushNode = useCallback(
    (sourceLocation: SourceLocation, note: string) => {
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
              data: { isHead: true, sourceLocation, note },
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
    },
    [setGraph]
  );

  const popNode = useCallback(
    (onDidReturnToNode?: (node: Node) => void) => {
      setGraph((previous) => {
        const headNode = previous.nodes.find((node) => node.data.isHead);
        if (!headNode) return previous;
        const lastNode = getIncomers(
          headNode,
          previous.nodes,
          previous.edges
        ).at(-1);
        if (lastNode) onDidReturnToNode?.(lastNode);
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
    },
    [setGraph]
  );

  const updateNodeNote = useCallback(
    (nodeId: string, note: string) =>
      setGraph((previous) => ({
        ...previous,
        nodes: previous.nodes.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, note } } : node
        ),
      })),
    [setGraph]
  );

  return (
    <editorContext.Provider
      value={{
        graph,
        setGraph,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setNodeAsHead,
        pushNode,
        popNode,
        updateNodeNote,
      }}
    >
      {children}
    </editorContext.Provider>
  );
}

export function useEditorContext(): EditorContext {
  const context = useContext(editorContext);
  if (!context) throw new Error("No EditorContextProvider");
  return context;
}
