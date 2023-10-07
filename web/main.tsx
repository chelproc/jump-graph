import { createRoot } from "react-dom/client";
import "reactflow/dist/style.css";

import "./style.css";
import App from "./App";

const rootElement = document.createElement("div");
rootElement.style.height = "100%";
document.body.appendChild(rootElement);
createRoot(rootElement).render(<App />);
