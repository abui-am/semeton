// Stylized Bali map — abstract topographic background.
// We don't draw a literal coastline (system prompt says no complex SVGs).
// Instead: a soft warm canvas with subtle "land" gradient, contour-style rings,
// area labels positioned by real lat/lng, and a coastline implied by a single
// rounded organic shape. Pins position via projectLatLng from data.js.

var _projectLatLng = window.PETA_DATA.projectLatLng;
var projectLatLng = _projectLatLng;

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
