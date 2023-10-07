// @ts-ignore
import css from "../dist/web.css";
// @ts-ignore
import script from "../dist/web.js";

export const webViewContent = `
  <!DOCTYPE html>
  <html lang="ja">
    <head>
      <meta charset="utf-8">
      <style>${css}</style>
    </head>
    <body>
      <script>${script}</script>
    </body>
  </html>
`;
