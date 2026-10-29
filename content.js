// Hides post images and post videos in the LinkedIn feed, each on its own
// switch (hideImages / hideVideos in storage). content.css does the hiding;
// this script turns it on and off, sorts each piece of media into "image" or
// "video", collapses the empty wrappers left around it, and keeps videos from
// playing (sound included) while they are out of sight. Each post with hidden
// media also gets a small button to show just that post's media. Two more
// switches, hideNews and hidePuzzles, only toggle classes for content.css.

const FEED = '[data-testid="mainFeed"]';
const PLAYER = "[data-vjs-player]";
// Image URLs that belong to people and pages rather than to a post.
const NOT_POST_IMAGE = /profile-displayphoto|profile-framedphoto|profile-displaybackgroundimage|company-logo|group-logo/;
const MARK = "data-lmt-media";
const POST = '[role="listitem"]';
const SHOWN = "data-lmt-shown";
const BUTTON = "lmt-post-toggle";

const state = { hideImages: false, hideVideos: false, hideNews: false, hidePuzzles: false };
const KEYS = Object.keys(state);

// "video" for a video player (its cover image and controls included),
// "image" for an image that is part of a post, null for everything else:
// avatars, logos, emoji and icons.
function mediaKind(el) {
  if (el.closest(PLAYER) || el.tagName === "VIDEO") return "video";
  if (el.tagName !== "IMG") return null;
  const src = el.currentSrc || el.getAttribute("src") || "";
  if (src.includes("/dms/image/") && !NOT_POST_IMAGE.test(src)) return "image";
  // LinkedIn's own graphics (job-change and anniversary celebrations) come
  // from /media/, like its icons and emoji do; only the graphics sit in a figure.
  if (src.includes("licdn.com/media/") && el.closest("figure")) return "image";
  return null;
}

// An element is "only" its media if it holds nothing else: no other element
// children and no text of its own. Climbing through those wrappers lets the
// whole media block collapse, not just the <img>, while stopping at the first
// ancestor that also holds the post's text, buttons or author line. Siblings
// already marked with the same kind count as gone, which is how a carousel
// strip collapses once all its images are marked.
function holdsOnly(parent, child, kind) {
  for (const node of parent.childNodes) {
    if (node === child || node.classList?.contains(BUTTON)) continue;
    if (node.nodeType === Node.ELEMENT_NODE && node.getAttribute(MARK) !== kind) return false;
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) return false;
  }
  return true;
}

// Video posts put their big play button next to the player rather than inside
// it, and some images carry a "content credentials" badge beside them; either
// would be left floating in an empty box. Icon-only buttons beside a piece of
// media count as part of it.
function markIconButtons(node, kind) {
  for (const sibling of node.parentElement.children) {
    if (sibling !== node && sibling.tagName === "BUTTON" && !sibling.textContent.trim()) {
      sibling.setAttribute(MARK, kind);
    }
  }
}

function markMedia() {
  const feed = document.querySelector(FEED);
  if (!feed) return;
  for (const el of feed.querySelectorAll(`img, video, ${PLAYER}`)) {
    if (el.hasAttribute(MARK)) continue;
    const kind = mediaKind(el);
    if (!kind) continue;
    let node = el.closest(PLAYER) || el;
    node.setAttribute(MARK, kind);
    while (node.parentElement && node.parentElement !== feed &&
           !node.parentElement.matches(POST)) {
      markIconButtons(node, kind);
      if (!holdsOnly(node.parentElement, node, kind)) break;
      node = node.parentElement;
      node.setAttribute(MARK, kind);
    }
  }
  for (const post of feed.querySelectorAll(POST)) placeButton(post);
}

// What the post's button would show or hide: the kinds of media it holds that
// are switched off. Empty if there is nothing to toggle.
function hiddenKinds(post) {
  return [
    state.hideImages && post.querySelector(`[${MARK}="image"]`) && "image",
    state.hideVideos && post.querySelector(`[${MARK}="video"]`) && "video",
  ].filter(Boolean);
}

function label(post) {
  const kinds = hiddenKinds(post);
  const what = kinds.length > 1 ? "media" : kinds[0] || "media";
  return `${post.hasAttribute(SHOWN) ? "Hide" : "Show"} ${what}`;
}

// Puts the button just before the outermost hidden wrapper of the post's
// first piece of media, so it sits where that media was. Wrappers can grow
// outward on later passes (a carousel collapses as its images load), so the
// button is moved out again if it ends up inside one. Only touches the DOM
// when something changed, since every change wakes the observer below.
function placeButton(post) {
  let top = post.querySelector(`[${MARK}]`);
  if (!top) return;
  while (top.parentElement !== post && top.parentElement.hasAttribute(MARK)) top = top.parentElement;
  let button = post.querySelector(`.${BUTTON}`);
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = BUTTON;
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePost(post);
    });
  }
  if (button.nextElementSibling !== top) top.before(button);
  const text = label(post);
  if (button.textContent !== text) button.textContent = text;
}

function togglePost(post) {
  const shown = post.toggleAttribute(SHOWN);
  if (!shown) post.querySelectorAll("video").forEach((v) => v.pause());
  placeButton(post);
}

function pauseFeedVideos() {
  for (const v of document.querySelectorAll(`${FEED} video`)) {
    if (!v.closest(`[${SHOWN}]`)) v.pause();
  }
}

function apply(changes) {
  Object.assign(state, changes);
  const root = document.documentElement.classList;
  root.toggle("lmt-hide-images", state.hideImages);
  root.toggle("lmt-hide-videos", state.hideVideos);
  root.toggle("lmt-hide-news", state.hideNews);
  root.toggle("lmt-hide-puzzles", state.hidePuzzles);
  if (state.hideImages || state.hideVideos) markMedia();
  if (state.hideVideos) pauseFeedVideos();
}

// LinkedIn starts videos from script as they scroll into view. Catch every
// play event on the way down and stop it while videos are hidden, unless the
// post has been opened with its own button.
document.addEventListener("play", (e) => {
  if (state.hideVideos && e.target.closest?.(FEED) && !e.target.closest(`[${SHOWN}]`)) e.target.pause();
}, true);

// The feed loads posts as you scroll and fills in image sources lazily, so
// re-mark after DOM changes, batched to one pass per animation frame.
let queued = false;
new MutationObserver(() => {
  if (!(state.hideImages || state.hideVideos) || queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    markMedia();
  });
}).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });

chrome.storage.local.get(KEYS).then(apply);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  const update = {};
  for (const key of KEYS) {
    if (key in changes) update[key] = changes[key].newValue ?? false;
  }
  apply(update);
});
