// Listen for when a tab is activated
chrome.tabs.onActivated.addListener((activeInfo) => {
  const { tabId } = activeInfo;
  chrome.storage.local.get([tabId.toString()], (result) => {
    const volume = result[tabId] ?? 1; // Default to 100% volume if none saved
    applyVolumeToTab(tabId, volume);
  });
});

// Function to apply volume to a tab
function applyVolumeToTab(tabId: number, volume: number) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (volume: number) => {
      // Set volume on all audio/video elements in the tab
      document.querySelectorAll('audio, video').forEach((media) => {
        if (media instanceof HTMLMediaElement) {
          media.volume = volume;
        }
      });
    },
    args: [volume],
  });
}
