
/* ===== map.jsx ===== */
// Stylized Bali map — abstract topographic background.
// We don't draw a literal coastline (system prompt says no complex SVGs).
// Instead: a soft warm canvas with subtle "land" gradient, contour-style rings,
// area labels positioned by real lat/lng, and a coastline implied by a single
// rounded organic shape. Pins position via projectLatLng from data.js.

var { projectLatLng, MAP_BOUNDS } = window.PETA_DATA;

// Real-ish anchor labels (area name + approximate centroid) — projected onto canvas.
const AREA_LABELS = [
  { name: "UBUD",        lat: -8.5069, lng: 115.2625 },
  { name: "CANGGU",      lat: -8.6478, lng: 115.1385 },
  { name: "SEMINYAK",    lat: -8.6905, lng: 115.1729 },
  { name: "DENPASAR",    lat: -8.6705, lng: 115.2126 },
  { name: "SANUR",       lat: -8.6878, lng: 115.2616 },
  { name: "ULUWATU",     lat: -8.8290, lng: 115.0849 },
  { name: "NUSA DUA",    lat: -8.8008, lng: 115.2317 },
  { name: "SIDEMEN",     lat: -8.4894, lng: 115.4456 },
  { name: "AMED",        lat: -8.3375, lng: 115.6680 },
  { name: "LOVINA",      lat: -8.1583, lng: 115.0270 },
  { name: "MT. AGUNG",   lat: -8.3431, lng: 115.5083 },
  { name: "MT. BATUR",   lat: -8.2421, lng: 115.3753 },
  { name: "TEGALLALANG", lat: -8.4318, lng: 115.2776 },
  { name: "JIMBARAN",    lat: -8.7835, lng: 115.1647 },
];

function BaliMap({ width, height, days, activeStop, onPinClick, hoveredDay, setHoveredDay, panOffset }) {
  // SVG view: full bleed of provided width/height
  const W = width;
  const H = height;

  // Project area labels
  const labels = AREA_LABELS.map(a => ({
    ...a,
    ...projectLatLng(a.lat, a.lng, W, H)
  }));

  // Project all stops with day color + index
  const allStops = [];
  days.forEach(day => {
    day.stops.forEach((s, idx) => {
      const p = projectLatLng(s.lat, s.lng, W, H);
      allStops.push({ ...s, x: p.x, y: p.y, dayNumber: day.dayNumber, color: day.color, indexInDay: idx + 1 });
    });
  });

  // Polylines: connect within day
  const polylines = days.map(day => {
    const pts = day.stops.map(s => projectLatLng(s.lat, s.lng, W, H));
    return { color: day.color, dayNumber: day.dayNumber, pts };
  });

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", background: "#EFE7DA" }}
    >
      <defs>
        {/* Land gradient — warm beige to sandy */}
        <radialGradient id="landGrad" cx="55%" cy="60%" r="70%">
          <stop offset="0%" stopColor="#F2EAD8" />
          <stop offset="55%" stopColor="#E9DEC7" />
          <stop offset="100%" stopColor="#D8C9AC" />
        </radialGradient>
        {/* Ocean gradient */}
        <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C7D8DA" />
          <stop offset="100%" stopColor="#B6CACE" />
        </linearGradient>
        {/* Paper grain */}
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.32  0 0 0 0.06 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        {/* Pin shadow */}
        <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1F1B16" floodOpacity="0.25" />
        </filter>
        {/* Active pin glow */}
        <filter id="pinGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Ocean base */}
      <rect width={W} height={H} fill="url(#oceanGrad)" />

      {/* Subtle bathymetry rings */}
      <g opacity="0.18" stroke="#7B98A0" strokeWidth="1" fill="none">
        {[0.62, 0.78, 0.95, 1.15, 1.4].map((r, i) => (
          <ellipse key={i} cx={W * 0.52} cy={H * 0.55} rx={W * 0.42 * r} ry={H * 0.5 * r} strokeDasharray="2 6" />
        ))}
      </g>

      <g transform={`translate(${panOffset.x}, ${panOffset.y})`}>
        {/* Bali island shape — abstract organic blob, NOT a literal coastline.
            Sized to fit the lat/lng bounds we project against. */}
        <g transform={`translate(${W * 0.5}, ${H * 0.55})`}>
          {/* Soft shadow under island */}
          <ellipse cx="0" cy="14" rx={W * 0.43} ry={H * 0.36} fill="#1F1B16" opacity="0.08" />
          {/* Main land mass — a single rounded shape with two appendages (Bukit south + Amed east) */}
          <path
            d={`
              M ${-W*0.42} ${-H*0.05}
              C ${-W*0.43} ${-H*0.22}, ${-W*0.28} ${-H*0.36}, ${-W*0.05} ${-H*0.34}
              C ${W*0.18} ${-H*0.35}, ${W*0.34} ${-H*0.28}, ${W*0.41} ${-H*0.10}
              C ${W*0.46} ${H*0.05}, ${W*0.42} ${H*0.16}, ${W*0.28} ${H*0.18}
              C ${W*0.20} ${H*0.19}, ${W*0.12} ${H*0.18}, ${W*0.08} ${H*0.22}
              C ${W*0.06} ${H*0.30}, ${W*0.10} ${H*0.36}, ${W*0.05} ${H*0.40}
              C ${-W*0.02} ${H*0.42}, ${-W*0.10} ${H*0.36}, ${-W*0.10} ${H*0.26}
              C ${-W*0.10} ${H*0.20}, ${-W*0.18} ${H*0.18}, ${-W*0.28} ${H*0.16}
              C ${-W*0.38} ${H*0.12}, ${-W*0.42} ${H*0.05}, ${-W*0.42} ${-H*0.05}
              Z
            `}
            fill="url(#landGrad)"
            stroke="#B59E78"
            strokeWidth="1.5"
          />
          {/* Inner contour rings on land */}
          <g fill="none" stroke="#B59E78" strokeWidth="0.8" opacity="0.45">
            <ellipse cx={W*0.06} cy={-H*0.05} rx={W*0.16} ry={H*0.13} />
            <ellipse cx={W*0.08} cy={-H*0.04} rx={W*0.10} ry={H*0.08} />
            <ellipse cx={W*0.10} cy={-H*0.03} rx={W*0.05} ry={H*0.04} />
          </g>
          {/* Tiny crater/lake mark */}
          <circle cx={W*0.10} cy={-H*0.03} r={3} fill="#7B98A0" opacity="0.7" />
        </g>

        {/* Paper grain overlay */}
        <rect width={W} height={H} fill="#FFFFFF" filter="url(#grain)" opacity="0.5" />

        {/* Area labels */}
        <g fontFamily="ui-monospace, 'JetBrains Mono', monospace" fontSize="10" fill="#6B6258" letterSpacing="0.12em">
          {labels.map(l => (
            <g key={l.name}>
              <circle cx={l.x} cy={l.y} r="2" fill="#6B6258" opacity="0.5" />
              <text x={l.x + 6} y={l.y + 3} fontWeight="500" opacity="0.75">{l.name}</text>
            </g>
          ))}
        </g>

        {/* Polylines — drawn before pins */}
        {polylines.map(pl => {
          const dimmed = hoveredDay && hoveredDay !== pl.dayNumber;
          const d = pl.pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
          return (
            <path
              key={pl.dayNumber}
              d={d}
              fill="none"
              stroke={pl.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="2 8"
              opacity={dimmed ? 0.15 : 0.55}
              style={{ transition: "opacity 200ms" }}
            />
          );
        })}

        {/* Pins */}
        {allStops.map(s => {
          const isActive = activeStop && activeStop.id === s.id;
          const dimmed = hoveredDay && hoveredDay !== s.dayNumber;
          return (
            <g
              key={s.id}
              transform={`translate(${s.x}, ${s.y})`}
              style={{ cursor: "pointer", transition: "opacity 200ms" }}
              opacity={dimmed ? 0.3 : 1}
              onMouseEnter={() => setHoveredDay(s.dayNumber)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={() => onPinClick(s)}
            >
              {isActive && <circle r="22" fill={s.color} opacity="0.18" />}
              {isActive && <circle r="14" fill={s.color} opacity="0.28">
                <animate attributeName="r" values="14;22;14" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.05;0.4" dur="1.6s" repeatCount="indefinite" />
              </circle>}
              {/* Pin teardrop */}
              <g filter="url(#pinShadow)" transform="translate(0, -2)">
                <path
                  d="M 0 -18 C 7 -18, 11 -13, 11 -7 C 11 -1, 6 5, 0 12 C -6 5, -11 -1, -11 -7 C -11 -13, -7 -18, 0 -18 Z"
                  fill={s.color}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <circle cx="0" cy="-8" r="7" fill="#FFFFFF" />
                <text
                  x="0" y="-5"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="10"
                  fontWeight="700"
                  fill={s.color}
                >{s.indexInDay}</text>
              </g>
            </g>
          );
        })}
      </g>

      {/* Compass */}
      <g transform={`translate(${W - 50}, 50)`} opacity="0.7">
        <circle r="20" fill="#FAF7F2" stroke="#B59E78" strokeWidth="1" />
        <path d="M 0 -14 L 4 0 L 0 14 L -4 0 Z" fill="#1F1B16" opacity="0.7" />
        <path d="M 0 -14 L 4 0 L 0 0 Z" fill="#E8642A" />
        <text x="0" y="-22" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fill="#6B6258" fontWeight="700">N</text>
      </g>

      {/* Scale bar */}
      <g transform={`translate(20, ${H - 30})`} fontFamily="ui-monospace, monospace" fontSize="9" fill="#6B6258">
        <line x1="0" y1="0" x2="60" y2="0" stroke="#6B6258" strokeWidth="2" />
        <line x1="0" y1="-3" x2="0" y2="3" stroke="#6B6258" strokeWidth="2" />
        <line x1="60" y1="-3" x2="60" y2="3" stroke="#6B6258" strokeWidth="2" />
        <text x="30" y="14" textAnchor="middle">~10 km</text>
      </g>
    </svg>
  );
}

window.BaliMap = BaliMap;


/* ===== landing.jsx ===== */
// Main PetaTrip app — landing → loading → results → drawer
var { useState, useEffect, useRef, useMemo } = React;
const { ITINERARY } = window.PETA_DATA;

const VIBES = [
  { id: "foodie",     label: "Foodie",     emoji: "🍜" },
  { id: "spiritual",  label: "Spiritual",  emoji: "🛕" },
  { id: "beach",      label: "Beach",      emoji: "🌊" },
  { id: "nightlife",  label: "Nightlife",  emoji: "🌃" },
  { id: "wellness",   label: "Wellness",   emoji: "🧘" },
  { id: "family",     label: "Family",     emoji: "👨‍👩‍👧" },
];
const AREAS = ["Ubud", "Canggu", "Seminyak", "Uluwatu", "Sanur", "Surprise me"];

const LOADING_LINES = [
  "Talking to your local guide…",
  "Avoiding the tourist traps…",
  "Checking ceremony schedules…",
  "Optimizing your route around traffic…",
  "Sniffing out the right warungs…",
];

// ─────────────────────────────────────── LANDING ──

function Landing({ onSubmit }) {
  const [days, setDays] = useState(4);
  const [vibes, setVibes] = useState(["foodie", "spiritual"]);
  const [area, setArea] = useState("Ubud");

  const toggleVibe = (id) => setVibes(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#FAF7F2", position: "relative", overflow: "hidden" }}>
      {/* Decorative warm gradient washes */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background:
        "radial-gradient(ellipse 60% 40% at 80% 0%, rgba(232,100,42,0.08), transparent 60%)," +
        "radial-gradient(ellipse 50% 40% at 0% 100%, rgba(42,139,139,0.08), transparent 60%)" }} />
      {/* Tropical contour ornament */}
      <svg style={{ position: "absolute", right: -120, bottom: -120, width: 520, height: 520, opacity: 0.55, pointerEvents: "none" }} viewBox="0 0 520 520">
        <g fill="none" stroke="#D8C9AC" strokeWidth="1.2">
          {Array.from({ length: 14 }).map((_, i) => (
            <circle key={i} cx="260" cy="260" r={40 + i * 18} strokeDasharray={i % 2 ? "2 8" : "0"} opacity={0.6 - i * 0.03}/>
          ))}
        </g>
      </svg>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 32px", position: "relative", zIndex: 2 }}>
        <Logo />
        <div style={{ fontSize: 13, color: "#6B6258", fontFamily: "Inter, sans-serif" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "#4F8B3F", display: "inline-block" }} />
            Demo · Bali only
          </span>
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 24px 60px", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: 580, width: "100%", textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, background: "#FFF4E6", color: "#B5511E", fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif", marginBottom: 24, letterSpacing: "0.02em" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "#E8642A" }} />
            Built by people who actually live here
          </div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(36px, 6vw, 56px)", lineHeight: 1.05, color: "#1F1B16", margin: "0 0 18px", letterSpacing: "-0.02em" }}>
            Plan Bali like a local.
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 17, color: "#6B6258", lineHeight: 1.55, margin: 0, maxWidth: 480, marginInline: "auto" }}>
            ChatGPT sends you to Tanah Lot at sunset with everyone else. We don't.
          </p>
        </div>

        <div style={{ width: "100%", maxWidth: 460, background: "#FFFFFF", border: "1px solid #E8DFD3", borderRadius: 18, padding: 22, boxShadow: "0 1px 0 rgba(31,27,22,0.02), 0 12px 30px -16px rgba(31,27,22,0.18)" }}>
          {/* Days */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <label style={fieldLabelStyle}>How many days?</label>
              <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, color: "#1F1B16" }}>{days}</span>
            </div>
            <DayStepper value={days} onChange={setDays} />
          </div>

          {/* Vibe */}
          <div style={{ marginBottom: 18 }}>
            <label style={fieldLabelStyle}>What's your vibe?</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {VIBES.map(v => {
                const on = vibes.includes(v.id);
                return (
                  <button key={v.id} onClick={() => toggleVibe(v.id)} style={{
                    border: on ? "1px solid #E8642A" : "1px solid #E8DFD3",
                    background: on ? "#FFF4E6" : "#FFFFFF",
                    color: on ? "#B5511E" : "#1F1B16",
                    padding: "8px 13px", borderRadius: 999, fontSize: 13, fontWeight: 500,
                    fontFamily: "Inter, sans-serif", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 6,
                    transition: "all 140ms"
                  }}>
                    <span style={{ fontSize: 14 }}>{v.emoji}</span>{v.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Area */}
          <div style={{ marginBottom: 22 }}>
            <label style={fieldLabelStyle}>Base area</label>
            <div style={{ position: "relative", marginTop: 8 }}>
              <select value={area} onChange={e => setArea(e.target.value)}
                style={{
                  width: "100%", padding: "11px 14px", paddingRight: 36,
                  border: "1px solid #E8DFD3", borderRadius: 12, background: "#FFFFFF",
                  fontFamily: "Inter, sans-serif", fontSize: 14, color: "#1F1B16",
                  appearance: "none", cursor: "pointer"
                }}>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#6B6258", pointerEvents: "none" }}>▾</span>
            </div>
          </div>

          {/* Submit */}
          <button onClick={() => onSubmit({ days, vibes, area })} disabled={vibes.length === 0}
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              background: vibes.length === 0 ? "#E8DFD3" : "#E8642A",
              color: vibes.length === 0 ? "#6B6258" : "#FFFFFF",
              border: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15,
              cursor: vibes.length === 0 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 140ms",
              boxShadow: vibes.length === 0 ? "none" : "0 4px 14px -4px rgba(232,100,42,0.5)"
            }}
            onMouseEnter={e => { if (vibes.length) e.currentTarget.style.background = "#D4541F"; }}
            onMouseLeave={e => { if (vibes.length) e.currentTarget.style.background = "#E8642A"; }}>
            <PinIcon size={16} />Plan my trip
          </button>
        </div>

        <div style={{ marginTop: 24, fontSize: 12, color: "#6B6258", fontFamily: "Inter, sans-serif", letterSpacing: "0.02em" }}>
          Powered by Gemini + 50+ curated Bali spots
        </div>
      </main>
    </div>
  );
}

function DayStepper({ value, onChange }) {
  const min = 2, max = 7;
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => {
        const on = n === value;
        return (
          <button key={n} onClick={() => onChange(n)} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid",
            borderColor: on ? "#E8642A" : "#E8DFD3",
            background: on ? "#E8642A" : "#FFFFFF",
            color: on ? "#FFFFFF" : "#1F1B16",
            fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 14,
            cursor: "pointer", transition: "all 140ms"
          }}>{n}</button>
        );
      })}
    </div>
  );
}

const fieldLabelStyle = { fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, color: "#1F1B16" };

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#E8642A", display: "grid", placeItems: "center", boxShadow: "0 4px 10px -4px rgba(232,100,42,0.6)" }}>
        <PinIcon size={14} color="#FFFFFF" />
      </div>
      <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 19, color: "#1F1B16", letterSpacing: "-0.01em" }}>PetaTrip</span>
    </div>
  );
}

function PinIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// ─────────────────────────────────────── LOADING ──

function Loading() {
  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLineIdx(i => (i + 1) % LOADING_LINES.length), 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#FAF7F2", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        {/* Pin drop animation */}
        <div style={{ width: 120, height: 120, position: "relative", margin: "0 auto 28px" }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Concentric ground rings */}
            <ellipse cx="60" cy="100" rx="36" ry="6" fill="none" stroke="#E8DFD3" strokeWidth="1.5">
              <animate attributeName="rx" values="10;42;10" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="1.6s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="60" cy="100" rx="20" ry="3" fill="#E8DFD3" opacity="0.7" />
            {/* Dropping pin */}
            <g>
              <animateTransform attributeName="transform" type="translate"
                values="0 -40; 0 0; 0 -8; 0 0; 0 -40"
                keyTimes="0; 0.45; 0.6; 0.75; 1"
                dur="1.6s" repeatCount="indefinite" />
              <path d="M 60 30 C 70 30, 76 38, 76 47 C 76 56, 68 67, 60 80 C 52 67, 44 56, 44 47 C 44 38, 50 30, 60 30 Z"
                fill="#E8642A" stroke="#FFFFFF" strokeWidth="2.5" />
              <circle cx="60" cy="47" r="5.5" fill="#FFFFFF" />
            </g>
          </svg>
        </div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, color: "#1F1B16", marginBottom: 10 }}>
          Drafting your itinerary
        </div>
        <div key={lineIdx} style={{
          fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B6258",
          animation: "fadeUp 320ms ease both", minHeight: 22
        }}>
          {LOADING_LINES[lineIdx]}
        </div>
      </div>
    </div>
  );
}

window.Landing = Landing;
window.Loading = Loading;
window.Logo = Logo;
window.PinIcon = PinIcon;


/* ===== results.jsx ===== */
// Results screen — split layout: Bali map on left, itinerary on right
var { useState, useEffect, useRef, useMemo } = React;

function Results({ trip, onReset, tweaks, onOpenTweaks }) {
  const [activeStop, setActiveStop] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [mapSize, setMapSize] = useState({ w: 900, h: 720 });
  const [regenerating, setRegenerating] = useState(false);
  const mapWrapRef = useRef(null);

  useEffect(() => {
    if (!mapWrapRef.current) return;
    const ro = new ResizeObserver(entries => {
      const r = entries[0].contentRect;
      setMapSize({ w: Math.max(400, r.width), h: Math.max(400, r.height) });
    });
    ro.observe(mapWrapRef.current);
    return () => ro.disconnect();
  }, []);

  const toggleDay = (n) => setCollapsed(c => ({ ...c, [n]: !c[n] }));

  const handleRegenerate = () => {
    setRegenerating(true);
    setTimeout(() => setRegenerating(false), 1400);
  };

  const drawerSide = tweaks.drawerSide || "right";

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid #E8DFD3", background: "#FFFFFF", position: "sticky", top: 0, zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <button onClick={onReset} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <window.Logo />
          </button>
          <div style={{ height: 24, width: 1, background: "#E8DFD3" }} />
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6B6258" }}>
            <span style={{ color: "#1F1B16", fontWeight: 500 }}>{trip.days} days</span>
            <span style={{ margin: "0 8px" }}>·</span>
            <span>{trip.vibes.map(v => v[0].toUpperCase() + v.slice(1)).join(" + ")}</span>
            <span style={{ margin: "0 8px" }}>·</span>
            <span>Base: {trip.area}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={onOpenTweaks} style={ghostBtnStyle}>Tweaks</button>
          <button onClick={onReset} style={ghostBtnStyle}>Start over</button>
        </div>
      </header>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(380px, 1fr)", height: "calc(100vh - 56px)" }}>
        {/* MAP */}
        <div ref={mapWrapRef} style={{ position: "relative", borderRight: "1px solid #E8DFD3", overflow: "hidden", background: "#EFE7DA" }}>
          <window.BaliMap
            width={mapSize.w}
            height={mapSize.h}
            days={window.PETA_DATA.ITINERARY.days}
            activeStop={activeStop}
            onPinClick={setActiveStop}
            hoveredDay={hoveredDay}
            setHoveredDay={setHoveredDay}
            panOffset={{ x: 0, y: 0 }}
          />
          {/* Map overlay — day legend */}
          <div style={{ position: "absolute", top: 16, left: 16, background: "#FFFFFFEE", backdropFilter: "blur(6px)", border: "1px solid #E8DFD3", borderRadius: 12, padding: 10, fontFamily: "Inter, sans-serif", fontSize: 12, boxShadow: "0 8px 24px -12px rgba(31,27,22,0.2)" }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#1F1B16" }}>Day clusters</div>
            {window.PETA_DATA.ITINERARY.days.map(d => (
              <div key={d.dayNumber}
                onMouseEnter={() => setHoveredDay(d.dayNumber)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", borderRadius: 6, cursor: "default",
                  background: hoveredDay === d.dayNumber ? "#FFF4E6" : "transparent" }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: d.color, display: "inline-block" }} />
                <span style={{ color: "#1F1B16", fontWeight: 500 }}>Day {d.dayNumber}</span>
                <span style={{ color: "#6B6258" }}>· {d.area}</span>
              </div>
            ))}
          </div>
          {/* Hint pill */}
          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "#1F1B16", color: "#FAF7F2", padding: "8px 14px", borderRadius: 999, fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500, opacity: 0.85 }}>
            Tap a pin for the local tip →
          </div>
        </div>

        {/* ITINERARY PANEL */}
        <aside style={{ overflowY: "auto", background: "#FAF7F2", padding: "20px 22px 80px" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24, color: "#1F1B16", margin: 0, letterSpacing: "-0.01em" }}>
                {window.PETA_DATA.ITINERARY.tripTitle.replace("4 Days", `${trip.days} Days`)}
              </h2>
              <button onClick={handleRegenerate} disabled={regenerating} style={{
                ...ghostBtnStyle, fontSize: 12, padding: "6px 11px",
                opacity: regenerating ? 0.6 : 1
              }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", animation: regenerating ? "spin 0.8s linear infinite" : "none" }}>↻</span>
                  {regenerating ? "Rerolling…" : "Regenerate"}
                </span>
              </button>
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B6258", lineHeight: 1.6, margin: "8px 0 0" }}>
              {window.PETA_DATA.ITINERARY.summary}
            </p>
          </div>

          {window.PETA_DATA.ITINERARY.days.slice(0, trip.days).map(day => (
            <DayCard
              key={day.dayNumber}
              day={day}
              collapsed={collapsed[day.dayNumber]}
              onToggle={() => toggleDay(day.dayNumber)}
              onStopClick={setActiveStop}
              activeStop={activeStop}
              onHover={setHoveredDay}
              density={tweaks.density}
            />
          ))}
        </aside>
      </div>

      {/* DRAWER */}
      <Drawer stop={activeStop} onClose={() => setActiveStop(null)} side={drawerSide} />
    </div>
  );
}

function DayCard({ day, collapsed, onToggle, onStopClick, activeStop, onHover, density }) {
  const tight = density === "compact";
  return (
    <div onMouseEnter={() => onHover(day.dayNumber)} onMouseLeave={() => onHover(null)}
      style={{ background: "#FFFFFF", border: "1px solid #E8DFD3", borderRadius: 16, marginBottom: 14, overflow: "hidden" }}>
      <button onClick={onToggle} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12,
        padding: tight ? "12px 16px" : "16px 18px",
        background: "none", border: "none", cursor: "pointer", textAlign: "left", borderBottom: collapsed ? "none" : "1px solid #F0E8DA"
      }}>
        <span style={{ width: 12, height: 12, borderRadius: 999, background: day.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6258" }}>
            Day {day.dayNumber} · {day.area}
          </div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 600, color: "#1F1B16", marginTop: 2, letterSpacing: "-0.01em" }}>
            {day.title}
          </div>
        </div>
        <span style={{ color: "#6B6258", fontSize: 14, transform: collapsed ? "rotate(-90deg)" : "none", transition: "transform 160ms" }}>▾</span>
      </button>
      {!collapsed && (
        <div style={{ padding: tight ? "6px 18px 14px" : "8px 18px 18px" }}>
          {day.stops.map((s, i) => (
            <Stop
              key={s.id}
              stop={s}
              indexInDay={i + 1}
              isLast={i === day.stops.length - 1}
              dayColor={day.color}
              onClick={() => onStopClick({ ...s, dayNumber: day.dayNumber, indexInDay: i + 1, color: day.color, area: day.area })}
              isActive={activeStop && activeStop.id === s.id}
              tight={tight}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Stop({ stop, indexInDay, isLast, dayColor, onClick, isActive, tight }) {
  return (
    <div>
      <div onClick={onClick}
        style={{
          display: "flex", gap: 12, padding: tight ? "10px 4px" : "14px 4px",
          cursor: "pointer", borderRadius: 10,
          background: isActive ? "#FFF4E6" : "transparent",
          margin: isActive ? "0 -8px" : 0,
          paddingLeft: isActive ? 12 : 4, paddingRight: isActive ? 12 : 4,
          transition: "background 160ms"
        }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 999, background: dayColor,
            color: "#FFFFFF", display: "grid", placeItems: "center",
            fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13,
            boxShadow: `0 2px 6px -2px ${dayColor}80`
          }}>{indexInDay}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 600, color: "#1F1B16", letterSpacing: "-0.005em" }}>
            {stop.name}
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6B6258", marginTop: 2 }}>
            {stop.category} · {stop.duration} · {stop.bestTime}
          </div>
          {!tight && (
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#3A352D", marginTop: 6, lineHeight: 1.5 }}>
              {stop.description}
            </div>
          )}
          <div style={{
            background: "#FFF4E6", border: "1px solid #F5E4C8", borderRadius: 10,
            padding: "9px 11px", marginTop: 8,
            fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6B4420", lineHeight: 1.5,
            fontStyle: "italic"
          }}>
            <span style={{ fontStyle: "normal", fontWeight: 600, color: "#B5511E", marginRight: 4 }}>💡 Local tip</span>
            {stop.localTip}
          </div>
        </div>
      </div>
      {!isLast && stop.travelToNextMin && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 14, color: "#6B6258", fontFamily: "Inter, sans-serif", fontSize: 12, padding: "2px 0 2px 14px" }}>
          <div style={{ width: 1, height: 14, borderLeft: "2px dotted #D8C9AC" }} />
          <span style={{ background: "#FAF7F2", padding: "3px 8px", borderRadius: 999, border: "1px solid #E8DFD3" }}>
            🛵 {stop.travelToNextMin} min
          </span>
        </div>
      )}
    </div>
  );
}

function Drawer({ stop, onClose, side }) {
  const open = !!stop;
  const isLeft = side === "left";
  // Render last stop content even after close, for graceful fade-out
  const [last, setLast] = useState(stop);
  useEffect(() => { if (stop) setLast(stop); }, [stop]);
  const display = stop || last;

  return (
    <>
      {/* Scrim */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(31,27,22,0.35)",
        opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transition: "opacity 220ms", zIndex: 50
      }} />
      <div style={{
        position: "fixed", top: 0, [isLeft ? "left" : "right"]: 0, height: "100vh", width: "min(420px, 92vw)",
        background: "#FFFFFF",
        borderLeft: !isLeft ? "1px solid #E8DFD3" : "none",
        borderRight: isLeft ? "1px solid #E8DFD3" : "none",
        boxShadow: isLeft ? "8px 0 32px -8px rgba(31,27,22,0.18)" : "-8px 0 32px -8px rgba(31,27,22,0.18)",
        transform: open ? "translateX(0)" : `translateX(${isLeft ? "-105%" : "105%"})`,
        transition: "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)",
        zIndex: 60, display: "flex", flexDirection: "column", overflow: "hidden"
      }}>
        {display && <DrawerContent stop={display} onClose={onClose} />}
      </div>
    </>
  );
}

function DrawerContent({ stop, onClose }) {
  return (
    <>
      {/* Hero — colored placeholder swatch, no fake photos */}
      <div style={{
        height: 200, position: "relative", flexShrink: 0,
        background: `linear-gradient(135deg, ${stop.color}, ${shade(stop.color, -25)})`,
      }}>
        {/* Diagonal stripe overlay for placeholder vibe */}
        <svg style={{ position: "absolute", inset: 0, opacity: 0.18 }} width="100%" height="100%">
          <defs>
            <pattern id={`stripe-${stop.id}`} patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(35)">
              <line x1="0" y1="0" x2="0" y2="20" stroke="#FFFFFF" strokeWidth="8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#stripe-${stop.id})`} />
        </svg>
        <div style={{ position: "absolute", inset: 0, padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#FFFFFF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{
              padding: "5px 10px", background: "#FFFFFF", color: stop.color,
              borderRadius: 999, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em"
            }}>DAY {stop.dayNumber} · STOP {stop.indexInDay}</div>
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: 999, background: "rgba(255,255,255,0.25)",
              backdropFilter: "blur(6px)", border: "none", color: "#FFFFFF", fontSize: 16, cursor: "pointer"
            }}>×</button>
          </div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, opacity: 0.85, letterSpacing: "0.08em" }}>
            ⟶ photo placeholder · {stop.name.toLowerCase().replace(/[^a-z]/g, "-")}.jpg
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 32px" }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6258", marginBottom: 6 }}>
          {stop.area}
        </div>
        <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 26, color: "#1F1B16", margin: "0 0 12px", letterSpacing: "-0.01em", lineHeight: 1.15 }}>
          {stop.name}
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
          <Tag>{stop.category}</Tag>
          <Tag>{stop.duration}</Tag>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "#FAF7F2", border: "1px solid #E8DFD3", borderRadius: 12, marginBottom: 18 }}>
          <span style={{ fontSize: 16 }}>🕐</span>
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#6B6258", fontWeight: 500 }}>Best time</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#1F1B16", fontWeight: 500 }}>{stop.bestTime}</div>
          </div>
        </div>

        {/* Local tip — the money element */}
        <div style={{
          background: "#FFF4E6", border: "1px solid #F5E4C8", borderRadius: 14, padding: 16, marginBottom: 18,
          position: "relative"
        }}>
          <div style={{ position: "absolute", top: -10, left: 14, background: "#E8642A", color: "#FFFFFF", padding: "3px 10px", borderRadius: 999, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>
            💡 LOCAL TIP
          </div>
          <p style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: "#6B4420", margin: "8px 0 0", lineHeight: 1.5, fontStyle: "italic", fontWeight: 500 }}>
            "{stop.localTip}"
          </p>
        </div>

        <div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6258", marginBottom: 8 }}>
            Why this spot
          </div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#3A352D", lineHeight: 1.6, margin: 0 }}>
            {stop.why || stop.description}
          </p>
        </div>
      </div>
    </>
  );
}

function Tag({ children }) {
  return (
    <span style={{
      padding: "4px 10px", borderRadius: 999, background: "#FAF7F2", border: "1px solid #E8DFD3",
      fontFamily: "Inter, sans-serif", fontSize: 12, color: "#3A352D", fontWeight: 500
    }}>{children}</span>
  );
}

const ghostBtnStyle = {
  background: "#FFFFFF", border: "1px solid #E8DFD3", borderRadius: 999,
  padding: "7px 14px", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500,
  color: "#1F1B16", cursor: "pointer"
};

function shade(hex, amt) {
  const n = hex.replace("#", "");
  const num = parseInt(n, 16);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0xff) + amt;
  let b = (num & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

window.Results = Results;


/* ===== tweaks.jsx ===== */
// Tweaks panel for PetaTrip
var { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mapStyle": "paper",
  "showAllAreaLabels": true,
  "density": "comfortable",
  "skipLanding": false,
  "drawerSide": "right"
}/*EDITMODE-END*/;

function useTweaks() {
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === "__tweaks_update") {
        setTweaks(t => ({ ...t, ...e.data.edits }));
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  const setTweak = (k, v) => {
    setTweaks(t => {
      const next = { ...t, [k]: v };
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { [k]: v } }, "*");
      return next;
    });
  };
  return [tweaks, setTweak];
}

function TweaksPanel({ tweaks, setTweak, visible, onClose }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", right: 24, bottom: 24, zIndex: 1000,
      width: 280, background: "#FFFFFF", border: "1px solid #E8DFD3",
      borderRadius: 14, boxShadow: "0 12px 40px rgba(31,27,22,0.16)",
      fontFamily: "Inter, sans-serif", color: "#1F1B16", overflow: "hidden"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #E8DFD3" }}>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Tweaks</div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6258", fontSize: 18 }}>×</button>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, fontSize: 13 }}>
        <Field label="Map style">
          <Seg value={tweaks.mapStyle} onChange={v => setTweak("mapStyle", v)} options={[["paper","Paper"],["mono","Mono"],["sunset","Sunset"]]} />
        </Field>
        <Field label="Density">
          <Seg value={tweaks.density} onChange={v => setTweak("density", v)} options={[["compact","Compact"],["comfortable","Comfy"]]} />
        </Field>
        <Field label="Drawer side">
          <Seg value={tweaks.drawerSide} onChange={v => setTweak("drawerSide", v)} options={[["right","Right"],["left","Left"]]} />
        </Field>
        <Field label="Show all area labels">
          <Toggle value={tweaks.showAllAreaLabels} onChange={v => setTweak("showAllAreaLabels", v)} />
        </Field>
        <Field label="Skip landing → demo straight to results">
          <Toggle value={tweaks.skipLanding} onChange={v => setTweak("skipLanding", v)} />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, color: "#6B6258", fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
}
function Seg({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", background: "#F2EAD8", borderRadius: 999, padding: 3 }}>
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)}
          style={{
            flex: 1, padding: "6px 10px", borderRadius: 999, border: "none",
            background: value === v ? "#FFFFFF" : "transparent",
            color: "#1F1B16", fontWeight: value === v ? 600 : 500, fontSize: 12,
            cursor: "pointer", boxShadow: value === v ? "0 1px 2px rgba(0,0,0,0.08)" : "none"
          }}>{l}</button>
      ))}
    </div>
  );
}
function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 40, height: 22, borderRadius: 999,
      background: value ? "#E8642A" : "#E8DFD3", border: "none", position: "relative", cursor: "pointer"
    }}>
      <span style={{
        position: "absolute", top: 2, left: value ? 20 : 2,
        width: 18, height: 18, borderRadius: 999, background: "#FFFFFF",
        transition: "left 160ms"
      }}/>
    </button>
  );
}

window.useTweaks = useTweaks;
window.TweaksPanel = TweaksPanel;


/* ===== app.jsx ===== */
// Root app — state machine + tweaks panel wiring
var { useState, useEffect } = React;

function App() {
  const [stage, setStage] = useState("landing"); // landing | loading | results
  const [trip, setTrip] = useState(null);
  const [tweaks, setTweak] = window.useTweaks();
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // Toolbar protocol
  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === "__activate_edit_mode") setTweaksOpen(true);
      if (e.data?.type === "__deactivate_edit_mode") setTweaksOpen(false);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Skip landing tweak
  useEffect(() => {
    if (tweaks.skipLanding && stage === "landing") {
      setTrip({ days: 4, vibes: ["foodie", "spiritual"], area: "Ubud" });
      setStage("results");
    }
  }, [tweaks.skipLanding]);

  const handleSubmit = (input) => {
    setTrip(input);
    setStage("loading");
    setTimeout(() => setStage("results"), 4800);
  };

  const handleReset = () => {
    setStage("landing");
    setTrip(null);
  };

  const closeTweaks = () => {
    setTweaksOpen(false);
    window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*");
  };

  return (
    <>
      {stage === "landing" && (
        <div data-screen-label="01 Landing">
          <window.Landing onSubmit={handleSubmit} />
        </div>
      )}
      {stage === "loading" && (
        <div data-screen-label="02 Loading">
          <window.Loading />
        </div>
      )}
      {stage === "results" && trip && (
        <div data-screen-label="03 Results">
          <window.Results trip={trip} onReset={handleReset} tweaks={tweaks} onOpenTweaks={() => setTweaksOpen(true)} />
        </div>
      )}
      <window.TweaksPanel tweaks={tweaks} setTweak={setTweak} visible={tweaksOpen} onClose={closeTweaks} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

