import type {
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
  NodeProps as ReactFlowNodeProps,
} from "reactflow";
import type { SourceLocation } from "../types";

export type Graph = {
  nodes: Node[];
  edges: Edge[];
};

export type Node = ReactFlowNode<NodeData>;
export type NodeData = {
  isHead: boolean;
  sourceLocation: SourceLocation;
  note: string;
};
export type NodeProps = ReactFlowNodeProps<NodeData>;
export type Edge = ReactFlowEdge;
