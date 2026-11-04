// Clicking the toolbar icon opens the side panel. The panel stays open while the
// user moves between tabs and pages, so each page can be analyzed on its own.
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
});
