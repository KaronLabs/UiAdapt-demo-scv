import React from "react";
import ReactDOM from "react-dom/client";
import "./entry.css";

const stagePath = /^\/(?:uiadapt_demo\/)?stage\/?$/.test(window.location.pathname);

async function mount() {
  const App = stagePath
    ? (await Promise.all([import("./stage/StageApp"), import("./stage/stage.css")]))[0].default
    : (
        await Promise.all([
          import("./App"),
          import("./styles.css"),
          import("wanted-sans/fonts/webfonts/variable/complete/WantedSansVariable.css"),
          import("@fontsource/ibm-plex-mono/400.css"),
          import("@fontsource/ibm-plex-mono/500.css"),
        ])
      )[0].default;

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void mount();
