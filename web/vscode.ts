import type { WebviewToExtensionMessage } from "../types";

const vscode = window.acquireVsCodeApi();
export function postMessage(message: WebviewToExtensionMessage) {
  vscode.postMessage(message);
}
