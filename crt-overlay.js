// ==UserScript==
// @name        Youtube CRT Shader
// @author      Pandotra
// @description Real-time CRT monitor effect (barrel warp, real bloom, scanlines, color bleed, phosphor tint, dot-matrix border fade) for the YouTube video player.
// @namespace   Violentmonkey Scripts
// @namespace   https://github.com/shalap-pandotra/crt-overlay-yt
//
// @icon        https://shalap-pandotra.github.io/images/crt-icon.png
// @version     1.1.0
//
// @match       https://www.youtube.com/*
// @grant       none
//
// ==/UserScript==

(function () {
  'use strict';

  const DEFAULT_PARAMS = {
    enabled: true,
    gamma: 2.46, saturation: 1.23, limiter: 1.0, phosphor: 0.34, whitePoint: 0.3, afterglow: 0.035,
    scan: 0.47, scanCount: 770, bloom: 0.65, warp: 0.08,
    vig: 0.22, bleed: 0.32, bloomThresh: 0.66, ambientGlow: 0.54,
    tintColor: '#a4a400',
    tintStrength: 0.1,
    renderScale: 1.0,
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

  function hexToRgb01(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

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
    const playerParent = video.parentNode;

    const playerWrap = document.createElement('div');
    playerWrap.id = 'crt-player-wrap';
    Object.assign(playerWrap.style, {
      position: 'absolute', overflow: 'hidden', pointerEvents: 'none',
      // Opaque backing over the real video. It must stay fully visible
      // and fully opaque underneath: both visibility:hidden and near-zero
      // opacity make Firefox relax frame timing and cause jitter.
      borderRadius: '0',
    });
    const canvas = document.createElement('canvas');
    canvas.id = 'crt-player-canvas';
    Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', borderRadius: '8px' });
    playerWrap.appendChild(canvas);
    playerParent.insertBefore(playerWrap, video.nextSibling);

    // The opaque backing over the real video takes YouTube's own page
    // background color, so the margins around the warped picture blend
    // into the page instead of reading as a black box. Fullscreen always
    // uses black. Updates live on theme switch and fullscreen changes.
    function updateBackingColor() {
      if (document.fullscreenElement) {
        // Transparent in fullscreen so YouTube's own background (including
        // Ambient mode's dynamic tint) shows through around the picture.
        playerWrap.style.background = 'transparent';
        return;
      }
      const ytBg = getComputedStyle(document.documentElement)
        .getPropertyValue('--yt-spec-base-background').trim();
      const isDark = document.documentElement.hasAttribute('dark');
      playerWrap.style.background = ytBg || (isDark ? '#0f0f0f' : '#ffffff');
    }
    updateBackingColor();
    const themeObserver = new MutationObserver(updateBackingColor);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['dark'] });
    document.addEventListener('fullscreenchange', updateBackingColor);

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      console.error('[CRT] WebGL not available, aborting.');
      return;
    }

    let sceneFBO, brightFBO, blurFBO_A, blurFBO_B;
    let histFBO_A, histFBO_B, historyNeedsClear = true, lastPersistT = -1;
    let lumFBO_16, lumFBO_1;

    let lastW = -1, lastH = -1, lastRenderScale = -1;
    let pendingW = -1, pendingH = -1, pendingSince = 0;
    let pipelineReady = false;
    let lastEffectiveValues = null;
    // Shrink the real video so it sits entirely under the opaque part of
    // our warped picture. This lets the margins around the picture be
    // transparent (showing whatever YouTube paints behind the player, like
    // Ambient mode) without the real video peeking through. The video
    // stays fully visible and opaque, just smaller. Scale accounts for how
    // far barrel warp pulls the picture's edges inward.
    function applyVideoTuck() {
      if (!params.enabled || playerWrap.style.display === 'none') return;
      const s = Math.max(0.6, 1 - 2 * (0.02 + params.warp * 0.25));
      const want = `scale(${s.toFixed(3)})`;
      if (video.style.transform !== want) {
        video.style.transformOrigin = 'center center';
        video.style.transform = want;
      }
    }
    function untuckVideo() {
      video.style.transform = '';
      video.style.transformOrigin = '';
    }

    function syncPlayerToVideo() {
      const r = { width: video.offsetWidth, height: video.offsetHeight };
      if (r.width < 2 || r.height < 2) return;

      playerWrap.style.left = video.offsetLeft + 'px';
      playerWrap.style.top = video.offsetTop + 'px';
      playerWrap.style.width = r.width + 'px';
      playerWrap.style.height = r.height + 'px';
      applyVideoTuck();
      const w = Math.round(r.width), h = Math.round(r.height);
      const sizeChanged = Math.abs(w - lastW) > 1 || Math.abs(h - lastH) > 1;
      const scaleChanged = params.renderScale !== lastRenderScale;
      if (sizeChanged && (w !== pendingW || h !== pendingH)) {
        pendingW = w; pendingH = h; pendingSince = performance.now();
      }
      // While the player is mid-resize (YouTube animates it when switching
      // videos or modes), keep the current backing store and let CSS stretch
      // the canvas, instead of reallocating the canvas and every bloom buffer
      // each frame. Reallocating clears the canvas, which is what flickered.
      // Rebuild once the size has held still for 150ms, or immediately on
      // the very first sizing or a render scale change.
      const settled = lastW < 0 || scaleChanged || performance.now() - pendingSince > 150;
      if ((sizeChanged || scaleChanged) && settled) {
        lastW = w; lastH = h;
        lastRenderScale = params.renderScale;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = params.renderScale;
        canvas.width = Math.max(1, Math.round(w * dpr * scale));
        canvas.height = Math.max(1, Math.round(h * dpr * scale));
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (typeof rebuildBloomFBOs === 'function') rebuildBloomFBOs();
        if (pipelineReady) {
          try {
            uploadVideoFrame();
            renderRealBloom(performance.now());
          } catch (err) {
            console.error('[CRT] error during forced re-render after resize:', err);
          }
        }
      }
    }
    const videoResizeObserver = new ResizeObserver(syncPlayerToVideo);
    videoResizeObserver.observe(video);
    syncPlayerToVideo();

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
uniform float uRenderScale;
uniform float uGamma;
uniform float uPhosphor;
uniform float uWhitePoint;
uniform float uSaturation;

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

vec2 pixelPos = uv * uResolution;
vec2 halfSize = uResolution * 0.5;
float cornerRadiusPx = 12.0 * uRenderScale;
vec2 q = abs(pixelPos - halfSize) - halfSize + cornerRadiusPx;
float roundedDist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - cornerRadiusPx;

float aaPx = 1.5;
float roundedAlpha = 1.0 - smoothstep(-aaPx, aaPx, roundedDist);

vec2 edgeDistUv = min(uv, 1.0 - uv);
float edgeDistPx = min(edgeDistUv.x * uResolution.x, edgeDistUv.y * uResolution.y);
float warpAlpha = smoothstep(0.0, aaPx, edgeDistPx);

float edgeAlpha = roundedAlpha * warpAlpha;
if (edgeAlpha <= 0.001) {
discard;
}

float BORDER_WIDTH_PX = 23.0 * uRenderScale;
const vec3 BORDER_COLOR = vec3(0.247, 0.263, 0.314);
float roundedInsideWide = 1.0 - smoothstep(-BORDER_WIDTH_PX, 0.0, roundedDist);
float warpInsideWide = smoothstep(0.0, BORDER_WIDTH_PX, edgeDistPx);
float borderMix = 1.0 - (roundedInsideWide * warpInsideWide);

vec2 imgUv = coverUv(uv, uResolution, uImgSize);

float aberr = uBleed * 0.006;
float r = texture2D(uTex, imgUv - vec2(aberr, 0.0)).r;
float g = texture2D(uTex, imgUv).g;
float b = texture2D(uTex, imgUv + vec2(aberr, 0.0)).b;
vec3 imgCol = vec3(r, g, b);

vec3 lin = pow(max(imgCol, 0.0), vec3(2.2));
vec3 crtLin = vec3(
dot(lin, vec3(0.86, 0.12, 0.02)),
dot(lin, vec3(0.06, 0.90, 0.04)),
dot(lin, vec3(0.01, 0.06, 0.93))
);
lin = mix(lin, crtLin, uPhosphor);
lin *= mix(vec3(1.0), vec3(0.85, 0.92, 1.0), uWhitePoint);
imgCol = pow(lin, vec3(1.0 / 2.2));
imgCol = pow(imgCol, vec3(uGamma / 2.2));
float sLuma = dot(imgCol, vec3(0.2126, 0.7152, 0.0722));
imgCol = max(mix(vec3(sLuma), imgCol, uSaturation), 0.0);

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
float DOT_CELL_PX = 2.0 * uRenderScale;
vec2 cellCoord = mod(pixelPos, DOT_CELL_PX) - DOT_CELL_PX * 0.5;
float maxDotRadius = DOT_CELL_PX * 0.5;
float dotRadius = sqrt(borderMix) * maxDotRadius;
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
    const uRenderScale = gl.getUniformLocation(prog, 'uRenderScale');
    const uGamma = gl.getUniformLocation(prog, 'uGamma');
    const uPhosphor = gl.getUniformLocation(prog, 'uPhosphor');
    const uWhitePoint = gl.getUniformLocation(prog, 'uWhitePoint');
    const uSaturation = gl.getUniformLocation(prog, 'uSaturation');
    gl.disable(gl.BLEND);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      function resetVideoTexture() {
      historyNeedsClear = true;
      awaitingFirstFrame = true;
      navPending = false;
      clearTimeout(navPendingTimer);
      applyEffectVisibility();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      if (videoUploadFailed) {
        videoUploadFailed = false;
        applyEffectVisibility();
      }
    }
    video.addEventListener('loadstart', resetVideoTexture);
    video.addEventListener('emptied', resetVideoTexture);
    function markHistoryStale() { historyNeedsClear = true; }
    video.addEventListener('seeking', markHistoryStale);

    let videoUploadFailed = false;
    // True while a new source is loading and hasn't produced a frame yet.
    // The overlay stays hidden during that gap so YouTube's own plain black
    // loading state shows, instead of an empty warped CRT box.
    let awaitingFirstFrame = video.readyState < 2;
    // YouTube fires yt-navigate-start the moment you click a new video,
    // before the browser starts loading it. Hiding the overlay right then
    // covers the gap where the player is already resizing but loadstart
    // hasn't fired yet (which caused a brief flash). navPending keeps us
    // from reappearing on a stray frame of the OLD video before the new
    // one loads; it clears on loadstart, or after 3s as a fallback for
    // navigations that never load a new video (channel pages etc).
    let navPending = false;
    let navPendingTimer = 0;
    function onNavigateStart() {
      navPending = true;
      awaitingFirstFrame = true;
      applyEffectVisibility();
      clearTimeout(navPendingTimer);
      navPendingTimer = setTimeout(() => { navPending = false; }, 3000);
    }
    document.addEventListener('yt-navigate-start', onNavigateStart);
    function uploadVideoFrame() {
      if (video.readyState < 2) return;
      if (videoUploadFailed) return;
      try {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        if (awaitingFirstFrame && !navPending) {
          awaitingFirstFrame = false;
          applyEffectVisibility();
        }
      } catch (err) {
        videoUploadFailed = true;
        console.error('[CRT] texImage2D on the video element failed — this usually means the browser is treating the video as tainted/cross-origin (DRM-protected content is a likely cause) and refusing to let WebGL read its pixels. Falling back to the real video. Full error:', err);
        applyEffectVisibility();
      }
    }
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
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
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
vec3 best = vec3(0.0);
float bestLum = -1.0;
float sumLum = 0.0;
for (int dy = -1; dy <= 1; dy++) {
for (int dx = -1; dx <= 1; dx++) {
vec2 offset = vec2(float(dx), float(dy)) * uSceneTexel;
vec3 c = texture2D(uScene, vUv + offset).rgb;
float lum = dot(c, vec3(0.299, 0.587, 0.114));
if (lum > bestLum) { bestLum = lum; best = c; }
sumLum += lum;
}
}
float excess = max(bestLum - uThreshold, 0.0) * 2.5 + bestLum * uAmbientGlow;
gl_FragColor = vec4(best * excess, sumLum / 9.0);
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
vec4 sum = texture2D(uTex, vUv) * weights[0];
for (int i = 1; i < 5; i++) {
vec2 off = uDir * uTexelSize * float(i);
sum += texture2D(uTex, vUv + off) * weights[i];
sum += texture2D(uTex, vUv - off) * weights[i];
}
gl_FragColor = sum;
}`;

    const compositeFragSrc = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomStrength;
uniform sampler2D uMeanLum;
uniform float uLimiter;
void main() {
vec4 sceneSample = texture2D(uScene, vUv);
vec3 bloom = texture2D(uBloom, vUv).rgb;
float globalLum = texture2D(uMeanLum, vec2(0.5)).r;
float localLum = texture2D(uBloom, vUv).a;
  float meanLum = max(globalLum, localLum);
  float pixelLum = dot(sceneSample.rgb, vec3(0.2126, 0.7152, 0.0722));
  // 1.0 = limit everything bright (most legible, flattest glow).
  // 0.0 = only limit clear detail (most glow, faint text can wash out).
  float detail = mix(0.85, 1.0, smoothstep(0.1, 0.35, localLum - pixelLum));
float abl = 1.0 - uLimiter * smoothstep(0.3, 0.75, meanLum) * 0.85 * detail;
gl_FragColor = vec4(sceneSample.rgb + bloom * uBloomStrength * abl, sceneSample.a);
}`;

    const persistFragSrc = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uCurrent;
uniform sampler2D uHistory;
uniform vec3 uDecay;
void main() {
vec4 cur = texture2D(uCurrent, vUv);
vec3 hist = texture2D(uHistory, vUv).rgb * uDecay;
gl_FragColor = vec4(max(cur.rgb, hist), cur.a);
}`;
    const persistProg = makeProgram(persistFragSrc);
    const u_persist_uCurrent = gl.getUniformLocation(persistProg, 'uCurrent');
    const u_persist_uHistory = gl.getUniformLocation(persistProg, 'uHistory');
    const u_persist_uDecay = gl.getUniformLocation(persistProg, 'uDecay');

    const lumDownFragSrc = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform vec2 uCell;
void main() {
vec2 o = uCell * 0.25;
vec3 w = vec3(0.2126, 0.7152, 0.0722);
float l = dot(texture2D(uScene, vUv + vec2(-o.x, -o.y)).rgb, w);
l += dot(texture2D(uScene, vUv + vec2( o.x, -o.y)).rgb, w);
l += dot(texture2D(uScene, vUv + vec2(-o.x,  o.y)).rgb, w);
l += dot(texture2D(uScene, vUv + vec2( o.x,  o.y)).rgb, w);
gl_FragColor = vec4(vec3(l * 0.25), 1.0);
}`;
    const lumAvgFragSrc = `
precision mediump float;
uniform sampler2D uLum;
void main() {
float sum = 0.0;
for (int y = 0; y < 16; y++) {
for (int x = 0; x < 16; x++) {
sum += texture2D(uLum, (vec2(float(x), float(y)) + 0.5) / 16.0).r;
}
}
gl_FragColor = vec4(vec3(sum / 256.0), 1.0);
}`;
    const lumDownProg = makeProgram(lumDownFragSrc);
    const lumAvgProg = makeProgram(lumAvgFragSrc);
    const u_lumDown_uScene = gl.getUniformLocation(lumDownProg, 'uScene');
    const u_lumDown_uCell = gl.getUniformLocation(lumDownProg, 'uCell');
    const u_lumAvg_uLum = gl.getUniformLocation(lumAvgProg, 'uLum');

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
    const u_comp_uMeanLum = gl.getUniformLocation(compositeProg, 'uMeanLum');
    const u_comp_uLimiter = gl.getUniformLocation(compositeProg, 'uLimiter');

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
      deleteFBO(sceneFBO);
      deleteFBO(brightFBO);
      deleteFBO(blurFBO_A);
      deleteFBO(blurFBO_B);
      sceneFBO = makeFBO(w, h);
      brightFBO = makeFBO(bw, bh);
      blurFBO_A = makeFBO(bw, bh);
      blurFBO_B = makeFBO(bw, bh);
      deleteFBO(histFBO_A);
      deleteFBO(histFBO_B);
      histFBO_A = makeFBO(w, h);
      histFBO_B = makeFBO(w, h);
      historyNeedsClear = true;
      deleteFBO(lumFBO_16);
      deleteFBO(lumFBO_1);
      lumFBO_16 = makeFBO(16, 16);
      lumFBO_1 = makeFBO(1, 1);
    }
    rebuildBloomFBOs();

    function renderRealBloom(t) {
      const rs = params.renderScale;
      const effScanCount = Math.max(10, params.scanCount * (0.5 + 0.5 * rs));
      const effScan = params.scan * (0.2 + 0.8 * rs);
      const effBloom = params.bloom * (0.4 + 0.6 * rs);
      const effBloomThresh = Math.min(1, params.bloomThresh + (1 - rs) * 0.15);
      lastEffectiveValues = { scan: effScan, scanCount: effScanCount, bloom: effBloom, bloomThresh: effBloomThresh };

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
      gl.uniform1f(uScan, effScan);
      gl.uniform1f(uScanCount, effScanCount);
      gl.uniform1f(uBloom, effBloom);
      gl.uniform1f(uWarp, params.warp);
      gl.uniform1f(uVig, params.vig);
      gl.uniform1f(uBleed, params.bleed);
      const tintRgb = hexToRgb01(params.tintColor);
      gl.uniform3f(uTintColor, tintRgb[0], tintRgb[1], tintRgb[2]);
      gl.uniform1f(uTintStrength, params.tintStrength);
      gl.uniform1f(uRenderScale, params.renderScale);
      gl.uniform1f(uGamma, params.gamma);
      gl.uniform1f(uPhosphor, params.phosphor);
      gl.uniform1f(uWhitePoint, params.whitePoint);
      gl.uniform1f(uSaturation, params.saturation);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      let sceneForBloom = sceneFBO.tex;
      if (params.afterglow > 0) {
        if (historyNeedsClear) {
          for (const f of [histFBO_A, histFBO_B]) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, f.fbo);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
          }
          historyNeedsClear = false;
          lastPersistT = t;
        }
        const dt = Math.min(0.25, Math.max(0, (t - lastPersistT) / 1000));
        lastPersistT = t;
        const tau = params.afterglow;
        const dR = Math.exp(-dt / (tau * 0.8));
        const dG = Math.exp(-dt / (tau * 1.3));
        const dB = Math.exp(-dt / (tau * 0.5));
        gl.bindFramebuffer(gl.FRAMEBUFFER, histFBO_B.fbo);
        gl.viewport(0, 0, histFBO_B.w, histFBO_B.h);
        gl.useProgram(persistProg);
        bindQuad(persistProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sceneFBO.tex);
        gl.uniform1i(u_persist_uCurrent, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, histFBO_A.tex);
        gl.uniform1i(u_persist_uHistory, 1);
        gl.uniform3f(u_persist_uDecay, dR, dG, dB);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.activeTexture(gl.TEXTURE0);
        [histFBO_A, histFBO_B] = [histFBO_B, histFBO_A];
        sceneForBloom = histFBO_A.tex;
      } else {
        historyNeedsClear = true;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, brightFBO.fbo);
      gl.viewport(0, 0, brightFBO.w, brightFBO.h);
      gl.useProgram(brightProg);
      bindQuad(brightProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneForBloom);
      gl.uniform1i(u_bright_uScene, 0);
      gl.uniform1f(u_bright_uThreshold, effBloomThresh);
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

      gl.bindFramebuffer(gl.FRAMEBUFFER, lumFBO_16.fbo);
      gl.viewport(0, 0, 16, 16);
      gl.useProgram(lumDownProg);
      bindQuad(lumDownProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneForBloom);
      gl.uniform1i(u_lumDown_uScene, 0);
      gl.uniform2f(u_lumDown_uCell, 1 / 16, 1 / 16);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.bindFramebuffer(gl.FRAMEBUFFER, lumFBO_1.fbo);
      gl.viewport(0, 0, 1, 1);
      gl.useProgram(lumAvgProg);
      bindQuad(lumAvgProg);
      gl.bindTexture(gl.TEXTURE_2D, lumFBO_16.tex);
      gl.uniform1i(u_lumAvg_uLum, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(compositeProg);
      bindQuad(compositeProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneForBloom);
      gl.uniform1i(u_comp_uScene, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform1i(u_comp_uBloom, 1);
      gl.uniform1f(u_comp_uBloomStrength, effBloom);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, lumFBO_1.tex);
      gl.uniform1i(u_comp_uMeanLum, 2);
      gl.uniform1f(u_comp_uLimiter, params.limiter);
      gl.activeTexture(gl.TEXTURE0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
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

    function updateEffectiveDisplays() {
      if (panel.style.display === 'none') return;
      if (!lastEffectiveValues) return;
      const rs = params.renderScale;
      for (const key of ['scan', 'scanCount', 'bloom', 'bloomThresh']) {
        const valSpan = panel.querySelector(`.crt-val[data-for="${key}"]`);
        if (!valSpan) continue;
        if (rs >= 0.999) {
          valSpan.textContent = params[key];
        } else {
          valSpan.textContent = `${params[key]} \u2192 ${lastEffectiveValues[key].toFixed(2)}`;
        }
      }
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

    panel.appendChild(sliderRow('renderScale', 'Render scale (perf)', 0.4, 1, 0.05));

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
    panel.appendChild(sliderRow('gamma', 'CRT gamma', 1.8, 3.0, 0.01));
    panel.appendChild(sliderRow('phosphor', 'Phosphor color', 0, 1, 0.01));
    panel.appendChild(sliderRow('whitePoint', 'Cool white point', 0, 1, 0.01));
    panel.appendChild(sliderRow('saturation', 'Saturation', 0, 2, 0.01));
    panel.appendChild(sliderRow('limiter', 'Bright scene limiter', 0, 1, 0.01));
    panel.appendChild(sliderRow('afterglow', 'Phosphor afterglow', 0, 0.2, 0.005));
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
      if (pipelineReady && params.enabled) {
        try {
          renderRealBloom(performance.now());
        } catch (err) {
          console.error('[CRT] error during forced re-render after settings change:', err);
        }
      }
    });

    function handlePanelToggleKey(e) {
      if (!e.ctrlKey || !e.altKey || e.metaKey || e.code !== 'KeyC') return;
      const active = document.activeElement;
      const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isTyping) return;
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      e.preventDefault();
    }
    window.addEventListener('keydown', handlePanelToggleKey);

    function applyEffectVisibility() {
      const active = params.enabled && !videoUploadFailed && !awaitingFirstFrame;
      if (active) {
        // Deliberately NOT hiding the real video. visibility:hidden makes
        // Firefox treat it as invisible and relax its frame timing, which
        // made frames arrive in stalls and bursts (the random jitter). The
        // black backing on playerWrap covers it instead.
                video.style.visibility = '';
        video.style.opacity = '';
        playerWrap.style.display = '';
        applyVideoTuck();
      } else {
        video.style.visibility = '';
        video.style.opacity = '';
        playerWrap.style.display = 'none';
        untuckVideo();
      }
    }
    applyEffectVisibility();
    let stopped = false;
    function teardown() {
      if (stopped) return;
      stopped = true;
      playerWrap.remove();
      panel.remove();
      sliderStyleTag.remove();
      video.style.visibility = '';
      video.style.opacity = '';
      video.removeEventListener('loadstart', resetVideoTexture);
      video.removeEventListener('emptied', resetVideoTexture);
      video.removeEventListener('seeking', markHistoryStale);
      window.removeEventListener('keydown', handlePanelToggleKey);
      videoResizeObserver.disconnect();
      themeObserver.disconnect();
      untuckVideo();
      document.removeEventListener('yt-navigate-start', onNavigateStart);
      clearTimeout(navPendingTimer);
      document.removeEventListener('fullscreenchange', updateBackingColor);
      const loseContextExt = gl.getExtension('WEBGL_lose_context');
      if (loseContextExt) loseContextExt.loseContext();
      console.log('[CRT] video element removed from page, shader stopped. Watching for a new one...');
      waitForVideo(initCRT);
    }
    pipelineReady = true;

        // ---- Jitter diagnostics (temporary, flip to false or remove later) ----
    const JANK_DEBUG = true;
    const jank = { lastNow: 0, lastPresented: -1, lastMedia: -1, frames: 0, skipped: 0, late: 0,
      slowUpload: 0, slowRender: 0, slowSync: 0, maxUpload: 0, maxRender: 0, maxSync: 0, since: performance.now() };
    function jankSync(ms) {
      jank.maxSync = Math.max(jank.maxSync, ms);
      if (ms > 3) jank.slowSync++;
    }
    function jankFrame(now, md, uploadMs, renderMs) {
      jank.frames++;
      jank.maxUpload = Math.max(jank.maxUpload, uploadMs);
      jank.maxRender = Math.max(jank.maxRender, renderMs);
      if (uploadMs > 6) jank.slowUpload++;
      if (renderMs > 6) jank.slowRender++;
      if (md && jank.lastPresented >= 0) {
        const skipped = md.presentedFrames - jank.lastPresented - 1;
        const gap = now - jank.lastNow;
        const frameDur = (md.mediaTime - jank.lastMedia) * 1000;
        const sane = frameDur > 0 && frameDur < 200 && gap < 1000; // ignore seeks/pauses
        if (sane && skipped >= 2) {
        jank.skipped += skipped;
          console.warn(`[CRT jank] @${video.currentTime.toFixed(1)}s missed ${skipped} frame(s). gap=${gap.toFixed(1)}ms, video frame=${frameDur.toFixed(1)}ms, upload=${uploadMs.toFixed(1)}ms, render=${renderMs.toFixed(1)}ms`);
        } else if (sane && gap >= 100) {
          jank.late++;
          console.warn(`[CRT jank] @${video.currentTime.toFixed(1)}s late callback. gap=${gap.toFixed(1)}ms, video frame=${frameDur.toFixed(1)}ms, upload=${uploadMs.toFixed(1)}ms, render=${renderMs.toFixed(1)}ms`);
        }
      }
      if (md) { jank.lastPresented = md.presentedFrames; jank.lastMedia = md.mediaTime; }
      jank.lastNow = now;
      if (performance.now() - jank.since > 10000) {
        console.log(`[CRT jank] 10s summary: frames=${jank.frames} missed=${jank.skipped} late=${jank.late} | upload max=${jank.maxUpload.toFixed(1)}ms slow=${jank.slowUpload} | render max=${jank.maxRender.toFixed(1)}ms slow=${jank.slowRender} | sync max=${jank.maxSync.toFixed(1)}ms slow=${jank.slowSync} | video=${video.videoWidth}x${video.videoHeight} canvas=${canvas.width}x${canvas.height}`);
        Object.assign(jank, { frames: 0, skipped: 0, late: 0, slowUpload: 0, slowRender: 0, slowSync: 0, maxUpload: 0, maxRender: 0, maxSync: 0, since: performance.now() });
      }
    }

    const hasRVFC = false; // TEST: force render-every-refresh path
    function onNewVideoFrame(now, metadata) {
      if (stopped) return; // don't keep re-registering after teardown
      if (params.enabled && !document.hidden) {
        try {
          const t0 = performance.now();
          uploadVideoFrame();
          const t1 = performance.now();
          renderRealBloom(performance.now());
          const t2 = performance.now();
          if (JANK_DEBUG) jankFrame(now, metadata, t1 - t0, t2 - t1);
        } catch (err) {
          console.error('[CRT] error during video-frame render, continuing anyway:', err);
        }
      }
      video.requestVideoFrameCallback(onNewVideoFrame);
    }
    if (hasRVFC) {
      video.requestVideoFrameCallback(onNewVideoFrame);
    } else {
      console.log('[CRT] requestVideoFrameCallback not available on this browser — falling back to rendering every animation frame regardless of whether the video frame actually changed.');
    }

    function render(t) {
      if (stopped) return;
      if (!document.contains(video)) {
        teardown();
        return;
      }
      if (!params.enabled) {
        requestAnimationFrame(render);
        return;
      }
      if (!document.hidden) {
        try {
            const s0 = performance.now();
          syncPlayerToVideo();
          if (JANK_DEBUG) jankSync(performance.now() - s0);
          updateEffectiveDisplays();
          if (!hasRVFC) {
            uploadVideoFrame();
            renderRealBloom(t);
          }
        } catch (err) {
          console.error('[CRT] error during render, continuing anyway:', err);
        }
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }
})();
