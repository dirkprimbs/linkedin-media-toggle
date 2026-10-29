// The switches read as "show", the stored flags as "hide": a switch is on
// while its flag is false.

const SWITCHES = { images: "hideImages", videos: "hideVideos", news: "hideNews", puzzles: "hidePuzzles" };

// The puzzles sit inside the News box, so their switch has nothing to do while
// the box is hidden.
function syncPuzzles() {
  document.getElementById("puzzles").disabled = !document.getElementById("news").checked;
}

chrome.storage.local.get(Object.values(SWITCHES)).then((stored) => {
  for (const [id, key] of Object.entries(SWITCHES)) {
    const input = document.getElementById(id);
    input.checked = !stored[key];
    input.addEventListener("change", () => {
      chrome.storage.local.set({ [key]: !input.checked });
      syncPuzzles();
    });
  }
  syncPuzzles();
});

// Keep the switches right if a shortcut is pressed while the popup is open.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  for (const [id, key] of Object.entries(SWITCHES)) {
    if (key in changes) document.getElementById(id).checked = !changes[key].newValue;
  }
  syncPuzzles();
});
