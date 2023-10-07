import * as vscode from "vscode";
import { webViewContent } from "./webview";
import type {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from "../types";

let webviewPanel: vscode.WebviewPanel | null = null;

export function activate(context: vscode.ExtensionContext) {
  const openCommand = vscode.commands.registerCommand("jump-graph.open", () => {
    if (webviewPanel) {
      webviewPanel.reveal();
      return;
    }
    webviewPanel = vscode.window.createWebviewPanel(
      "jump-graph.main",
      "Jump Graph",
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    webviewPanel.webview.html = webViewContent;
    webviewPanel.webview.onDidReceiveMessage(
      async (message: WebviewToExtensionMessage) => {
        switch (message.type) {
          case "JUMP": {
            const position = new vscode.Position(
              message.sourceLocation.line,
              message.sourceLocation.character
            );
            vscode.window.showTextDocument(
              vscode.Uri.parse(message.sourceLocation.uri, true),
              {
                viewColumn: vscode.ViewColumn.One,
                selection: new vscode.Selection(position, position),
                preview: true,
              }
            );
            break;
          }
        }
      }
    );
  });
  const pushCommand = vscode.commands.registerCommand("jump-graph.push", () => {
    if (!webviewPanel) return;
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const message: ExtensionToWebviewMessage = {
      type: "PUSH",
      sourceLocation: {
        uri: editor.document.uri.toString(),
        line: editor.selection.active.line,
        character: editor.selection.active.character,
      },
      preview: editor.document.lineAt(editor.selection.active).text.trim(),
    };
    webviewPanel.webview.postMessage(message);
  });
  const popCommand = vscode.commands.registerCommand("jump-graph.pop", () => {
    if (!webviewPanel) return;
    const message: ExtensionToWebviewMessage = {
      type: "POP",
    };
    webviewPanel.webview.postMessage(message);
  });
  context.subscriptions.push(openCommand, pushCommand, popCommand);
}

export function deactivate() {}
