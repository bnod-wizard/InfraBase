import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import accountApi from '../services/accountApi';
import { useToast } from '../context';
import 'leaflet/dist/leaflet.css';
import '../styles/PropertyMapModal.css';

// ── Custom markers ─────────────────────────────────────────────────────────────
const makeMarker = (color, label = '') => L.divIcon({
  html: `<div class="pmap-pin" style="--pin-color:${color}">${label ? `<span class="pmap-pin-label">${label}</span>` : ''}</div>`,
  className: '',
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -42],
});

const PROPERTY_ICON = makeMarker('#1f3a2e', 'P');
const LANDMARK_ICON = makeMarker('#2563eb', 'L');
const SEARCH_ICON   = makeMarker('#f59e0b', 'S');

// ── GPS parsers ────────────────────────────────────────────────────────────────
function dmsToDecimal(deg, min, sec, dir) {
  const d = Math.abs(parseFloat(deg)) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
  return (dir === 'S' || dir === 'W') ? -d : d;
}

function parseGPS(str) {
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

// ── Map inner: route drawing + click handling + cursor ────────────────────────
function MapHandle({ mapRef, route, straight, routeMode, onMapClick }) {
  const map = useMap();
  const polyRef = useRef(null);
  const straightRef = useRef(null);

  useEffect(() => { mapRef.current = map; }, [map, mapRef]);

  // Draw / clear road route polyline
  useEffect(() => {
    if (polyRef.current) { polyRef.current.remove(); polyRef.current = null; }
    if (route?.length && map) {
      polyRef.current = L.polyline(route, { color: '#facc15', weight: 5, opacity: 0.95 }).addTo(map);
    }
    return () => { if (polyRef.current) { polyRef.current.remove(); polyRef.current = null; } };
  }, [route, map]);

  // Draw / clear dashed straight-line between P and L
  useEffect(() => {
    if (straightRef.current) { straightRef.current.remove(); straightRef.current = null; }
    if (straight?.length && map) {
      straightRef.current = L.polyline(straight, {
        color: '#38bdf8', weight: 2, opacity: 0.75, dashArray: '8 12',
      }).addTo(map);
    }
    return () => { if (straightRef.current) { straightRef.current.remove(); straightRef.current = null; } };
  }, [straight, map]);

  // Crosshair cursor in route mode
  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = routeMode ? 'crosshair' : '';
    return () => { container.style.cursor = ''; };
  }, [routeMode, map]);

  // Map click handler
  useMapEvents({
    click(e) {
      if (routeMode && onMapClick) onMapClick(e.latlng);
    },
  });

  return null;
}

// ── Haversine straight-line distance ───────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return (R * 2 * Math.asin(Math.sqrt(a))).toFixed(2) + ' km';
}

// ── Fetch OSRM route ───────────────────────────────────────────────────────────
async function fetchRoute(fromLat, fromLng, toLat, toLng) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${fromLng},${fromLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route');
  const r0 = data.routes[0];
  return {
    // raw OSRM coords — caller will prepend/append actual marker positions
    coords: r0.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distance: (r0.distance / 1000).toFixed(2) + ' km',
    duration: Math.round(r0.duration / 60) + ' min',
  };
}

// ── Reverse geocode a lat/lng to a place name ─────────────────────────────────
async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// ── Main component ─────────────────────────────────────────────────────────────
// ── Tile layer definitions ─────────────────────────────────────────────────────
const TILE_LAYERS = {
  street: {
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA',
    maxZoom: 19,
  },
  hybrid: {
    label: 'Hybrid',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labelsUrl: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
};

export default function PropertyMapModal({ property, accountId, onClose, onPropertyUpdate }) {
  const [mode, setMode]           = useState('view');
  const [tileStyle, setTileStyle] = useState('satellite');
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [landmark, setLandmark]   = useState(null);
  const [route, setRoute]         = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [searching, setSearching]           = useState(false);
  const [routeLoading, setRouteLoading]     = useState(false);
  const [screenshotting, setScreenshotting] = useState(false);
  const [error, setError]                   = useState('');

  // View-mode location search
  const [viewQuery, setViewQuery]       = useState('');
  const [viewResults, setViewResults]   = useState([]);
  const [viewSearching, setViewSearching] = useState(false);
  const [searchedPin, setSearchedPin]   = useState(null);

  // Draggable marker state
  const [markerPos, setMarkerPos]       = useState(null);
  const [isDragged, setIsDragged]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [savingLandmark, setSavingLandmark] = useState(false);
  const [landmarkSaved, setLandmarkSaved]   = useState(false);

  const toast = useToast();
  const mapRef     = useRef(null);
  const captureRef = useRef(null);

  const coords = parseGPS(property?.gps_coordinates);

  // Reconstruct the previously-saved landmark from stored property fields
  const savedLandmark = useMemo(() => {
    const lmCoords = parseGPS(property?.landmark_coordinates);
    if (!lmCoords) return null;
    return {
      lat: lmCoords.lat,
      lng: lmCoords.lng,
      name: property?.nearest_landmark || `${lmCoords.lat.toFixed(5)}, ${lmCoords.lng.toFixed(5)}`,
    };
  }, [property?.landmark_coordinates, property?.nearest_landmark]); // eslint-disable-line

  // Sync marker position when coords change (e.g. after save)
  useEffect(() => {
    if (coords) { setMarkerPos(coords); setIsDragged(false); }
  }, [property?.gps_coordinates]); // eslint-disable-line

  // Init on first render
  useEffect(() => {
    if (coords && !markerPos) setMarkerPos(coords);
  }, []); // eslint-disable-line

  // ── Apply route from a { lat, lng, name } landmark object ───────────────────
  const applyLandmark = useCallback(async (lm) => {
    setLandmark(lm);
    setResults([]);
    setRouteLoading(true);
    setError('');
    setRoute(null);
    setRouteInfo(null);
    try {
      const r = await fetchRoute(lm.lat, lm.lng, coords.lat, coords.lng);
      // Extend with actual marker positions so the line visually connects P ↔ L
      // regardless of where OSRM snaps to the nearest road.
      const extended = [[lm.lat, lm.lng], ...r.coords, [coords.lat, coords.lng]];
      setRoute(extended);
      setRouteInfo({
        distance: r.distance,
        duration: r.duration,
        straight: haversine(lm.lat, lm.lng, coords.lat, coords.lng),
      });
      if (mapRef.current && extended.length) {
        mapRef.current.fitBounds(L.latLngBounds(extended), { padding: [50, 50] });
      }
    } catch {
      setError('No drivable route found. Try a different point.');
    } finally {
      setRouteLoading(false);
    }
  }, [coords]);

  // ── Search by text ───────────────────────────────────────────────────────────
  const searchLandmark = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError('');
    setResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setResults(data);
      if (!data.length) setError('No places found — try a different name.');
    } catch {
      setError('Search failed. Check your connection.');
    } finally {
      setSearching(false);
    }
  }, [query]);

  // Select from route search results
  const selectResult = useCallback((r) => {
    const lm = { lat: parseFloat(r.lat), lng: parseFloat(r.lon), name: r.display_name };
    setQuery(r.display_name);
    applyLandmark(lm);
  }, [applyLandmark]);

  // ── View-mode location search ────────────────────────────────────────────────
  const searchViewLocation = useCallback(async () => {
    const q = viewQuery.trim();
    if (!q) return;
    setViewSearching(true);
    setError('');
    setViewResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setViewResults(data);
      if (!data.length) setError('No places found — try a different name.');
    } catch {
      setError('Search failed. Check your connection.');
    } finally {
      setViewSearching(false);
    }
  }, [viewQuery]);

  const selectViewResult = useCallback((r) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setSearchedPin({ lat, lng, name: r.display_name });
    setViewQuery(r.display_name);
    setViewResults([]);
    if (mapRef.current) mapRef.current.setView([lat, lng], 16);
  }, []);

  const clearViewSearch = () => {
    setSearchedPin(null);
    setViewQuery('');
    setViewResults([]);
    setError('');
    if (mapRef.current && coords) mapRef.current.setView([coords.lat, coords.lng], 17);
  };

  // ── Click on map ─────────────────────────────────────────────────────────────
  const handleMapClick = useCallback(async ({ lat, lng }) => {
    if (routeLoading) return;
    // Reverse geocode in background; start route immediately with coords
    const tempName = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setQuery(tempName);
    const lm = { lat, lng, name: tempName };
    setLandmark(lm);          // show marker instantly
    setRouteLoading(true);
    setError('');
    setRoute(null);
    setRouteInfo(null);
    // Reverse geocode + route in parallel
    const [name, routeResult] = await Promise.allSettled([
      reverseGeocode(lat, lng),
      fetchRoute(lat, lng, coords.lat, coords.lng),
    ]);
    const resolvedName = name.status === 'fulfilled' ? name.value : tempName;
    setLandmark({ lat, lng, name: resolvedName });
    setQuery(resolvedName);
    if (routeResult.status === 'fulfilled') {
      const r = routeResult.value;
      const extended = [[lat, lng], ...r.coords, [coords.lat, coords.lng]];
      setRoute(extended);
      setRouteInfo({
        distance: r.distance,
        duration: r.duration,
        straight: haversine(lat, lng, coords.lat, coords.lng),
      });
      if (mapRef.current && extended.length) {
        mapRef.current.fitBounds(L.latLngBounds(extended), { padding: [50, 50] });
      }
    } else {
      setError('No drivable route to that point. Try somewhere else.');
    }
    setRouteLoading(false);
  }, [coords, routeLoading]);

  // ── Save landmark to property record ────────────────────────────────────────
  const handleSaveLandmark = async () => {
    if (!landmark || !property?._id) return;
    setSavingLandmark(true);
    setError('');
    try {
      const lmCoords = `${landmark.lat.toFixed(7)}, ${landmark.lng.toFixed(7)}`;
      const res = await accountApi.updateProperty(property._id, {
        ...property,
        nearest_landmark: landmark.name.split(',').slice(0, 2).join(',').trim(),
        landmark_coordinates: lmCoords,
      });
      if (res.data?.success) {
        setLandmarkSaved(true);
        if (onPropertyUpdate) onPropertyUpdate(res.data.data);
        setTimeout(() => setLandmarkSaved(false), 3000);
      } else {
        setError(res.data?.message || 'Could not save landmark.');
      }
    } catch {
      setError('Could not save landmark. Try again.');
    } finally {
      setSavingLandmark(false);
    }
  };

  // ── Clear route ──────────────────────────────────────────────────────────────
  const clearRoute = () => {
    setLandmark(null); setRoute(null); setRouteInfo(null);
    setQuery(''); setResults([]); setError(''); setLandmarkSaved(false);
    if (mapRef.current && coords) mapRef.current.setView([coords.lat, coords.lng], 15);
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
    if (m === 'view') clearRoute();
    if (m === 'route') {
      setSearchedPin(null); setViewQuery(''); setViewResults([]);
      // Auto-restore saved landmark if the user hasn't placed one yet this session
      if (!landmark && savedLandmark) {
        setQuery(savedLandmark.name);
        applyLandmark(savedLandmark);
      }
    }
  };

  // ── Save dragged coordinates to backend ──────────────────────────────────────
  const handleUpdateCoords = async () => {
    if (!markerPos || !property?._id) return;
    setSaving(true);
    setError('');
    try {
      const gpsStr = `${markerPos.lat.toFixed(7)}, ${markerPos.lng.toFixed(7)}`;
      const res = await accountApi.updateProperty(property._id, {
        ...property,
        gps_coordinates: gpsStr,
      });
      if (res.data?.success) {
        setIsDragged(false);
        if (onPropertyUpdate) onPropertyUpdate(res.data.data);
      } else {
        setError(res.data?.message || 'Update failed.');
      }
    } catch {
      setError('Could not save coordinates. Try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Screenshot → upload to account documents ─────────────────────────────────
  const takeScreenshot = async () => {
    if (!captureRef.current) return;
    setScreenshotting(true); setError('');
    try {
      const canvas = await html2canvas(captureRef.current, {
        useCORS: true, allowTaint: true, scale: 2, logging: false, imageTimeout: 8000,
      });

      // Build filename with date-time stamp
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const stamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      const base  = (property?.property_name || property?.plot_no || 'property').replace(/\s+/g, '_').toLowerCase();
      const filename = `${base}_map_${stamp}.png`;

      // Convert canvas to Blob and upload
      canvas.toBlob(async (blob) => {
        if (!blob) { toast('Screenshot capture failed.'); setScreenshotting(false); return; }
        try {
          const form = new FormData();
          form.append('file', blob, filename);
          form.append('doc_type', 'photo');
          form.append('description', `Map screenshot — ${property?.property_name || property?.plot_no || 'property'}`);
          const token = localStorage.getItem('authToken');
          const res = await fetch(`http://localhost:5001/api/accounts/${accountId}/documents`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          });
          const data = await res.json();
          if (res.ok && data.success) {
            toast(`Screenshot saved — ${filename}`);
          } else {
            toast(data.message || 'Upload failed.');
          }
        } catch {
          toast('Upload failed — check your connection.');
        } finally {
          setScreenshotting(false);
        }
      }, 'image/png');
    } catch {
      toast('Screenshot failed — use OS shortcut (Cmd+Shift+4 / Win+Shift+S) instead.');
      setScreenshotting(false);
    }
  };

  // ── No GPS ───────────────────────────────────────────────────────────────────
  if (!coords) return (
    <div className="pmap-overlay" onClick={onClose}>
      <div className="pmap-modal" onClick={e => e.stopPropagation()}>
        <div className="pmap-header">
          <div>
            <p className="pmap-eyebrow">Property Map</p>
            <h2>{property?.property_name || property?.plot_no || 'Map'}</h2>
          </div>
          <button className="pmap-close" onClick={onClose}>✕</button>
        </div>
        <div className="pmap-no-coords">
          <div className="pmap-no-coords-icon">📍</div>
          <p>No GPS coordinates set for this property.</p>
          <small>Add coordinates in the <strong>GPS Coordinates</strong> field.<br/>
            Accepted formats:<br/>
            <code>27.7172, 85.3240</code><br/>
            <code>27°37′32.2″N 84°30′16.9″E</code>
          </small>
        </div>
      </div>
    </div>
  );

  const propName = property?.property_name || property?.plot_no || 'Property';
  const routeMode = mode === 'route';
  // Dashed straight-line between landmark and property (always shown when route exists)
  const straightLine = landmark && coords
    ? [[landmark.lat, landmark.lng], [coords.lat, coords.lng]]
    : null;

  return (
    <div className="pmap-overlay" onClick={onClose}>
      <div className="pmap-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="pmap-header">
          <div>
            <p className="pmap-eyebrow">Property Map</p>
            <h2>{propName}</h2>
            <p className="pmap-coords">
              {isDragged && markerPos
                ? <><span className="pmap-coords-old">{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</span> → <span className="pmap-coords-new">{markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}</span></>
                : <>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</>
              }
            </p>
          </div>
          <button className="pmap-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="pmap-tabs">
          <button className={`pmap-tab${mode === 'view' ? ' active' : ''}`} onClick={() => switchMode('view')}>
            📍 View Location
          </button>
          <button className={`pmap-tab${routeMode ? ' active' : ''}`} onClick={() => switchMode('route')}>
            🗺 Route from Landmark
          </button>
        </div>

        {/* View-mode search panel */}
        {!routeMode && (
          <div className="pmap-route-panel">
            <div className="pmap-search-row">
              <input
                className="pmap-search-input"
                type="text"
                placeholder="Search a place to pan the map…"
                value={viewQuery}
                onChange={e => { setViewQuery(e.target.value); setViewResults([]); }}
                onKeyDown={e => e.key === 'Enter' && searchViewLocation()}
              />
              <button className="pmap-search-btn" onClick={searchViewLocation} disabled={viewSearching}>
                {viewSearching ? '…' : 'Search'}
              </button>
              {searchedPin && (
                <button className="pmap-clear-btn" onClick={clearViewSearch} title="Clear">✕</button>
              )}
            </div>

            {viewResults.length > 0 && (
              <div className="pmap-results">
                {viewResults.map((r, i) => (
                  <div key={i} className="pmap-result-item" onClick={() => selectViewResult(r)}>
                    <span className="pmap-result-icon">🔍</span>
                    <span className="pmap-result-name">{r.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Route panel */}
        {routeMode && (
          <div className="pmap-route-panel">
            <div className="pmap-search-row">
              <input
                className="pmap-search-input"
                type="text"
                placeholder="Search a place, or click anywhere on the map"
                value={query}
                onChange={e => { setQuery(e.target.value); setResults([]); }}
                onKeyDown={e => e.key === 'Enter' && searchLandmark()}
                autoFocus
              />
              <button className="pmap-search-btn" onClick={searchLandmark} disabled={searching}>
                {searching ? '…' : 'Search'}
              </button>
              {landmark && (
                <button className="pmap-clear-btn" onClick={clearRoute} title="Clear">✕</button>
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

            {routeInfo ? (
              <div className="pmap-route-info">
                <span className="pmap-route-badge">🛣 {routeInfo.distance}</span>
                <span className="pmap-route-badge">⏱ {routeInfo.duration} by road</span>
                {routeInfo.straight && (
                  <span className="pmap-route-badge pmap-route-badge--straight" title="Straight-line distance">
                    ✈ {routeInfo.straight} direct
                  </span>
                )}
                <span className="pmap-route-from">from {landmark?.name?.split(',')[0]}</span>
              </div>
            ) : !landmark && (
              <p className="pmap-click-hint">👆 Click anywhere on the map to drop a landmark, or search above</p>
            )}
          </div>
        )}

        {error && <div className="pmap-error">⚠ {error}</div>}

        {/* Map */}
        <div className="pmap-map-wrap" ref={captureRef}>
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={17}
            style={{ width: '100%', height: '100%' }}
            zoomControl
          >
            <TileLayer
              key={tileStyle}
              url={TILE_LAYERS[tileStyle].url}
              attribution={TILE_LAYERS[tileStyle].attribution}
              maxZoom={TILE_LAYERS[tileStyle].maxZoom}
              crossOrigin="anonymous"
            />
            {tileStyle === 'hybrid' && (
              <TileLayer
                url={TILE_LAYERS.hybrid.labelsUrl}
                attribution=""
                maxZoom={19}
                crossOrigin="anonymous"
                pane="overlayPane"
              />
            )}
            <MapHandle
              mapRef={mapRef}
              route={route}
              straight={straightLine}
              routeMode={routeMode}
              onMapClick={handleMapClick}
            />

            {markerPos && (
              <Marker
                position={[markerPos.lat, markerPos.lng]}
                icon={PROPERTY_ICON}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    setMarkerPos({ lat, lng });
                    setIsDragged(true);
                  },
                }}
              >
                <Popup>
                  <div className="pmap-popup">
                    <strong>{propName}</strong>
                    {property?.address && <p>{property.address}</p>}
                    {property?.plot_no && <p>Plot No: {property.plot_no}</p>}
                    <small>{markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}</small>
                    {isDragged && <p style={{color:'#d97706',fontWeight:600,marginTop:4}}>Unsaved position — click Update</p>}
                  </div>
                </Popup>
              </Marker>
            )}

            {landmark && (
              <Marker position={[landmark.lat, landmark.lng]} icon={LANDMARK_ICON}>
                <Popup>
                  <div className="pmap-popup">
                    <strong>Landmark</strong>
                    <p>{landmark.name.split(',').slice(0, 2).join(',')}</p>
                    <small>{landmark.lat.toFixed(5)}, {landmark.lng.toFixed(5)}</small>
                  </div>
                </Popup>
              </Marker>
            )}

            {searchedPin && (
              <Marker position={[searchedPin.lat, searchedPin.lng]} icon={SEARCH_ICON}>
                <Popup>
                  <div className="pmap-popup">
                    <strong>Search Result</strong>
                    <p>{searchedPin.name.split(',').slice(0, 2).join(',')}</p>
                    <small>{searchedPin.lat.toFixed(5)}, {searchedPin.lng.toFixed(5)}</small>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Layer switcher — sits above the map canvas */}
          <div className="pmap-layer-switcher">
            {Object.entries(TILE_LAYERS).map(([key, def]) => (
              <button
                key={key}
                className={`pmap-layer-btn${tileStyle === key ? ' active' : ''}`}
                onClick={() => setTileStyle(key)}
              >
                {def.label}
              </button>
            ))}
          </div>

          {routeLoading && (
            <div className="pmap-loading">
              <div className="pmap-spinner" />
              Calculating route…
            </div>
          )}

          {/* Hints */}
          {routeMode && !landmark && !routeLoading && (
            <div className="pmap-map-hint">Click map to place landmark</div>
          )}
          {!routeMode && !isDragged && (
            <div className="pmap-map-hint pmap-map-hint--dim">Drag the marker to reposition</div>
          )}
          {isDragged && (
            <div className="pmap-map-hint pmap-map-hint--warn">Marker moved — click Update Coordinates to save</div>
          )}
        </div>

        {/* Footer */}
        <div className="pmap-footer">
          {isDragged && (
            <div className="pmap-drag-hint">
              <span>New: {markerPos?.lat.toFixed(6)}, {markerPos?.lng.toFixed(6)}</span>
            </div>
          )}
          <div className="pmap-footer-actions">
            <button className="pmap-btn-secondary" onClick={onClose}>Close</button>
            {isDragged && (
              <button className="pmap-btn-update" onClick={handleUpdateCoords} disabled={saving}>
                {saving ? 'Saving…' : '📍 Update Coordinates'}
              </button>
            )}
            {landmark && (
              <button
                className={`pmap-btn-save-landmark${landmarkSaved ? ' saved' : ''}`}
                onClick={handleSaveLandmark}
                disabled={savingLandmark || landmarkSaved}
                title={`Save "${landmark.name.split(',')[0]}" as nearest landmark`}
              >
                {savingLandmark ? 'Saving…' : landmarkSaved ? '✓ Landmark Saved' : '📌 Save Landmark'}
              </button>
            )}
            <button className="pmap-btn-primary" onClick={takeScreenshot} disabled={screenshotting || !accountId}>
              {screenshotting ? 'Uploading…' : 'Save Map'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
