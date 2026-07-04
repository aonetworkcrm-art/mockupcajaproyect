/*
 * BOX MOCKUP — Render basado en MockupCaja.psd REAL
 * 
 * El PSD renderizado (psd_render.png) es el fondo del canvas.
 * El texto se superpone en posiciones aproximadas.
 * Los colores de las caras se aplican con blend mode "color".
 * Export usa renderTo() — sin flicker.
 * 100% client-side — funciona en Netlify/GitHub Pages
 */
(function () {
  "use strict";

  // ─── State ──────────────────────────────────────────────
  const state = {
    front: { title: "Product Name", subtitle: "Premium Quality", badge: "NEW", desc: "The best solution for your business", bg: "#1a1a3e", accent: "#ff6b35", titleColor: "#ffffff", subtitleColor: "#cccccc", badgeColor: "#ffffff", descColor: "#aaaaaa" },
    side: { text: "PRODUCT", bg: "#ff6b35", textColor: "#ffffff" },
    scene: { bg: "#f0ebe3" },
  };

  // ─── DOM refs ───────────────────────────────────────────
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const toast = document.getElementById("toast");
  const loadingEl = document.getElementById("loading");
  let toastTimer = null, renderReq = null;

  // ─── PSD Background Image ──────────────────────────────
  const psdBg = new Image();
  let psdLoaded = false;

  psdBg.onload = function () {
    psdLoaded = true;
    loadingEl.classList.add("hidden");
    scheduleRender();
  };
  psdBg.onerror = function () {
    psdLoaded = false;
    loadingEl.classList.add("hidden");
    scheduleRender();
  };
  psdBg.src = "psd_render.png";

  // ─── Canvas sizing ──────────────────────────────────────
  const PSD_W = 2000, PSD_H = 1750;
  let canvasW = 0, canvasH = 0; // logical (CSS) size

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const maxW = rect.width * 0.92;
    const maxH = rect.height * 0.92;
    const scale = Math.min(maxW / PSD_W, maxH / PSD_H, 1);
    const dpr = window.devicePixelRatio || 1;
    canvasW = PSD_W * scale;
    canvasH = PSD_H * scale;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = canvasW + "px";
    canvas.style.height = canvasH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ─── Helpers ────────────────────────────────────────────
  function hexToRgb(h) {
    return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
  }

  // Position helpers (PSD coordinates → canvas coords)
  function pX(x, w) { return x * (w / PSD_W); }
  function pY(y, h) { return y * (h / PSD_H); }
  function pS(s, w) { return s * (w / PSD_W); }

  // Estimated positions on PSD canvas (2000×1750)
  // Frontal: 750×1358 at ~(625,196). Lateral: 181×1358 at ~(1375,196)
  const L = {
    front: { x: 625, y: 196, w: 750, h: 1358 },
    side:  { x: 1375, y: 196, w: 181, h: 1358 },
    text: {
      badge:    { y: 0.08 },
      title:    { y: 0.22 },
      subtitle: { y: 0.36 },
      desc:     { y: 0.48 },
      barBelow: { y: 0.90, h: 0.04 },
    }
  };

  // Blend mode support check
  let supportsColorBlend = false;
  (function checkBlendMode() {
    try {
      var tc = document.createElement("canvas").getContext("2d");
      tc.globalCompositeOperation = "color";
      supportsColorBlend = (tc.globalCompositeOperation === "color");
    } catch(_) { supportsColorBlend = false; }
  })();

  // ─── Text Wrapping ─────────────────────────────────────
  function wrapText(ctxx, text, x, y, maxW, lh) {
    if (!text) return y;
    var words = text.split(" "), line = "", ly = y;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var test = line + w + " ";
      if (ctxx.measureText(test).width > maxW && line) {
        ctxx.fillText(line.trim(), x, ly);
        line = w + " ";
        ly += lh;
      } else line = test;
    }
    if (line.trim()) ctxx.fillText(line.trim(), x, ly);
    return ly;
  }

  // ─── Rounded rect (helper) ─────────────────────────────
  function roundRect(ctx, x, y, w, h, r) {
    if (r > w/2) r = w/2;
    if (r > h/2) r = h/2;
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }

  // ─── Draw front face content ──────────────────────────
  function drawFrontContent(ctxx, cw, ch) {
    var fx = pX(L.front.x, cw);
    var fy = pY(L.front.y, ch);
    var fw = pX(L.front.w, cw);
    var fh = pY(L.front.h, ch);
    var cx = fx + fw / 2;
    var t = L.text;

    // Badge
    var badgeY = fy + fh * t.badge.y;
    var bSize = pS(36, cw);
    var bText = state.front.badge.toUpperCase();
    ctxx.font = "bold " + bSize + "px -apple-system, sans-serif";
    var bW = ctxx.measureText(bText).width + pS(28, cw);
    var bH = bSize * 1.1;
    var bx = cx - bW / 2, by = badgeY - bH / 2;
    var br = bH / 2;
    ctxx.fillStyle = state.front.accent;
    roundRect(ctxx, bx, by, bW, bH, br);
    ctxx.fill();

    // Badge text
    ctxx.fillStyle = state.front.badgeColor;
    ctxx.textAlign = "center";
    ctxx.textBaseline = "middle";
    ctxx.fillText(bText, cx, badgeY);

    // Título
    var titleY = badgeY + pS(65, cw);
    var tSize = pS(42, cw);
    ctxx.fillStyle = state.front.titleColor;
    ctxx.font = "bold " + tSize + "px -apple-system, sans-serif";
    ctxx.textAlign = "center";
    ctxx.textBaseline = "middle";
    wrapText(ctxx, state.front.title, cx, titleY, fw * 0.8, tSize * 1.2);

    // Subtítulo
    var subY = fy + fh * t.subtitle.y;
    var sSize = pS(20, cw);
    ctxx.fillStyle = state.front.subtitleColor;
    ctxx.font = sSize + "px -apple-system, sans-serif";
    ctxx.textAlign = "center";
    ctxx.textBaseline = "middle";
    ctxx.fillText(state.front.subtitle, cx, subY);

    // Descripción
    var descY = fy + fh * t.desc.y;
    var dSize = pS(16, cw);
    ctxx.fillStyle = state.front.descColor;
    ctxx.font = dSize + "px -apple-system, sans-serif";
    ctxx.textAlign = "center";
    ctxx.textBaseline = "middle";
    wrapText(ctxx, state.front.desc, cx, descY, fw * 0.75, dSize * 1.5);

    // Barra acento inferior
    var barY = fy + fh * t.barBelow.y;
    var barH = pS(24, cw);
    var barW = fw * 0.55;
    ctxx.fillStyle = state.front.accent;
    roundRect(ctxx, cx - barW/2, barY, barW, barH, barH/2);
    ctxx.fill();
  }

  // ─── Colorize an area ──────────────────────────────────
  function colorizeArea(ctxx, x, y, w, h, color) {
    var c = hexToRgb(color);
    ctxx.save();
    if (supportsColorBlend) {
      ctxx.globalCompositeOperation = "color";
      ctxx.fillStyle = "rgba(" + c.r + "," + c.g + "," + c.b + ",0.9)";
    } else {
      ctxx.globalCompositeOperation = "source-over";
      ctxx.fillStyle = "rgba(" + c.r + "," + c.g + "," + c.b + ",0.18)";
    }
    ctxx.fillRect(x, y, w, h);
    ctxx.restore();
  }

  // ─── Main Render (accepts any context + dimensions) ────
  function renderTo(ctxx, w, h) {
    ctxx.clearRect(0, 0, w, h);

    // 1. Scene Background
    ctxx.fillStyle = state.scene.bg;
    ctxx.fillRect(0, 0, w, h);

    // 2. PSD Background Image
    if (psdLoaded) {
      ctxx.drawImage(psdBg, 0, 0, w, h);
    } else {
      ctxx.fillStyle = "#999";
      ctxx.font = "16px sans-serif";
      ctxx.textAlign = "center";
      ctxx.textBaseline = "middle";
      ctxx.fillText("Cargando...", w / 2, h / 2);
    }

    // 3. Colorize front and side faces
    colorizeArea(ctxx, pX(L.front.x, w), pY(L.front.y, h), pX(L.front.w, w), pY(L.front.h, h), state.front.bg);
    colorizeArea(ctxx, pX(L.side.x, w), pY(L.side.y, h), pX(L.side.w, w), pY(L.side.h, h), state.side.bg);

    // 4. Text overlays on front face
    drawFrontContent(ctxx, w, h);

    // 5. Side face text (rotated)
    var sx = pX(L.side.x, w);
    var sy = pY(L.side.y, h);
    var sw = pX(L.side.w, w);
    var sh = pY(L.side.h, h);
    ctxx.save();
    ctxx.translate(sx + sw / 2, sy + sh / 2);
    ctxx.rotate(-Math.PI / 2);
    ctxx.fillStyle = state.side.textColor;
    ctxx.font = "bold " + (sw * 0.5) + "px -apple-system, sans-serif";
    ctxx.textAlign = "center";
    ctxx.textBaseline = "middle";
    ctxx.fillText(state.side.text, 0, 0);
    ctxx.restore();
  }

  // ─── Visible render ─────────────────────────────────────
  function render() {
    renderTo(ctx, canvasW, canvasH);
  }

  // ─── Schedule ───────────────────────────────────────────
  function scheduleRender() {
    if (renderReq) cancelAnimationFrame(renderReq);
    renderReq = requestAnimationFrame(function () {
      render();
      renderReq = null;
    });
  }

  // ─── UI ─────────────────────────────────────────────────
  function showToast(msg, type) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = "toast " + (type || "info");
    void toast.offsetWidth;
    toast.classList.add("show");
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 3000);
  }

  function bind(id, path) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", function () {
      var keys = path.split(".");
      var obj = state;
      for (var i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = el.value;
      scheduleRender();
    });
  }

  bind("front-title", "front.title");
  bind("front-subtitle", "front.subtitle");
  bind("front-badge", "front.badge");
  bind("front-desc", "front.desc");
  bind("front-bg", "front.bg");
  bind("front-accent", "front.accent");
  bind("side-text", "side.text");
  bind("side-bg", "side.bg");
  bind("side-text-color", "side.textColor");
  bind("scene-bg", "scene.bg");

  // ─── Export (flicker-free — uses offscreen render) ─────
  function exportPNG() {
    try {
      var dpr = 2;
      var ew = PSD_W, eh = PSD_H;

      // Create offscreen canvas — never touches the visible canvas
      var offscreen = document.createElement("canvas");
      offscreen.width = ew * dpr;
      offscreen.height = eh * dpr;
      var offCtx = offscreen.getContext("2d");
      offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Render directly to offscreen canvas
      renderTo(offCtx, ew, eh);

      offscreen.toBlob(function (blob) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "mockup_caja.png";
        a.click();
        URL.revokeObjectURL(a.href);
        showToast("✅ Exportado " + (ew * dpr) + "×" + (eh * dpr) + "px", "success");
      }, "image/png");
    } catch (e) {
      showToast("Error: " + e.message, "error");
    }
    // No need to re-render the visible canvas — export is fully offscreen
  }

  function openPhotopea() {
    window.open("https://www.photopea.com/", "_blank");
    showToast("🔗 Arrastra MockupCaja.psd a Photopea", "info");
  }

  function resetAll() { location.reload(); }

  // ─── Init ────────────────────────────────────────────────
  window.addEventListener("resize", function () { resizeCanvas(); scheduleRender(); });
  document.getElementById("btn-export").addEventListener("click", exportPNG);
  document.getElementById("btn-photopea").addEventListener("click", openPhotopea);
  document.getElementById("btn-reset").addEventListener("click", resetAll);

  resizeCanvas();
  console.log("📦 Box Mockup v6 — PSD background + color blend + offscreen export");
})();
