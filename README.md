# YouTube CRT Shader

A Violentmonkey userscript that applies a real-time CRT monitor effect
to YouTube's video player using WebGL. Barrel warp, real bloom
(bright-pass + blur), scanlines, VHS-style color bleed, phosphor tint,
an ambient glow so it never looks flat on dim scenes, a dot-matrix
border fade around the edges, and a render-scale slider for weaker hardware.

## Install

1. Install [Violentmonkey](https://violentmonkey.github.io/) in your browser.
2. Open `crt-overlay.js` from this repo, copy its contents.
3. In Violentmonkey's dashboard, create a new script and paste it in.
4. Go to any YouTube video.

## Controls

Press **Ctrl+Alt+C** to open the control panel. Every parameter is
live-adjustable: scanline intensity/count, bloom strength/threshold,
ambient glow, barrel warp, vignette, color bleed, tint color +
strength, and a render-scale slider for performance. There's also a
master on/off toggle at the top. Settings are saved automatically and
persist across reloads.

**Render scale** renders the shader at fewer internal pixels than the
video's on-screen size (same "Dynamic Resolution Scaling" idea games
use), then lets the browser stretch it to fit. This mainly exists for performance and optimization purposes. So if you've got a very weak GPU or a very old machine, lowering the render scale should help. Lowering it also affects bloom spread and scanline
clarity as a side effect of rendering at lower resolution, so scanline
intensity/count and bloom strength/threshold are automatically
compensated to keep the look reasonably consistent across scales. When
render scale is below 1.0, those four sliders show `your value →
effective value` next to the number, so you can see exactly what's
being applied versus what you've actually set dragging render scale
back to 1.0 always restores your exact original settings.

The rounded-corner mask and the dot-matrix border fade are not
user-tunable. This was a deliberate decision I made to hardcode those values since I saw no reason for them to be tweakable after I had already tweaked with them and gotten the effect I wanted. Both stay a constant on-screen size
regardless of render scale.

## Files

- `crt-overlay.js`: this is the actual userscript.

## Known limitations

- Not tested against ad playback specifically.
- Not tested on Shorts or embedded players — built and tested against
  the standard `/watch` page layout.
- At very low render scale, bloom spread and scanline aliasing are
  compensated but it isn't perfect. This is a known existing gap because there's no exact inverse formula for
  this, just reasonable heuristic tuning. If it ever needs retuning,
  the four `eff*` multipliers in `renderRealBloom()` are the place to
  look, and each is commented with which visual symptom it controls.

## Notes for future development

This works by injecting a canvas directly into YouTube's own player DOM
(not floating above it), tracking the real `<video>` element's live
position/size every frame, and drawing the shaded result on top of it
while the original video is hidden (not removed, so audio/decoding
still work normally). A separate MutationObserver-based watcher handles
YouTube's SPA navigation between videos.

Rendering itself is driven by `requestVideoFrameCallback` where
available (fires only when the browser has a genuinely new decoded
video frame, never while paused), with a full fallback to rendering
every animation frame on browsers without it. Because of this, any
code path that needs to force a redraw outside of normal playback
(after a resize, after a panel setting change) has to explicitly call
`renderRealBloom()` itself it won't happen automatically just because
time passed, the way it would with a plain `requestAnimationFrame`
loop. Two real bugs came from forgetting this: a blank canvas after
toggling fullscreen while paused, and panel sliders not visibly doing
anything while paused. Both are fixed (search `pipelineReady` in the
code), but worth remembering if adding new render-affecting logic.

Ordering hazard worth knowing about if editing this file: several
pieces of state (`sceneFBO`, `forceRenderOnce`-style flags,
`pipelineReady`) are deliberately declared near the TOP of `initCRT()`
rather than near where they're conceptually used, because
`syncPlayerToVideo()` runs once immediately (before the rest of the
pipeline shader programs, textures, bloom FBOs is set up further
down the script). Referencing a `let`/`const` from code that runs
before its own declaration line has executed throws a
ReferenceError this bit us more than once during development.

## Version history

**1.1.0**
- Switched rendering to `requestVideoFrameCallback` (with fallback)
  fixes redundant re-rendering/re-uploading of unchanged frames while
  paused, without reintroducing the seek/resume jitter a naive
  "skip when paused" approach caused earlier.
- Added a render-scale slider (Dynamic Resolution Scaling) for weaker
  hardware, with compensation math to keep the look consistent across
  scales, and live `value → effective value` panel feedback.
- Added ambient glow, the dot-matrix border fade, and the rounded-
  corner mask (computed in-shader, not CSS).
- Fixed: scanline intensity slider silently doing nothing (only the
  since-removed page-wide overlay ever read that uniform correctly).
- Fixed: cross-tab jitter (idle videos on other YouTube tabs burning a
  full render loop).
- Fixed: black screen on DRM/tainted-canvas upload failure now falls
  back to the real video instead of a permanently dead canvas.
- Fixed: a `ResizeObserver`/keydown-listener/WebGL-context leak on
  repeated init/teardown cycles.
- Redesigned the control panel's visual style.

**1.0.0**
- Initial working version: barrel warp, real bloom, scanlines, color
  bleed, phosphor tint, full control panel with persistence, SPA
  navigation handling, stale-frame-on-nav fix, Trusted Types CSP
  workaround.
