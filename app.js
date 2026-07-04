/*
 * BOX MOCKUP — Aplicación web estática para mockups de caja 3D
 *
 * Renderiza una caja con perspectiva 3D usando Canvas 2D.
 * Permite editar texto y colores en las 3 caras (frontal, lateral, tapa).
 * Integra Photopea para edición profesional con el PSD original.
 * Exporta a PNG con html2canvas.
 *
 * 100% client-side — funciona en Netlify Drop, GitHub Pages, Cloudflare, etc.
 */
(function () {
  "use strict";

  // ─── State ──────────────────────────────────────────────
  const state = {
    front: { title: "Product Name", subtitle: "Premium Quality", badge: "NEW", desc: "The best solution for your business", bg: "#1a1a3e", accent: "#ff6b35", titleColor: "#ffffff", subtitleColor: "#cccccc", badgeColor: "#ffffff", descColor: "#aaaaaa" },
    side: { text: "PRODUCT", bg: "#ff6b35", textColor: "#ffffff" },
    top: { text: "BRAND", bg: "#2a1a5e", textColor: "#ffffff" },
    scene: { bg: "#f0ebe3" },
  };

  // ─── DOM refs ──────────────────────────────────────────
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const toast = document.getElementById("toast");
  let toastTimer = null;
  let renderReq = null;

  // ─── Canvas sizing ─────────────────────────────────────
  function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width * 0.9, rect.height * 0.85, 1000);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * 0.75 * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size * 0.75 + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ─── 3D Box rendering ────────────────────────────────
  function renderBox() {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = state.scene.bg;
    ctx.fillRect(0, 0, w, h);

    // Scene floor shadow
    const floorY = h * 0.72;
    const grad = ctx.createRadialGradient(w / 2, floorY + 20, 10, w / 2, floorY + 20, w * 0.4);
    grad.addColorStop(0, "rgba(0,0,0,0.15)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, floorY, w, h - floorY);

    // Box dimensions (perspective)
    const cx = w / 2;
    const cy = h * 0.48;
    const bw = w * 0.55;   // box width at front
    const bh = h * 0.38;   // box height
    const bd = bw * 0.32;  // box depth
    const pX = bw * 0.20;  // horizontal perspective offset (rightward)
    const pY = bh * 0.12;  // vertical perspective offset (upward)

    // ─── Front face ───
    const fx1 = cx - bw / 2;
    const fy1 = cy - bh / 2;
    const fx2 = cx + bw / 2;
    const fy2 = cy + bh / 2;

    // Front shadow
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 12;

    // Front face fill
    ctx.fillStyle = state.front.bg;
    ctx.beginPath();
    ctx.moveTo(fx1, fy1);
    ctx.lineTo(fx2, fy1);
    ctx.lineTo(fx2, fy2);
    ctx.lineTo(fx1, fy2);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Front border
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(fx1, fy1, bw, bh);

    // Front content area
    const padX = bw * 0.08;
    const padY = bh * 0.06;
    const contentX = fx1 + padX;
    const contentY = fy1 + padY;
    const contentW = bw - padX * 2;
    const contentH = bh - padY * 2;

    // Decorative top bar
    const barH = contentH * 0.06;
    ctx.fillStyle = state.front.accent;
    ctx.beginPath();
    ctx.roundRect(contentX, contentY, contentW, barH, 3);
    ctx.fill();

    // Badge
    const badgeY = contentY + barH + contentH * 0.08;
    const badgeSize = contentH * 0.08;
    ctx.fillStyle = state.front.accent;
    const badgeW = ctx.measureText(state.front.badge).width + badgeSize;
    ctx.beginPath();
    ctx.roundRect(cx - badgeW / 2 - 4, badgeY - badgeSize * 0.3, badgeW + 8, badgeSize, badgeSize / 2);
    ctx.fill();
    ctx.fillStyle = state.front.badgeColor;
    ctx.font = `bold ${badgeSize * 0.55}px -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(state.front.badge.toUpperCase(), cx, badgeY + badgeSize * 0.2);

    // Title
    const titleY = badgeY + contentH * 0.18;
    const titleSize = contentH * 0.13;
    ctx.fillStyle = state.front.titleColor;
    ctx.font = `bold ${titleSize}px -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    wrapText(ctx, state.front.title, cx, titleY, contentW * 0.9, titleSize * 1.2);

    // Subtitle
    const subY = titleY + contentH * 0.2;
    const subSize = contentH * 0.065;
    ctx.fillStyle = state.front.subtitleColor;
    ctx.font = `${subSize}px -apple-system, sans-serif`;
    ctx.fillText(state.front.subtitle, cx, subY);

    // Description
    const descY = subY + contentH * 0.15;
    const descSize = contentH * 0.05;
    ctx.fillStyle = state.front.descColor;
    ctx.font = `${descSize}px -apple-system, sans-serif`;
    wrapText(ctx, state.front.desc, cx, descY, contentW * 0.85, descSize * 1.4);

    // Bottom accent bar
    const bar2Y = fy2 - padY - barH;
    ctx.fillStyle = state.front.accent;
    ctx.beginPath();
    ctx.roundRect(contentX, bar2Y, contentW, barH, 3);
    ctx.fill();

    // ─── Side face (right) — goes RIGHT and UP from front right edge ───
    // Shared edge with front: (fx2, fy1) to (fx2, fy2)
    // Back edge: shifted right by bd and up by pY
    const sx1 = fx2;
    const sy1 = fy1 - pY;          // top-right-front → moves UP in perspective
    const sx2 = fx2 + bd;
    const sy2 = fy2 - pY;          // bottom-right-front → moves UP

    ctx.fillStyle = darkenColor(state.side.bg, 20);
    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.lineTo(sx2, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.lineTo(sx1, sy2);
    ctx.closePath();
    ctx.fill();

    // Side edge highlight
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx2, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();

    // Side text (vertical, centered)
    ctx.save();
    ctx.translate(fx2 + bd * 0.5, (fy1 + fy2) / 2 - pY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = state.side.textColor;
    ctx.font = `bold ${bd * 0.22}px -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(state.side.text, 0, 0);
    ctx.restore();

    // ─── Top face ───
    // Shared edge with front: (fx1, fy1) to (fx2, fy1)
    // Back edge: shifted right by pX and up by bd*0.55
    const backRise = bd * 0.55;    // how much the top goes UP
    const tx1 = fx1 + pX;
    const ty1 = fy1 - backRise;   // top-left-back
    const tx2 = fx2 + pX;
    const ty2 = fy1;               // top-right-back (same y as front top edge)
    // Stylized perspective (not strict 3D) — acceptable for mockup

    ctx.fillStyle = lightenColor(state.top.bg, 15);
    ctx.beginPath();
    ctx.moveTo(fx1, fy1);
    ctx.lineTo(tx1, ty1);
    ctx.lineTo(tx2, ty2);
    ctx.lineTo(fx2, fy1);
    ctx.closePath();
    ctx.fill();

    // Top border
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx1, fy1);
    ctx.lineTo(tx1, ty1);
    ctx.lineTo(tx2, ty2);
    ctx.lineTo(fx2, fy1);
    ctx.closePath();
    ctx.stroke();

    // Top text (rotated with perspective)
    ctx.save();
    ctx.translate((fx1 + fx2) / 2 + pX * 0.5, (fy1 + ty1) / 2 - backRise * 0.05);
    ctx.rotate(-0.12);
    ctx.fillStyle = state.top.textColor;
    ctx.font = `bold ${bd * 0.18}px -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(state.top.text, 0, 0);
    ctx.restore();

    // ─── Highlights ───
    // Front shine
    const shine = ctx.createLinearGradient(fx1, fy1, fx1, fy2);
    shine.addColorStop(0, "rgba(255,255,255,0.06)");
    shine.addColorStop(0.5, "rgba(255,255,255,0)");
    shine.addColorStop(1, "rgba(255,255,255,0.03)");
    ctx.fillStyle = shine;
    ctx.fillRect(fx1, fy1, bw, bh);

    // Edge highlight on side
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.lineTo(sx2, sy1);
    ctx.stroke();
  }

  // ─── Helpers ───────────────────────────────────────────
  function darkenColor(hex, amt) {
    const r = Math.max(parseInt(hex.slice(1,3), 16) - amt, 0);
    const g = Math.max(parseInt(hex.slice(3,5), 16) - amt, 0);
    const b = Math.max(parseInt(hex.slice(5,7), 16) - amt, 0);
    return `rgb(${r},${g},${b})`;
  }

  function lightenColor(hex, amt) {
    const r = Math.min(parseInt(hex.slice(1,3), 16) + amt, 255);
    const g = Math.min(parseInt(hex.slice(3,5), 16) + amt, 255);
    const b = Math.min(parseInt(hex.slice(5,7), 16) + amt, 255);
    return `rgb(${r},${g},${b})`;
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let ly = y;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + " ";
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line.trim(), x, ly);
        line = words[i] + " ";
        ly += lineHeight;
      } else {
        line = test;
      }
    }
    if (line.trim()) ctx.fillText(line.trim(), x, ly);
  }

  function showToast(msg, type = "info") {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = "toast " + type;
    void toast.offsetWidth;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // ─── Schedule render ──────────────────────────────────
  function scheduleRender() {
    if (renderReq) cancelAnimationFrame(renderReq);
    renderReq = requestAnimationFrame(() => {
      renderBox();
      renderReq = null;
    });
  }

  // ─── Bind inputs ──────────────────────────────────────
  function bind(id, path) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      const keys = path.split(".");
      let obj = state;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
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
  bind("top-text", "top.text");
  bind("top-bg", "top.bg");
  bind("top-text-color", "top.textColor");
  bind("scene-bg", "scene.bg");

  async function exportPNG() {
    try {
      const dpr = 2;
      const w = 2000;
      const h = 1500;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = w * dpr;
      tempCanvas.height = h * dpr;

      // Store visible canvas state
      const visW = canvas.width;
      const visH = canvas.height;

      // Render at export resolution (temporarily resize)
      const origCanvasW = canvas.width;
      const origCanvasH = canvas.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderBox();

      // Copy to temp
      tempCanvas.getContext("2d").drawImage(canvas, 0, 0);

      // Restore visible canvas
      canvas.width = origCanvasW;
      canvas.height = origCanvasH;
      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);

      // Download
      tempCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mockup_caja.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("✅ Mockup exportado (4000×3000px)", "success");
      }, "image/png");
    } catch (e) {
      showToast("Error al exportar", "error");
    }

    scheduleRender();
  }

  // ─── Photopea ──────────────────────────────────────────
  function openPhotopea() {
    // Photopea espera parámetros JSON específicos en el hash:
    // { "files[]": ["URL_DEL_PSD"], "script": "..." }
    // Como no podemos hostear el PSD públicamente desde local,
    // abrimos Photopea vacío para que el usuario arrastre su PSD manualmente.
    const url = "https://www.photopea.com/";
    window.open(url, "_blank");
    showToast("🔗 Arrastra tu archivo .psd a Photopea (desde la carpeta templates/)", "info");
  }

  // ─── Reset ─────────────────────────────────────────────
  function resetAll() {
    location.reload();
  }

  // ─── Init ──────────────────────────────────────────────
  window.addEventListener("resize", () => {
    resizeCanvas();
    scheduleRender();
  });

  document.getElementById("btn-export").addEventListener("click", exportPNG);
  document.getElementById("btn-photopea").addEventListener("click", openPhotopea);
  document.getElementById("btn-reset").addEventListener("click", resetAll);

  // roundRect polyfill
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (r > w / 2) r = w / 2;
      if (r > h / 2) r = h / 2;
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
    };
  }

  resizeCanvas();
  scheduleRender();

  console.log("📦 Box Mockup loaded");
})();
