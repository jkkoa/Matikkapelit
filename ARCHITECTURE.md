# Matikkapelit — Architecture & Style Guide

Reference document for adding future mini-games (**Määrävertailu**, **Lukusuora**, **Laskumato**, etc.) while staying 100% consistent with **Tavupeli** and **Pikaluku**.

## Design Tokens (`shared/style.css`)

- **Typography**: Self-hosted **Andika** (`fonts/andika-regular.woff2`, `fonts/andika-bold.woff2`), loaded via `MatikkaReader`.
- **Palette**:
  - Board / paper: `--bg-board: #FAF8F3`
  - Outer frame / panel: `--bg-frame: #F3EFE6`, `--bg-panel: #F2EFE7`
  - Card surface: `--surface: #FFFFFF`
  - Ink: `--ink: #262A2F`, `--ink-soft: #5E646C`
  - Borders: `--border: #D8D3C8`, `--border-strong: #BEB8AC`
  - Primary math blue: `--accent: #2E6FB8` (`--accent-soft: #E9F1FA`)
  - Secondary subgroup ochre: `--ochre: #DF9E3E` (`--ochre-soft: #FBF3E4`)
  - Verification green: `--sage: #3D855A` (`--sage-soft: #EAF4EE`)
  - Gentle error terracotta: `--danger: #C94842` (`--danger-soft: #FAEBEA`)
  - Tabletop cloth / bear tone: `--bear-bg: #ECE7DE`, `--bear-border: #4A443E`
- **Interaction rules (iPad-first)**:
  - Landscape `100dvh`, zero page scroll, `touch-action: manipulation`, safe-area padding.
  - Touch targets `>= 48px` (answer buttons `>= 60px`).
  - Always protect exit/navigation during gameplay with the 2-step exit modal (`MatikkaUI.wireExitModal`).
  - Zero PII: never store student names, logins, analytics, or cross-session scores. Only `matikkapelit_muted` is stored in `localStorage`.

## Storybook Artwork Style (`img/*.webp`)

New tile or character illustrations should match `img/pikaluku-tile.webp` and `img/karhu-win.webp` (inherited from `Tavupeli`):
- Uniform thick dark-charcoal outline (`#2F3338`)
- Flat muted warm colors (warm brown, cream, ochre `#DF9E3E`, slate blue `#2E6FB8`, soft sage) with minimal flat cel-shading
- Transparent background, `512x512` `.webp`, no text, no cast ground shadow.

## Shared Modules (`shared/`)

| File | Global | Purpose |
| --- | --- | --- |
| `shared/style.css` | — | Shared design tokens, hub grid, setup shell, buttons, 2-step exit modal, end screen. |
| `shared/audio.js` | `MatikkaAudio` | Soft C-major pentatonic Web Audio marimba (`playTap`, `playFlash`, `playCorrect`, `playMiss`, `playWin`). |
| `shared/scheduler.js` | `MatikkaScheduler` | Zero-PII within-session expanding-retrieval queue (lag 2 -> lag 4–5 on miss/assist, capped safely). |
| `shared/quantities.js` | `MatikkaQuantities` | Crisp SVG renderer for `tenframe`, `subgroups`, `dots`, `dice`, `fingers`, and `numeral` (`1–10`). |
| `shared/ui.js` | `MatikkaUI` | Service worker registration, mute button sync, 2-step exit modal wiring. |
| `shared/games.js` | `MATIKKA_GAMES` | Plug-in registry rendered by root `index.html`. |

## Adding a New Game Checklist

1. Create `games/<id>/index.html`, `style.css`, `app.js` linking `../../shared/style.css` and needed `../../shared/*.js`.
2. Add a transparent `512x512` tile illustration `img/<id>-tile.webp` in matching storybook style.
3. Add the game entry (`ready: true`) to `shared/games.js`.
4. Add the new files (`./games/<id>/...` and `./img/<id>-tile.webp`) to `CORE_ASSETS` in `sw.js` and bump `CACHE_NAME` (e.g. `v2`).
