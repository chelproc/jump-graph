import * as vscode from "vscode";
import { webViewContent } from "./webview";
import type {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from "../types";

export default class JumpGraphEditor {
  private readonly document: vscode.TextDocument;
  private readonly webviewPanel: vscode.WebviewPanel;
  private lastSavedMinifiedJson: string | null = null;

  onDidBecomeActive?: () => void;
  onDidClose?: () => void;
  getLastActiveViewColumn?: () => vscode.ViewColumn | undefined;

  constructor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ) {
    this.document = document;
    this.webviewPanel = webviewPanel;

    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = webViewContent;
    webviewPanel.webview.onDidReceiveMessage(this.handleMessage.bind(this));
    webviewPanel.onDidChangeViewState(() => {
      if (webviewPanel.active) this.onDidBecomeActive?.();
    });
    const subscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() !== document.uri.toString()) return;
      this.syncDocument();
    });
    webviewPanel.onDidDispose(() => {
      subscription.dispose();
      this.onDidClose?.();
    });
  }

  private handleMessage(message: WebviewToExtensionMessage) {
    switch (message.type) {
      case "INIT": {
        this.syncDocument();
        break;
      }
      case "JUMP": {
        const position = new vscode.Position(
          message.sourceLocation.line,
          message.sourceLocation.character
        );
        vscode.window.showTextDocument(
          vscode.Uri.parse(
            JumpGraphEditor.denormalizeUriString(message.sourceLocation.uri),
            true
          ),
          {
            viewColumn:
              this.getLastActiveViewColumn?.() ?? vscode.ViewColumn.One,
            selection: new vscode.Selection(position, position),
            preview: true,
          }
        );
        break;
      }
      case "SYNC": {
        const minifiedJson = JSON.stringify(message.data);
        if (minifiedJson === this.lastSavedMinifiedJson) break;
        this.lastSavedMinifiedJson = minifiedJson;
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
          this.document.uri,
          new vscode.Range(0, 0, this.document.lineCount, 0),
          JSON.stringify(message.data, null, 2)
        );
        vscode.workspace.applyEdit(edit);
        break;
      }
    }
  }

  private sendMessage(message: ExtensionToWebviewMessage) {
    this.webviewPanel.webview.postMessage(message);
  }

  syncDocument() {
    try {
      const text = this.document.getText();
      const jsonParsedObject = text
        ? JSON.parse(text)
        : { nodes: [], edges: [] };
      const minifiedJson = JSON.stringify(jsonParsedObject);
      if (minifiedJson === this.lastSavedMinifiedJson) return;
      this.lastSavedMinifiedJson = minifiedJson;
      this.sendMessage({
        type: "SYNC",
        data: jsonParsedObject,
      });
    } catch {
      vscode.window.showErrorMessage("Jump Graph: Failed to parse JSON");
    }
  }

  pushCurrentSourceLocation() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    this.sendMessage({
      type: "PUSH",
      sourceLocation: {
        uri: JumpGraphEditor.normalizeUriString(editor.document.uri.toString()),
        line: editor.selection.active.line,
        character: editor.selection.active.character,
      },
      note: editor.document.lineAt(editor.selection.active).text.trim(),
    });
  }

  popHeadNode() {
    this.sendMessage({ type: "POP" });
  }

  static getRootUri() {
    const rootUriCandidate =
      vscode.workspace.workspaceFolders?.[0]?.uri.toString();
    return vscode.workspace.workspaceFolders?.length === 1 && rootUriCandidate
      ? rootUriCandidate
      : undefined;
  }

  static normalizeUriString(uriString: string) {
    const rootUri = JumpGraphEditor.getRootUri();
    return rootUri && uriString.startsWith(rootUri)
      ? `workspace://${uriString.slice(rootUri.length)}`
      : uriString;
  }

  static denormalizeUriString(uriString: string) {
    const rootUri = JumpGraphEditor.getRootUri();
    return rootUri && uriString.startsWith("workspace://")
      ? `${rootUri}${uriString.slice("workspace://".length)}`
      : uriString;
  }
}
