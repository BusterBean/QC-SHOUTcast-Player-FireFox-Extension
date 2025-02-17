let fetchInterval;

document.getElementById('play').addEventListener('click', function() {
  const volume = document.getElementById('volume').value;
  browser.runtime.sendMessage({ action: 'play', volume: volume }, function(response) {
    if (response.success) {
      updateButtonStates(true);
    } else if (response.error) {
      console.error("Failed to start audio:", response.error);
    }
  });
});

document.getElementById('stop').addEventListener('click', function() {
  browser.runtime.sendMessage({ action: 'stop' }, function(response) {
    if (response.success) {
      updateButtonStates(false);
    } else if (response.error) {
      console.error("Failed to stop audio:", response.error);
    }
  });
});

document.getElementById('volume').addEventListener('input', function() {
  const volume = this.value;
  browser.runtime.sendMessage({ action: 'setVolume', volume: volume }, function(response) {
    if (!response.success) {
      console.error("Failed to set volume:", response.error);
    }
  });
  updateVolumePercentage(volume);
});

function updateButtonStates(isPlaying) {
  document.getElementById('play').disabled = isPlaying;
  document.getElementById('stop').disabled = !isPlaying;
}

function updateVolumePercentage(volume) {
  const percentage = Math.round(volume * 100);
  document.getElementById('volume-percentage').textContent = `${percentage}%`;
}

function updateSongTitle(title) {
  document.getElementById('song-title').textContent = title;
}

function fetchSongTitle() {
  fetch('https://radio.queercraft.net:443/stream/currentsong')
    .then(response => response.text())
    .then(title => {
      updateSongTitle(title);
      browser.storage.local.set({ songTitle: title });
    })
    .catch(error => {
      console.error("Failed to fetch song title:", error);
    });
}

function startFetchingSongTitle() {
  fetchSongTitle();
  fetchInterval = setInterval(fetchSongTitle, 5000);
}

function stopFetchingSongTitle() {
  clearInterval(fetchInterval);
}

document.addEventListener('DOMContentLoaded', () => {
  startFetchingSongTitle();
});

window.addEventListener('beforeunload', () => {
  stopFetchingSongTitle();
});

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.songTitle) {
    updateSongTitle(changes.songTitle.newValue);
  }
});

browser.storage.local.get(['playing', 'volume', 'songTitle'], (result) => {
  updateButtonStates(result.playing);
  const volume = result.volume || 0.32; // Default volume
  document.getElementById('volume').value = volume;
  updateVolumePercentage(volume);
  updateSongTitle(result.songTitle || 'Unknown');
});
