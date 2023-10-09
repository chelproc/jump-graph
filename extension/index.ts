import * as vscode from "vscode";
import JumpGraphApp from "./app";

export function activate(context: vscode.ExtensionContext) {
  new JumpGraphApp(context);
}

export function deactivate() {}
