/* Matikkapelit — Reusable SVG Quantity Renderer
 * Shared by Pikaluku (Flash Subitizer) and future Määrävertailu.
 * Styled in Tavupeli's warm storybook tabletop palette and crisp dark-charcoal ink.
 */
window.MatikkaQuantities = (() => {
  const INK = '#2E3338';
  const BLUE = '#2E6FB8';
  const OCHRE = '#DF9E3E';
  const CREAM_PLATE = '#FAF8F3';
  const PLATE_RIM = '#D8D3C8';
  const SKIN = '#F3D5B5';
  const SKIN_SHADE = '#E3BC94';

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function svgDot(cx, cy, r, fill = BLUE) {
    const hiX = (cx - r * 0.28).toFixed(1);
    const hiY = (cy - r * 0.28).toFixed(1);
    const hiR = (r * 0.22).toFixed(1);
    return `
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" stroke="${INK}" stroke-width="3.6" />
      <circle cx="${hiX}" cy="${hiY}" r="${hiR}" fill="#FFFFFF" opacity="0.28" />
    `;
  }

  /* Canonical mini-constellations normalized around (0, 0) within [-1, 1] */
  const MINI_PATTERNS = {
    1: [[0, 0]],
    2: [[-0.65, 0], [0.65, 0]],
    3: [[0, -0.62], [-0.66, 0.48], [0.66, 0.48]],
    4: [[-0.58, -0.58], [0.58, -0.58], [-0.58, 0.58], [0.58, 0.58]],
    5: [[-0.68, -0.66], [0.68, -0.66], [0, 0], [-0.68, 0.66], [0.68, 0.66]]
  };

  function placeCluster(count, cx, cy, scale, angleDeg, fill, dotR) {
    const pts = MINI_PATTERNS[count] || MINI_PATTERNS[1];
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return pts.map(([px, py]) => {
      const rx = (px * cos - py * sin) * scale;
      const ry = (px * sin + py * cos) * scale;
      return svgDot(cx + rx, cy + ry, dotR, fill);
    }).join('');
  }

  let clipCounter = 0;

  /* 1. TEN-FRAME (Kymppiruudukko) */
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
        cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="#FFFFFF" stroke="#C8C1B4" stroke-width="2.5" />`;
      }
    }

    // Fill standard left-to-right top row (1-5), then bottom row (6-10)
    let dots = '';
    const dotR = 25;
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / 5);
      const c = i % 5;
      const cx = ox + c * cell + cell / 2;
      const cy = oy + r * cell + cell / 2;
      dots += svgDot(cx, cy, dotR, BLUE);
    }

    return `
      <svg viewBox="0 0 ${W} ${H}" class="qty-svg" role="img" aria-label="${n} pistettä kymppiruudukossa">
        <rect x="${ox - 6}" y="${oy - 6}" width="${gridW + 12}" height="${gridH + 12}" rx="18" fill="${CREAM_PLATE}" stroke="${INK}" stroke-width="5" />
        <g clip-path="url(#${clipId})">
          ${cells}
        </g>
        <defs>
          <clipPath id="${clipId}">
            <rect x="${ox}" y="${oy}" width="${gridW}" height="${gridH}" rx="12" />
          </clipPath>
        </defs>
        <rect x="${ox}" y="${oy}" width="${gridW}" height="${gridH}" rx="12" fill="none" stroke="${INK}" stroke-width="4.5" />
        ${dots}
      </svg>
    `;
  }

  /* 2. CONCEPTUAL SUBGROUP DOTS (Ryhmitellyt pisteet — two-color spatial parts) */
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

  function renderSubgroups(n, singleColor = false) {
    const W = 520;
    const H = 320;
    const parts = pick(SUBGROUP_SPLITS[n] || [[Math.min(5, n)]]);
    // Randomly swap left/right order for two-part splits so 5 isn't always on the left
    const ordered = parts.length === 2 && Math.random() < 0.45 ? [parts[1], parts[0]] : parts;
    const colors = singleColor ? [BLUE, BLUE, BLUE] : [BLUE, OCHRE, '#5C8A68'];
    const dotR = n <= 5 ? 25 : 22;

    let inner = '';
    if (ordered.length === 1) {
      const ang = rand(-22, 22);
      inner = placeCluster(ordered[0], W / 2, H / 2, 74, ang, colors[0], dotR);
    } else if (ordered.length === 2) {
      const vertical = Math.random() < 0.25 && n <= 7;
      if (vertical) {
        inner += placeCluster(ordered[0], W / 2 + rand(-12, 12), 95, 44, rand(-16, 16), colors[0], dotR);
        inner += placeCluster(ordered[1], W / 2 + rand(-12, 12), 225, 44, rand(-16, 16), colors[1], dotR);
      } else {
        const s0 = ordered[0] >= 4 ? 54 : 48;
        const s1 = ordered[1] >= 4 ? 54 : 48;
        inner += placeCluster(ordered[0], 150 + rand(-10, 8), H / 2 + rand(-12, 12), s0, rand(-15, 15), colors[0], dotR);
        inner += placeCluster(ordered[1], 370 + rand(-8, 10), H / 2 + rand(-12, 12), s1, rand(-15, 15), colors[1], dotR);
      }
    } else {
      // Three clusters (e.g. 3+3+3 = 9)
      inner += placeCluster(ordered[0], 130, 160 + rand(-10, 10), 42, rand(-12, 12), colors[0], 20);
      inner += placeCluster(ordered[1], 260, 160 + rand(-10, 10), 42, rand(-12, 12), colors[1], 20);
      inner += placeCluster(ordered[2], 390, 160 + rand(-10, 10), 42, rand(-12, 12), colors[2], 20);
    }

    return `
      <svg viewBox="0 0 ${W} ${H}" class="qty-svg" role="img" aria-label="${n} pistettä">
        <rect x="28" y="20" width="${W - 56}" height="${H - 40}" rx="34" fill="${CREAM_PLATE}" stroke="${PLATE_RIM}" stroke-width="3" />
        ${inner}
      </svg>
    `;
  }

  /* 3. IRREGULAR SINGLE-COLOR PLATE (Pikalukulautanen — harder subitizing) */
  function renderIrregularDots(n) {
    // For 6-10, 50% use single-color subtle spatial subgroups (fair conceptual subitizing),
    // and 50% use collision-free scattered plate layout.
    if (n >= 6 && Math.random() < 0.5) {
      return renderSubgroups(n, true);
    }

    const W = 520;
    const H = 320;
    const cx = W / 2;
    const cy = H / 2;
    const plateR = 142;
    const dotR = n <= 5 ? 24 : 20;
    const minDist = dotR * 2.75;
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
        // Fallback to clean single-color subgroup if tight random pack fails
        return renderSubgroups(n, true);
      }
    }

    const dots = pts.map(p => svgDot(p.x, p.y, dotR, BLUE)).join('');
    return `
      <svg viewBox="0 0 ${W} ${H}" class="qty-svg" role="img" aria-label="${n} pistettä lautasella">
        <circle cx="${cx}" cy="${cy}" r="${plateR}" fill="${CREAM_PLATE}" stroke="${INK}" stroke-width="4.5" />
        <circle cx="${cx}" cy="${cy}" r="${plateR - 10}" fill="none" stroke="${PLATE_RIM}" stroke-width="2" />
        ${dots}
      </svg>
    `;
  }

  /* 4. DICE (Nopat: 1 die for 1-6, 2 dice for 7-10) */
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

  function svgDie(val, cx, cy, size, tiltDeg, pipColor = INK) {
    const half = size / 2;
    const step = size * 0.27;
    const pipR = size * 0.095;
    const pips = (DIE_PIPS[val] || []).map(([gx, gy]) =>
      `<circle cx="${(gx * step).toFixed(1)}" cy="${(gy * step).toFixed(1)}" r="${pipR.toFixed(1)}" fill="${pipColor}" />`
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
      inner = svgDie(n, W / 2, H / 2, 186, rand(-6, 6), INK);
    } else {
      const pair = pick(TWO_DICE_PAIRS[n] || [[5, n - 5]]);
      const [a, b] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
      inner += svgDie(a, 162, H / 2 + rand(-6, 6), 164, rand(-7, -1), INK);
      inner += svgDie(b, 358, H / 2 + rand(-6, 6), 164, rand(1, 7), BLUE);
    }
    return `
      <svg viewBox="0 0 ${W} ${H}" class="qty-svg" role="img" aria-label="${n} nopissa">
        ${inner}
      </svg>
    `;
  }

  /* 5. STORYBOOK FINGERS (Sormet: clean outlined hands, 1 hand for 1-5, 5 + n for 6-10) */
  function svgHand(count, cx, cy, scale = 1, mirror = false) {
    // Raised finger flags: [thumb, index, middle, ring, pinky]
    const configs = {
      1: [false, true, false, false, false],
      2: [false, true, true, false, false],
      3: [false, true, true, true, false],
      4: [false, true, true, true, true],
      5: [true, true, true, true, true]
    };
    const [thumbUp, idxUp, midUp, ringUp, pinkUp] = configs[count] || configs[5];

    const fingerDefs = [
      { up: idxUp,  x: -38, topY: -102, w: 23, rot: count === 2 ? -6 : -4 },
      { up: midUp,  x: -12, topY: -112, w: 23, rot: count === 2 ? 6 : 0 },
      { up: ringUp, x:  14, topY: -104, w: 22, rot: 4 },
      { up: pinkUp, x:  38, topY: -86,  w: 20, rot: 9 }
    ];

    // Raised fingers drawn behind palm edge
    const raisedFingers = fingerDefs.filter(f => f.up).map(f => {
      const h = -f.topY + 12;
      return `
        <g transform="translate(${f.x}, 0) rotate(${f.rot})">
          <rect x="${-f.w / 2}" y="${f.topY}" width="${f.w}" height="${h}" rx="${f.w / 2}" fill="${SKIN}" stroke="${INK}" stroke-width="4.8" />
        </g>
      `;
    }).join('');

    // Thumb up (drawn slightly angled out on left)
    const raisedThumb = thumbUp ? `
      <g transform="translate(-52, 22) rotate(-42)">
        <rect x="-12" y="-64" width="24" height="72" rx="12" fill="${SKIN}" stroke="${INK}" stroke-width="4.8" />
      </g>
    ` : '';

    // Folded fingers tucked neatly along top of palm
    const foldedFingers = fingerDefs.filter(f => !f.up).map(f => `
      <rect x="${f.x - f.w / 2}" y="-14" width="${f.w}" height="32" rx="${f.w / 2}" fill="${SKIN_SHADE}" stroke="${INK}" stroke-width="4.4" />
    `).join('');

    // Tucked thumb across lower palm when not raised
    const foldedThumb = !thumbUp ? `
      <g transform="translate(-14, 24) rotate(24)">
        <rect x="-32" y="-12" width="56" height="24" rx="12" fill="${SKIN}" stroke="${INK}" stroke-width="4.5" />
      </g>
    ` : '';

    const sx = mirror ? -scale : scale;
    return `
      <g transform="translate(${cx}, ${cy}) scale(${sx}, ${scale})">
        ${raisedThumb}
        ${raisedFingers}
        <!-- Wrist -->
        <path d="M -32 68 L -28 96 L 28 96 L 32 68 Z" fill="${SKIN_SHADE}" stroke="${INK}" stroke-width="4.8" stroke-linejoin="round" />
        <!-- Palm -->
        <rect x="-52" y="-12" width="104" height="90" rx="36" fill="${SKIN}" stroke="${INK}" stroke-width="4.8" />
        <!-- Subtle palm crease -->
        <path d="M -26 42 Q 0 34 26 44" fill="none" stroke="${SKIN_SHADE}" stroke-width="4" stroke-linecap="round" />
        ${foldedFingers}
        ${foldedThumb}
      </g>
    `;
  }

  function renderFingers(n) {
    const W = 520;
    const H = 310;
    let inner = '';
    if (n <= 5) {
      inner = svgHand(n, W / 2, 182, 1.15, false);
    } else {
      inner += svgHand(5, 152, 184, 1.02, true);
      inner += svgHand(n - 5, 368, 184, 1.02, false);
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
      case 'subgroups': return renderSubgroups(n, false);
      case 'dots': return renderIrregularDots(n);
      case 'dice': return renderDice(n);
      case 'fingers': return renderFingers(n);
      case 'numeral': return renderNumeral(n);
      default: return renderSubgroups(n, false);
    }
  }

  return { render };
})();
