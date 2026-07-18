import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

/**
 * Mounts the React application into the Vite root element.
 */
function bootstrapApp() {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrapApp();
