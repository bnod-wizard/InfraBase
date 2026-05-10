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

function TriangleDiagram({ count }) {
  if (count <= 1) {
    return (
      <svg {...svgBase}>
        <polygon points="140,18 28,182 252,182" fill="#c8f25c33" stroke="#1f3a2e" strokeWidth="2.5" strokeLinejoin="round"/>
        <text x="74"  y="116" fontSize="15" fill="#1f3a2e" fontWeight="700">a</text>
        <text x="196" y="116" fontSize="15" fill="#1f3a2e" fontWeight="700">b</text>
        <text x="136" y="197" fontSize="15" fill="#1f3a2e" fontWeight="700">c</text>
      </svg>
    );
  }
  return (
    <svg {...svgBase}>
      {/* Outer polygon */}
      <polygon points="75,18 18,145 148,182 248,148 220,38" fill="#e8f5e944" stroke="#1f3a2e" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* Diagonals */}
      <line x1="75" y1="18" x2="148" y2="182" stroke="#1f3a2e" strokeWidth="1.5" strokeDasharray="5,4"/>
      <line x1="75" y1="18" x2="248" y2="148" stroke="#1f3a2e" strokeWidth="1.5" strokeDasharray="5,4"/>
      {/* Triangle-1 fill */}
      <polygon points="75,18 18,145 148,182" fill="#c8f25c22" stroke="#1a6e3c" strokeWidth="1.5"/>
      {/* Triangle-2 fill */}
      <polygon points="75,18 148,182 248,148" fill="#3b6fb622" stroke="#3b6fb6" strokeWidth="1.5"/>
      {/* Side labels */}
      <text x="30"  y="86"  fontSize="13" fill="#1f3a2e" fontWeight="700">a</text>
      <text x="90"  y="175" fontSize="13" fill="#1f3a2e" fontWeight="700">b</text>
      <text x="205" y="175" fontSize="13" fill="#1f3a2e" fontWeight="700">c</text>
      <text x="244" y="96"  fontSize="13" fill="#1f3a2e" fontWeight="700">x</text>
      <text x="148" y="36"  fontSize="13" fill="#1f3a2e" fontWeight="700">y</text>
      {/* Labels */}
      <text x="50"  y="132" fontSize="10" fill="#1a6e3c">Tri-1</text>
      <text x="148" y="120" fontSize="10" fill="#3b6fb6">Tri-2</text>
      {count > 2 && <text x="110" y="155" fontSize="10" fill="#888" fontStyle="italic">+{count - 2} more</text>}
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

const ShapeDiagram = ({ shape, triCount }) => {
  switch (shape) {
    case 'polygon':      return <TriangleDiagram count={triCount} />;
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
function AreaCalculatorModal({ isOpen, onClose, asPage = false, accountData = null, onSave }) {
  const [shape,   setShape]   = useState('polygon');
  const [unit,    setUnit]    = useState(
    (accountData?.area_unit === 'sqft' || accountData?.land_area_unit === 'sqft') ? 'Feet' : 'Meter'
  );
  const [inputs,  setInputs]  = useState(defaultInputs('polygon'));
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
    setUnit(e.target.value);
    setResults(null);
  }, []);

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
      await onSave({ land_area: fmt2(results.sqm), land_area_unit: 'sqm' });
    } finally {
      setSaving(false);
    }
  };

  const triCount = shape === 'polygon' ? (inputs.triangles?.length || 1) : 1;

  const body = (
    <div className="ac-body">
      {/* ── Diagram ── */}
      <div className="ac-diagram">
        <ShapeDiagram shape={shape} triCount={triCount} />
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
                  {results && (
                    <span className="ac-tri-area">
                      Area = {fmt2(heronArea(
                        (parseFloat(tri.a) || 0) * LINEAR_TO_M[unit],
                        (parseFloat(tri.b) || 0) * LINEAR_TO_M[unit],
                        (parseFloat(tri.c) || 0) * LINEAR_TO_M[unit],
                      ))} sq.m
                    </span>
                  )}
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
