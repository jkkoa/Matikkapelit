/* Matikkapelit — Reusable SVG Quantity Renderer
 * Shared by Pikaluku (Flash Subitizer) and future Määrävertailu.
 * Clean ThinkMath-style solid black dots/ten-frames and minimalist silhouette hands.
 */
window.MatikkaQuantities = (() => {
  const INK = '#262A2F';
  const CREAM_PLATE = '#FAF8F3';
  const PLATE_RIM = '#D8D3C8';
  const HAND_FILL = '#F2DEC4';

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  /* Solid ThinkMath-style black dot */
  function svgDot(cx, cy, r) {
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${INK}" />`;
  }

  /* Canonical mini-constellations normalized around (0, 0) within [-1, 1] */
  const MINI_PATTERNS = {
    1: [[0, 0]],
    2: [[-0.68, 0], [0.68, 0]],
    3: [[0, -0.62], [-0.68, 0.5], [0.68, 0.5]],
    4: [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]],
    5: [[-0.72, -0.68], [0.72, -0.68], [0, 0], [-0.72, 0.68], [0.72, 0.68]]
  };

  function placeCluster(count, cx, cy, scale, angleDeg, dotR) {
    const pts = MINI_PATTERNS[count] || MINI_PATTERNS[1];
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return pts.map(([px, py]) => {
      const rx = (px * cos - py * sin) * scale;
      const ry = (px * sin + py * cos) * scale;
      return svgDot(cx + rx, cy + ry, dotR);
    }).join('');
  }

  let clipCounter = 0;

  /* 1. TEN-FRAME (Kymppiruudukko — crisp ThinkMath black frame & solid black dots) */
  function renderTenFrame(n) {
    const clipId = `tf-clip-${++clipCounter}`;
    const W = 520;
    const H = 260;
    const cols = 5;
    const rows = 2;
    const cell = 88;
    const gridW = cols * cell;
    const gridH = rows * cell;
    const ox = (W - gridW) / 2;
    const oy = (H - gridH) / 2;

    let cells = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = ox + c * cell;
        const y = oy + r * cell;
        cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="#FFFFFF" stroke="${INK}" stroke-width="2.6" />`;
      }
    }

    // Standard ThinkMath left-to-right top row (1-5), then bottom row (6-10)
    let dots = '';
    const dotR = 25;
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / 5);
      const c = i % 5;
      const cx = ox + c * cell + cell / 2;
      const cy = oy + r * cell + cell / 2;
      dots += svgDot(cx, cy, dotR);
    }

    return `
      <svg viewBox="0 0 ${W} ${H}" class="qty-svg" role="img" aria-label="${n} pistettä kymppiruudukossa">
        <g clip-path="url(#${clipId})">
          ${cells}
        </g>
        <defs>
          <clipPath id="${clipId}">
            <rect x="${ox}" y="${oy}" width="${gridW}" height="${gridH}" rx="10" />
          </clipPath>
        </defs>
        <rect x="${ox}" y="${oy}" width="${gridW}" height="${gridH}" rx="10" fill="none" stroke="${INK}" stroke-width="4.5" />
        ${dots}
      </svg>
    `;
  }

  /* 2. CONCEPTUAL SUBGROUP DOTS (ThinkMath solid black dots with clear spatial separation) */
  const SUBGROUP_SPLITS = {
    1: [[1]],
    2: [[2]],
    3: [[3]],
    4: [[4], [2, 2]],
    5: [[5], [3, 2], [4, 1]],
    6: [[5, 1], [4, 2], [3, 3]],
    7: [[5, 2], [4, 3]],
    8: [[5, 3], [4, 4]],
    9: [[5, 4], [3, 3, 3]],
    10: [[5, 5]]
  };

  function renderSubgroups(n) {
    const W = 520;
    const H = 320;
    const parts = pick(SUBGROUP_SPLITS[n] || [[Math.min(5, n)]]);
    const ordered = parts.length === 2 && Math.random() < 0.45 ? [parts[1], parts[0]] : parts;
    const dotR = n <= 5 ? 25 : 22;

    let inner = '';
    if (ordered.length === 1) {
      inner = placeCluster(ordered[0], W / 2, H / 2, 74, rand(-20, 20), dotR);
    } else if (ordered.length === 2) {
      const vertical = Math.random() < 0.25 && n <= 7;
      if (vertical) {
        inner += placeCluster(ordered[0], W / 2 + rand(-10, 10), 92, 44, rand(-14, 14), dotR);
        inner += placeCluster(ordered[1], W / 2 + rand(-10, 10), 228, 44, rand(-14, 14), dotR);
      } else {
        const s0 = ordered[0] >= 4 ? 54 : 48;
        const s1 = ordered[1] >= 4 ? 54 : 48;
        inner += placeCluster(ordered[0], 144 + rand(-8, 6), H / 2 + rand(-10, 10), s0, rand(-14, 14), dotR);
        inner += placeCluster(ordered[1], 376 + rand(-6, 8), H / 2 + rand(-10, 10), s1, rand(-14, 14), dotR);
      }
    } else {
      inner += placeCluster(ordered[0], 122, 160 + rand(-10, 10), 40, rand(-12, 12), 20);
      inner += placeCluster(ordered[1], 260, 160 + rand(-10, 10), 40, rand(-12, 12), 20);
      inner += placeCluster(ordered[2], 398, 160 + rand(-10, 10), 40, rand(-12, 12), 20);
    }

    return `
      <svg viewBox="0 0 ${W} ${H}" class="qty-svg" role="img" aria-label="${n} pistettä">
        <rect x="26" y="18" width="${W - 52}" height="${H - 36}" rx="32" fill="${CREAM_PLATE}" stroke="${PLATE_RIM}" stroke-width="3" />
        ${inner}
      </svg>
    `;
  }

  /* 3. IRREGULAR BLACK DOT PLATE (Pikalukulautanen) */
  function renderIrregularDots(n) {
    if (n >= 6 && Math.random() < 0.5) {
      return renderSubgroups(n);
    }

    const W = 520;
    const H = 320;
    const cx = W / 2;
    const cy = H / 2;
    const plateR = 142;
    const dotR = n <= 5 ? 24 : 20;
    const minDist = dotR * 2.85;
    const pts = [];

    for (let i = 0; i < n; i++) {
      let placed = false;
      for (let attempt = 0; attempt < 180; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * (plateR - dotR - 18);
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        if (pts.every(p => Math.hypot(p.x - x, p.y - y) >= minDist)) {
          pts.push({ x, y });
          placed = true;
          break;
        }
      }
      if (!placed) {
        return renderSubgroups(n);
      }
    }

    const dots = pts.map(p => svgDot(p.x, p.y, dotR)).join('');
    return `
      <svg viewBox="0 0 ${W} ${H}" class="qty-svg" role="img" aria-label="${n} pistettä lautasella">
        <circle cx="${cx}" cy="${cy}" r="${plateR}" fill="${CREAM_PLATE}" stroke="${INK}" stroke-width="4.5" />
        <circle cx="${cx}" cy="${cy}" r="${plateR - 10}" fill="none" stroke="${PLATE_RIM}" stroke-width="2" />
        ${dots}
      </svg>
    `;
  }

  /* 4. DICE (Nopat: 1 die for 1-6, 2 dice for 7-10, crisp black pips) */
  const DIE_PIPS = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
  };

  const TWO_DICE_PAIRS = {
    7: [[5, 2], [4, 3], [6, 1]],
    8: [[4, 4], [5, 3], [6, 2]],
    9: [[5, 4], [6, 3]],
    10: [[5, 5], [6, 4]]
  };

  function svgDie(val, cx, cy, size, tiltDeg) {
    const half = size / 2;
    const step = size * 0.27;
    const pipR = size * 0.095;
    const pips = (DIE_PIPS[val] || []).map(([gx, gy]) =>
      `<circle cx="${(gx * step).toFixed(1)}" cy="${(gy * step).toFixed(1)}" r="${pipR.toFixed(1)}" fill="${INK}" />`
    ).join('');

    return `
      <g transform="translate(${cx}, ${cy}) rotate(${tiltDeg.toFixed(1)})">
        <rect x="${-half + 4}" y="${-half + 7}" width="${size}" height="${size}" rx="26" fill="#DDD6C8" />
        <rect x="${-half}" y="${-half}" width="${size}" height="${size}" rx="26" fill="#FFFFFF" stroke="${INK}" stroke-width="5.5" />
        <rect x="${-half + 8}" y="${-half + 8}" width="${size - 16}" height="${size - 16}" rx="19" fill="none" stroke="#EFEBE2" stroke-width="2" />
        ${pips}
      </g>
    `;
  }

  function renderDice(n) {
    const W = 520;
    const H = 300;
    let inner = '';
    if (n <= 6) {
      inner = svgDie(n, W / 2, H / 2, 186, rand(-6, 6));
    } else {
      const pair = pick(TWO_DICE_PAIRS[n] || [[5, n - 5]]);
      const [a, b] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
      inner += svgDie(a, 162, H / 2 + rand(-6, 6), 164, rand(-7, -1));
      inner += svgDie(b, 358, H / 2 + rand(-6, 6), 164, rand(1, 7));
    }
    return `
      <svg viewBox="0 0 ${W} ${H}" class="qty-svg" role="img" aria-label="${n} nopissa">
        ${inner}
      </svg>
    `;
  }

  /* 5. ULTRA-SIMPLE UNIFORM SILHOUETTE HANDS (Sormet)
   * One identical flat hand silhouette across 1-10:
   * - Zero creases, fingernails, shading, or folded-knuckle clutter
   * - Wide finger separation so every count 1-5 (and 5+n) reads instantly in a 1 s flash
   */
  function svgSimpleHand(count, cx, cy, scale = 1, mirror = false) {
    // Wide-splayed raised finger layouts: { x, y, len, rot }
    const layouts = {
      1: [
        { x: -18, y: 10, len: 108, rot: -8 }
      ],
      2: [
        { x: -22, y: 10, len: 106, rot: -16 },
        { x:   4, y:  6, len: 112, rot:   8 }
      ],
      3: [
        { x: -26, y: 10, len: 102, rot: -20 },
        { x:  -2, y:  6, len: 112, rot:  -2 },
        { x:  22, y: 10, len: 104, rot:  18 }
      ],
      4: [
        { x: -29, y: 12, len: 100, rot: -25 },
        { x: -10, y:  6, len: 110, rot:  -8 },
        { x:  10, y:  6, len: 110, rot:   8 },
        { x:  29, y: 12, len:  98, rot:  25 }
      ],
      5: [
        { x: -34, y: 40, len:  76, rot: -60 }, // clear side thumb
        { x: -26, y: 12, len: 100, rot: -22 },
        { x:  -8, y:  6, len: 110, rot:  -7 },
        { x:  11, y:  6, len: 108, rot:   8 },
        { x:  29, y: 12, len:  96, rot:  24 }
      ]
    };

    const fingers = layouts[count] || layouts[5];
    const fw = 21;

    const shapes = () => {
      const fSvg = fingers.map(f => `
        <g transform="translate(${f.x}, ${f.y}) rotate(${f.rot})">
          <rect x="${-fw / 2}" y="${-f.len}" width="${fw}" height="${f.len + 14}" rx="${fw / 2}" />
        </g>
      `).join('');

      return `
        ${fSvg}
        <rect x="-24" y="54" width="48" height="34" rx="12" />
        <rect x="-44" y="-4" width="88" height="72" rx="34" />
      `;
    };

    const sx = mirror ? -scale : scale;
    return `
      <g transform="translate(${cx}, ${cy}) scale(${sx}, ${scale})">
        <!-- Unified clean outer outline (no internal overlap strokes) -->
        <g fill="${INK}" stroke="${INK}" stroke-width="11" stroke-linejoin="round" stroke-linecap="round">
          ${shapes()}
        </g>
        <!-- Flat clean interior fill (zero creases, fingernails, or shading) -->
        <g fill="${HAND_FILL}" stroke="none">
          ${shapes()}
        </g>
      </g>
    `;
  }

  function renderFingers(n) {
    const W = 540;
    const H = 300;
    let inner = '';
    if (n <= 5) {
      inner = svgSimpleHand(n, W / 2, 176, 1.12, false);
    } else {
      inner += svgSimpleHand(5, 140, 180, 0.96, true);
      inner += svgSimpleHand(n - 5, 400, 180, 0.96, false);
    }
    return `
      <svg viewBox="0 0 ${W} ${H}" class="qty-svg" role="img" aria-label="${n} sormea">
        ${inner}
      </svg>
    `;
  }

  /* 6. NUMERAL (for Määrävertailu & reveals) */
  function renderNumeral(n) {
    return `
      <svg viewBox="0 0 320 260" class="qty-svg" role="img" aria-label="Luku ${n}">
        <text x="160" y="182" text-anchor="middle" font-family="MatikkaReader, sans-serif" font-size="168" font-weight="700" fill="${INK}">${n}</text>
      </svg>
    `;
  }

  /**
   * Render quantity n (1..10) in a given representation format.
   * @param {number} n
   * @param {'tenframe'|'subgroups'|'dots'|'dice'|'fingers'|'numeral'} format
   */
  function render(n, format = 'subgroups') {
    switch (format) {
      case 'tenframe': return renderTenFrame(n);
      case 'subgroups': return renderSubgroups(n);
      case 'dots': return renderIrregularDots(n);
      case 'dice': return renderDice(n);
      case 'fingers': return renderFingers(n);
      case 'numeral': return renderNumeral(n);
      default: return renderSubgroups(n);
    }
  }

  return { render };
})();
