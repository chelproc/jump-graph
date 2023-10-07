export type SourceLocation = {
  uri: string;
  line: number;
  character: number;
};

export type ExtensionToWebviewMessage =
  | {
      type: "PUSH";
      sourceLocation: SourceLocation;
      preview: string;
    }
  | { type: "POP" };

export type WebviewToExtensionMessage = {
  type: "JUMP";
  sourceLocation: SourceLocation;
};
