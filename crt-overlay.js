// ==UserScript==
// @name        Youtube CRT Shader
// @author      Pandotra
// @description Real-time CRT monitor effect (barrel warp, real bloom, scanlines, color bleed, phosphor tint, dot-matrix border fade) for the YouTube video player.
// @namespace   Violentmonkey Scripts
// @namespace   https://github.com/shalap-pandotra/crt-overlay-yt
//
// @icon        data:image/png;base64,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
// @version     1.0.0
//
// @match       https://www.youtube.com/*
// @grant       none
//
// ==/UserScript==

(function () {
  'use strict';

  // ============================================================
  // Tuned defaults from the prototyping sessions, now live-adjustable
  // via an in-page control panel (Ctrl+Alt+C to toggle) rather than fixed.
  // Persisted to localStorage so settings survive reloads/new videos.
  // ============================================================
  const DEFAULT_PARAMS = {
    enabled: true,
    scan: 0.47, scanCount: 390, bloom: 0.75, warp: 0.055,
    vig: 0.29, bleed: 0.29, bloomThresh: 0.67, ambientGlow: 0.5,
    tintColor: '#8080c0',
    tintStrength: 0.13,
  };

  const STORAGE_KEY = 'crt-shader-settings';

  function loadParams() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return Object.assign({}, DEFAULT_PARAMS, saved);
    } catch (err) {
      console.error('[CRT] failed to load saved settings, using defaults:', err);
      return Object.assign({}, DEFAULT_PARAMS);
    }
  }

  function saveParams(p) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch (err) {
      console.error('[CRT] failed to save settings:', err);
    }
  }

  const params = loadParams();

  // Converts a "#rrggbb" hex string to a [r, g, b] triple in 0-1 range,
  // for feeding directly into a vec3 shader uniform.
  function hexToRgb01(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  // ============================================================
  // Wait for YouTube's real video element to exist. YouTube is an
  // SPA, so on first script load the player may not be there yet.
  // This is deliberately minimal — it does NOT yet handle
  // navigating between videos after the fact (that's step 6:
  // handling SPA navigation). This only handles "wait for the
  // player to first appear."
  // ============================================================
  function waitForVideo(callback) {
    const existing = document.querySelector('#movie_player video') || document.querySelector('video');
    if (existing) {
      callback(existing);
      return;
    }
    const observer = new MutationObserver(() => {
      const v = document.querySelector('#movie_player video') || document.querySelector('video');
      if (v) {
        observer.disconnect();
        callback(v);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  waitForVideo(initCRT);

  function initCRT(video) {
    // ---- inject the player canvas directly into YouTube's own player DOM ----
    // Inserted as the very next sibling after <video>, inside the same
    // parent. This is the key fix for two stacking bugs: (1) YouTube's
    // own controls are separate overlay elements painted *after* the
    // video in DOM order — inserting here, before them, means normal
    // DOM paint order puts them above us automatically, no z-index
    // guessing needed; (2) using `position: absolute` scoped to this
    // local parent (instead of `position: fixed` on document.body with
    // a huge z-index) means we no longer escape the page's normal
    // stacking order, so YouTube's sticky header correctly paints over
    // us on scroll instead of the other way around.
    //
    // IMPORTANT: we deliberately do NOT force playerParent to
    // `position: relative` here, even if it's currently `static`. CSS
    // absolute positioning resolves against the nearest POSITIONED
    // ancestor, skipping static ones — and YouTube's own script sets
    // video.style.top/left assuming that resolution point is whatever
    // ancestor is ACTUALLY positioned further up (e.g. #movie_player),
    // not this immediate parent. Forcing this parent to `relative`
    // inserts a new, closer positioning boundary that YouTube's own
    // math doesn't know about, silently breaking its previously-correct
    // offset — which is exactly what caused the video to disappear
    // (its top/left ended up resolving against the wrong box entirely).
    // By leaving this parent's position alone, our absolutely-positioned
    // playerWrap resolves against the SAME true positioned ancestor that
    // video already does, since both skip over the same static parent.
    const playerParent = video.parentNode;

    const playerWrap = document.createElement('div');
    playerWrap.id = 'crt-player-wrap';
    Object.assign(playerWrap.style, {
      // left/top/width/height are set explicitly by syncPlayerToVideo(),
      // computed from video's own actual rect — NOT from `inset: 0`,
      // which would only be correct if this wrap's containing block
      // happened to exactly match video's box, which isn't guaranteed.
      position: 'absolute', overflow: 'hidden', pointerEvents: 'none',
      borderRadius: '8px',
    });
    const canvas = document.createElement('canvas');
    canvas.id = 'crt-player-canvas';
    Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', borderRadius: '8px' });
    playerWrap.appendChild(canvas);
    playerParent.insertBefore(playerWrap, video.nextSibling);

    // The real video element gets visually hidden (not removed —
    // audio/decode/etc. still need it) since the canvas draws the
    // shaded version directly on top of it in the exact same spot.
    video.style.visibility = 'hidden';

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      console.error('[CRT] WebGL not available, aborting.');
      return;
    }

    let sceneFBO, brightFBO, blurFBO_A, blurFBO_B;

    // ---- live tracking of the real video element's SIZE ----
    // Position is no longer tracked here at all — `inset: 0` on
    // playerWrap means it automatically matches its parent's box,
    // including on scroll, resize, fullscreen, and theater-mode toggles,
    // with zero JS involved. Only the WebGL backing store (canvas.width/
    // height, viewport, bloom FBOs) needs updating, and only when the
    // rendered SIZE actually changes.
    //
    // CORRECTION: that assumption doesn't hold here. playerWrap's CSS
    // `inset: 0` matches playerParent's box, but video's own rect can
    // legitimately differ from its parent container's box (crop/cover
    // positioning, or — on this experimental "grid" player specifically
    // — the container may be sized for scroll/peek behavior separate
    // from the actual visible video area). Relying on CSS to coincide
    // with video's real box was the likely cause of the canvas ending up
    // positioned somewhere other than where the video actually is.
    // Instead, compute playerWrap's left/top/width/height explicitly
    // from video's own actual rect every time, converted into
    // coordinates relative to playerParent (its real containing block),
    // rather than trusting `inset: 0` to line up by coincidence.
    let lastW = -1, lastH = -1;
    function syncPlayerToVideo() {
      const r = video.getBoundingClientRect();
      // if the video has zero size (e.g. hidden/ad transition), skip
      if (r.width < 2 || r.height < 2) return;

      const containerRect = playerParent.getBoundingClientRect();
      playerWrap.style.left = (r.left - containerRect.left) + 'px';
      playerWrap.style.top = (r.top - containerRect.top) + 'px';
      playerWrap.style.width = r.width + 'px';
      playerWrap.style.height = r.height + 'px';

      const w = Math.round(r.width), h = Math.round(r.height);
      if (w !== lastW || h !== lastH) {
        lastW = w; lastH = h;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(w * dpr));
        canvas.height = Math.max(1, Math.round(h * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (typeof rebuildBloomFBOs === 'function') rebuildBloomFBOs();
      }
    }
    const videoResizeObserver = new ResizeObserver(syncPlayerToVideo);
    videoResizeObserver.observe(video);
    syncPlayerToVideo();

    // ============================================================
    // Shaders — identical to the validated prototype.
    // ============================================================
    const vertSrc = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

    const fragSrc = `
precision mediump float;
varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uImgSize;
uniform sampler2D uTex;
uniform float uScan;
uniform float uScanCount;
uniform float uBloom;
uniform float uWarp;
uniform float uVig;
uniform float uBleed;
uniform vec3 uTintColor;
uniform float uTintStrength;

vec2 barrel(vec2 uv, float amt) {
  vec2 cc = uv - 0.5;
  float dist = dot(cc, cc);
  return uv + cc * dist * amt;
}

vec2 coverUv(vec2 uv, vec2 screenRes, vec2 imgRes) {
  float screenAspect = screenRes.x / screenRes.y;
  float imgAspect = imgRes.x / imgRes.y;
  vec2 scale = vec2(1.0);
  if (screenAspect > imgAspect) {
    scale.y = imgAspect / screenAspect;
  } else {
    scale.x = screenAspect / imgAspect;
  }
  vec2 centered = (uv - 0.5) * scale + 0.5;
  return centered;
}

void main() {
  vec2 uv = barrel(vUv, uWarp);

  // Rounded-corner frame around the actual video content. Computed
  // against uv (the WARPED coordinate, same space the barrel-warp
  // out-of-bounds test below already uses) rather than the raw screen
  // coordinate — the barrel warp already pulls content in from the
  // canvas edges, so rounding against the canvas's own outer edge had
  // no visible effect at all: that boundary was already fully
  // transparent well before reaching it. This has to bite into the
  // actual edge of the visible content, not an edge nothing reaches.
  vec2 pixelPos = uv * uResolution;
  vec2 halfSize = uResolution * 0.5;
  float cornerRadiusPx = 12.0;
  vec2 q = abs(pixelPos - halfSize) - halfSize + cornerRadiusPx;
  float roundedDist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - cornerRadiusPx;

  // Anti-aliased edges: fade alpha smoothly over ~1.5px around each
  // boundary instead of a hard discard. A binary cutoff can't produce a
  // smooth edge on a curve by definition — every pixel is either fully
  // in or fully out, which is exactly what staircases on the rounded
  // corners. This alpha has to survive all the way through the bloom
  // pipeline to the final composite (see compositeFragSrc below), or
  // it'll get silently discarded there instead.
  float aaPx = 1.5;
  float roundedAlpha = 1.0 - smoothstep(-aaPx, aaPx, roundedDist);

  vec2 edgeDistUv = min(uv, 1.0 - uv); // distance to nearest uv-space edge (negative if outside)
  float edgeDistPx = min(edgeDistUv.x * uResolution.x, edgeDistUv.y * uResolution.y);
  float warpAlpha = smoothstep(0.0, aaPx, edgeDistPx);

  float edgeAlpha = roundedAlpha * warpAlpha;
  if (edgeAlpha <= 0.001) {
    discard;
  }

  // How authentic CRTs actually looked at their edges: the phosphor
  // screen was physically larger than the actively-scanned picture, so
  // there was a dim band of "lit but no signal" screen between the real
  // picture and the true edge — the picture faded INTO that band rather
  // than cutting off sharply against it. Reuses the same two distance
  // fields as the edge-alpha fade above (roundedDist for the corners,
  // edgeDistPx for the barrel-warp boundary), just with a much wider
  // falloff distance, and blends color (not alpha) toward BORDER_COLOR.
  // The final transparent cutoff at the true outer edge (edgeAlpha,
  // computed above with the tight ~1.5px AA band) is unchanged — this
  // only affects what color things fade to just before that happens.
  // Hardcoded, not user-tunable — deliberately fixed at rgb(63,67,80).
  const float BORDER_WIDTH_PX = 23.0;
  const vec3 BORDER_COLOR = vec3(0.247, 0.263, 0.314);
  // NOTE: combined with multiplication (not max()) — max() would let
  // whichever boundary is LESS restrictive win, which is exactly what
  // produced square corners on the border: the barrel-warp edge test
  // below is a plain axis-aligned "distance to nearest straight side"
  // (a square, not a curve), and max() let its straight edges poke
  // through past where the rounded corner wants to cut things off.
  // Multiplication makes the MORE restrictive (rounded) shape dominate,
  // same as edgeAlpha above already correctly does.
  float roundedInsideWide = 1.0 - smoothstep(-BORDER_WIDTH_PX, 0.0, roundedDist);
  float warpInsideWide = smoothstep(0.0, BORDER_WIDTH_PX, edgeDistPx);
  float borderMix = 1.0 - (roundedInsideWide * warpInsideWide);

  vec2 imgUv = coverUv(uv, uResolution, uImgSize);

  float aberr = uBleed * 0.006;
  float r = texture2D(uTex, imgUv - vec2(aberr, 0.0)).r;
  float g = texture2D(uTex, imgUv).g;
  float b = texture2D(uTex, imgUv + vec2(aberr, 0.0)).b;
  vec3 imgCol = vec3(r, g, b);

  float y = uv.y * uScanCount;
  float scanline = sin(y * 3.14159) * 0.5 + 0.5;
  scanline = pow(scanline, 2.0);

  vec2 cc = uv - 0.5;
  float vig = smoothstep(0.9, 0.25, length(cc));
  vig = mix(1.0, vig, uVig);

  vec3 col = mix(imgCol, imgCol * uTintColor, uTintStrength);
  float scanMul = mix(1.0, (0.55 + 0.45 * scanline), uScan);
  col *= scanMul;
  col *= vig;
  // Dot-matrix border fade — the same technique as the printed ceramic
  // "frit" dot pattern on car/bus windshields: no continuous color
  // blend at all, just a grid of dots whose SIZE scales with borderMix
  // (0 = invisible, tiny; 1 = large enough to fully cover its cell,
  // reading as solid). The graduality comes entirely from dot
  // density/size increasing toward the edge, not from a smooth fade.
  // Uses pixelPos (screen space, already computed above) so the dot
  // grid stays a clean, undistorted grid regardless of the barrel warp
  // — physically sensible too, since a real frit pattern is printed on
  // the glass itself, not warped along with whatever's behind it.
  const float DOT_CELL_PX = 2.0;
  vec2 cellCoord = mod(pixelPos, DOT_CELL_PX) - DOT_CELL_PX * 0.5;
  // Max radius is LARGER than half the cell (0.5) so adjacent dots
  // actually overlap and merge into a solid border at full strength —
  // exactly half would only let them touch at a single point per edge,
  // always leaving small diamond-shaped gaps at the corners no matter
  // how far into the border you are.
  float maxDotRadius = DOT_CELL_PX * 0.5;
  // sqrt(borderMix), not borderMix directly — perceived dot "size" is
  // closer to AREA than radius, and area scales as radius squared, so a
  // plain linear radius ramp looks like nothing happens for most of the
  // band and then suddenly balloons late. Taking the square root here
  // makes dot AREA increase linearly across the band instead, which
  // reads as a much more evenly-paced, gradual growth.
  float dotRadius = sqrt(borderMix) * maxDotRadius;
  // Without this, the dot's own AA falloff (dotRadius ± 1px) still
  // leaves a faint ~1px phantom dot at every cell center even when
  // dotRadius is meant to be exactly zero deep inside the video —
  // this kills that residual instead of letting it show everywhere.
  float dotPresence = smoothstep(0.0, 1.0, dotRadius);
  float inDot = dotPresence * (1.0 - smoothstep(dotRadius - 1.0, dotRadius + 1.0, length(cellCoord)));
  col = mix(col, BORDER_COLOR, inDot);

  gl_FragColor = vec4(col, edgeAlpha);
}`;

    function compile(context, type, src) {
      const s = context.createShader(type);
      context.shaderSource(s, src);
      context.compileShader(s);
      if (!context.getShaderParameter(s, context.COMPILE_STATUS)) {
        console.error('[CRT]', context.getShaderInfoLog(s));
        throw new Error('shader compile failed');
      }
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    function bindQuad(p) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      const loc = gl.getAttribLocation(p, 'aPos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }
    bindQuad(prog);

    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uResolution = gl.getUniformLocation(prog, 'uResolution');
    const uImgSize = gl.getUniformLocation(prog, 'uImgSize');
    const uTexLoc = gl.getUniformLocation(prog, 'uTex');
    const uScan = gl.getUniformLocation(prog, 'uScan');
    const uScanCount = gl.getUniformLocation(prog, 'uScanCount');
    const uBloom = gl.getUniformLocation(prog, 'uBloom');
    const uWarp = gl.getUniformLocation(prog, 'uWarp');
    const uVig = gl.getUniformLocation(prog, 'uVig');
    const uBleed = gl.getUniformLocation(prog, 'uBleed');
    const uTintColor = gl.getUniformLocation(prog, 'uTintColor');
    const uTintStrength = gl.getUniformLocation(prog, 'uTintStrength');

    gl.disable(gl.BLEND);

    // ---- video texture ----
    // Sourced directly from YouTube's own <video> element, uploaded
    // fresh every frame. Requires the page to be served over http(s),
    // which it obviously is here (unlike the file:// prototype).
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Flip-Y only makes sense for the real video upload below (a DOM
    // element) — Firefox specifically warns that combining it with a
    // raw TypedArray upload like this placeholder pixel is deprecated,
    // since there's no meaningful "orientation" to flip for a solid
    // color. Explicitly false here rather than leaving whatever state
    // a previous call left behind.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Resets the texture back to a solid black 1x1 pixel — matching what
    // a native <video> element renders once its decode buffer is
    // invalidated (e.g. on src change). Without this, our texture just
    // keeps whatever the last uploaded frame was forever, since
    // uploadVideoFrame() below skips uploading while readyState < 2 —
    // which is exactly what produced the "stale frame from the previous
    // video" bug: real YouTube shows black during that gap, we were
    // showing a frozen ghost frame instead.
    function resetVideoTexture() {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // Same reasoning as above: this is a raw array, not the video
      // element, so flip-Y needs to be explicitly off here regardless
      // of what uploadVideoFrame() last left it set to.
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      // A new source might not have the same DRM/tainted-canvas problem
      // the previous one did — give it a fresh chance rather than
      // staying permanently fallen-back for the rest of the page's life.
      if (videoUploadFailed) {
        videoUploadFailed = false;
        applyEffectVisibility();
      }
    }
    // 'loadstart' fires as soon as the browser begins loading a new
    // source (i.e. right when video.src/currentSrc changes) — exactly
    // the moment we want to drop the stale frame. 'emptied' covers the
    // case where the media resource is reset without a new source lined
    // up yet.
    video.addEventListener('loadstart', resetVideoTexture);
    video.addEventListener('emptied', resetVideoTexture);

    // If texImage2D on the video ever throws (e.g. a tainted-canvas
    // SecurityError — DRM'd rentals/purchases are the likely trigger),
    // we log it once and fall back to showing the REAL video instead of
    // leaving a permanently dead black canvas sitting in front of
    // content our shader can never actually read. videoUploadFailed
    // resets on 'loadstart'/'emptied' (see resetVideoTexture below), so
    // a later, non-protected video gets a fresh chance rather than
    // staying disabled for the rest of the page's life.
    let videoUploadFailed = false;
    function uploadVideoFrame() {
      if (video.readyState < 2) return; // not enough data yet
      if (videoUploadFailed) return; // already know it doesn't work, stop trying
      try {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      } catch (err) {
        videoUploadFailed = true;
        console.error('[CRT] texImage2D on the video element failed — this usually means the browser is treating the video as tainted/cross-origin (DRM-protected content is a likely cause) and refusing to let WebGL read its pixels. Falling back to the real video. Full error:', err);
        applyEffectVisibility();
      }
    }

    // ============================================================
    // Real bloom pipeline — identical to the validated prototype.
    // ============================================================
    function makeProgram(fs) {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vertSrc));
      gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      return p;
    }

    function makeFBO(w, h) {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      // Allocating empty storage (null data) — not a DOM element, so
      // flip-Y needs to be explicitly off here too, same reasoning as
      // the placeholder/reset uploads above.
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      // DIAGNOSTIC: a framebuffer can silently fail to complete (e.g. if
      // w/h exceeds this GPU's texture size limit) — draws to an
      // incomplete framebuffer are no-ops, which would look exactly like
      // "bloom stopped contributing anything" without any thrown error.
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error(`[CRT] framebuffer incomplete at ${w}x${h}, status=${status} (maxTextureSize=${gl.getParameter(gl.MAX_TEXTURE_SIZE)})`);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { fbo, tex: t, w, h };
    }

    const brightFragSrc = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform float uThreshold;
uniform vec2 uSceneTexel;
uniform float uAmbientGlow;
void main() {
  // Sample a small neighborhood in the FULL-RES scene (not just one
  // point) and take the brightest hit. This runs at quarter resolution,
  // so a single point-sample can systematically miss thin bright
  // details (like closely-spaced scanline peaks) if the sparse sampling
  // grid happens to land between them — which becomes MORE likely, not
  // less, at larger canvas sizes, since the same scanline pattern
  // becomes physically thinner relative to the quarter-res sampling
  // interval. Taking the max over a 3x3 neighborhood makes the bright-
  // pass robust to that alignment problem at any resolution.
  vec3 best = vec3(0.0);
  float bestLum = -1.0;
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      vec2 offset = vec2(float(dx), float(dy)) * uSceneTexel;
      vec3 c = texture2D(uScene, vUv + offset).rgb;
      float lum = dot(c, vec3(0.299, 0.587, 0.114));
      if (lum > bestLum) { bestLum = lum; best = c; }
    }
  }
  // Threshold-gated highlight bloom (unchanged) PLUS a small always-on
  // ambient term proportional to the scene's own brightness everywhere
  // — not gated by the threshold at all. Without this, a scene with no
  // strong highlights contributes literally zero bloom (excess = 0
  // everywhere), while scanlines/vignette/tint keep darkening it
  // regardless — all of the CRT look's cost with none of its glow. The
  // ambient term guarantees some soft glow is always present,
  // proportional to whatever's actually on screen, so it never goes
  // fully dead/flat on dim or low-contrast footage.
  float excess = max(bestLum - uThreshold, 0.0) * 2.5 + bestLum * uAmbientGlow;
  gl_FragColor = vec4(best * excess, 1.0);
}`;

    const blurFragSrc = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexelSize;
uniform vec2 uDir;
void main() {
  float weights[5];
  weights[0] = 0.2270270270;
  weights[1] = 0.1945945946;
  weights[2] = 0.1216216216;
  weights[3] = 0.0540540541;
  weights[4] = 0.0162162162;
  vec3 sum = texture2D(uTex, vUv).rgb * weights[0];
  for (int i = 1; i < 5; i++) {
    vec2 off = uDir * uTexelSize * float(i);
    sum += texture2D(uTex, vUv + off).rgb * weights[i];
    sum += texture2D(uTex, vUv - off).rgb * weights[i];
  }
  gl_FragColor = vec4(sum, 1.0);
}`;

    const compositeFragSrc = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomStrength;
void main() {
  // Alpha comes from the SCENE texture (which carries the anti-aliased
  // rounded-corner/barrel-edge mask from the main shader), not
  // hardcoded to 1.0 — otherwise that soft edge alpha gets silently
  // discarded here and the final on-screen result is opaque everywhere
  // regardless of what the scene pass actually computed.
  vec4 sceneSample = texture2D(uScene, vUv);
  vec3 bloom = texture2D(uBloom, vUv).rgb;
  gl_FragColor = vec4(sceneSample.rgb + bloom * uBloomStrength, sceneSample.a);
}`;

    const brightProg = makeProgram(brightFragSrc);
    const blurProg = makeProgram(blurFragSrc);
    const compositeProg = makeProgram(compositeFragSrc);

    const u_bright_uScene = gl.getUniformLocation(brightProg, 'uScene');
    const u_bright_uThreshold = gl.getUniformLocation(brightProg, 'uThreshold');
    const u_bright_uSceneTexel = gl.getUniformLocation(brightProg, 'uSceneTexel');
    const u_bright_uAmbientGlow = gl.getUniformLocation(brightProg, 'uAmbientGlow');
    const u_blur_uTex = gl.getUniformLocation(blurProg, 'uTex');
    const u_blur_uTexelSize = gl.getUniformLocation(blurProg, 'uTexelSize');
    const u_blur_uDir = gl.getUniformLocation(blurProg, 'uDir');
    const u_comp_uScene = gl.getUniformLocation(compositeProg, 'uScene');
    const u_comp_uBloom = gl.getUniformLocation(compositeProg, 'uBloom');
    const u_comp_uBloomStrength = gl.getUniformLocation(compositeProg, 'uBloomStrength');

    function deleteFBO(f) {
      if (!f) return;
      gl.deleteFramebuffer(f.fbo);
      gl.deleteTexture(f.tex);
    }

    function rebuildBloomFBOs() {
      const w = canvas.width, h = canvas.height;
      const bw = Math.max(1, Math.floor(w / 4));
      const bh = Math.max(1, Math.floor(h / 4));
      console.log(`[CRT] rebuildBloomFBOs: canvas=${w}x${h} bloomTargets=${bw}x${bh}`);
      // free the previous set before creating new ones — otherwise
      // repeatedly toggling cinema mode / resizing leaks GPU memory
      // indefinitely, since the old textures/framebuffers are never
      // referenced again but also never explicitly freed.
      deleteFBO(sceneFBO);
      deleteFBO(brightFBO);
      deleteFBO(blurFBO_A);
      deleteFBO(blurFBO_B);
      sceneFBO = makeFBO(w, h);
      brightFBO = makeFBO(bw, bh);
      blurFBO_A = makeFBO(bw, bh);
      blurFBO_B = makeFBO(bw, bh);
    }
    rebuildBloomFBOs();

    function renderRealBloom(t) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO.fbo);
      gl.viewport(0, 0, sceneFBO.w, sceneFBO.h);
      gl.useProgram(prog);
      bindQuad(prog);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(uTexLoc, 0);
      gl.uniform1f(uTime, t * 0.001);
      gl.uniform2f(uResolution, sceneFBO.w, sceneFBO.h);
      gl.uniform2f(uImgSize, video.videoWidth || 16, video.videoHeight || 9);
      gl.uniform1f(uScan, params.scan);
      gl.uniform1f(uScanCount, params.scanCount);
      gl.uniform1f(uBloom, params.bloom);
      gl.uniform1f(uWarp, params.warp);
      gl.uniform1f(uVig, params.vig);
      gl.uniform1f(uBleed, params.bleed);
      const tintRgb = hexToRgb01(params.tintColor);
      gl.uniform3f(uTintColor, tintRgb[0], tintRgb[1], tintRgb[2]);
      gl.uniform1f(uTintStrength, params.tintStrength);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.bindFramebuffer(gl.FRAMEBUFFER, brightFBO.fbo);
      gl.viewport(0, 0, brightFBO.w, brightFBO.h);
      gl.useProgram(brightProg);
      bindQuad(brightProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneFBO.tex);
      gl.uniform1i(u_bright_uScene, 0);
      gl.uniform1f(u_bright_uThreshold, params.bloomThresh);
      gl.uniform2f(u_bright_uSceneTexel, 1 / sceneFBO.w, 1 / sceneFBO.h);
      gl.uniform1f(u_bright_uAmbientGlow, params.ambientGlow);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const texel = [1 / brightFBO.w, 1 / brightFBO.h];
      let src = brightFBO, dst = blurFBO_A;
      const passes = [[1, 0], [0, 1]];
      for (const [dx, dy] of passes) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
        gl.viewport(0, 0, dst.w, dst.h);
        gl.useProgram(blurProg);
        bindQuad(blurProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, src.tex);
        gl.uniform1i(u_blur_uTex, 0);
        gl.uniform2f(u_blur_uTexelSize, texel[0], texel[1]);
        gl.uniform2f(u_blur_uDir, dx, dy);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        src = dst;
        dst = (dst === blurFBO_A) ? blurFBO_B : blurFBO_A;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(compositeProg);
      bindQuad(compositeProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneFBO.tex);
      gl.uniform1i(u_comp_uScene, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform1i(u_comp_uBloom, 1);
      gl.uniform1f(u_comp_uBloomStrength, params.bloom);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // ============================================================
    // Control panel — hidden by default, toggled with Ctrl+Alt+C. Every
    // parameter is live-adjustable and persisted to localStorage.
    // ============================================================
    const panel = document.createElement('div');
    panel.id = 'crt-panel';
    Object.assign(panel.style, {
      position: 'fixed', top: '10px', right: '10px', zIndex: '2147483002',
      background: '#fafafa', color: '#1d1d1d',
      fontFamily: 'Georgia, "Times New Roman", Times, serif', fontSize: '13px', padding: '14px 16px',
      borderRadius: '8px', width: '250px', lineHeight: '1.6',
      border: '1.5px solid #e2e2e2', display: 'none',
      maxHeight: '90vh', overflowY: 'auto',
      boxShadow: '0 4px 14px #bebebe',
      paddingRight: '22px',
    });

    // Cross-browser two-tone slider track (filled portion vs remaining
    // track) can't be done with a single native CSS property — it needs
    // -webkit/-moz-specific pseudo-elements for the thumb, and the fill
    // itself is done by computing a plain CSS gradient and applying it
    // as the input's own background (updated on every change), rather
    // than relying on ::-webkit-slider-runnable-track / -moz-range-progress,
    // which differ enough between browsers that hand-computing the
    // gradient ourselves is more predictable.
    const sliderStyleTag = document.createElement('style');
    sliderStyleTag.textContent = `
#crt-panel input[type=range] {
  -webkit-appearance: none;
  appearance: none;
  height: 3px;
  border-radius: 1.5px;
  outline: none;
  background: #8d8d8d;
}
#crt-panel input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 13px; height: 13px;
  border-radius: 50%;
  background: #fe0705;
  cursor: pointer;
  margin-top: -5px;
}
#crt-panel input[type=range]::-moz-range-thumb {
  width: 13px; height: 13px;
  border-radius: 50%;
  background: #fe0705;
  border: none;
  cursor: pointer;
}
#crt-panel input[type=range]::-moz-range-track {
  height: 3px;
  border-radius: 1.5px;
  background: transparent;
}
#crt-panel input[type=text]:focus,
#crt-panel input[type=color]:focus {
  outline: none;
}
#crt-panel {
  scrollbar-width: thin;
  scrollbar-color: #d0d0d0 transparent;
}
#crt-panel::-webkit-scrollbar {
  width: 6px;
}
#crt-panel::-webkit-scrollbar-track {
  background: transparent;
}
#crt-panel::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}
#crt-panel::-webkit-scrollbar-thumb:hover {
  background: #bebebe;
}
`;
    document.head.appendChild(sliderStyleTag);

    function updateSliderFill(input) {
      const min = parseFloat(input.min), max = parseFloat(input.max), val = parseFloat(input.value);
      const pct = ((val - min) / (max - min)) * 100;
      input.style.background = `linear-gradient(to right, #fe0705 0%, #fe0705 ${pct}%, #8d8d8d ${pct}%, #8d8d8d 100%)`;
    }

    // Built entirely with DOM APIs (createElement/appendChild), NOT
    // innerHTML — YouTube enforces a Trusted Types CSP policy that
    // outright blocks assigning plain strings to .innerHTML (a security
    // feature against DOM-injection attacks, with no exception for
    // extensions/userscripts). Direct DOM construction sidesteps that
    // restriction entirely, since it never touches the blocked sink.
    function sliderRow(key, label, min, max, step) {
      const row = document.createElement('label');
      row.style.cssText = 'display:block;margin-top:10px;';
      const valSpan = document.createElement('span');
      valSpan.className = 'crt-val';
      valSpan.dataset.for = key;
      valSpan.style.cssText = 'color:#1d1d1d;float:right;';
      valSpan.textContent = params[key];
      row.appendChild(document.createTextNode(label + ' '));
      row.appendChild(valSpan);
      row.appendChild(document.createElement('br'));
      const input = document.createElement('input');
      input.type = 'range';
      input.dataset.key = key;
      input.min = min; input.max = max; input.step = step;
      input.value = params[key];
      input.style.width = '100%';
      updateSliderFill(input);
      row.appendChild(input);
      return row;
    }

    const title = document.createElement('div');
    title.style.cssText = 'color:#1d1d1d;font-size:14px;margin-bottom:8px;margin-top:8px;display:flex;justify-content:space-between;align-items:baseline;';
    const titleText = document.createElement('span');
    titleText.textContent = 'CRT Shader';
    titleText.style.cssText = 'display:inline-block;transform:scaleY(2.23);transform-origin:left;font-weight:400;';
    title.appendChild(titleText);
    const titleHint = document.createElement('span');
    titleHint.style.cssText = 'color:#8d8d8d;font-size:11px;';
    titleHint.textContent = '(Ctrl+Alt+C to hide)';
    title.appendChild(titleHint);
    panel.appendChild(title);

    const enabledRow = document.createElement('label');
    enabledRow.style.cssText = 'display:block;cursor:pointer;';
    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.style.accentColor = '#fe0705';
    enabledCheckbox.dataset.key = 'enabled';
    enabledCheckbox.checked = params.enabled;
    enabledRow.appendChild(enabledCheckbox);
    enabledRow.appendChild(document.createTextNode(' Effect enabled'));
    panel.appendChild(enabledRow);

    panel.appendChild(sliderRow('scan', 'Scanline intensity', 0, 1, 0.01));
    panel.appendChild(sliderRow('scanCount', 'Scanline count', 100, 1200, 10));
    panel.appendChild(sliderRow('bloom', 'Bloom strength', 0, 1.5, 0.01));
    panel.appendChild(sliderRow('warp', 'Barrel warp', 0, 0.4, 0.005));
    panel.appendChild(sliderRow('vig', 'Vignette', 0, 1, 0.01));
    panel.appendChild(sliderRow('bleed', 'Color bleed', 0, 3, 0.01));
    panel.appendChild(sliderRow('bloomThresh', 'Bloom threshold', 0, 1, 0.01));
    panel.appendChild(sliderRow('ambientGlow', 'Ambient glow', 0, 1, 0.01));

    const tintRow = document.createElement('label');
    tintRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:10px;';
    const tintLabel = document.createElement('span');
    tintLabel.textContent = 'Tint color';
    tintLabel.style.cssText = 'flex:0 0 auto;';
    tintRow.appendChild(tintLabel);

    const tintHexInput = document.createElement('input');
    tintHexInput.type = 'text';
    tintHexInput.dataset.key = 'tintColorHex';
    tintHexInput.value = params.tintColor;
    tintHexInput.spellcheck = false;
    tintHexInput.style.cssText = 'flex:1 1 auto;min-width:0;font-family:inherit;font-size:13px;color:#1d1d1d;background:#fff;border:1.5px solid #e2e2e2;border-radius:4px;padding:3px 6px;';
    tintRow.appendChild(tintHexInput);

    const tintSwatch = document.createElement('input');
    tintSwatch.type = 'color';
    tintSwatch.dataset.key = 'tintColor';
    tintSwatch.value = params.tintColor;
    tintSwatch.style.cssText = 'flex:0 0 auto;width:26px;height:26px;padding:0;border:1.5px solid #e2e2e2;border-radius:4px;cursor:pointer;';
    tintRow.appendChild(tintSwatch);

    panel.appendChild(tintRow);

    panel.appendChild(sliderRow('tintStrength', 'Tint strength', 0, 1, 0.01));

    document.body.appendChild(panel);

    panel.addEventListener('input', (e) => {
      const key = e.target.dataset.key;
      if (!key) return;
      if (e.target.type === 'checkbox') {
        params[key] = e.target.checked;
        if (key === 'enabled') applyEffectVisibility();
      } else if (e.target.type === 'color') {
        params[key] = e.target.value;
        if (key === 'tintColor') tintHexInput.value = e.target.value;
      } else if (e.target.type === 'text' && key === 'tintColorHex') {
        const hex = e.target.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
          params.tintColor = hex;
          tintSwatch.value = hex;
        }
      } else {
        params[key] = parseFloat(e.target.value);
        const valSpan = panel.querySelector(`.crt-val[data-for="${key}"]`);
        if (valSpan) valSpan.textContent = params[key];
        updateSliderFill(e.target);
      }
      saveParams(params);
    });

    // Ctrl+Alt+C toggles the panel (not just Alt+C — holding Alt alone
    // can trigger Windows Firefox's hidden menu-bar/mnemonic mode, which
    // swallows the following keypress before the page ever sees it;
    // requiring both modifiers together avoids that entirely). Uses
    // e.code (the physical key) rather than e.key, since e.key can be
    // remapped by some keyboard layouts when a modifier is held. Ignored
    // while typing in an input/textarea/contenteditable field (YouTube's
    // search box, comments, etc.) so it doesn't interfere with typing.
    // Named (not inline) so teardown() can remove it later — this
    // listener is on `window`, not any element that gets cleaned up
    // just by removing our DOM nodes, so without an explicit removeEventListener
    // it outlives this whole instance indefinitely.
    function handlePanelToggleKey(e) {
      if (!e.ctrlKey || !e.altKey || e.metaKey || e.code !== 'KeyC') return;
      const active = document.activeElement;
      const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isTyping) return;
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      e.preventDefault();
    }
    window.addEventListener('keydown', handlePanelToggleKey);

    // Single source of truth for whether the effect should actually be
    // showing right now: the user's own on/off toggle AND the upload
    // pipeline not having permanently failed on this video. Combining
    // both into one function (rather than two separate places each
    // setting video.style.visibility) avoids them fighting over the
    // same state — e.g. the user having the effect enabled while a
    // failed DRM'd video correctly still shows the real video anyway.
    function applyEffectVisibility() {
      const active = params.enabled && !videoUploadFailed;
      if (active) {
        video.style.visibility = 'hidden';
        playerWrap.style.display = '';
      } else {
        video.style.visibility = '';
        playerWrap.style.display = 'none';
      }
    }
    applyEffectVisibility();

    // ============================================================
    // Main render loop.
    // ============================================================
    // NOTE: this does NOT yet handle YouTube's SPA navigation (clicking
    // to a different video without a full page reload) — that's step 6.
    // What it DOES handle: if the video this instance is attached to
    // gets removed from the page entirely (e.g. navigating away to the
    // homepage), stop cleanly instead of leaving a frozen, unplayable
    // ghost frame on screen. This is a graceful bail-out, not a re-init;
    // if a new video appears later, this instance will NOT attach to it.
    let stopped = false;
    function teardown() {
      if (stopped) return;
      stopped = true;
      playerWrap.remove();
      panel.remove();
      sliderStyleTag.remove();
      video.style.visibility = '';
      video.removeEventListener('loadstart', resetVideoTexture);
      video.removeEventListener('emptied', resetVideoTexture);
      window.removeEventListener('keydown', handlePanelToggleKey);
      videoResizeObserver.disconnect();
      // Explicitly release the WebGL context rather than relying on
      // garbage collection to eventually reclaim it once the canvas is
      // removed from the DOM. This matters because browsers cap the
      // number of SIMULTANEOUSLY LIVE WebGL contexts per tab (commonly
      // ~8-16) — without this, repeatedly attaching to short-lived
      // <video> elements (e.g. hovering many homepage preview thumbnails
      // in one session, each triggering its own init/teardown cycle)
      // could accumulate contexts fast enough to hit that ceiling before
      // GC ever catches up, causing the browser to start forcibly
      // evicting the oldest ones out from under other instances.
      const loseContextExt = gl.getExtension('WEBGL_lose_context');
      if (loseContextExt) loseContextExt.loseContext();
      console.log('[CRT] video element removed from page, shader stopped. Watching for a new one...');
      // Re-arm: the video that just disappeared might have been a
      // transient placeholder YouTube swaps out during page load (seen
      // in practice: a 300x150 default-sized element that gets replaced
      // by the real player moments later), not necessarily the user
      // navigating away. Rather than permanently giving up, go back to
      // watching for whatever video appears next — this makes a fresh
      // page load self-healing instead of a coin flip on which video
      // element we happened to grab first.
      waitForVideo(initCRT);
    }

    // Skips the actual GPU/CPU work (texture upload + full shader
    // pipeline) whenever this TAB isn't visible — i.e. it's a background
    // tab, minimized, or another window is focused. This is deliberately
    // based on tab visibility (document.hidden), NOT on whether the
    // video itself is paused: an earlier version skipped rendering
    // whenever the video was paused, which also (unintentionally) meant
    // the ACTIVE tab you're watching would stop and restart its render
    // loop on every pause/seek/resume — and restarting after an idle gap
    // has its own catch-up cost, which is exactly what caused jitter on
    // seeking or resuming. Tying this to tab visibility instead fixes
    // the original problem (an idle/preview <video> on some OTHER
    // YouTube tab burning a full 60fps loop forever, competing for the
    // same shared GPU process as the tab you're actually watching)
    // without ever touching the render cadence of the tab you're
    // actively looking at, paused or not.

    function render(t) {
      if (stopped) return;
      if (!document.contains(video)) {
        teardown();
        return;
      }
      if (!params.enabled) {
        // Master toggle is off: skip all the actual GPU/CPU work (texture
        // upload, shader passes) entirely, but keep the loop alive so
        // re-enabling is instant rather than needing a re-init.
        requestAnimationFrame(render);
        return;
      }
      if (!document.hidden) {
        try {
          syncPlayerToVideo();
          uploadVideoFrame();
          renderRealBloom(t);
        } catch (err) {
          // Never let an unexpected error silently kill the loop — log it
          // loudly and keep going, so a single bad frame doesn't freeze
          // the effect permanently with no clue why.
          console.error('[CRT] error during render, continuing anyway:', err);
        }
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }
})();
