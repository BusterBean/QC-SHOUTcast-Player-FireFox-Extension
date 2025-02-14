let audio;

browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({ playing: false, volume: 0.32, songTitle: '' });
}); // Default = 0.32

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'play') {
    browser.storage.local.get('volume', (result) => {
      if (!audio) {
        audio = new Audio('https://radio.queercraft.net:443/stream/;'); // New station URL
        audio.volume = result.volume; // Set initial volume from storage
      }
      audio.play().then(() => {
        browser.storage.local.set({ playing: true });
        browser.browserAction.setIcon({
          path: {
            "16": "icons/icon16_playing.png",
            "32": "icons/icon32_playing.png",
            "48": "icons/icon48_playing.png",
            "64": "icons/icon64_playing.png",
            "128": "icons/icon128_playing.png"
          }
        });
        sendResponse({ success: true });
      }).catch(error => {
        console.error("Error playing audio:", error);
        sendResponse({ success: false, error: error.message });
      });
      // Start periodic fetching of song title
      fetchSongTitle();
      setInterval(fetchSongTitle, 5000);
    });
  } else if (message.action === 'stop') {
    if (audio) {
      audio.pause();
      audio.src = ''; // Reset the audio source to stop the stream
      audio = null; // Clear the audio object
      browser.storage.local.set({ playing: false });
      browser.browserAction.setIcon({
        path: {
          "16": "icons/icon16.png",
          "32": "icons/icon32.png",
          "48": "icons/icon48.png",
          "64": "icons/icon64.png",
          "128": "icons/icon128.png"
        }
      });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "No audio to stop" });
    }
  } else if (message.action === 'setVolume') {
    if (audio) {
      audio.volume = message.volume;
    }
    browser.storage.local.set({ volume: message.volume }); // Store volume in storage
    sendResponse({ success: true });
  }
  return true; // Ensure sendResponse is valid asynchronously
});

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.playing) {
    if (!changes.playing.newValue && audio) {
      audio.pause();
    }
  }
});

function fetchSongTitle() {
  fetch('http://mc.queercraft.net:8008/currentsong')
    .then(response => response.text())
    .then(title => {
      browser.storage.local.set({ songTitle: title });
    })
    .catch(error => {
      console.error("Failed to fetch song title:", error);
    });
}
