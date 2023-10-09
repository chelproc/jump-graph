export type SourceLocation = {
  uri: string;
  line: number;
  character: number;
};

export type ExtensionToWebviewMessage =
  | {
      type: "PUSH";
      sourceLocation: SourceLocation;
      note: string;
    }
  | { type: "POP" }
  | { type: "SYNC"; data: any };

export type WebviewToExtensionMessage =
  | { type: "INIT" }
  | {
      type: "JUMP";
      sourceLocation: SourceLocation;
    }
  | { type: "SYNC"; data: any };
