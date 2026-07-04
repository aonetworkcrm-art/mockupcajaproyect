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
      price: "$49.99",
      logoText: "BRAND",
      barcodeText: "7 890123 456789",
      bg: "#1a1a3e",
      accent: "#ff6b35",
      titleColor: "#ffffff",
      subtitleColor: "#cccccc",
      badgeColor: "#ffffff",
      descColor: "#aaaaaa",
      priceColor: "#ffd700",
      logoColor: "#ffffff"
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
    },
    toggles: {
      logo: true,
      barcode: true,
      price: true,
      decor: true
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

  // ─── Draw a 4-pointed star ────────────────────────────
  function drawStar(ctxx, cx, cy, r) {
    ctxx.beginPath();
    for (var i = 0; i < 8; i++) {
      var angle = (i * Math.PI) / 4 - Math.PI / 2;
      var rad = i % 2 === 0 ? r : r * 0.35;
      var px = cx + Math.cos(angle) * rad;
      var py = cy + Math.sin(angle) * rad;
      if (i === 0) ctxx.moveTo(px, py);
      else ctxx.lineTo(px, py);
    }
    ctxx.closePath();
    ctxx.fill();
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

    // ─── LOGO ───
    if (state.toggles.logo) {
      var logoText = state.front.logoText;
      if (logoText) {
        var lSize = vs(16);
        var lR = vs(28);
        var lx = cx, ly = cy2 + ch2 * 0.02 + vOff;
        // Outer circle
        ctxx.fillStyle = state.front.accent;
        ctxx.beginPath();
        ctxx.arc(lx, ly, lR, 0, Math.PI * 2);
        ctxx.fill();
        // Inner circle
        ctxx.fillStyle = state.front.bg;
        ctxx.beginPath();
        ctxx.arc(lx, ly, lR - vs(3), 0, Math.PI * 2);
        ctxx.fill();
        // Logo text
        ctxx.fillStyle = state.front.logoColor;
        ctxx.font = "bold " + lSize + "px -apple-system, sans-serif";
        ctxx.textAlign = "center";
        ctxx.textBaseline = "middle";
        ctxx.fillText(logoText.charAt(0).toUpperCase(), lx, ly);
        // Brand name below circle
        ctxx.font = "bold " + vs(12) + "px -apple-system, sans-serif";
        ctxx.fillStyle = state.front.accent;
        ctxx.textBaseline = "top";
        ctxx.fillText(logoText.toUpperCase(), lx, ly + lR + vs(4));
      }
    }

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
    var barY = Math.max(cursorY + vs(8), fy + fh * 0.82);
    if (barY + barH + vs(8) < fy + fh) {
      ctxx.fillStyle = state.front.accent;
      roundRect(ctxx, cx - barW/2, barY, barW, barH, barH/2);
      ctxx.fill();
    }
    var afterBar = barY + barH + vs(12);

    // ─── PRICE ───
    if (state.toggles.price && state.front.price) {
      var pSize = vs(32);
      ctxx.fillStyle = state.front.priceColor;
      ctxx.font = "bold " + pSize + "px -apple-system, sans-serif";
      ctxx.textAlign = "center";
      ctxx.textBaseline = "top";
      ctxx.fillText(state.front.price, cx, afterBar);
      afterBar += pSize + vs(6);
    }

    // ─── DECORATIVE ICONS ───
    if (state.toggles.decor) {
      var dR = vs(4);
      ctxx.fillStyle = rgba({r:255,g:255,b:255}, 0.12);
      // Top-left corner dots
      var dotY1 = cy2 + vs(8) + vOff;
      var dotX1 = cx2 + vs(8);
      for (var di = 0; di < 3; di++) {
        ctxx.beginPath();
        ctxx.arc(dotX1 + di * vs(14), dotY1, dR, 0, Math.PI * 2);
        ctxx.fill();
      }
      // Top-right corner dots
      var dotX2 = cx2 + cw2 - vs(8);
      for (var di = 0; di < 3; di++) {
        ctxx.beginPath();
        ctxx.arc(dotX2 - di * vs(14), dotY1, dR, 0, Math.PI * 2);
        ctxx.fill();
      }
      // Small 4-pointed stars at top corners
      var starY = cy2 + vs(20) + vOff;
      var starSize = vs(6);
      [[dotX1 + vs(6), starY], [dotX2 - vs(6), starY]].forEach(function(p) {
        drawStar(ctxx, p[0], p[1], starSize);
      });
    }

    // ─── BARCODE ───
    if (state.toggles.barcode) {
      var bcY = fy + fh - vs(70) + vOff;
      var bcX = fx + fw * 0.15;
      var bcW = fw * 0.7;
      var bcH = vs(36);
      // White background
      ctxx.fillStyle = "rgba(255,255,255,0.9)";
      roundRect(ctxx, bcX, bcY, bcW, bcH, vs(2));
      ctxx.fill();
      // Barcode lines
      var lines = [2,4,1,3,5,2,1,4,2,3,1,5,2,1,3,4,1,2,5,3,2,1,4,2,3,5,1,2,4,1,3,2,5,1,2,3];
      var totalW = 0;
      var lineMaxW = bcW - vs(16);
      for (var li = 0; li < lines.length; li++) {
        totalW += lines[li];
      }
      var lineScale = lineMaxW / totalW;
      var lx = bcX + vs(8);
      for (var li = 0; li < lines.length; li++) {
        var lw = lines[li] * lineScale;
        ctxx.fillStyle = li % 2 === 0 ? "#000" : "rgba(255,255,255,0.9)";
        ctxx.fillRect(lx, bcY + vs(3), lw, bcH - vs(6));
        lx += lw;
      }
      // Barcode text below
      var bcText = state.front.barcodeText || "7 890123 456789";
      ctxx.fillStyle = "#000";
      ctxx.font = "bold " + vs(9) + "px 'Courier New', monospace";
      ctxx.textAlign = "center";
      ctxx.textBaseline = "top";
      ctxx.fillText(bcText, bcX + bcW/2, bcY + bcH + vs(2));
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

  // Checkbox toggle bind
  function bindToggle(id, path) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", function () {
      var keys = path.split(".");
      var obj = state;
      for (var i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = el.checked;
      scheduleRender();
    });
  }

  bindToggle("toggle-logo", "toggles.logo");
  bindToggle("toggle-barcode", "toggles.barcode");
  bindToggle("toggle-price", "toggles.price");
  bindToggle("toggle-decor", "toggles.decor");

  bind("front-logo", "front.logoText");
  bind("front-price", "front.price");
  bind("front-barcode", "front.barcodeText");
  bind("front-logo-color", "front.logoColor");
  bind("front-price-color", "front.priceColor");

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

  // ─── OPENROUTER AI ────────────────────────────────────────
  var aiSuggestions = [];
  var aiLoading = false;

  // Load API key from localStorage
  var savedKey = localStorage.getItem("openrouter_key") || "";
  var apiKeyInput = document.getElementById("ai-api-key");
  if (apiKeyInput) {
    apiKeyInput.value = savedKey;
    apiKeyInput.addEventListener("input", function () {
      localStorage.setItem("openrouter_key", apiKeyInput.value);
    });
  }

  function generateVariations() {
    var keyEl = document.getElementById("ai-api-key");
    var key = keyEl ? keyEl.value.trim() : "";
    if (!key) {
      showToast("⚠️ Ingresa tu API key de OpenRouter primero", "error");
      return;
    }

    var btn = document.getElementById("btn-ai-generate");
    var container = document.getElementById("ai-suggestions");
    if (!btn || !container) return;

    aiLoading = true;
    btn.disabled = true;
    btn.textContent = "⏳ Generando...";
    container.innerHTML = "<div class='ai-loading'>Generando variaciones...</div>";

    // Build the current config for context
    var currentConfig = {
      title: state.front.title,
      subtitle: state.front.subtitle,
      badge: state.front.badge,
      desc: state.front.desc,
      price: state.front.price,
      logoText: state.front.logoText,
      side: state.side.text,
      bg: state.front.bg,
      accent: state.front.accent,
      sideBg: state.side.bg
    };

    var prompt = [
      "You are a product packaging designer. Given this product box configuration:",
      JSON.stringify(currentConfig, null, 2),
      "",
      "Generate EXACTLY 3 creative variations in this JSON format (no markdown, no code blocks, pure JSON):",
      "[{",
      '  "name": "Short describing name",',
      '  "title": "New product title",',
      '  "subtitle": "New subtitle",',
      '  "badge": "New badge text",',
      '  "desc": "New description",',
      '  "price": "New price",',
      '  "logoText": "Brand name",',
      '  "side": "Side text",',
      '  "bg": "#hex color for front face",',
      '  "accent": "#hex accent color",',
      '  "sideBg": "#hex for side face"',
      "}]"
    ].join("\n");

    fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://box-mockup.netlify.app",
        "X-Title": "Box Mockup Generator"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      var content = data.choices[0].message.content;
      // Clean markdown code blocks if present
      content = content.replace(/```json?/g, "").replace(/```/g, "").trim();
      aiSuggestions = JSON.parse(content);
      if (!Array.isArray(aiSuggestions)) {
        aiSuggestions = [aiSuggestions];
      }
      renderSuggestions(container);
      showToast("✅ " + aiSuggestions.length + " variaciones generadas", "success");
    })
    .catch(function (err) {
      container.innerHTML = "<div class='ai-error'>❌ Error: " + err.message + "</div>";
      showToast("Error: " + err.message, "error");
    })
    .finally(function () {
      aiLoading = false;
      btn.disabled = false;
      btn.textContent = "✨ Generar variaciones";
    });
  }

  function renderSuggestions(container) {
    if (!container || !aiSuggestions.length) {
      container.innerHTML = "<div class='ai-empty'>No se generaron variaciones</div>";
      return;
    }
    var html = "";
    for (var i = 0; i < aiSuggestions.length; i++) {
      var s = aiSuggestions[i];
      var name = s.name || "Variación " + (i + 1);
      // Color previews
      var colors = [s.bg, s.accent, s.sideBg].filter(function(c) { return c; });
      var colorDots = colors.map(function(c) {
        return "<span class='ai-color' style='background:" + c + "'></span>";
      }).join("");
      html += [
        "<div class='ai-card' data-idx='" + i + "'>",
        "  <div class='ai-card-header'>" + name + "</div>",
        "  <div class='ai-card-colors'>" + colorDots + "</div>",
        "  <div class='ai-card-text'>" + (s.title || "") + "</div>",
        "  <div class='ai-card-sub'>" + (s.subtitle || "") + "</div>",
        "  <button class='btn-ai-apply' data-idx='" + i + "'>Aplicar</button>",
        "</div>"
      ].join("");
    }
    container.innerHTML = html;

    // Add apply handlers
    container.querySelectorAll(".btn-ai-apply").forEach(function(btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-idx"));
        applyVariation(idx);
      });
    });
  }

  function applyVariation(idx) {
    var s = aiSuggestions[idx];
    if (!s) return;

    if (s.title) state.front.title = s.title;
    if (s.subtitle) state.front.subtitle = s.subtitle;
    if (s.badge) state.front.badge = s.badge;
    if (s.desc) state.front.desc = s.desc;
    if (s.price) state.front.price = s.price;
    if (s.logoText) state.front.logoText = s.logoText;
    if (s.side) state.side.text = s.side;
    if (s.bg) state.front.bg = s.bg;
    if (s.accent) state.front.accent = s.accent;
    if (s.sideBg) state.side.bg = s.sideBg;

    // Sync UI fields
    function sync(id, val) {
      var el = document.getElementById(id);
      if (el) el.value = val;
    }
    sync("front-title", s.title);
    sync("front-subtitle", s.subtitle);
    sync("front-badge", s.badge);
    sync("front-desc", s.desc);
    sync("front-price", s.price);
    sync("front-logo", s.logoText);
    sync("side-text", s.side);
    sync("front-bg", s.bg);
    sync("front-accent", s.accent);
    sync("side-bg", s.sideBg);

    scheduleRender();
    showToast("✅ Aplicada: " + (s.name || "Variación " + (idx + 1)), "success");
  }

  // Bind AI buttons
  var aiBtn = document.getElementById("btn-ai-generate");
  if (aiBtn) aiBtn.addEventListener("click", generateVariations);

  // ─── Init ────────────────────────────────────────────────
  window.addEventListener("resize", function () { resizeCanvas(); scheduleRender(); });
  document.getElementById("btn-export").addEventListener("click", exportPNG);
  document.getElementById("btn-reset").addEventListener("click", resetAll);

  resizeCanvas();
  scheduleRender();
  console.log("📦 Box Mockup — Caja profesional dibujada en Canvas 2D");
})();
