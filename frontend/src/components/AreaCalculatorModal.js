import React, { useState, useCallback } from 'react';
import '../styles/AreaCalculatorModal.css';

/* ── Shapes ─────────────────────────────────────────────────── */
const SHAPES = [
  { id: 'polygon',      label: 'Triangle / Polygon' },
  { id: 'cyclic_quad',  label: 'Cyclic Quadrilateral' },
  { id: 'rectangle',    label: 'Rectangle' },
  { id: 'circle',       label: 'Circle' },
  { id: 'semicircle',   label: 'Semi-circle' },
  { id: 'ellipse',      label: 'Ellipse' },
  { id: 'semi_ellipse', label: 'Semi-ellipse' },
];

const UNITS = ['Meter', 'Feet', 'Centimeter'];

/* ── Conversion constants ───────────────────────────────────── */
const LINEAR_TO_M = { Meter: 1, Feet: 0.3048, Centimeter: 0.01 };

const ROPANI = 508.72;
const AANA   = ROPANI / 16;
const PAISA  = AANA   / 4;
const DAM    = PAISA  / 4;

/* ── Area formulas ──────────────────────────────────────────── */
function heronArea(a, b, c) {
  const s = (a + b + c) / 2;
  const v = s * (s - a) * (s - b) * (s - c);
  return v > 0 ? Math.sqrt(v) : 0;
}

function computeAreaSqm(shape, inputs, unit) {
  const k = LINEAR_TO_M[unit] || 1;
  const n = v => (parseFloat(v) || 0) * k;

  switch (shape) {
    case 'polygon':
      return (inputs.triangles || []).reduce((sum, t) => {
        const a = n(t.a), b = n(t.b), c = n(t.c);
        return a && b && c ? sum + heronArea(a, b, c) : sum;
      }, 0);
    case 'cyclic_quad': {
      const a = n(inputs.a), b = n(inputs.b), c = n(inputs.c), d = n(inputs.d);
      if (!a || !b || !c || !d) return 0;
      const s = (a + b + c + d) / 2;
      const v = (s - a) * (s - b) * (s - c) * (s - d);
      return v > 0 ? Math.sqrt(v) : 0;
    }
    case 'rectangle':
      return n(inputs.a) * n(inputs.b);
    case 'circle':
      return Math.PI * n(inputs.r) ** 2;
    case 'semicircle':
      return (Math.PI * n(inputs.r) ** 2) / 2;
    case 'ellipse':
      return Math.PI * n(inputs.a) * n(inputs.b);
    case 'semi_ellipse':
      return (Math.PI * n(inputs.a) * n(inputs.b)) / 2;
    default:
      return 0;
  }
}

function toNepal(sqm) {
  const ropani = Math.floor(sqm / ROPANI);
  const r1 = sqm % ROPANI;
  const aana  = Math.floor(r1 / AANA);
  const r2 = r1 % AANA;
  const paisa = Math.floor(r2 / PAISA);
  const r3 = r2 % PAISA;
  const dam   = Math.floor(r3 / DAM);
  return { ropani, aana, paisa, dam };
}

function buildResults(sqm) {
  return {
    sqm:  sqm,
    sqft: sqm * 10.7639,
    sqyd: sqm * 1.19599,
    acre: sqm * 0.000247105,
    nepal: toNepal(sqm),
  };
}

/* ── SVG Diagrams ───────────────────────────────────────────── */
const svgBase = { viewBox: '0 0 280 200', style: { width: '100%', height: '100%', maxHeight: 200 } };

/* Find which side of t1 is the shared diagonal with t2 (closest relative value) */
function findSharedSide(t1, t2) {
  const sides = ['a', 'b', 'c'];
  let best = { s1: 'c', s2: 'a', ratio: Infinity };
  for (const s1 of sides) {
    for (const s2 of sides) {
      const v1 = parseFloat(t1[s1]) || 0;
      const v2 = parseFloat(t2[s2]) || 0;
      if (v1 > 0 && v2 > 0) {
        const ratio = Math.abs(v1 - v2) / Math.max(v1, v2);
        if (ratio < best.ratio) best = { s1, s2, ratio };
      }
    }
  }
  return { s1: best.s1, s2: best.s2 };
}

/* ── Geometry helpers for proportional SVG ──────────────────── */

// V0=(0,0), V1=(c,0), V2=(cx,cy): side c=V0-V1, b=V0-V2, a=V1-V2
function triVertices(a, b, c) {
  if (a <= 0 || b <= 0 || c <= 0) return null;
  if (a >= b + c || b >= a + c || c >= a + b) return null;
  const cx = (b * b + c * c - a * a) / (2 * c);
  const cy2 = b * b - cx * cx;
  if (cy2 < 0) return null;
  return [[0, 0], [c, 0], [cx, Math.sqrt(cy2)]];
}

// Place V3 opposite the PQ edge from vOpp, with |P-V3|=lenP, |Q-V3|=lenQ
function attachVertex(P, Q, lenP, lenQ, vOpp) {
  const dx = Q[0] - P[0], dy = Q[1] - P[1];
  const d = Math.sqrt(dx * dx + dy * dy);
  if (!d || lenP <= 0 || lenQ <= 0) return [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];
  const ux = dx / d, uy = dy / d;
  const lx = (lenP * lenP + d * d - lenQ * lenQ) / (2 * d);
  const ly = Math.sqrt(Math.max(0, lenP * lenP - lx * lx));
  const cA = [P[0] + ux * lx - uy * ly, P[1] + uy * lx + ux * ly];
  const cB = [P[0] + ux * lx + uy * ly, P[1] + uy * lx - ux * ly];
  const crossOpp = dx * (vOpp[1] - P[1]) - dy * (vOpp[0] - P[0]);
  const crossA   = dx * (cA[1] - P[1])   - dy * (cA[0] - P[0]);
  return (crossOpp * crossA > 0) ? cB : cA;
}

// Scale world pts into SVG box [W×H] with padding, flipping Y axis
function fitToBox(pts, W, H, pad) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const s = Math.min((W - 2 * pad) / (maxX - minX || 1), (H - 2 * pad) / (maxY - minY || 1));
  const offX = W / 2 - (maxX + minX) * s / 2;
  const offY = H / 2 + (maxY + minY) * s / 2;
  return pts.map(([x, y]) => [x * s + offX, -y * s + offY]);
}

// Edge midpoint offset outward from centroid for label placement
function edgeMidLabel(A, B, centroid, offset) {
  const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
  const dx = mx - centroid[0], dy = my - centroid[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [mx + dx / len * offset, my + dy / len * offset];
}

function ptStr(pts) {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

// Maps side letter to [vertexIndex_1, vertexIndex_2] and outer vertex index
// in the triVertices(a,b,c) output [V0,V1,V2]: c=V0-V1, b=V0-V2, a=V1-V2
const EDGE_VERTS = { a: [1, 2], b: [0, 2], c: [0, 1] };
const EDGE_OUTER = { a: 0, b: 1, c: 2 };

function TriangleDiagram({ count, triangles, unit }) {
  const u = unit === 'Meter' ? 'm' : unit === 'Feet' ? 'ft' : unit === 'Centimeter' ? 'cm' : '';
  const lbl = (v, fallback) => (v && parseFloat(v) > 0) ? `${v}${u}` : fallback;
  const W = 280, H = 200, pad = 24;

  /* ── Single triangle ── */
  if (count <= 1) {
    const t = (triangles && triangles[0]) || {};
    const a = parseFloat(t.a) || 0, b = parseFloat(t.b) || 0, c = parseFloat(t.c) || 0;
    const verts = triVertices(a, b, c);
    if (!verts) {
      return (
        <svg {...svgBase}>
          <polygon points="140,18 28,182 252,182" fill="#c8f25c33" stroke="#1f3a2e" strokeWidth="2.5" strokeLinejoin="round"/>
          <text x="68"  y="112" fontSize="12" fill="#1f3a2e" fontWeight="700" textAnchor="middle">{lbl(t.a, 'a')}</text>
          <text x="210" y="112" fontSize="12" fill="#1f3a2e" fontWeight="700" textAnchor="middle">{lbl(t.b, 'b')}</text>
          <text x="140" y="196" fontSize="12" fill="#1f3a2e" fontWeight="700" textAnchor="middle">{lbl(t.c, 'c')}</text>
        </svg>
      );
    }
    const [S0, S1, S2] = fitToBox(verts, W, H, pad);
    const cen = [(S0[0]+S1[0]+S2[0])/3, (S0[1]+S1[1]+S2[1])/3];
    const [la, lb, lc] = [
      edgeMidLabel(S1, S2, cen, 16), // side a = V1-V2
      edgeMidLabel(S0, S2, cen, 16), // side b = V0-V2
      edgeMidLabel(S0, S1, cen, 16), // side c = V0-V1
    ];
    return (
      <svg {...svgBase}>
        <polygon points={ptStr([S0, S1, S2])} fill="#c8f25c33" stroke="#1f3a2e" strokeWidth="2.5" strokeLinejoin="round"/>
        <text x={la[0].toFixed(1)} y={la[1].toFixed(1)} fontSize="11" fill="#1f3a2e" fontWeight="700" textAnchor="middle">{lbl(t.a, 'a')}</text>
        <text x={lb[0].toFixed(1)} y={lb[1].toFixed(1)} fontSize="11" fill="#1f3a2e" fontWeight="700" textAnchor="middle">{lbl(t.b, 'b')}</text>
        <text x={lc[0].toFixed(1)} y={lc[1].toFixed(1)} fontSize="11" fill="#1f3a2e" fontWeight="700" textAnchor="middle">{lbl(t.c, 'c')}</text>
      </svg>
    );
  }

  /* ── Two triangles — proportional quadrilateral ── */
  if (count === 2) {
    const t1 = (triangles && triangles[0]) || {};
    const t2 = (triangles && triangles[1]) || {};
    const { s1, s2 } = findSharedSide(t1, t2);
    const a1 = parseFloat(t1.a)||0, b1 = parseFloat(t1.b)||0, c1 = parseFloat(t1.c)||0;
    const verts1 = triVertices(a1, b1, c1);
    if (!verts1) {
      return (
        <svg {...svgBase}>
          <polygon points="110,22 18,148 148,188 258,148" fill="none" stroke="#1f3a2e" strokeWidth="2.5" strokeLinejoin="round"/>
          <text x="140" y="108" fontSize="11" fill="#888" textAnchor="middle">Enter values</text>
        </svg>
      );
    }
    const [V0, V1, V2] = verts1;
    const [pi, qi] = EDGE_VERTS[s1];
    const oi = EDGE_OUTER[s1];
    const P = verts1[pi], Q = verts1[qi], Vopp = verts1[oi];
    const t2outers = ['a','b','c'].filter(s => s !== s2);
    const lenP2 = parseFloat(t2[t2outers[0]]) || 0;
    const lenQ2 = parseFloat(t2[t2outers[1]]) || 0;
    const V3 = (lenP2 > 0 && lenQ2 > 0) ? attachVertex(P, Q, lenP2, lenQ2, Vopp) : null;
    const worldPts = V3 ? [V0, V1, V2, V3] : [V0, V1, V2];
    const svgPts = fitToBox(worldPts, W, H, pad);
    const [S0, S1, S2] = svgPts;
    const S3 = V3 ? svgPts[3] : null;
    const SP = svgPts[pi], SQ = svgPts[qi];

    const cen1 = [(S0[0]+S1[0]+S2[0])/3, (S0[1]+S1[1]+S2[1])/3];
    const cen2 = S3 ? [(SP[0]+SQ[0]+S3[0])/3, (SP[1]+SQ[1]+S3[1])/3] : cen1;

    const t1outers = ['a','b','c'].filter(s => s !== s1);

    // Diagonal geometry for ticks and label
    const dDx = SQ[0]-SP[0], dDy = SQ[1]-SP[1];
    const dLen = Math.sqrt(dDx*dDx+dDy*dDy) || 1;
    const perpX = -dDy/dLen, perpY = dDx/dLen;
    const dMid = [(SP[0]+SQ[0])/2, (SP[1]+SQ[1])/2];
    const mkTick = frac => {
      const px = SP[0]+dDx*frac, py = SP[1]+dDy*frac;
      return [px-perpX*5, py-perpY*5, px+perpX*5, py+perpY*5];
    };
    const [tk1, tk2, tk3, tk4] = [mkTick(0.42), mkTick(0.47), mkTick(0.53), mkTick(0.58)];

    const dv1 = t1[s1], dv2 = t2[s2];
    const diff = (dv1 && dv2) ? Math.abs(parseFloat(dv1) - parseFloat(dv2)) : 1;
    const diagLabel = dv1 ? (diff < 0.5 ? `${parseFloat(dv1)}${u}` : `${parseFloat(dv1)}/${parseFloat(dv2)}${u}`) : 'shared';
    const diagLabelX = (dMid[0] + perpX * 12).toFixed(1);
    const diagLabelY = (dMid[1] + perpY * 12).toFixed(1);

    // Quad outline: outer vertex of T1, then around
    const SVopp = svgPts[oi];
    const quadPts = S3 ? [SVopp, SP, S3, SQ] : [S0, S1, S2];

    return (
      <svg {...svgBase}>
        {S3 && <polygon points={ptStr(quadPts)} fill="none" stroke="#1f3a2e" strokeWidth="2.5" strokeLinejoin="round"/>}
        <polygon points={ptStr([S0, S1, S2])} fill="#c8f25c22" stroke="#1a6e3c" strokeWidth="1.5"/>
        {S3 && <polygon points={ptStr([SP, SQ, S3])} fill="#3b6fb622" stroke="#3b6fb6" strokeWidth="1.5"/>}
        <line x1={SP[0].toFixed(1)} y1={SP[1].toFixed(1)} x2={SQ[0].toFixed(1)} y2={SQ[1].toFixed(1)} stroke="#888" strokeWidth="1.8" strokeDasharray="6,4"/>
        {[tk1,tk2,tk3,tk4].map((tk,i) => (
          <line key={i} x1={tk[0].toFixed(1)} y1={tk[1].toFixed(1)} x2={tk[2].toFixed(1)} y2={tk[3].toFixed(1)} stroke="#888" strokeWidth="1.5"/>
        ))}
        <text x={diagLabelX} y={diagLabelY} fontSize="10" fill="#555" fontWeight="600" textAnchor="middle">{diagLabel}</text>
        {t1outers.map(side => {
          const [va, vb] = EDGE_VERTS[side].map(idx => svgPts[idx]);
          const [lx, ly] = edgeMidLabel(va, vb, cen1, 16);
          return <text key={side} x={lx.toFixed(1)} y={ly.toFixed(1)} fontSize="11" fill="#1a6e3c" fontWeight="700" textAnchor="middle">{lbl(t1[side], side)}</text>;
        })}
        {S3 && t2outers.map((side, i) => {
          const [va, vb] = [[SP, S3], [SQ, S3]][i];
          const [lx, ly] = edgeMidLabel(va, vb, cen2, 16);
          return <text key={side} x={lx.toFixed(1)} y={ly.toFixed(1)} fontSize="11" fill="#3b6fb6" fontWeight="700" textAnchor="middle">{lbl(t2[side], side)}</text>;
        })}
        <text x={cen1[0].toFixed(1)} y={cen1[1].toFixed(1)} fontSize="10" fill="#1a6e3c" fontWeight="600" textAnchor="middle">Tri-1</text>
        {S3 && <text x={cen2[0].toFixed(1)} y={cen2[1].toFixed(1)} fontSize="10" fill="#3b6fb6" fontWeight="600" textAnchor="middle">Tri-2</text>}
      </svg>
    );
  }

  /* ── Three or more triangles — generic polygon ── */
  return (
    <svg {...svgBase}>
      <polygon points="75,18 18,145 148,182 248,148 220,38" fill="#e8f5e944" stroke="#1f3a2e" strokeWidth="2.5" strokeLinejoin="round"/>
      <line x1="75" y1="18" x2="148" y2="182" stroke="#1f3a2e" strokeWidth="1.5" strokeDasharray="5,4"/>
      <line x1="75" y1="18" x2="248" y2="148" stroke="#1f3a2e" strokeWidth="1.5" strokeDasharray="5,4"/>
      <polygon points="75,18 18,145 148,182" fill="#c8f25c22" stroke="#1a6e3c" strokeWidth="1.5"/>
      <polygon points="75,18 148,182 248,148" fill="#3b6fb622" stroke="#3b6fb6" strokeWidth="1.5"/>
      <text x="50"  y="132" fontSize="10" fill="#1a6e3c">Tri-1</text>
      <text x="148" y="120" fontSize="10" fill="#3b6fb6">Tri-2</text>
      <text x="110" y="160" fontSize="10" fill="#888" fontStyle="italic">+{count - 2} more triangles</text>
    </svg>
  );
}

function CyclicQuadDiagram() {
  return (
    <svg {...svgBase}>
      <circle cx="140" cy="100" r="82" fill="none" stroke="#ccc" strokeWidth="1.5" strokeDasharray="6,4"/>
      <polygon points="140,18 58,155 140,182 222,155" fill="#c8f25c33" stroke="#1f3a2e" strokeWidth="2.5" strokeLinejoin="round"/>
      <line x1="140" y1="18" x2="140" y2="182" stroke="#1f3a2e" strokeWidth="1" strokeDasharray="4,3"/>
      <line x1="58"  y1="155" x2="222" y2="155" stroke="#1f3a2e" strokeWidth="1" strokeDasharray="4,3"/>
      <text x="88"  y="80"  fontSize="14" fill="#1f3a2e" fontWeight="700">b</text>
      <text x="188" y="80"  fontSize="14" fill="#1f3a2e" fontWeight="700">c</text>
      <text x="88"  y="175" fontSize="14" fill="#1f3a2e" fontWeight="700">a</text>
      <text x="188" y="175" fontSize="14" fill="#1f3a2e" fontWeight="700">d</text>
      <text x="136" y="98"  fontSize="11" fill="#888">e</text>
      <text x="162" y="152" fontSize="11" fill="#888">f</text>
    </svg>
  );
}

function RectangleDiagram() {
  return (
    <svg {...svgBase}>
      <rect x="32" y="40" width="216" height="120" fill="#c8f25c33" stroke="#1f3a2e" strokeWidth="2.5" rx="4"/>
      {/* tick marks */}
      <line x1="80" y1="35" x2="80" y2="44" stroke="#1f3a2e" strokeWidth="1.5"/>
      <line x1="200" y1="35" x2="200" y2="44" stroke="#1f3a2e" strokeWidth="1.5"/>
      <line x1="80" y1="156" x2="80" y2="165" stroke="#1f3a2e" strokeWidth="1.5"/>
      <line x1="200" y1="156" x2="200" y2="165" stroke="#1f3a2e" strokeWidth="1.5"/>
      {/* arrows top */}
      <line x1="32" y1="28" x2="248" y2="28" stroke="#1f3a2e" strokeWidth="1.5"/>
      <polygon points="32,28 40,24 40,32" fill="#1f3a2e"/>
      <polygon points="248,28 240,24 240,32" fill="#1f3a2e"/>
      {/* arrows bottom */}
      <line x1="32" y1="172" x2="248" y2="172" stroke="#1f3a2e" strokeWidth="1.5"/>
      <polygon points="32,172 40,168 40,176" fill="#1f3a2e"/>
      <polygon points="248,172 240,168 240,176" fill="#1f3a2e"/>
      {/* arrows right */}
      <line x1="258" y1="40" x2="258" y2="160" stroke="#1f3a2e" strokeWidth="1.5"/>
      <polygon points="258,40 254,48 262,48" fill="#1f3a2e"/>
      <polygon points="258,160 254,152 262,152" fill="#1f3a2e"/>
      {/* labels */}
      <text x="133" y="24" fontSize="15" fill="#1f3a2e" fontWeight="700" textAnchor="middle">a</text>
      <text x="133" y="188" fontSize="15" fill="#1f3a2e" fontWeight="700" textAnchor="middle">a</text>
      <text x="270" y="104" fontSize="15" fill="#1f3a2e" fontWeight="700" textAnchor="middle">b</text>
      <text x="20"  y="104" fontSize="15" fill="#1f3a2e" fontWeight="700" textAnchor="middle">b</text>
    </svg>
  );
}

function CircleDiagram() {
  return (
    <svg {...svgBase}>
      <circle cx="140" cy="100" r="85" fill="#c8f25c33" stroke="#1f3a2e" strokeWidth="2.5"/>
      <line x1="140" y1="100" x2="225" y2="100" stroke="#333" strokeDasharray="5,4" strokeWidth="2"/>
      <polygon points="225,100 215,95 215,105" fill="#333"/>
      <text x="176" y="93" fontSize="15" fill="#1f3a2e" fontWeight="700">r</text>
    </svg>
  );
}

function SemicircleDiagram() {
  return (
    <svg {...svgBase}>
      <path d="M 30 140 A 110 110 0 0 1 250 140 Z" fill="#c8f25c33" stroke="#1f3a2e" strokeWidth="2.5" strokeLinejoin="round"/>
      <line x1="30" y1="140" x2="250" y2="140" stroke="#1f3a2e" strokeWidth="2.5"/>
      <line x1="140" y1="140" x2="140" y2="30" stroke="#333" strokeDasharray="5,4" strokeWidth="1.5"/>
      <polygon points="140,30 135,42 145,42" fill="#333"/>
      <text x="142" y="96" fontSize="15" fill="#1f3a2e" fontWeight="700">r</text>
    </svg>
  );
}

function EllipseDiagram() {
  return (
    <svg {...svgBase}>
      <ellipse cx="140" cy="100" rx="115" ry="65" fill="#c8f25c33" stroke="#1f3a2e" strokeWidth="2.5"/>
      {/* a = semi-major (horizontal) */}
      <line x1="140" y1="100" x2="255" y2="100" stroke="#333" strokeDasharray="5,4" strokeWidth="1.5"/>
      {/* b = semi-minor (vertical) */}
      <line x1="140" y1="100" x2="140" y2="35"  stroke="#333" strokeDasharray="5,4" strokeWidth="1.5"/>
      <text x="190" y="94" fontSize="15" fill="#1f3a2e" fontWeight="700">a</text>
      <text x="144" y="72" fontSize="15" fill="#1f3a2e" fontWeight="700">b</text>
    </svg>
  );
}

function SemiEllipseDiagram() {
  return (
    <svg {...svgBase}>
      <path d="M 25 140 A 115 90 0 0 1 255 140 Z" fill="#c8f25c33" stroke="#1f3a2e" strokeWidth="2.5" strokeLinejoin="round"/>
      <line x1="25" y1="140" x2="255" y2="140" stroke="#1f3a2e" strokeWidth="2.5"/>
      <line x1="140" y1="140" x2="255" y2="140" stroke="#333" strokeDasharray="5,4" strokeWidth="1.5"/>
      <line x1="140" y1="140" x2="140" y2="50"  stroke="#333" strokeDasharray="5,4" strokeWidth="1.5"/>
      <text x="192" y="134" fontSize="15" fill="#1f3a2e" fontWeight="700">a</text>
      <text x="144" y="100" fontSize="15" fill="#1f3a2e" fontWeight="700">b</text>
    </svg>
  );
}

const ShapeDiagram = ({ shape, triCount, triangles, unit }) => {
  switch (shape) {
    case 'polygon':      return <TriangleDiagram count={triCount} triangles={triangles} unit={unit} />;
    case 'cyclic_quad':  return <CyclicQuadDiagram />;
    case 'rectangle':    return <RectangleDiagram />;
    case 'circle':       return <CircleDiagram />;
    case 'semicircle':   return <SemicircleDiagram />;
    case 'ellipse':      return <EllipseDiagram />;
    case 'semi_ellipse': return <SemiEllipseDiagram />;
    default:             return null;
  }
};

/* ── Input fields per shape ─────────────────────────────────── */
const EMPTY_TRIANGLE = { a: '', b: '', c: '' };

function defaultInputs(shape) {
  switch (shape) {
    case 'polygon':      return { triangles: [{ ...EMPTY_TRIANGLE }] };
    case 'cyclic_quad':  return { a: '', b: '', c: '', d: '' };
    case 'rectangle':    return { a: '', b: '' };
    case 'circle':       return { r: '' };
    case 'semicircle':   return { r: '' };
    case 'ellipse':      return { a: '', b: '' };
    case 'semi_ellipse': return { a: '', b: '' };
    default:             return {};
  }
}

/* ── Number formatter ───────────────────────────────────────── */
const fmt = (n, dec = 4) => (isNaN(n) || n === null) ? '—' : n.toFixed(dec);
const fmt2 = n => fmt(n, 2);

/* ── Main component ─────────────────────────────────────────── */
function AreaCalculatorModal({ isOpen, onClose, asPage = false, asDrawer = false, drawerTitle, accountData = null, initialAreaData = null, onSave }) {
  const [shape,   setShape]   = useState('polygon');
  const [unit,    setUnit]    = useState(() => {
    if (initialAreaData?.unit) return initialAreaData.unit;
    if (accountData?.area_unit === 'sqft' || accountData?.land_area_unit === 'sqft') return 'Feet';
    return 'Feet';
  });
  const [inputs,  setInputs]  = useState(() => {
    const tris = initialAreaData?.triangles;
    if (tris && tris.length > 0) {
      return { triangles: tris.map(t => ({ a: String(t.side_a ?? ''), b: String(t.side_b ?? ''), c: String(t.side_c ?? '') })) };
    }
    return defaultInputs('polygon');
  });
  const [results, setResults] = useState(null);
  const [saving,  setSaving]  = useState(false);

  const unitLabel = unit === 'Meter' ? 'm' : unit === 'Feet' ? 'ft' : 'cm';

  const handleShapeChange = useCallback(e => {
    const s = e.target.value;
    setShape(s);
    setInputs(defaultInputs(s));
    setResults(null);
  }, []);

  const handleUnitChange = useCallback(e => {
    const newUnit = e.target.value;
    setUnit(newUnit);
    // Auto-recalculate with the new unit so results stay live
    setResults(prev => {
      if (!prev) return null;
      const sqm = computeAreaSqm(shape, inputs, newUnit);
      return sqm > 0 ? buildResults(sqm) : null;
    });
  }, [shape, inputs]);

  /* Triangle inputs */
  const setTriField = (idx, field, val) => {
    setInputs(prev => {
      const tris = prev.triangles.map((t, i) => i === idx ? { ...t, [field]: val } : t);
      return { ...prev, triangles: tris };
    });
    setResults(null);
  };

  const addTriangle = () => {
    setInputs(prev => ({ ...prev, triangles: [...prev.triangles, { ...EMPTY_TRIANGLE }] }));
    setResults(null);
  };

  const removeTriangle = idx => {
    setInputs(prev => ({ ...prev, triangles: prev.triangles.filter((_, i) => i !== idx) }));
    setResults(null);
  };

  /* Simple input */
  const setField = (field, val) => {
    setInputs(prev => ({ ...prev, [field]: val }));
    setResults(null);
  };

  const handleCalculate = () => {
    const sqm = computeAreaSqm(shape, inputs, unit);
    setResults(buildResults(sqm));
  };

  const handleReset = () => {
    setInputs(defaultInputs(shape));
    setResults(null);
  };

  const handleSaveToAccount = async () => {
    if (!onSave || !results) return;
    setSaving(true);
    try {
      const saveData = {
        land_area: fmt2(results.sqm),
        land_area_unit: 'sqm',
        area_unit: unit === 'Feet' ? 'sqft' : 'sqm',
      };
      if (shape === 'polygon') {
        const k = LINEAR_TO_M[unit] || 1;
        const trianglesData = inputs.triangles
          .filter(t => t.a && t.b && t.c)
          .map(t => {
            const a = (parseFloat(t.a) || 0) * k;
            const b = (parseFloat(t.b) || 0) * k;
            const c = (parseFloat(t.c) || 0) * k;
            const areaSqm = heronArea(a, b, c);
            const s = (a + b + c) / 2;
            return {
              side_a: t.a,
              side_b: t.b,
              side_c: t.c,
              semi_perimeter: fmt2(s / k),
              area_sqft: fmt2(areaSqm * 10.7639),
              aana: fmt2(areaSqm / AANA),
            };
          });
        const nepal = toNepal(results.sqm);
        const totalAana = nepal.ropani * 16 + nepal.aana + nepal.paisa / 4 + nepal.dam / 16;
        saveData.triangles = trianglesData;
        saveData.total_sqft = fmt2(results.sqft);
        saveData.total_sqm = fmt2(results.sqm);
        saveData.total_aana = fmt2(totalAana);
        saveData.rapd = `${nepal.ropani}-${nepal.aana}-${nepal.paisa}-${nepal.dam}`;
        saveData.unit = unit;
      }
      await onSave(saveData);
    } finally {
      setSaving(false);
    }
  };

  const triCount = shape === 'polygon' ? (inputs.triangles?.length || 1) : 1;

  const body = (
    <div className="ac-body">
      {/* ── Diagram ── */}
      <div className="ac-diagram">
        <ShapeDiagram shape={shape} triCount={triCount} triangles={inputs.triangles} unit={unit} />
      </div>

      {/* ── Controls row ── */}
      <div className="ac-controls">
        <div className="ac-select-wrap">
          <select className="ac-select" value={shape} onChange={handleShapeChange}>
            {SHAPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <span className="ac-select-arrow">⌄</span>
        </div>
        <div className="ac-select-wrap">
          <select className="ac-select" value={unit} onChange={handleUnitChange}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <span className="ac-select-arrow">⌄</span>
        </div>
      </div>

      {/* ── Input fields ── */}
      <div className="ac-inputs">
        {shape === 'polygon' && (
          <>
            {inputs.triangles.map((tri, idx) => (
              <div key={idx} className="ac-tri-group">
                <div className="ac-tri-head">
                  <span>Triangle {idx + 1}</span>
                  {results && (() => {
                    const k = LINEAR_TO_M[unit] || 1;
                    const areaSqm = heronArea(
                      (parseFloat(tri.a)||0)*k,
                      (parseFloat(tri.b)||0)*k,
                      (parseFloat(tri.c)||0)*k,
                    );
                    const dispArea = unit === 'Feet' ? areaSqm * 10.7639 : areaSqm;
                    const dispUnit = unit === 'Feet' ? 'sq.ft' : 'sq.m';
                    return <span className="ac-tri-area">Area = {fmt2(dispArea)} {dispUnit}</span>;
                  })()}
                  {inputs.triangles.length > 1 && (
                    <button className="ac-tri-remove" onClick={() => removeTriangle(idx)}>✕</button>
                  )}
                </div>
                <div className="ac-tri-fields">
                  {['a', 'b', 'c'].map(f => (
                    <div key={f} className="ac-field-wrap">
                      <input
                        className="ac-input"
                        type="number"
                        min="0"
                        value={tri[f]}
                        onChange={e => setTriField(idx, f, e.target.value)}
                        placeholder=" "
                      />
                      <label className="ac-label">{f} (in {unit})</label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {shape === 'cyclic_quad' && (
          <div className="ac-fields-grid">
            {['a', 'b', 'c', 'd'].map(f => (
              <div key={f} className="ac-field-wrap">
                <input
                  className="ac-input"
                  type="number"
                  min="0"
                  value={inputs[f] || ''}
                  onChange={e => setField(f, e.target.value)}
                  placeholder=" "
                />
                <label className="ac-label">{f} (in {unit})</label>
              </div>
            ))}
          </div>
        )}

        {['rectangle', 'ellipse', 'semi_ellipse'].includes(shape) && (
          <div className="ac-fields-grid">
            {['a', 'b'].map(f => (
              <div key={f} className="ac-field-wrap">
                <input
                  className="ac-input"
                  type="number"
                  min="0"
                  value={inputs[f] || ''}
                  onChange={e => setField(f, e.target.value)}
                  placeholder=" "
                />
                <label className="ac-label">{f} (in {unit})</label>
              </div>
            ))}
          </div>
        )}

        {['circle', 'semicircle'].includes(shape) && (
          <div className="ac-fields-grid ac-fields-single">
            <div className="ac-field-wrap">
              <input
                className="ac-input"
                type="number"
                min="0"
                value={inputs.r || ''}
                onChange={e => setField('r', e.target.value)}
                placeholder=" "
              />
              <label className="ac-label">r (in {unit})</label>
            </div>
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="ac-actions">
        {shape === 'polygon' && (
          <button className="ac-btn ac-btn-add" onClick={addTriangle}>＋ Add Triangle</button>
        )}
        <button className="ac-btn ac-btn-calc" onClick={handleCalculate}>⊞ Calculate</button>
        <button className="ac-btn ac-btn-reset" onClick={handleReset}>↺ Reset</button>
      </div>

      {/* ── Results ── */}
      {results !== null && (
        <div className="ac-results">
          <div className="ac-results-head">
            Total Area {shape === 'polygon' && inputs.triangles.length > 1 ? `(${inputs.triangles.length} triangles)` : ''}
          </div>

          <div className="ac-results-section">
            <div className="ac-results-section-label">Universal</div>
            <div className="ac-result-row">
              <span className="ac-result-name">Sq. Meter</span>
              <span className="ac-result-sep">:</span>
              <span className="ac-result-val">{fmt2(results.sqm)}</span>
            </div>
            <div className="ac-result-row">
              <span className="ac-result-name">Sq. Feet</span>
              <span className="ac-result-sep">:</span>
              <span className="ac-result-val">{fmt2(results.sqft)}</span>
            </div>
            <div className="ac-result-row">
              <span className="ac-result-name">Sq. Yard</span>
              <span className="ac-result-sep">:</span>
              <span className="ac-result-val">{fmt2(results.sqyd)}</span>
            </div>
            <div className="ac-result-row">
              <span className="ac-result-name">Acre</span>
              <span className="ac-result-sep">:</span>
              <span className="ac-result-val">{fmt(results.acre, 5)}</span>
            </div>
          </div>

          <div className="ac-results-section">
            <div className="ac-results-section-label">Nepal (Ropani system)</div>
            <div className="ac-result-row">
              <span className="ac-result-name">Ropani</span>
              <span className="ac-result-sep">:</span>
              <span className="ac-result-val">{results.nepal.ropani}</span>
            </div>
            <div className="ac-result-row">
              <span className="ac-result-name">Aana</span>
              <span className="ac-result-sep">:</span>
              <span className="ac-result-val">{results.nepal.aana}</span>
            </div>
            <div className="ac-result-row">
              <span className="ac-result-name">Paisa</span>
              <span className="ac-result-sep">:</span>
              <span className="ac-result-val">{results.nepal.paisa}</span>
            </div>
            <div className="ac-result-row">
              <span className="ac-result-name">Dam</span>
              <span className="ac-result-sep">:</span>
              <span className="ac-result-val">{results.nepal.dam}</span>
            </div>
            <div className="ac-result-row ac-result-rapd">
              <span className="ac-result-name">R-A-P-D</span>
              <span className="ac-result-sep">:</span>
              <span className="ac-result-val">
                {results.nepal.ropani}-{results.nepal.aana}-{results.nepal.paisa}-{results.nepal.dam}
              </span>
            </div>
          </div>

          {accountData && onSave && (
            <button
              className="ac-btn ac-btn-save"
              onClick={handleSaveToAccount}
              disabled={saving}
            >
              {saving ? 'Saving…' : '⇩ Save to Account'}
            </button>
          )}
        </div>
      )}
    </div>
  );

  /* ── Page mode (no overlay) ─────────────────────────────── */
  if (asPage) return <div className="ac-page">{body}</div>;

  /* ── Drawer mode ─────────────────────────────────────────── */
  if (asDrawer) {
    if (!isOpen) return null;
    return (
      <div className="ac-drawer-overlay" onClick={onClose}>
        <div className="ac-drawer" onClick={e => e.stopPropagation()}>
          <div className="ac-header">
            <h2 className="ac-title">{drawerTitle || 'Area Calculator'}</h2>
            <button className="ac-close" onClick={onClose}>✕</button>
          </div>
          <div className="ac-scroll">
            {body}
          </div>
        </div>
      </div>
    );
  }

  /* ── Modal mode ─────────────────────────────────────────── */
  if (!isOpen) return null;
  return (
    <div className="ac-overlay" onClick={onClose}>
      <div className="ac-modal" onClick={e => e.stopPropagation()}>
        <div className="ac-header">
          <h2 className="ac-title">Area Calculator</h2>
          <button className="ac-close" onClick={onClose}>✕</button>
        </div>
        <div className="ac-scroll">
          {body}
        </div>
      </div>
    </div>
  );
}

export default AreaCalculatorModal;
