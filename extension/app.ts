import * as vscode from "vscode";
import JumpGraphEditor from "./editor";

export default class JumpGraphApp {
  jumpGraphEditors: JumpGraphEditor[] = [];
  lastActiveViewColumn?: vscode.ViewColumn;

  constructor(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.commands.registerCommand("jump-graph.new", () => {
        vscode.commands.executeCommand(
          "vscode.openWith",
          vscode.Uri.from({ scheme: "untitled", path: "Untitled.jump-graph" }),
          "jump-graph.editor"
        );
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("jump-graph.push", () => {
        this.jumpGraphEditors.at(-1)?.pushCurrentSourceLocation();
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("jump-graph.pop", () => {
        this.jumpGraphEditors.at(-1)?.popHeadNode();
      })
    );
    context.subscriptions.push(
      vscode.window.registerCustomEditorProvider(
        "jump-graph.editor",
        {
          resolveCustomTextEditor: (document, webviewPanel) => {
            const editor = new JumpGraphEditor(document, webviewPanel);
            editor.onDidBecomeActive = () => {
              this.jumpGraphEditors = this.jumpGraphEditors
                .filter((e) => e !== editor)
                .concat(editor);
            };
            editor.onDidClose = () => {
              this.jumpGraphEditors = this.jumpGraphEditors.filter(
                (e) => e !== editor
              );
            };
            editor.getLastActiveViewColumn = () => this.lastActiveViewColumn;
            this.jumpGraphEditors.push(editor);
          },
        },
        { webviewOptions: { retainContextWhenHidden: true } }
      )
    );

    this.lastActiveViewColumn =
      vscode.window.tabGroups.activeTabGroup.viewColumn;
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (!editor) return;
        this.lastActiveViewColumn = editor.viewColumn;
      })
    );
  }
}
