import { createRoot } from "react-dom/client";
import "reactflow/dist/style.css";

import "./style.css";
import Editor, { type Graph } from "./Editor";
import { useEffect, useState } from "react";
import type { ExtensionToWebviewMessage } from "../types";
import { postMessage } from "./vscode";
import { EditorContextProvider } from "./context";

const rootElement = document.createElement("div");
rootElement.style.height = "100%";
document.body.appendChild(rootElement);

createRoot(rootElement).render(<App />);

function App() {
  const [initialGraph, setInitialGraph] = useState<Graph | null>(null);
  useEffect(() => {
    const handler = ({
      data: message,
    }: MessageEvent<ExtensionToWebviewMessage>) => {
      if (message.type !== "SYNC") return;
      setInitialGraph(message.data);
      window.removeEventListener("message", handler);
    };
    postMessage({ type: "INIT" });
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  });

  return initialGraph ? (
    <EditorContextProvider initialGraph={initialGraph}>
      <Editor />
    </EditorContextProvider>
  ) : (
    <>Loading...</>
  );
}
