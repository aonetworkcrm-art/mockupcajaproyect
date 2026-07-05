/*
 * BOX MOCKUP 3D — Caja profesional 3D con Three.js
 *
 * Basado en MockupCaja.psd:
 *   Frontal: 750×1358  |  Lateral: 181×1358
 *   WebGL con perspectiva real, iluminación, sombras, rotación interactiva
 *
 * 100% editable en vivo mediante texturas Canvas2D → Three.js
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ═══════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════ */

const state = {
    front: {
        title: 'Product Name',
        subtitle: 'Premium Quality',
        badge: 'NEW',
        desc: 'The best solution for your business',
        price: '$49.99',
        logoText: 'BRAND',
        barcodeText: '7 890123 456789',
        bg: '#1a1a3e',
        accent: '#ff6b35',
        titleColor: '#ffffff',
        subtitleColor: '#cccccc',
        badgeColor: '#ffffff',
        descColor: '#aaaaaa',
        priceColor: '#ffd700',
        logoColor: '#ffffff',
    },
    side: {
        text: 'PRODUCT',
        bg: '#d45a2a',
        textColor: '#ffffff',
    },
    scene: {
        bg: '#f0ebe3',
    },
    pos: {
        offset: 0,
    },
    toggles: {
        logo: true,
        barcode: true,
        price: true,
        decor: true,
    },
    view: 'threequarter', // 'front' | 'threequarter' | 'side' | 'top'
};

/* ═══════════════════════════════════════════
   DOM REFS
   ═══════════════════════════════════════════ */

const canvas = document.getElementById('canvas');
const toast = document.getElementById('toast');
const loadingEl = document.getElementById('loading');
let toastTimer = null;

loadingEl.classList.add('hidden');

/* ═══════════════════════════════════════════
   THREE.JS — DIMENSIONES DE LA CAJA (PSD)
   ═══════════════════════════════════════════ */

const FRONT_W = 750;
const FRONT_H = 1358;
const SIDE_W = 181;
const SIDE_D = SIDE_W; // depth in 3D = side face width

// La caja se centra en origen: dimensiones (ancho, alto, profundidad)
const BOX_W = FRONT_W;
const BOX_H = FRONT_H;
const BOX_D = SIDE_D;

/* ═══════════════════════════════════════════
   THREE.JS — SETUP DE ESCENA
   ═══════════════════════════════════════════ */

const scene = new THREE.Scene();

// Cámara perspectiva
const camera = new THREE.PerspectiveCamera(25, 1, 1, 10000);
camera.position.set(400, 250, 700);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 400;
controls.maxDistance = 2500;
controls.update();

/* ═══════════════════════════════════════════
   THREE.JS — LUCES
   ═══════════════════════════════════════════ */

// Luz ambiental (base)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Luz hemisferio (simula cielo + suelo)
const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x887766, 0.6);
scene.add(hemiLight);

// Luz direccional principal (desde arriba-izquierda-frente)
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(-400, 600, 500);
scene.add(mainLight);

// Luz de relleno (desde atrás-derecha)
const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight.position.set(300, 100, -400);
scene.add(fillLight);

// Luz de borde (desde atrás-izquierda)
const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
rimLight.position.set(-300, -100, -500);
scene.add(rimLight);

/* ═══════════════════════════════════════════
   THREE.JS — SOMBRA DE SUELO
   ═══════════════════════════════════════════ */

function createGroundShadow() {
    const shadowSize = 1100;
    const canvas2 = document.createElement('canvas');
    canvas2.width = 512;
    canvas2.height = 512;
    const gctx = canvas2.getContext('2d');
    const grad = gctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, 'rgba(0,0,0,0.30)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0.15)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 512, 512);

    const shadowTex = new THREE.CanvasTexture(canvas2);
    const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
    const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(shadowSize, shadowSize * 0.6),
        shadowMat
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -BOX_H / 2 - 5; // justo debajo de la caja
    shadowPlane.position.z = 50; // ligeramente adelante
    scene.add(shadowPlane);
    return shadowPlane;
}

let groundShadow = createGroundShadow();

/* ═══════════════════════════════════════════
   THREE.JS — CAJA 3D
   ═══════════════════════════════════════════ */

// Texturas (se actualizan dinámicamente)
let frontCanvas = document.createElement('canvas');
let sideCanvas = document.createElement('canvas');
let topCanvas = document.createElement('canvas');
let frontTexture = new THREE.CanvasTexture(frontCanvas);
let sideTexture = new THREE.CanvasTexture(sideCanvas);
let topTexture = new THREE.CanvasTexture(topCanvas);

// Material de relleno oscuro para caras no visibles
const darkMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.7,
    metalness: 0.1,
});

// Materiales texturizados
const frontMat = new THREE.MeshStandardMaterial({
    map: frontTexture,
    roughness: 0.3,
    metalness: 0.05,
    side: THREE.DoubleSide,
});
const sideMat = new THREE.MeshStandardMaterial({
    map: sideTexture,
    roughness: 0.3,
    metalness: 0.05,
    side: THREE.DoubleSide,
});
const topMat = new THREE.MeshStandardMaterial({
    map: topTexture,
    roughness: 0.3,
    metalness: 0.05,
    side: THREE.DoubleSide,
});

// Materiales: [+X, -X, +Y, -Y, +Z, -Z]
// +X = lado derecho (no visible en vista 3/4 típica)
// -X = lado izquierdo (visible en vista 3/4 típica = cara lateral)
// +Y = tapa superior
// -Y = fondo (no visible)
// +Z = frente (cara frontal)
// -Z = atrás (no visible)
const materials = [
    darkMat,   // +X (right)
    sideMat,   // -X (left = side face)
    topMat,    // +Y (top)
    darkMat,   // -Y (bottom)
    frontMat,  // +Z (front)
    darkMat,   // -Z (back)
];

const geometry = new THREE.BoxGeometry(BOX_W, BOX_H, BOX_D);
const box = new THREE.Mesh(geometry, materials);
box.castShadow = false; // we handle shadows via the ground plane
scene.add(box);

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function hexToRgb(h) {
    return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
}
function rgba(c, a) {
    return 'rgba(' + (c.r | 0) + ',' + (c.g | 0) + ',' + (c.b | 0) + ',' + a + ')';
}

function drawStar(ctxx, cx, cy, r) {
    ctxx.beginPath();
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.35;
        const px = cx + Math.cos(angle) * rad;
        const py = cy + Math.sin(angle) * rad;
        if (i === 0) ctxx.moveTo(px, py);
        else ctxx.lineTo(px, py);
    }
    ctxx.closePath();
    ctxx.fill();
}

function roundRect(ctxx, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctxx.beginPath();
    ctxx.moveTo(x + r, y);
    ctxx.lineTo(x + w - r, y);
    ctxx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctxx.lineTo(x + w, y + h - r);
    ctxx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctxx.lineTo(x + r, y + h);
    ctxx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctxx.lineTo(x, y + r);
    ctxx.quadraticCurveTo(x, y, x + r, y);
    ctxx.closePath();
}

function wrapText(ctxx, text, x, y, maxW, lh) {
    if (!text) return y;
    const words = text.split(' ');
    let line = '',
        ly = y;
    for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const test = line + w + ' ';
        if (ctxx.measureText(test).width > maxW && line) {
            ctxx.fillText(line.trim(), x, ly);
            line = w + ' ';
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

/* ═══════════════════════════════════════════
   TEXTURA — CARA FRONTAL (750×1358)
   ═══════════════════════════════════════════ */

function renderFrontTexture() {
    const w = FRONT_W,
        h = FRONT_H;
    if (frontCanvas.width !== w || frontCanvas.height !== h) {
        frontCanvas = document.createElement('canvas');
        frontCanvas.width = w;
        frontCanvas.height = h;
    }
    const ctxx = frontCanvas.getContext('2d');
    ctxx.clearRect(0, 0, w, h);

    const rgb = hexToRgb(state.front.bg);
    const rad = 6;

    // ─── Base fill (prevents transparent corners from showing as black) ───
    ctxx.fillStyle = rgba({ r: rgb.r + 18, g: rgb.g + 18, b: rgb.b + 18 }, 1);
    ctxx.fillRect(0, 0, w, h);

    // ─── Shadow (baked into texture) ───
    ctxx.save();
    ctxx.shadowColor = 'rgba(0,0,0,0.25)';
    ctxx.shadowBlur = 28;
    ctxx.shadowOffsetX = 8;
    ctxx.shadowOffsetY = 14;
    const grad = ctxx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, rgba({ r: rgb.r + 18, g: rgb.g + 18, b: rgb.b + 18 }, 1));
    grad.addColorStop(0.15, rgba(rgb, 1));
    grad.addColorStop(0.85, rgba(rgb, 1));
    grad.addColorStop(1, rgba({ r: rgb.r - 10, g: rgb.g - 10, b: rgb.b - 10 }, 1));
    ctxx.fillStyle = grad;
    roundRect(ctxx, 0, 0, w, h, rad);
    ctxx.fill();
    ctxx.restore();

    // ─── Border ───
    ctxx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctxx.lineWidth = 1;
    roundRect(ctxx, 0.5, 0.5, w - 1, h - 1, rad - 0.5);
    ctxx.stroke();

    // ─── Gloss ───
    const glossH = h * 0.12;
    const gloss = ctxx.createLinearGradient(0, 0, 0, glossH);
    gloss.addColorStop(0, 'rgba(255,255,255,0.08)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctxx.fillStyle = gloss;
    roundRect(ctxx, 2, 2, w - 4, glossH, rad > 2 ? rad - 1 : 1);
    ctxx.fill();

    // ─── Internal content area ───
    const padX = w * 0.07;
    const padY = h * 0.04;
    const cx2 = padX,
        cy2 = padY;
    const cw2 = w - padX * 2,
        ch2 = h - padY * 2;
    const cx = w / 2;

    // Internal border
    ctxx.strokeStyle = 'rgba(255,255,255,0.04)';
    roundRect(ctxx, cx2, cy2, cw2, ch2, 3);
    ctxx.stroke();

    const vOff = state.pos.offset;

    // ─── LOGO ───
    if (state.toggles.logo && state.front.logoText) {
        const logoText = state.front.logoText;
        const lR = 28;
        const lSize = 16;
        const lx = cx,
            ly = cy2 + ch2 * 0.02 + vOff;
        ctxx.fillStyle = state.front.accent;
        ctxx.beginPath();
        ctxx.arc(lx, ly, lR, 0, Math.PI * 2);
        ctxx.fill();
        ctxx.fillStyle = state.front.bg;
        ctxx.beginPath();
        ctxx.arc(lx, ly, lR - 3, 0, Math.PI * 2);
        ctxx.fill();
        ctxx.fillStyle = state.front.logoColor;
        ctxx.font = 'bold ' + lSize + 'px -apple-system, sans-serif';
        ctxx.textAlign = 'center';
        ctxx.textBaseline = 'middle';
        ctxx.fillText(logoText.charAt(0).toUpperCase(), lx, ly);
        ctxx.font = 'bold 12px -apple-system, sans-serif';
        ctxx.fillStyle = state.front.accent;
        ctxx.textBaseline = 'top';
        ctxx.fillText(logoText.toUpperCase(), lx, ly + lR + 4);
    }

    // ─── BADGE ───
    const bSize = 32;
    const bText = state.front.badge.toUpperCase();
    ctxx.font = 'bold ' + bSize + 'px -apple-system, sans-serif';
    const bW = ctxx.measureText(bText).width + 22;
    const bH = bSize * 1.2;
    const badgeY = cy2 + ch2 * 0.03 + vOff;
    const bx = cx - bW / 2,
        by = badgeY - bH / 2;
    ctxx.fillStyle = state.front.accent;
    roundRect(ctxx, bx, by, bW, bH, bH / 2);
    ctxx.fill();
    ctxx.fillStyle = state.front.badgeColor;
    ctxx.textAlign = 'center';
    ctxx.textBaseline = 'middle';
    ctxx.fillText(bText, cx, badgeY);

    // ─── Text cascade ───
    let cursorY = badgeY + bH / 2 + 12;

    // Title
    const tSize = 38;
    ctxx.fillStyle = state.front.titleColor;
    ctxx.font = 'bold ' + tSize + 'px -apple-system, sans-serif';
    ctxx.textAlign = 'center';
    ctxx.textBaseline = 'top';
    cursorY = wrapText(ctxx, state.front.title, cx, cursorY, cw2 * 0.88, tSize * 1.3);
    cursorY += 14;

    // Subtitle
    const sSize = 17;
    ctxx.fillStyle = state.front.subtitleColor;
    ctxx.font = sSize + 'px -apple-system, sans-serif';
    ctxx.textAlign = 'center';
    ctxx.textBaseline = 'top';
    ctxx.fillText(state.front.subtitle, cx, cursorY);
    cursorY += sSize + 10;

    // Desc
    const dSize = 13;
    ctxx.fillStyle = state.front.descColor;
    ctxx.font = dSize + 'px -apple-system, sans-serif';
    ctxx.textAlign = 'center';
    ctxx.textBaseline = 'top';
    cursorY = wrapText(ctxx, state.front.desc, cx, cursorY, cw2 * 0.78, dSize * 1.7);
    cursorY += 10;

    // ─── Accent bar ───
    const barH = 20;
    const barW = w * 0.45;
    const barY = Math.max(cursorY + 8, h * 0.82);
    if (barY + barH + 8 < h) {
        ctxx.fillStyle = state.front.accent;
        roundRect(ctxx, cx - barW / 2, barY, barW, barH, barH / 2);
        ctxx.fill();
    }
    let afterBar = barY + barH + 12;

    // ─── PRICE ───
    if (state.toggles.price && state.front.price) {
        const pSize = 32;
        ctxx.fillStyle = state.front.priceColor;
        ctxx.font = 'bold ' + pSize + 'px -apple-system, sans-serif';
        ctxx.textAlign = 'center';
        ctxx.textBaseline = 'top';
        ctxx.fillText(state.front.price, cx, afterBar);
        afterBar += pSize + 6;
    }

    // ─── DECOR ───
    if (state.toggles.decor) {
        const dR = 4;
        ctxx.fillStyle = rgba({ r: 255, g: 255, b: 255 }, 0.12);
        const dotY1 = cy2 + 8 + vOff;
        const dotX1 = cx2 + 8;
        for (let di = 0; di < 3; di++) {
            ctxx.beginPath();
            ctxx.arc(dotX1 + di * 14, dotY1, dR, 0, Math.PI * 2);
            ctxx.fill();
        }
        const dotX2 = cx2 + cw2 - 8;
        for (let di = 0; di < 3; di++) {
            ctxx.beginPath();
            ctxx.arc(dotX2 - di * 14, dotY1, dR, 0, Math.PI * 2);
            ctxx.fill();
        }
        const starY = cy2 + 20 + vOff;
        [
            [dotX1 + 6, starY],
            [dotX2 - 6, starY],
        ].forEach(function(p) {
            drawStar(ctxx, p[0], p[1], 6);
        });
    }

    // ─── BARCODE ───
    if (state.toggles.barcode) {
        const bcY = h - 70 + vOff;
        const bcX = w * 0.15;
        const bcW = w * 0.7;
        const bcH = 36;
        ctxx.fillStyle = 'rgba(255,255,255,0.9)';
        roundRect(ctxx, bcX, bcY, bcW, bcH, 2);
        ctxx.fill();
        const lines = [2, 4, 1, 3, 5, 2, 1, 4, 2, 3, 1, 5, 2, 1, 3, 4, 1, 2, 5, 3, 2, 1, 4, 2, 3, 5, 1, 2, 4, 1, 3, 2, 5, 1, 2, 3];
        const totalW = lines.reduce((a, b) => a + b, 0);
        const lineScale = (bcW - 16) / totalW;
        let lx = bcX + 8;
        for (let li = 0; li < lines.length; li++) {
            const lw = lines[li] * lineScale;
            ctxx.fillStyle = li % 2 === 0 ? '#000' : 'rgba(255,255,255,0.9)';
            ctxx.fillRect(lx, bcY + 3, lw, bcH - 6);
            lx += lw;
        }
        const bcText = state.front.barcodeText || '7 890123 456789';
        ctxx.fillStyle = '#000';
        ctxx.font = "bold 9px 'Courier New', monospace";
        ctxx.textAlign = 'center';
        ctxx.textBaseline = 'top';
        ctxx.fillText(bcText, bcX + bcW / 2, bcY + bcH + 2);
    }

    frontTexture = new THREE.CanvasTexture(frontCanvas);
    frontTexture.colorSpace = THREE.SRGBColorSpace;
    return frontTexture;
}

/* ═══════════════════════════════════════════
   TEXTURA — CARA LATERAL (181×1358)
   ═══════════════════════════════════════════ */

function renderSideTexture() {
    const w = SIDE_W,
        h = FRONT_H;
    if (sideCanvas.width !== w || sideCanvas.height !== h) {
        sideCanvas = document.createElement('canvas');
        sideCanvas.width = w;
        sideCanvas.height = h;
    }
    const ctxx = sideCanvas.getContext('2d');
    ctxx.clearRect(0, 0, w, h);

    const rgb = hexToRgb(state.side.bg);

    // Gradient vertical
    const grad = ctxx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, rgba({ r: rgb.r + 18, g: rgb.g + 18, b: rgb.b + 18 }, 1));
    grad.addColorStop(0.15, rgba(rgb, 1));
    grad.addColorStop(0.85, rgba(rgb, 1));
    grad.addColorStop(1, rgba({ r: rgb.r - 10, g: rgb.g - 10, b: rgb.b - 10 }, 1));
    ctxx.fillStyle = grad;
    ctxx.fillRect(0, 0, w, h);

    // Fold line
    ctxx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctxx.lineWidth = 1;
    ctxx.beginPath();
    ctxx.moveTo(0.5, h * 0.02);
    ctxx.lineTo(0.5, h * 0.98);
    ctxx.stroke();

    // Side text (rotated -90°)
    ctxx.save();
    ctxx.translate(w / 2, h / 2);
    ctxx.rotate(-Math.PI / 2);
    ctxx.fillStyle = state.side.textColor;
    let sFontSize = w * 0.42;
    ctxx.font = 'bold ' + sFontSize + 'px -apple-system, sans-serif';
    ctxx.textAlign = 'center';
    ctxx.textBaseline = 'middle';
    let sText = state.side.text;
    let sW = ctxx.measureText(sText).width;
    let sMaxW = h * 0.85;
    if (sW > sMaxW) {
        const ratio = sMaxW / sW;
        sFontSize = sFontSize * ratio;
        ctxx.font = 'bold ' + sFontSize + 'px -apple-system, sans-serif';
    }
    ctxx.fillText(sText, 0, 0);
    ctxx.restore();

    // Subtle highlight
    ctxx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctxx.lineWidth = 1;
    ctxx.beginPath();
    ctxx.moveTo(w - 0.5, h * 0.05);
    ctxx.lineTo(w - 0.5, h * 0.95);
    ctxx.stroke();

    sideTexture = new THREE.CanvasTexture(sideCanvas);
    sideTexture.colorSpace = THREE.SRGBColorSpace;
    return sideTexture;
}

/* ═══════════════════════════════════════════
   TEXTURA — TAPA SUPERIOR (750×181)
   ═══════════════════════════════════════════ */

function renderTopTexture() {
    const w = FRONT_W,
        h = SIDE_W;
    if (topCanvas.width !== w || topCanvas.height !== h) {
        topCanvas = document.createElement('canvas');
        topCanvas.width = w;
        topCanvas.height = h;
    }
    const ctxx = topCanvas.getContext('2d');
    ctxx.clearRect(0, 0, w, h);

    const rgb = hexToRgb(state.front.bg);

    // Gradient: lighter at front (+Z = canvas bottom), darker at back (-Z = canvas top)
    // flipY=true: canvas top → V=1 → +Z (front edge)
    const grad = ctxx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, rgba({ r: rgb.r + 18, g: rgb.g + 18, b: rgb.b + 18 }, 1));
    grad.addColorStop(0.5, rgba(rgb, 1));
    grad.addColorStop(1, rgba({ r: rgb.r - 20, g: rgb.g - 20, b: rgb.b - 20 }, 1));
    ctxx.fillStyle = grad;
    ctxx.fillRect(0, 0, w, h);

    // Subtle edge highlight
    ctxx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctxx.lineWidth = 1;
    ctxx.strokeRect(0.5, 0.5, w - 1, h - 1);

    topTexture = new THREE.CanvasTexture(topCanvas);
    topTexture.colorSpace = THREE.SRGBColorSpace;
    return topTexture;
}

/* ═══════════════════════════════════════════
   REBUILD — ACTUALIZA TODAS LAS TEXTURAS
   ═══════════════════════════════════════════ */

function rebuildTextures() {
    // Actualizar materiales
    frontMat.map = renderFrontTexture();
    frontMat.needsUpdate = true;

    sideMat.map = renderSideTexture();
    sideMat.needsUpdate = true;

    topMat.map = renderTopTexture();
    topMat.needsUpdate = true;

    // Fondo de escena
    scene.background = new THREE.Color(state.scene.bg);

    // Sombra de suelo (recrear con color actualizado del fondo)
    scene.remove(groundShadow);
    groundShadow = createGroundShadow();

    scheduleRender();
}

/* ═══════════════════════════════════════════
   VIEW PRESETS
   ═══════════════════════════════════════════ */

const VIEW_PRESETS = {
    front: { pos: [0, 0, 750], target: [0, 0, 0] },
    threequarter: { pos: [-400, 250, 700], target: [0, 0, 0] },
    side: { pos: [-550, 0, 0], target: [0, 0, 0] },
    top: { pos: [0, 900, 1], target: [0, 0, 0] },
};

// Camera animation
let cameraAnim = null;

function animateCamera(targetPos, targetLook, duration) {
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const endPos = new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]);
    const endTarget = new THREE.Vector3(targetLook[0], targetLook[1], targetLook[2]);
    const startTime = performance.now();

    cameraAnim = {
        startPos,
        endPos,
        startTarget,
        endTarget,
        startTime,
        duration,
    };
}

function updateCameraAnim() {
    if (!cameraAnim) return;
    const elapsed = performance.now() - cameraAnim.startTime;
    const t = Math.min(elapsed / cameraAnim.duration, 1);
    // Smooth ease-in-out
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    camera.position.lerpVectors(cameraAnim.startPos, cameraAnim.endPos, ease);
    controls.target.lerpVectors(cameraAnim.startTarget, cameraAnim.endTarget, ease);

    if (t >= 1) {
        cameraAnim = null;
    }
}

function setView(viewName) {
    const preset = VIEW_PRESETS[viewName];
    if (!preset) return;
    state.view = viewName;
    animateCamera(preset.pos, preset.target, 600);

    // Update active button
    document.querySelectorAll('.btn-view').forEach(function(btn) {
        btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });
}

/* ═══════════════════════════════════════════
   RENDER LOOP
   ═══════════════════════════════════════════ */

function animate() {
    requestAnimationFrame(animate);

    if (cameraAnim) {
        updateCameraAnim();
    }

    controls.update();

    // Rotación sutil automática solo si el usuario no está interactuando
    // (comentado para mantener control manual completo)
    // if (!controls.isDragging) {
    //     box.rotation.y += 0.001;
    // }

    renderer.render(scene, camera);
}

/* ═══════════════════════════════════════════
   RESIZE
   ═══════════════════════════════════════════ */

function resizeRenderer() {
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const w = rect.width * 0.92;
    const h = rect.height * 0.92;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    renderer.setSize(w, h);
    renderer.setPixelRatio(dpr);

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}

/* ═══════════════════════════════════════════
   UI BINDINGS
   ═══════════════════════════════════════════ */

function showToast(msg, type) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = 'toast ' + (type || 'info');
    void toast.offsetWidth;
    toast.classList.add('show');
    toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

function bind(id, path) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function() {
        const keys = path.split('.');
        let obj = state;
        for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
        obj[keys[keys.length - 1]] = el.value;
        rebuildTextures();
    });
}

// Slider with label
(function() {
    const el = document.getElementById('pos-offset');
    const label = document.getElementById('pos-label');
    if (el && label) {
        el.addEventListener('input', function() {
            state.pos.offset = parseFloat(el.value);
            label.textContent = el.value;
            rebuildTextures();
        });
    }
})();

function bindToggle(id, path) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', function() {
        const keys = path.split('.');
        let obj = state;
        for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
        obj[keys[keys.length - 1]] = el.checked;
        rebuildTextures();
    });
}

bindToggle('toggle-logo', 'toggles.logo');
bindToggle('toggle-barcode', 'toggles.barcode');
bindToggle('toggle-price', 'toggles.price');
bindToggle('toggle-decor', 'toggles.decor');

bind('front-logo', 'front.logoText');
bind('front-price', 'front.price');
bind('front-barcode', 'front.barcodeText');
bind('front-logo-color', 'front.logoColor');
bind('front-price-color', 'front.priceColor');
bind('front-title', 'front.title');
bind('front-subtitle', 'front.subtitle');
bind('front-badge', 'front.badge');
bind('front-desc', 'front.desc');
bind('front-bg', 'front.bg');
bind('front-accent', 'front.accent');
bind('front-title-color', 'front.titleColor');
bind('front-subtitle-color', 'front.subtitleColor');
bind('front-badge-color', 'front.badgeColor');
bind('front-desc-color', 'front.descColor');
bind('side-text', 'side.text');
bind('side-bg', 'side.bg');
bind('side-text-color', 'side.textColor');
bind('scene-bg', 'scene.bg');

/* ─── View buttons ─── */

document.querySelectorAll('.btn-view').forEach(function(btn) {
    btn.addEventListener('click', function() {
        const view = this.getAttribute('data-view');
        if (view) setView(view);
    });
});

/* ─── Export ─── */

function exportPNG() {
    try {
        const ew = 4000,
            eh = 3500;
        const exportRenderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true,
        });
        exportRenderer.setSize(ew, eh);
        exportRenderer.setPixelRatio(1);
        exportRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        exportRenderer.toneMappingExposure = 1.0;
        exportRenderer.outputColorSpace = THREE.SRGBColorSpace;

        // Temporarily adjust camera aspect
        const oldAspect = camera.aspect;
        camera.aspect = ew / eh;
        camera.updateProjectionMatrix();

        exportRenderer.render(scene, camera);

        // Restore camera
        camera.aspect = oldAspect;
        camera.updateProjectionMatrix();

        exportRenderer.domElement.toBlob(function(blob) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'mockup_caja_3d.png';
            a.click();
            URL.revokeObjectURL(a.href);
            exportRenderer.dispose();
            showToast('✅ Exportado ' + ew + '×' + eh + 'px', 'success');
        }, 'image/png');
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    }
}

function resetAll() { location.reload(); }

/* ─── OpenRouter AI ─── */

let aiSuggestions = [];
let aiLoading = false;

const savedKey = localStorage.getItem('openrouter_key') || '';
const apiKeyInput = document.getElementById('ai-api-key');
if (apiKeyInput) {
    apiKeyInput.value = savedKey;
    apiKeyInput.addEventListener('input', function() {
        localStorage.setItem('openrouter_key', apiKeyInput.value);
    });
}

function generateVariations() {
    const keyEl = document.getElementById('ai-api-key');
    const key = keyEl ? keyEl.value.trim() : '';
    if (!key) {
        showToast('⚠️ Ingresa tu API key de OpenRouter primero', 'error');
        return;
    }

    const btn = document.getElementById('btn-ai-generate');
    const container = document.getElementById('ai-suggestions');
    if (!btn || !container) return;

    aiLoading = true;
    btn.disabled = true;
    btn.textContent = '⏳ Generando...';
    container.innerHTML = "<div class='ai-loading'>Generando variaciones...</div>";

    const currentConfig = {
        title: state.front.title,
        subtitle: state.front.subtitle,
        badge: state.front.badge,
        desc: state.front.desc,
        price: state.front.price,
        logoText: state.front.logoText,
        side: state.side.text,
        bg: state.front.bg,
        accent: state.front.accent,
        sideBg: state.side.bg,
    };

    const prompt = [
        'You are a product packaging designer. Given this product box configuration:',
        JSON.stringify(currentConfig, null, 2),
        '',
        'Generate EXACTLY 3 creative variations in this JSON format (no markdown, no code blocks, pure JSON):',
        '[{',
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
        '}]',
    ].join('\n');

    fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://box-mockup.netlify.app',
                'X-Title': 'Box Mockup 3D',
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 2000,
            }),
        })
        .then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(function(data) {
            let content = data.choices[0].message.content;
            content = content.replace(/```json?/g, '').replace(/```/g, '').trim();
            aiSuggestions = JSON.parse(content);
            if (!Array.isArray(aiSuggestions)) {
                aiSuggestions = [aiSuggestions];
            }
            renderSuggestions(container);
            showToast('✅ ' + aiSuggestions.length + ' variaciones generadas', 'success');
        })
        .catch(function(err) {
            container.innerHTML = "<div class='ai-error'>❌ Error: " + err.message + '</div>';
            showToast('Error: ' + err.message, 'error');
        })
        .finally(function() {
            aiLoading = false;
            btn.disabled = false;
            btn.textContent = '✨ Generar variaciones';
        });
}

function renderSuggestions(container) {
    if (!container || !aiSuggestions.length) {
        container.innerHTML = "<div class='ai-empty'>No se generaron variaciones</div>";
        return;
    }
    let html = '';
    for (let i = 0; i < aiSuggestions.length; i++) {
        const s = aiSuggestions[i];
        const name = s.name || 'Variación ' + (i + 1);
        const colors = [s.bg, s.accent, s.sideBg].filter(function(c) { return c; });
        const colorDots = colors.map(function(c) {
            return "<span class='ai-color' style='background:" + c + "'></span>";
        }).join('');
        html += [
            "<div class='ai-card' data-idx='" + i + "'>",
            "  <div class='ai-card-header'>" + name + '</div>',
            "  <div class='ai-card-colors'>" + colorDots + '</div>',
            "  <div class='ai-card-text'>" + (s.title || '') + '</div>',
            "  <div class='ai-card-sub'>" + (s.subtitle || '') + '</div>',
            "  <button class='btn-ai-apply' data-idx='" + i + "'>Aplicar</button>",
            '</div>',
        ].join('');
    }
    container.innerHTML = html;

    container.querySelectorAll('.btn-ai-apply').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const idx = parseInt(btn.getAttribute('data-idx'));
            applyVariation(idx);
        });
    });
}

function applyVariation(idx) {
    const s = aiSuggestions[idx];
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

    function sync(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }
    sync('front-title', s.title);
    sync('front-subtitle', s.subtitle);
    sync('front-badge', s.badge);
    sync('front-desc', s.desc);
    sync('front-price', s.price);
    sync('front-logo', s.logoText);
    sync('side-text', s.side);
    sync('front-bg', s.bg);
    sync('front-accent', s.accent);
    sync('side-bg', s.sideBg);

    rebuildTextures();
    showToast('✅ Aplicada: ' + (s.name || 'Variación ' + (idx + 1)), 'success');
}

const aiBtn = document.getElementById('btn-ai-generate');
if (aiBtn) aiBtn.addEventListener('click', generateVariations);

/* ─── Init ─── */

window.addEventListener('resize', function() { resizeRenderer(); });

document.getElementById('btn-export').addEventListener('click', exportPNG);
document.getElementById('btn-reset').addEventListener('click', resetAll);

resizeRenderer();
rebuildTextures();
animate();

// Set default active view button
document.querySelector('.btn-view[data-view="threequarter"]')?.classList.add('active');

console.log('📦 Box Mockup 3D — Three.js WebGL render');
