chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["lifeosBaseUrl"], (result) => {
    if (!result.lifeosBaseUrl) {
      chrome.storage.sync.set({ lifeosBaseUrl: "http://localhost:3000" });
    }
  });

  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.windowId) {
    return;
  }

  await chrome.sidePanel.open({ windowId: tab.windowId });
});
