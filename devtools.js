chrome.devtools.panels.create(
  "UI Copilot",
  "icon.png",
  "devtools-panel.html",
  (panel) => {
    console.log("UI Copilot DevTools panel created");
  }
);

chrome.devtools.panels.create(
  "Design Tokens",
  "icon.png",
  "devtools-tokens.html",
  (panel) => {
    console.log("Design Tokens panel created");
  }
);