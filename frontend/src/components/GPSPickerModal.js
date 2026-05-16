import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/PropertyMapModal.css';

const PIN_ICON = L.divIcon({
  html: `<div class="pmap-pin" style="--pin-color:#1f3a2e"><span class="pmap-pin-label">P</span></div>`,
  className: '',
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -42],
});

const TILE_LAYERS = {
  street:    { label: 'Street',    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  satellite: { label: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
};

// Nepal center as default
const DEFAULT_CENTER = [28.3949, 84.124];
const DEFAULT_ZOOM   = 7;

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: e => onMapClick(e.latlng) });
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  const prev = useRef(null);
  if (target) {
    const key = `${target.lat},${target.lng},${target.zoom ?? ''}`;
    if (prev.current !== key) {
      prev.current = key;
      if (target.zoom != null) {
        map.flyTo([target.lat, target.lng], target.zoom, { duration: 1 });
      } else {
        map.panTo([target.lat, target.lng], { animate: true, duration: 0.4 });
      }
    }
  }
  return null;
}

function dmsToDecimal(deg, min, sec, dir) {
  const d = Math.abs(parseFloat(deg)) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
  return (dir === 'S' || dir === 'W') ? -d : d;
}

function parseCoords(str) {
  if (!str) return null;
  const s = String(str).trim();
  const dmsRe = /(\d+)[°d]\s*(\d+)['''′]\s*([\d.]+)["""″]?\s*([NSns])[,\s]+(\d+)[°d]\s*(\d+)['''′]\s*([\d.]+)["""″]?\s*([EWew])/;
  const m = s.match(dmsRe);
  if (m) {
    const lat = dmsToDecimal(m[1], m[2], m[3], m[4].toUpperCase());
    const lng = dmsToDecimal(m[5], m[6], m[7], m[8].toUpperCase());
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  const parts = s.split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
  if (parts.length >= 2) {
    const [lat, lng] = parts;
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  }
  return null;
}

export default function GPSPickerModal({ isOpen, onPick, onClose, initialCoords }) {
  const existing = useMemo(() => parseCoords(initialCoords), [initialCoords]);

  const [pin,        setPin]        = useState(null);
  const [flyTarget,  setFlyTarget]  = useState(null);
  const [tileStyle,  setTileStyle]  = useState('satellite');
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [error,      setError]      = useState('');

  // Sync pin + fly whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      const p = existing ?? null;
      setPin(p);
      setFlyTarget(p ? { ...p, zoom: 16 } : null);
      setQuery('');
      setResults([]);
      setError('');
    }
  }, [isOpen]); // eslint-disable-line

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true); setError(''); setResults([]);
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setResults(data);
      if (!data.length) setError('No places found.');
    } catch {
      setError('Search failed.');
    } finally {
      setSearching(false);
    }
  }, [query]);

  const selectResult = r => {
    const pos = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    setPin(pos);
    setFlyTarget({ ...pos, zoom: 16 }); // fly + zoom for search results
    setQuery(r.display_name);
    setResults([]);
  };

  const handleMapClick = ({ lat, lng }) => {
    setPin({ lat, lng });
    setFlyTarget(null); // no fly — user already sees the spot they clicked
    setResults([]);
  };

  const handleUse = () => {
    if (!pin) return;
    const pad = n => n.toFixed(7);
    onPick(`${pad(pin.lat)}, ${pad(pin.lng)}`);
    onClose();
  };

  const handleClose = () => {
    setPin(existing ?? null); setQuery(''); setResults([]); setError('');
    onClose();
  };

  if (!isOpen) return null;

  const mapCenter = existing ? [existing.lat, existing.lng] : DEFAULT_CENTER;
  const mapZoom   = existing ? 16 : DEFAULT_ZOOM;

  return (
    <div className="pmap-overlay" onClick={handleClose}>
      <div className="pmap-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 960, width: '92vw' }}>

        {/* Header */}
        <div className="pmap-header">
          <div>
            <p className="pmap-eyebrow">GPS Picker</p>
            <h2>Pick Location on Map</h2>
          </div>
          <button className="pmap-close" onClick={handleClose}>✕</button>
        </div>

        {/* Search */}
        <div className="pmap-route-panel">
          <div className="pmap-search-row">
            <input
              className="pmap-search-input"
              type="text"
              placeholder="Search a place, or click the map to drop a pin…"
              value={query}
              onChange={e => { setQuery(e.target.value); setResults([]); }}
              onKeyDown={e => e.key === 'Enter' && search()}
              autoFocus
            />
            <button className="pmap-search-btn" onClick={search} disabled={searching}>
              {searching ? '…' : 'Search'}
            </button>
            {pin && (
              <button className="pmap-clear-btn" onClick={() => { setPin(null); setQuery(''); }} title="Clear">✕</button>
            )}
          </div>
          {results.length > 0 && (
            <div className="pmap-results">
              {results.map((r, i) => (
                <div key={i} className="pmap-result-item" onClick={() => selectResult(r)}>
                  <span className="pmap-result-icon">📌</span>
                  <span className="pmap-result-name">{r.display_name}</span>
                </div>
              ))}
            </div>
          )}
          {error && <div className="pmap-error" style={{ margin: '6px 0 0' }}>⚠ {error}</div>}
        </div>

        {/* Map */}
        <div className="pmap-map-wrap" style={{ flex: 1 }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ width: '100%', height: '100%' }}
            zoomControl
          >
            <TileLayer url={TILE_LAYERS[tileStyle].url} attribution="" maxZoom={19} crossOrigin="anonymous" />
            <ClickHandler onMapClick={handleMapClick} />
            {flyTarget && <FlyTo target={flyTarget} />}
            {pin && <Marker position={[pin.lat, pin.lng]} icon={PIN_ICON} />}
          </MapContainer>

          {/* Layer switcher */}
          <div className="pmap-layer-switcher">
            {Object.entries(TILE_LAYERS).map(([key, def]) => (
              <button key={key} className={`pmap-layer-btn${tileStyle === key ? ' active' : ''}`} onClick={() => setTileStyle(key)}>
                {def.label}
              </button>
            ))}
          </div>

          {/* Coordinate tag */}
          {pin && (
            <div style={{
              position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(15,30,20,0.82)', color: '#fff', borderRadius: 8,
              padding: '6px 14px', fontSize: 12, fontFamily: 'monospace',
              pointerEvents: 'none', zIndex: 800, whiteSpace: 'nowrap',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}>
              📍 {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
            </div>
          )}

          {!pin && <div className="pmap-map-hint pmap-map-hint--dim">Click anywhere on the map to drop a pin</div>}
        </div>

        {/* Footer */}
        <div className="pmap-footer">
          {pin && (
            <div className="pmap-drag-hint">
              <span>{pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}</span>
            </div>
          )}
          <div className="pmap-footer-actions">
            <button className="pmap-btn-secondary" onClick={handleClose}>Cancel</button>
            <button className="pmap-btn-primary" onClick={handleUse} disabled={!pin}>
              Use these Coordinates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
