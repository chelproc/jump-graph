import { Handle, Position } from "reactflow";
import type { NodeProps } from "./types";

const targetHandleCommonStyle = {
  position: "absolute",
  opacity: 0,
  border: "none",
  borderRadius: 0,
  pointerEvents: "none",
  width: "10px",
  height: "10px",
  transform: "translate(-5px, -5px)",
} as const;

export const nodeRendererHandleIds = {
  top: "top",
  right: "right",
  bottom: "bottom",
  left: "left",
} as const;

export default ({ data }: NodeProps) => {
  return (
    <div
      style={{
        padding: "6px",
        backgroundColor: data.isHead ? "#ddffff" : "unset",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: "1.1em" }}>
        {[
          data.sourceLocation.uri.split("/").pop(),
          data.sourceLocation.line + 1,
        ].join(":")}
      </div>
      <div
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          direction: "rtl",
          whiteSpace: "nowrap",
          fontSize: "0.9em",
          color: "#666",
        }}
      >
        {data.sourceLocation.uri.split("/").slice(0, -1).join("/")}
      </div>
      <div
        style={{ marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden" }}
      >
        {data.preview}
      </div>
      <Handle
        type="source"
        id={nodeRendererHandleIds.top}
        position={Position.Top}
      />
      <Handle
        type="source"
        id={nodeRendererHandleIds.right}
        position={Position.Right}
      />
      <Handle
        type="source"
        id={nodeRendererHandleIds.bottom}
        position={Position.Bottom}
      />
      <Handle
        type="source"
        id={nodeRendererHandleIds.left}
        position={Position.Left}
      />
      <Handle
        type="target"
        id={nodeRendererHandleIds.top}
        position={Position.Top}
        style={{
          ...targetHandleCommonStyle,
          top: 0,
          left: "50%",
        }}
      />
      <Handle
        type="target"
        id={nodeRendererHandleIds.right}
        position={Position.Right}
        style={{
          ...targetHandleCommonStyle,
          top: "50%",
          left: "100%",
        }}
      />
      <Handle
        type="target"
        id={nodeRendererHandleIds.bottom}
        position={Position.Bottom}
        style={{
          ...targetHandleCommonStyle,
          top: "100%",
          left: "50%",
        }}
      />
      <Handle
        type="target"
        id={nodeRendererHandleIds.left}
        position={Position.Left}
        style={{
          ...targetHandleCommonStyle,
          top: "50%",
          left: 0,
        }}
      />
    </div>
  );
};
