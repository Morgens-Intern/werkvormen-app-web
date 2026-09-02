import * as React from "react";
import { createRoot } from "react-dom/client";
import "./global.css";
import App from "./App";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Kon het element #root niet vinden in index.html");
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
