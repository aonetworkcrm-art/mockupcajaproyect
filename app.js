/*
 * BOX MOCKUP — Caja profesional dibujada desde cero
 * 
 * Proporciones EXACTAS del PSD MockupCaja.psd:
 *   Frontal: 750x1358  en (920, 196)
 *   Lateral: 181x1358  en (740, 200)
 * 
 * 100% Canvas 2D — sin PSD render — 100% editable
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
      bg: "#d45a2a",
      textColor: "#ffffff"
    },
    scene: {
      bg: "#f0ebe3"
    },
    // Vertical offset for text positioning (-100 to +100 virtual px)
    pos: {
      offset: 0
    }
  };

  // ─── DOM refs ───────────────────────────────────────────
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var toast = document.getElementById("toast");
  var loadingEl = document.getElementById("loading");
  var toastTimer = null, renderReq = null;

  // Initial loading done
  loadingEl.classList.add("hidden");

  // ─── Canvas sizing ──────────────────────────────────────
  var VIRT_W = 2000, VIRT_H = 1750;
  var dispW = 0, dispH = 0; // display (CSS) size

  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect();
    var maxW = rect.width * 0.92;
    var maxH = rect.height * 0.92;
    var scale = Math.min(maxW / VIRT_W, maxH / VIRT_H, 1);
    var dpr = window.devicePixelRatio || 1;
    dispW = VIRT_W * scale;
    dispH = VIRT_H * scale;
    canvas.width = dispW * dpr;
    canvas.height = dispH * dpr;
    canvas.style.width = dispW + "px";
    canvas.style.height = dispH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ─── Position helpers ──────────────────────────────────
  function vx(x) { return x * (dispW / VIRT_W); }
  function vy(y) { return y * (dispH / VIRT_H); }
  function vs(s) { return s * (dispW / VIRT_W); }

  // ─── EXACT PSD coordinates ─────────────────────────────
  var BOX = {
    front: { x: 920, y: 196, w: 750, h: 1358 },
    side:  { x: 740, y: 200, w: 181, h: 1358 },
    // The box bounding box (incl. shadow etc.)
    bounds: { x: 205, y: 200, w: 1492, h: 1359 }
  };

  // ─── Helpers ────────────────────────────────────────────
  function hexToRgb(h) {
    return { r: parseInt(h.slice(1,3),16), g: parseInt(h.slice(3,5),16), b: parseInt(h.slice(5,7),16) };
  }
  function rgba(c, a) {
    return "rgba(" + (c.r|0) + "," + (c.g|0) + "," + (c.b|0) + "," + a + ")";
  }

  // ─── Rounded rect path ─────────────────────────────────
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

  // ─── Text wrap ─────────────────────────────────────────
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
      } else {
        line = test;
      }
    }
    if (line.trim()) {
      ctxx.fillText(line.trim(), x, ly);
      ly += lh;
    }
    return ly;
  }

  // ─── DRAW LATERAL FACE ─────────────────────────────────
  function drawSideFace(ctxx) {
    var s = BOX.side;
    var sx = vx(s.x), sy = vy(s.y), sw = vx(s.w), sh = vy(s.h);
    var rgb = hexToRgb(state.side.bg);

    // Gradient: darker at the back (left), lighter at front (right)
    var grad = ctxx.createLinearGradient(sx, 0, sx + sw, 0);
    grad.addColorStop(0, rgba({r:rgb.r-40,g:rgb.g-40,b:rgb.b-40}, 1));
    grad.addColorStop(0.4, rgba({r:rgb.r-20,g:rgb.g-20,b:rgb.b-20}, 1));
    grad.addColorStop(1, rgba(rgb, 1));
    ctxx.fillStyle = grad;
    ctxx.fillRect(sx, sy, sw, sh);

    // Vertical edge line at right (fold)
    ctxx.strokeStyle = "rgba(0,0,0,0.10)";
    ctxx.lineWidth = 1;
    ctxx.beginPath();
    ctxx.moveTo(sx + sw - 0.5, sy + sh * 0.02);
    ctxx.lineTo(sx + sw - 0.5, sy + sh * 0.98);
    ctxx.stroke();

    // Side text (rotated 90°)
    ctxx.save();
    ctxx.translate(sx + sw/2, sy + sh/2);
    ctxx.rotate(-Math.PI / 2);
    ctxx.fillStyle = state.side.textColor;
    var sFontSize = sw * 0.42;
    ctxx.font = "bold " + sFontSize + "px -apple-system, sans-serif";
    ctxx.textAlign = "center";
    ctxx.textBaseline = "middle";
    // Measure and truncate if too long
    var sText = state.side.text;
    var sW = ctxx.measureText(sText).width;
    var sMaxW = sh * 0.85;
    if (sW > sMaxW) {
      var ratio = sMaxW / sW;
      ctxx.font = "bold " + (sFontSize * ratio) + "px -apple-system, sans-serif";
    }
    ctxx.fillText(state.side.text, 0, 0);
    ctxx.restore();

    // Subtle edge highlight at right
    ctxx.strokeStyle = "rgba(255,255,255,0.06)";
    ctxx.lineWidth = 1;
    ctxx.beginPath();
    ctxx.moveTo(sx + sw, sy + sh * 0.05);
    ctxx.lineTo(sx + sw, sy + sh * 0.95);
    ctxx.stroke();
  }

  // ─── DRAW FRONT FACE ───────────────────────────────────
  function drawFrontFace(ctxx) {
    var f = BOX.front;
    var fx = vx(f.x), fy = vy(f.y), fw = vx(f.w), fh = vy(f.h);
    var cx = fx + fw / 2;
    var rgb = hexToRgb(state.front.bg);
    var rad = vs(6);

    // ─── Drop shadow ───
    ctxx.save();
    ctxx.shadowColor = "rgba(0,0,0,0.25)";
    ctxx.shadowBlur = vs(28);
    ctxx.shadowOffsetX = vs(8);
    ctxx.shadowOffsetY = vs(14);

    // ─── Front face fill (gradient) ───
    var grad = ctxx.createLinearGradient(0, fy, 0, fy + fh);
    grad.addColorStop(0, rgba({r:rgb.r+18,g:rgb.g+18,b:rgb.b+18}, 1));
    grad.addColorStop(0.15, rgba(rgb, 1));
    grad.addColorStop(0.85, rgba(rgb, 1));
    grad.addColorStop(1, rgba({r:rgb.r-10,g:rgb.g-10,b:rgb.b-10}, 1));
    ctxx.fillStyle = grad;
    roundRect(ctxx, fx, fy, fw, fh, rad);
    ctxx.fill();

    ctxx.restore(); // removes shadow for subsequent drawing

    // ─── Subtle border ───
    ctxx.strokeStyle = "rgba(255,255,255,0.06)";
    ctxx.lineWidth = 1;
    roundRect(ctxx, fx + 0.5, fy + 0.5, fw - 1, fh - 1, rad - 0.5);
    ctxx.stroke();

    // ─── Top highlight (gloss effect) ───
    var glossH = fh * 0.12;
    var gloss = ctxx.createLinearGradient(0, fy, 0, fy + glossH);
    gloss.addColorStop(0, "rgba(255,255,255,0.08)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    ctxx.fillStyle = gloss;
    roundRect(ctxx, fx + 2, fy + 2, fw - 4, glossH, rad > 2 ? rad - 1 : 1);
    ctxx.fill();

    // ─── Internal content area ───
    var padX = fw * 0.07;
    var padY = fh * 0.04;
    var cx2 = fx + padX, cy2 = fy + padY;
    var cw2 = fw - padX * 2, ch2 = fh - padY * 2;

    // Internal border
    ctxx.strokeStyle = "rgba(255,255,255,0.04)";
    roundRect(ctxx, cx2, cy2, cw2, ch2, vs(3));
    ctxx.stroke();

    // ─── Vertical offset ───
    var vOff = vs(state.pos.offset);

    // ─── BADGE ───
    var bSize = vs(32);
    var bText = state.front.badge.toUpperCase();
    ctxx.font = "bold " + bSize + "px -apple-system, sans-serif";
    var bW = ctxx.measureText(bText).width + vs(22);
    var bH = bSize * 1.2;
    var badgeY = cy2 + ch2 * 0.03 + vOff;
    var bx = cx - bW / 2, by = badgeY - bH / 2;
    ctxx.fillStyle = state.front.accent;
    roundRect(ctxx, bx, by, bW, bH, bH/2);
    ctxx.fill();
    ctxx.fillStyle = state.front.badgeColor;
    ctxx.textAlign = "center";
    ctxx.textBaseline = "middle";
    ctxx.fillText(bText, cx, badgeY);

    // ─── TEXT CONTENT (cursor-based cascade) ───
    var cursorY = badgeY + bH/2 + vs(12);

    // Title
    var tSize = vs(38);
    ctxx.fillStyle = state.front.titleColor;
    ctxx.font = "bold " + tSize + "px -apple-system, sans-serif";
    ctxx.textAlign = "center";
    ctxx.textBaseline = "top";
    cursorY = wrapText(ctxx, state.front.title, cx, cursorY, cw2 * 0.88, tSize * 1.3);
    cursorY += vs(14);

    // Subtitle
    var sSize = vs(17);
    ctxx.fillStyle = state.front.subtitleColor;
    ctxx.font = sSize + "px -apple-system, sans-serif";
    ctxx.textAlign = "center";
    ctxx.textBaseline = "top";
    ctxx.fillText(state.front.subtitle, cx, cursorY);
    cursorY += sSize + vs(10);

    // Description
    var dSize = vs(13);
    ctxx.fillStyle = state.front.descColor;
    ctxx.font = dSize + "px -apple-system, sans-serif";
    ctxx.textAlign = "center";
    ctxx.textBaseline = "top";
    cursorY = wrapText(ctxx, state.front.desc, cx, cursorY, cw2 * 0.78, dSize * 1.7);
    cursorY += vs(10);

    // ─── Bottom accent bar ───
    var barH = vs(20);
    var barW = fw * 0.45;
    var barY = Math.max(cursorY + vs(8), fy + fh * 0.85);
    if (barY + barH + vs(8) < fy + fh) {
      ctxx.fillStyle = state.front.accent;
      roundRect(ctxx, cx - barW/2, barY, barW, barH, barH/2);
      ctxx.fill();
    }
  }

  // ─── DRAW SCENE SHADOW ────────────────────────────────
  function drawSceneShadow(ctxx) {
    // Floor shadow below the box
    var fx = vx(BOX.side.x); // left edge of side face
    var fw = vx(BOX.front.w + BOX.side.w); // total width
    var boxBottom = vy(BOX.front.y + BOX.front.h);
    var shadowY = boxBottom + vs(15);
    var shadowCX = vx((BOX.side.x + BOX.front.x + BOX.front.w) / 2);
    var shadowH = vs(25);
    var shadowW = fw * 0.8;

    var grad = ctxx.createRadialGradient(shadowCX, shadowY, 1, shadowCX, shadowY, shadowW);
    grad.addColorStop(0, "rgba(0,0,0,0.15)");
    grad.addColorStop(0.5, "rgba(0,0,0,0.06)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctxx.fillStyle = grad;
    ctxx.beginPath();
    ctxx.ellipse(shadowCX, shadowY, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctxx.fill();
  }

  // ─── MAIN RENDER ───────────────────────────────────────
  function renderTo(ctxx, w, h) {
    ctxx.clearRect(0, 0, w, h);

    // 1. Scene background
    ctxx.fillStyle = state.scene.bg;
    ctxx.fillRect(0, 0, w, h);

    // 2. Floor shadow
    drawSceneShadow(ctxx);

    // 3. Side face (behind front)
    drawSideFace(ctxx);

    // 4. Front face (on top with drop shadow)
    drawFrontFace(ctxx);
  }

  function render() {
    renderTo(ctx, dispW, dispH);
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

  // Special bind for slider with label update
  (function () {
    var el = document.getElementById("pos-offset");
    var label = document.getElementById("pos-label");
    if (el && label) {
      el.addEventListener("input", function () {
        state.pos.offset = parseFloat(el.value);
        label.textContent = el.value;
        scheduleRender();
      });
    }
  })();

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

  // ─── Export ─────────────────────────────────────────────
  function exportPNG() {
    try {
      var dpr = 2;
      var ew = VIRT_W, eh = VIRT_H;
      var offscreen = document.createElement("canvas");
      offscreen.width = ew * dpr;
      offscreen.height = eh * dpr;
      var offCtx = offscreen.getContext("2d");
      offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Temporarily swap display size for render
      var oldW = dispW, oldH = dispH;
      dispW = ew;
      dispH = eh;
      renderTo(offCtx, ew, eh);
      dispW = oldW;
      dispH = oldH;

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
  scheduleRender();
  console.log("📦 Box Mockup — Caja profesional dibujada en Canvas 2D");
})();
