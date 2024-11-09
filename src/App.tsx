import { useEffect, useState } from 'react';
import { Slider } from '@/components/ui/slider';

import { SpeakerNone, SpeakerSimpleHigh } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from './components/theme-provider';

function App() {
  const [volume, setVolume] = useState(1);
  const [tabId, setTabId] = useState<number | null>(null);

  // Update volume when slider changes
  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0]);
  };

  // Function to save volume level for a specific tab in storage
  const saveVolume = (tabId: number, volume: number) => {
    chrome.storage.local.set({ [tabId.toString()]: volume });
  };

  // Function to get the saved volume level for a specific tab
  const getVolume = (
    tabId: number,
    callback: (volume: number | undefined) => void
  ) => {
    chrome.storage.local.get([tabId.toString()], (result) => {
      callback(result[tabId.toString()]);
    });
  };

  // Get current tab ID and load saved volume
  useEffect(() => {
    if (chrome.runtime)
      // Get the current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTabId = tabs[0]?.id;
        if (currentTabId) {
          setTabId(currentTabId); // Ensure currentTabId is not undefined
          // Load the saved volume for this tab
          getVolume(currentTabId ?? 0, (savedVolume) => {
            setVolume(savedVolume ?? 1); // Default to 100% if no saved volume
          });
        }
      });
  }, []);

  // Save the volume level when it changes
  useEffect(() => {
    if (tabId) {
      saveVolume(tabId, volume);
      applyVolumeToTab(tabId, volume);
    }
  }, [volume, tabId]);

  // Function to apply the volume to the tab
  const applyVolumeToTab = (_: number, volume: number) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id as number },
        func: (level: number) => {
          document.querySelectorAll('audio, video').forEach((mediaElement) => {
            if (mediaElement instanceof HTMLMediaElement) {
              mediaElement.volume = level;
            }
          });

          // Create a MutationObserver to watch for new audio and video elements
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              mutation.addedNodes.forEach((node) => {
                // Check if the node is an element and has a tagName property
                if (node instanceof HTMLElement) {
                  // Directly set volume if the node is an audio or video element
                  if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
                    if (node instanceof HTMLMediaElement) {
                      node.volume = level;
                    }
                  }

                  // Also set volume for any nested audio or video elements within this node
                  node
                    .querySelectorAll('audio, video')
                    .forEach((mediaElement) => {
                      if (mediaElement instanceof HTMLMediaElement) {
                        mediaElement.volume = level;
                      }
                    });
                }
              });
            });
          });

          // Observe the document body for changes to its child elements
          observer.observe(document.body, { childList: true, subtree: true });
        },
        args: [volume], // Volume level (0.0 to 1.0)
      });
    });
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="px-4 py-3 w-[345px] bg-[#2A2A2A] text-white flex flex-col gap-y-3.5">
        <h2 className="text-lg font-semibold">Sound Control</h2>

        <div className="flex gap-4 items-center ">
          <div>
            <p className="text-sm">Volume</p>
          </div>
          <div className="flex flex-1 gap-2 items-center">
            <Button
              className="rounded-full "
              variant="outline"
              size="icon"
              onClick={() => handleVolumeChange([0])}
            >
              <SpeakerNone />
            </Button>
            <Slider
              className="w-full flex-1"
              defaultValue={[1]}
              value={[volume]}
              max={1}
              step={0.01}
              min={0}
              onValueChange={handleVolumeChange}
            />
            <Button
              variant="outline"
              className="rounded-full "
              size="icon"
              onClick={() => handleVolumeChange([1])}
            >
              <SpeakerSimpleHigh />
            </Button>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
