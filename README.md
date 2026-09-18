# YouTube CRT Shader

A Violentmonkey userscript that applies a real-time CRT monitor effect
to YouTube's video player using WebGL — barrel warp, real bloom
(bright-pass + blur, not a cheap fake), scanlines, VHS-style color
bleed, phosphor tint, and an ambient glow so it never looks flat on
dim scenes.

## Install

1. Install [Violentmonkey](https://violentmonkey.github.io/) in your browser.
2. Open `youtube-crt.user.js` from this repo, copy its contents.
3. In Violentmonkey's dashboard, create a new script and paste it in.
4. Go to any YouTube video.

## Controls

Press **Ctrl+Alt+C** to open the control panel. Every parameter is
live-adjustable: scanline intensity/count, bloom strength/threshold,
ambient glow, barrel warp, vignette, color bleed, and tint color +
strength. There's also a master on/off toggle at the top. Settings are
saved automatically and persist across reloads.

## Files

- `youtube-crt.user.js` — the actual userscript.
- `crt-prototype.html` — a standalone HTML version used during
  development to test the shader in isolation, before wiring it up to
  real YouTube. Not needed to use the effect; kept for reference.

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

## License MIT: See [License](LICENSE) for details
