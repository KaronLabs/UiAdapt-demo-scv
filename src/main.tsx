import React from "react";
import ReactDOM from "react-dom/client";
import "wanted-sans/fonts/webfonts/variable/complete/WantedSansVariable.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import App from "./App";
import "./styles.css";

const stagePath = /^\/(?:uiadapt_demo\/)?stage\/?$/.test(window.location.pathname);

async function mount() {
  if (stagePath) {
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((link) => link.remove());
  }

  const RootApp = stagePath
    ? (await Promise.all([import("./stage/StageApp"), import("./stage/stage.css")]))[0].default
    : App;

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <RootApp />
    </React.StrictMode>,
  );
}

void mount();
