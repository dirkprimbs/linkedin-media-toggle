# LinkedIn Media Toggle

A browser extension that hides or shows the images and videos in LinkedIn
feed posts, each with its own switch. Click the toolbar button for the two
switches, or use the shortcuts: **Alt+Shift+P** for images, **Alt+Shift+V**
for videos (**Alt+Shift+M** opens the switches). The badge shows what is
hidden: `img`, `vid` or `i+v`. The settings apply to all open LinkedIn tabs
and persist across browser restarts.

Only media that is part of a post is touched:

- **Images:** post photos and carousels, link-preview and document thumbnails,
  images posted in comments, and LinkedIn's celebration graphics.
- **Videos:** the video player with its cover image and play button. Hidden
  videos are paused too, so nothing plays in the background.
- **Never hidden:** profile pictures, company and group logos, emoji, reaction
  icons and other interface graphics.

Posts collapse to their text; no empty boxes are left. Only the main feed
(`/feed/`) is affected, not profiles or single-post pages.

## Install

**Chrome / Chromium / Edge / Brave:** open `chrome://extensions`, turn on
*Developer mode*, click *Load unpacked*, and pick this folder. Change the
shortcuts at `chrome://extensions/shortcuts`.

**Firefox (121+):** open `about:debugging#/runtime/this-firefox`, click *Load
Temporary Add-on*, and pick `manifest.json`. Temporary add-ons are removed when
Firefox restarts; a permanent install needs the extension signed through
addons.mozilla.org.

## How it finds media

LinkedIn's CSS class names are generated and change with every deploy, so the
extension ignores them. It relies on things that have stayed put:

- the feed container, `[data-testid="mainFeed"]`
- video.js players, `[data-vjs-player]`
- the kind of image named in its URL: post media live under `/dms/image/`,
  while avatars and logos say `profile-displayphoto`, `company-logo` and so on

If LinkedIn changes one of these, `content.css` and `content.js` are the two
places to update. Checked against the live feed on 2026-10-27.
