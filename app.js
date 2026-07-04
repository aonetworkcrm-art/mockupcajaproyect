/*
 * BOX MOCKUP — Render en vivo sobre PSD real
 * 
 * El PSD renderizado es el fondo.
 * El texto se superpone en las coordenadas EXACTAS del PSD.
 * Los colores se aplican con blend mode "color".
 * Export directo desde la app — sin Photopea.
 * 100% client-side.
 */
(function () {
  "use strict";

  // ─── State ──────────────────────────────────────────────
  var state = {
    front: {
      title: "Product Name",
      subtitle: "Premium Quality",
      badge: "NEW",
      desc: "The best solution for your business",
      bg: "#1a1a3e",
      accent: "#ff6b35",
      titleColor: "#ffffff",
      subtitleColor: "#cccccc",
      badgeColor: "#ffffff",
      descColor: "#aaaaaa"
    },
    side: {
      text: "PRODUCT",
      bg: "#ff6b35",
      textColor: "#ffffff"
    },
    scene: {
      bg: "#f0ebe3"
    }
  };

  // ─── DOM refs ───────────────────────────────────────────
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var toast = document.getElementById("toast");
  var loadingEl = document.getElementById("loading");
  var toastTimer = null, renderReq = null;

  // ─── PSD Background Image ──────────────────────────────
  var psdBg = new Image();
  var psdLoaded = false;

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
  var PSD_W = 2000, PSD_H = 1750;
  var canvasW = 0, canvasH = 0;

  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect();
    var maxW = rect.width * 0.92;
    var maxH = rect.height * 0.92;
    var scale = Math.min(maxW / PSD_W, maxH / PSD_H, 1);
    var dpr = window.devicePixelRatio || 1;
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
  function px(x, w) { return x * (w / PSD_W); }
  function py(y, h) { return y * (h / PSD_H); }
  function ps(s, w) { return s * (w / PSD_W); }

  // ─── COORDENADAS EXACTAS del PSD ───────────────────────
  // Frontal: offset(920, 196), size(750, 1358)
  // Lateral: offset(740, 200), size(181, 1358)
  var L = {
    front: { x: 920, y: 196, w: 750, h: 1358 },
    side:  { x: 740, y: 200, w: 181, h: 1358 },
    // Text positions (% within frontal face)
    txt: {
      badge:    0.06,
      title:    0.18,
      subtitle: 0.32,
      desc:     0.44,
      barBelow: 0.90
    }
  };

  // ─── Blend mode support check ─────────────────────────
  var supportsColorBlend = false;
  (function () {
    try {
      var tc = document.createElement("canvas").getContext("2d");
      tc.globalCompositeOperation = "color";
      supportsColorBlend = (tc.globalCompositeOperation === "color");
    } catch (_) { supportsColorBlend = false; }
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
    if (line.trim()) {
      ctxx.fillText(line.trim(), x, ly);
      ly += lh;
    }
    return ly;
  }

  // ─── Rounded rect ──────────────────────────────────────
  function roundRect(ctxx, x, y, w, h, r) {
    if (r > w/2) r = w/2;
    if (r > h/2) r = h/2;
    ctxx.beginPath();
    ctxx.moveTo(x+r, y);
    ctxx.lineTo(x+w-r, y);
    ctxx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctxx.lineTo(x+w, y+h-r);
    ctxx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctxx.lineTo(x+r, y+h);
    ctxx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctxx.lineTo(x, y+r);
    ctxx.quadraticCurveTo(x, y, x+r, y);
    ctxx.closePath();
  }

  // ─── Colorize area using blend mode ────────────────────
  function colorizeArea(ctxx, x, y, w, h, color) {
    var c = hexToRgb(color);
    ctxx.save();
    if (supportsColorBlend) {
      ctxx.globalCompositeOperation = "color";
      ctxx.fillStyle = "rgba(" + c.r + "," + c.g + "," + c.b + ",0.85)";
    } else {
      ctxx.globalCompositeOperation = "source-over";
      ctxx.fillStyle = "rgba(" + c.r + "," + c.g + "," + c.b + ",0.20)";
    }
    ctxx.fillRect(x, y, w, h);
    ctxx.restore();
  }

  // ─── Draw front content (text + badge + bar) ──────────
  function drawFrontContent(ctxx, w, h) {
    var fx = px(L.front.x, w);
    var fy = py(L.front.y, h);
    var fw = px(L.front.w, w);
    var fh = py(L.front.h, h);
    var cx = fx + fw / 2;
    var cursorY = fy; // track Y position for auto-advance

    // Badge
    cursorY = fy + fh * L.txt.badge;
    var bSize = ps(34, w);
    var bText = state.front.badge.toUpperCase();
    ctxx.font = "bold " + bSize + "px -apple-system, sans-serif";
    var bW = ctxx.measureText(bText).width + ps(24, w);
    var bH = bSize * 1.15;
    var bx = cx - bW / 2, by = cursorY - bH / 2;
    ctxx.fillStyle = state.front.accent;
    roundRect(ctxx, bx, by, bW, bH, bH/2);
    ctxx.fill();
    ctxx.fillStyle = state.front.badgeColor;
    ctxx.textAlign = "center";
    ctxx.textBaseline = "middle";
    ctxx.fillText(bText, cx, cursorY);
    cursorY += bH + ps(8, w);

    // Título (wrap, then advance cursor)
    var tSize = ps(40, w);
    ctxx.fillStyle = state.front.titleColor;
    ctxx.font = "bold " + tSize + "px -apple-system, sans-serif";
    ctxx.textAlign = "center";
    ctxx.textBaseline = "top";
    cursorY = wrapText(ctxx, state.front.title, cx, cursorY, fw * 0.82, tSize * 1.2);
    cursorY += ps(12, w);

    // Subtítulo
    var sSize = ps(18, w);
    ctxx.fillStyle = state.front.subtitleColor;
    ctxx.font = sSize + "px -apple-system, sans-serif";
    ctxx.textAlign = "center";
    ctxx.textBaseline = "top";
    ctxx.fillText(state.front.subtitle, cx, cursorY);
    cursorY += sSize + ps(8, w);

    // Descripción
    var dSize = ps(14, w);
    ctxx.fillStyle = state.front.descColor;
    ctxx.font = dSize + "px -apple-system, sans-serif";
    ctxx.textAlign = "center";
    ctxx.textBaseline = "top";
    cursorY = wrapText(ctxx, state.front.desc, cx, cursorY, fw * 0.72, dSize * 1.6);
    cursorY += ps(8, w);

    // Barra acento inferior (si hay espacio)
    var barH = ps(22, w);
    var barW = fw * 0.50;
    var barY = Math.max(cursorY, fy + fh * 0.85);
    if (barY + barH < fy + fh - ps(10, w)) {
      ctxx.fillStyle = state.front.accent;
      roundRect(ctxx, cx - barW/2, barY, barW, barH, barH/2);
      ctxx.fill();
    }
  }

  // ─── Render ─────────────────────────────────────────────
  function renderTo(ctxx, w, h) {
    ctxx.clearRect(0, 0, w, h);

    // 1. Scene background
    ctxx.fillStyle = state.scene.bg;
    ctxx.fillRect(0, 0, w, h);

    // 2. PSD background
    if (psdLoaded) {
      ctxx.drawImage(psdBg, 0, 0, w, h);
    } else {
      ctxx.fillStyle = "#999";
      ctxx.font = "16px sans-serif";
      ctxx.textAlign = "center";
      ctxx.textBaseline = "middle";
      ctxx.fillText("Cargando...", w/2, h/2);
      return;
    }

    // 3. Colorize front and side faces
    colorizeArea(ctxx, px(L.front.x, w), py(L.front.y, h), px(L.front.w, w), py(L.front.h, h), state.front.bg);
    colorizeArea(ctxx, px(L.side.x, w), py(L.side.y, h), px(L.side.w, w), py(L.side.h, h), state.side.bg);

    // 4. Front text overlay
    drawFrontContent(ctxx, w, h);

    // 5. Side face text (rotated)
    var sx = px(L.side.x, w);
    var sy = py(L.side.y, h);
    var sw = px(L.side.w, w);
    var sh = py(L.side.h, h);
    ctxx.save();
    ctxx.translate(sx + sw/2, sy + sh/2);
    ctxx.rotate(-Math.PI/2);
    ctxx.fillStyle = state.side.textColor;
    ctxx.font = "bold " + (sw * 0.45) + "px -apple-system, sans-serif";
    ctxx.textAlign = "center";
    ctxx.textBaseline = "middle";
    ctxx.fillText(state.side.text, 0, 0);
    ctxx.restore();
  }

  function render() {
    renderTo(ctx, canvasW, canvasH);
  }

  function scheduleRender() {
    if (renderReq) cancelAnimationFrame(renderReq);
    renderReq = requestAnimationFrame(function () { render(); renderReq = null; });
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
  bind("front-title-color", "front.titleColor");
  bind("front-subtitle-color", "front.subtitleColor");
  bind("front-badge-color", "front.badgeColor");
  bind("front-desc-color", "front.descColor");
  bind("side-text", "side.text");
  bind("side-bg", "side.bg");
  bind("side-text-color", "side.textColor");
  bind("scene-bg", "scene.bg");

  // ─── Export (offscreen) ─────────────────────────────────
  function exportPNG() {
    try {
      var dpr = 2;
      var ew = PSD_W, eh = PSD_H;
      var offscreen = document.createElement("canvas");
      offscreen.width = ew * dpr;
      offscreen.height = eh * dpr;
      var offCtx = offscreen.getContext("2d");
      offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

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
  }

  function resetAll() { location.reload(); }

  // ─── Init ────────────────────────────────────────────────
  window.addEventListener("resize", function () { resizeCanvas(); scheduleRender(); });
  document.getElementById("btn-export").addEventListener("click", exportPNG);
  document.getElementById("btn-reset").addEventListener("click", resetAll);

  resizeCanvas();
  if (psdLoaded) scheduleRender();
  console.log("📦 Box Mockup — Render en vivo con coordenadas PSD exactas");
})();
