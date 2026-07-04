# 📦 Box Mockup — Product Mockup Generator

Aplicación web estática para generar mockups de caja de producto 3D con perspectiva, basada en el estilo del video de Julián Trullo (minuto 21:48).

## ✨ Características

- 🖼️ Render 3D de caja con 3 caras (frontal, lateral, tapa) en Canvas
- 📝 Edición de texto en tiempo real (título, subtítulo, badge, descripción)
- 🎨 Personalización de colores para cada cara
- 📥 Exportación PNG a 4000×3000px
- 🔗 Integración con Photopea para edición profesional con PSD
- ☁️ 100% client-side — funciona en Netlify Drop, GitHub Pages, Cloudflare Pages

## 🚀 Deploy

Solo arrastra esta carpeta a **Netlify Drop** o **GitHub Pages** — no necesita backend.

## 📁 Archivos

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Interfaz principal |
| `style.css` | Estilos tema oscuro |
| `app.js` | Render 3D, edición, export, Photopea |

## 🎯 Cómo usar

1. Abre `index.html` en tu navegador
2. Edita textos y colores en el panel lateral
3. La vista previa 3D se actualiza en tiempo real
4. Haz clic en **Exportar PNG** para descargar
5. Haz clic en **Abrir en Photopea** para editar con el PSD original

## 📦 PSD Original

El archivo `MockupCaja.psd` (3.7 MB) es el mockup original del video. 
Para usarlo en Photopea:
1. Abre photopea.com
2. Arrastra el PSD al editor
3. Busca las capas "Frontal", "Lateral", "PRODUCT BOX"
4. Edita los Smart Objects para cambiar el diseño
