import * as React from "react";
import { createRoot } from "react-dom/client";
import "./global.css";
import Werkvormen from "./components/Werkvormen";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Kon het element #root niet vinden in index.html");
}

createRoot(container).render(
  <React.StrictMode>
    <Werkvormen
      description="Morgens Werkvormen"
      isDarkTheme={false}
      environmentMessage=""
      userDisplayName="Gast"
    />
  </React.StrictMode>
);
