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
