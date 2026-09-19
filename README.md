# YouTube CRT Shader

A Violentmonkey userscript that applies a real-time CRT monitor effect
to YouTube's video player using WebGL — barrel warp, real bloom
(bright-pass + blur, not a cheap fake), scanlines, VHS-style color
bleed, phosphor tint, and an ambient glow so it never looks flat on
dim scenes.

## Install

1. Install [Violentmonkey](https://violentmonkey.github.io/) in your browser.
2. Open `crt-overlay.js` from this repo, copy its contents.
3. In Violentmonkey's dashboard, create a new script and paste it in.
4. Go to any YouTube video.

## Controls

Press **Ctrl+Alt+C** to open the control panel. Every parameter is
live-adjustable: scanline intensity/count, bloom strength/threshold,
ambient glow, barrel warp, vignette, color bleed, and tint color +
strength. There's also a master on/off toggle at the top. Settings are
saved automatically and persist across reloads.

## Files

- `crt-overlay.js` — the actual userscript.

## Known limitations

- Not tested against ad playback specifically.
- Not tested on Shorts or embedded players — built and tested against
  the standard `/watch` page layout.

## Notes for future development

This works by injecting a canvas directly into YouTube's own player DOM
(not floating above it), tracking the real `<video>` element's live
position/size every frame, and drawing the shaded result on top of it
while the original video is hidden (not removed, so audio/decoding
still work normally). A separate MutationObserver-based watcher handles
YouTube's SPA navigation between videos.

## Performance notes (not yet acted on)

Profiling (step 7) showed steady 60fps in real use with acceptable CPU
overhead, so none of this was urgent enough to act on. Left here for
if it ever does matter (weaker hardware, wanting lower battery/CPU
draw, etc).

- **Full render pipeline runs every frame even when the video is
  paused, as long as the tab is visible.** Background-tab idling is
  already handled (skips work via `document.hidden`), but a paused
  video in the ACTIVE tab still redraws the identical frame 60x/sec —
  full texture upload, scene shader, bright-pass, 2 blur passes,
  composite. Deliberately not "fixed" the same way background tabs
  were, because tying render skipping to `video.paused` instead of tab
  visibility is exactly what caused the seek/resume jitter bug earlier
  in this project — so any fix here needs to be more careful than a
  naive "skip when paused" (e.g. only skip after N consecutive
  identical frames, or skip but keep a low-rate heartbeat render).
- **`texImage2D` uploads the full video frame every frame**, regardless
  of whether playback actually advanced. This is one of the more
  expensive individual calls in the pipeline.
- **Bright-pass samples a 3x3 neighborhood** (9 texture reads per
  output pixel) instead of 1 — necessary for correctness (fixes the
  cinema-mode bloom-disappearing bug), but real added cost. Not worth
  reverting, just worth knowing where the extra cost comes from.
- **`syncPlayerToVideo()` calls `getBoundingClientRect()` twice every
  frame** (video + its parent), regardless of whether anything actually
  moved or resized. Could cache and only re-check on a lower-rate timer
  or via ResizeObserver/IntersectionObserver instead of every frame.
