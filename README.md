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
