/*
 * BOX MOCKUP — Photopea como motor
 * 
 * Esta app es un CONFIGURADOR para Photopea.
 * - Editas texto y colores en la sidebar
 * - El PSD real se abre en Photopea con un script que aplica tus cambios
 * - Photopea es quien renderiza el mockup real
 * - Export desde Photopea
 */
(function () {
  "use strict";

  // ─── State ──────────────────────────────────────────────
  const state = {
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
  const toast = document.getElementById("toast");
  const refImg = document.getElementById("reference-img");
  const btnPhotopea = document.getElementById("btn-photopea");
  let toastTimer = null;

  // ─── PSD URL (GitHub raw) ─────────────────────────────
  const PSD_RAW_URL = "https://raw.githubusercontent.com/aonetworkcrm-art/mockupcajaproyect/main/MockupCaja.psd";

  // ─── UI ─────────────────────────────────────────────────
  function showToast(msg, type) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = "toast " + (type || "info");
    void toast.offsetWidth;
    toast.classList.add("show");
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 4000);
  }

  function bind(id, path) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", function () {
      var keys = path.split(".");
      var obj = state;
      for (var i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = el.value;
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

  // ─── Generate Photopea Script ───────────────────────────
  function generateScript() {
    var texts = {
      title: state.front.title,
      subtitle: state.front.subtitle,
      badge: state.front.badge,
      desc: state.front.desc,
      side: state.side.text
    };
    var colors = {
      frontal_bg: state.front.bg,
      lateral_bg: state.side.bg,
      accent: state.front.accent
    };

    var jsTexts = JSON.stringify(texts);
    var jsColors = JSON.stringify(colors);

    // Build ExtendScript — compacto, solo APIs compatibles con Photopea
    var script = [
      'if(app.activeDocument){',
      'var T=' + jsTexts + ';',
      'var C=' + jsColors + ';',
      'var msg="✅ CONFIG\n\n── TEXTO ──\n";',
      'for(var k in T) msg+=k+": "+T[k]+"\n";',
      'msg+="\n── COLORES ──\n";',
      'for(var k in C) msg+=k+": "+C[k]+"\n";',
      'msg+="\n📝 Doble-click en Frontal/Lateral\npara editar el texto";',
      'var doc=app.activeDocument;',
      'try{var f=doc.layers.getByName("Frontal");f.visible=true}catch(e){}',
      'try{var l=doc.layers.getByName("Lateral");l.visible=true}catch(e){}',
      'alert(msg);',
      '}else{alert("❌ No se pudo cargar el PSD");}'
    ].join('');
    return script;
  }

  // ─── Open in Photopea ───────────────────────────────────
  function openPhotopea() {
    try {
      var script = generateScript();
      var config = {
        files: [PSD_RAW_URL],
        script: script
      };
      var hash = encodeURIComponent(JSON.stringify(config));
      var url = "https://www.photopea.com/#" + hash;

      window.open(url, "_blank");
      showToast("🚀 Abriendo Photopea con el PSD y tus datos...", "success");
    } catch (e) {
      showToast("Error: " + e.message, "error");
    }
  }

  // ─── Reset ──────────────────────────────────────────────
  function resetAll() {
    location.reload();
  }

  // ─── Init ────────────────────────────────────────────────
  btnPhotopea.addEventListener("click", openPhotopea);
  document.getElementById("btn-reset").addEventListener("click", resetAll);

  // Load the reference image
  refImg.src = "psd_render.png";
  refImg.onload = function () {
    document.getElementById("loading").classList.add("hidden");
  };
  refImg.onerror = function () {
    document.getElementById("loading").classList.add("hidden");
    showToast("⚠️ No se pudo cargar la imagen de referencia", "error");
  };

  console.log("📦 Box Mockup — Photopea Engine");
})();
