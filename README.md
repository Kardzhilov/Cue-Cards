<div align="center">

# 🃏 Cue-Card Generator

**Turn any text into beautiful, print-ready cue cards — right in your browser.**

Paste your script, pick a card size, and download a ready-to-print PDF. The text is
split intelligently across cards so it _never_ breaks in the middle of a sentence.

[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Deploy](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-222?logo=github)](https://pages.github.com)

<img src="docs/images/app.png" alt="Cue-Card Generator interface" width="100%" />

</div>

---

## ✨ Features

| | |
|---|---|
| 📝 **Markdown input** | Headings, **bold**, _italic_, and lists render on the cards. |
| ✂️ **Sentence-safe splitting** | Breaks at sentence boundaries first, then clauses (`,` `;`), then words only as a last resort. |
| ⏭️ **Manual breaks** | Drop a horizontal rule (`---`) anywhere to force a new card. |
| 📐 **Flexible sizes** | A7, A6, Index 3×5 / 4×6 / 5×8, or custom — shown in **metric & imperial**. |
| 🔄 **Single or double-sided** | Double-sided continues your text onto the back of each card. |
| 🖨️ **Duplex-aware** | Choose long- or short-edge flip so the backs line up when printing. |
| 🔢 **Card numbers** | Optional, position anywhere, as `current` or `current / max`. |
| 📄 **Print-ready PDF** | Multiple cards per A4 / US Letter sheet, complete with cut lines. |
| 👀 **Live preview** | See every card update as you type. |
| ☁️ **100% client-side** | No server, no upload — runs entirely in the browser. |

## 🚀 Quick start

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (e.g. `http://localhost:5173/Cue-Cards/`).

### How to use

1. Paste or type your text (Markdown welcome).
2. Pick a **card size**, **orientation**, and **font size**.
3. Toggle **double-sided** and **card numbers** to taste.
4. Watch the **live preview**, then hit **Download PDF**.
5. Print on card stock (or paper) and cut along the guide lines. ✂️

> 💡 **Tip:** Insert a line containing only `---` to force the next chunk onto a new card.

## 📱 Responsive

The layout collapses to a single column on small screens.

<div align="center">
  <img src="docs/images/mobile.png" alt="Mobile layout" width="320" />
</div>

## 🛠️ Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with hot reload. |
| `npm run build` | Type-check and build to `dist/`. |
| `npm run preview` | Preview the production build locally. |

## 🌐 Deployment

Every push to `main` builds the site and publishes it to **GitHub Pages** via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Enable Pages in your
repository settings with **Source: GitHub Actions**.

The Vite `base` is set to `/Cue-Cards/` in [`vite.config.ts`](vite.config.ts) — update
it if you rename the repository.

## 🧱 Tech stack

- **Vite + React + TypeScript** for the app shell.
- **react-markdown** + **remark-gfm** for Markdown rendering.
- **html2canvas-pro** + **jsPDF** for client-side PDF export.
- Smart packing driven by real DOM measurement, so the preview matches the PDF.

## 📂 Project structure

```
src/
├── components/      # Card, CardPreview, SettingsPanel
├── lib/
│   ├── splitter.ts  # text → cards (sentence/clause/word logic)
│   ├── measure.ts   # off-screen height measurement
│   ├── pdf.ts       # sheet layout, cut lines, duplex mirroring
│   └── cardSizes.ts # size presets + unit helpers
└── App.tsx          # state + wiring
```

---

<div align="center">
Made for anyone who speaks from cards — presenters, students, performers, and speakers. 🎤
</div>
