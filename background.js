// Owns the two switches, hideImages and hideVideos, in storage. The popup and
// the keyboard shortcuts flip them; every LinkedIn tab's content script listens
// for the change, so all open tabs switch together and the choice survives
// restarts. This script also keeps the toolbar badge in step.

const KEYS = ["hideImages", "hideVideos"];

async function showState() {
  const { hideImages = false, hideVideos = false } = await chrome.storage.local.get(KEYS);
  const text = hideImages && hideVideos ? "i+v" : hideImages ? "img" : hideVideos ? "vid" : "";
  const hidden = [hideImages && "images", hideVideos && "videos"].filter(Boolean);
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: "#555" });
  await chrome.action.setTitle({
    title: hidden.length
      ? `LinkedIn feed: ${hidden.join(" and ")} hidden`
      : "LinkedIn feed: images and videos shown",
  });
}

const COMMANDS = { "toggle-images": "hideImages", "toggle-videos": "hideVideos" };

chrome.commands.onCommand.addListener(async (command) => {
  const key = COMMANDS[command];
  if (!key) return;
  const { [key]: current = false } = await chrome.storage.local.get(key);
  await chrome.storage.local.set({ [key]: !current });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && KEYS.some((k) => k in changes)) showState();
});

// The badge is not persisted by the browser, so restore it whenever the
// background starts.
showState();
