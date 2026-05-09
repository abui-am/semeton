// PetaTrip Mobile — dark iPhone concierge prototype
var { useState, useEffect, useRef } = React;

// ─── Design tokens ─────────────────────────────────
var T = {
  bg: "#0A0D0C",
  surface: "#13171A",
  surfaceHi: "#1B2024",
  border: "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,255,255,0.14)",
  text: "#F2F0EC",
  textMid: "rgba(242,240,236,0.72)",
  textLow: "rgba(242,240,236,0.48)",
  accent: "#FF8A4C",
  accentDim: "rgba(255,138,76,0.18)",
  emerald: "#3DDC97",
  teal: "#5EC9D8",
  sand: "#E8C28A",
  rose: "#E97777",
};

var SAFE_TOP = 60;       // status bar
var SAFE_BOTTOM = 100;   // bottom nav + home indicator

// ─── Mock data ─────────────────────────────────────
var TODAY_PLAN = [
  { id: "s1", time: "07:30", end: "09:00", title: "Sunrise at Campuhan Ridge", area: "Ubud", category: "Walk", color: T.emerald, weather: "27°", tip: "Park at IBAH, walk in from the south. Skips the entrance crowd.", duration: "1h 30m", travelMin: 14 },
  { id: "s2", time: "09:30", end: "10:30", title: "Sayuri Healing Food", area: "Ubud", category: "Breakfast", color: T.sand, tip: "Order the dragon bowl. Skip the jamu shot — overpriced.", duration: "1h", travelMin: 22 },
  { id: "s3", time: "11:30", end: "13:30", title: "Tirta Empul", area: "Manukaya", category: "Temple · Ritual", color: T.teal, tip: "Bring your own sarong. The rented ones are damp.", duration: "2h", travelMin: 38 },
  { id: "s4", time: "15:00", end: "17:00", title: "Tukad Cepung Waterfall", area: "Bangli", category: "Nature", color: T.accent, tip: "Light beam best at midday. After 3pm it's just water (still gorgeous, half the people).", duration: "2h", travelMin: 0 },
];

// ─── Icons (inline SVG) ────────────────────────────
function Icon({ name, size = 22, stroke = "currentColor", fill = "none", w = 1.8 }) {
  var p = {
    home:    "M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H10v7H6a2 2 0 0 1-2-2v-9z",
    chat:    "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4 3v-3H6a2 2 0 0 1-2-2V6z",
    map:     "M9 4l-5 2v14l5-2 6 2 5-2V4l-5 2-6-2zm0 0v14m6-12v14",
    book:    "M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4 4V4z",
    pin:     "M12 22s8-7 8-13a8 8 0 0 0-16 0c0 6 8 13 8 13z M12 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z",
    arrow:   "M5 12h14m-6-6 6 6-6 6",
    plus:    "M12 5v14M5 12h14",
    sparkle: "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z",
    mic:     "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zm-7 9a7 7 0 0 0 14 0M12 19v3",
    sun:     "M12 4v2m0 12v2M4 12H2m20 0h-2M5.6 5.6 4.2 4.2m15.6 15.6-1.4-1.4M5.6 18.4 4.2 19.8m15.6-15.6-1.4 1.4 M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z",
    cloud:   "M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 11a4 4 0 0 1-1 7H7z",
    rain:    "M7 16a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 9a4 4 0 0 1-1 7M9 19l-1 2m4-2-1 2m4-2-1 2",
    car:     "M5 13l1.5-5a2 2 0 0 1 2-1.5h7a2 2 0 0 1 2 1.5L19 13m-14 0v5a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-5m-14 0h14M8 16h.01M16 16h.01",
    bike:    "M5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM7 15l3-7h4l2 4m-3-4 2-3h2",
    clock:   "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-15v6l4 2",
    chevR:   "M9 6l6 6-6 6",
    chevD:   "M6 9l6 6 6-6",
    close:   "M6 6l12 12M18 6 6 18",
    check:   "M5 12l5 5L20 7",
    star:    "M12 3l2.6 6.3 6.4.5-4.9 4.2 1.5 6.5L12 17l-5.6 3.5 1.5-6.5L3 9.8l6.4-.5L12 3z",
    filter:  "M4 6h16M7 12h10m-7 6h4",
    bookmark:"M6 4h12v18l-6-4-6 4V4z",
    layer:   "M12 3 3 8l9 5 9-5-9-5zm0 9L3 17l9 5 9-5-9-5z",
    zap:     "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
    walk:    "M13 4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM9 22l2-7-3-3 1-5 4 1 4 4M9 12l-3 1",
    coffee:  "M3 8h14v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zm14 0h2a3 3 0 0 1 0 6h-2M5 1v3m4-3v3m4-3v3",
    leaf:    "M5 19c0-9 5-15 14-15 0 9-5 15-14 15zM5 19l9-9",
    wifi:    "M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01",
    chev_l:  "M15 6l-6 6 6 6",
  }[name] || "M0 0";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d={p} />
    </svg>
  );
}

// ─── Reusable bits ─────────────────────────────────
function Pill({ children, color = T.textMid, bg = "rgba(255,255,255,0.06)", border = "rgba(255,255,255,0.08)", style = {}, onClick }) {
  return (
    <span onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 11px",
      borderRadius: 999, background: bg, border: `1px solid ${border}`, color,
      fontSize: 12.5, fontWeight: 500, letterSpacing: "0.01em", cursor: onClick ? "pointer" : "default",
      whiteSpace: "nowrap", ...style
    }}>{children}</span>
  );
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18,
      padding: 16, ...style
    }}>{children}</div>
  );
}

// ─── Onboarding ────────────────────────────────────
var ONBOARD_STEPS = [
  {
    title: "Plan Bali like a local.",
    sub: "I skip the spots ChatGPT keeps sending you to. I know where the locals actually go — and when.",
    cta: "Show me",
    art: "hero",
  },
  {
    title: "How long are you here?",
    sub: "Pick the trip length. I'll cluster days so you're not crossing the island twice for one warung.",
    cta: "Continue",
    art: "days",
  },
  {
    title: "What's your vibe?",
    sub: "Tap a few. I'll lean your plan in that direction without padding it with tourist filler.",
    cta: "Continue",
    art: "vibes",
  },
  {
    title: "Where's home base?",
    sub: "I'll route around traffic from here. You can always change it.",
    cta: "Plan my trip",
    art: "base",
  },
];
var VIBES = [
  { id: "foodie", label: "Foodie", emoji: "🍜" },
  { id: "spiritual", label: "Spiritual", emoji: "🛕" },
  { id: "beach", label: "Beach", emoji: "🌊" },
  { id: "wellness", label: "Wellness", emoji: "🧘" },
  { id: "nightlife", label: "Nightlife", emoji: "🌃" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧" },
];
var AREAS = ["Ubud", "Canggu", "Seminyak", "Uluwatu", "Sanur", "Sidemen"];

function Onboarding({ onDone }) {
  var [step, setStep] = useState(0);
  var [days, setDays] = useState(4);
  var [vibes, setVibes] = useState(["foodie", "spiritual"]);
  var [area, setArea] = useState("Ubud");
  var s = ONBOARD_STEPS[step];

  var next = () => step === ONBOARD_STEPS.length - 1 ? onDone({ days, vibes, area }) : setStep(step + 1);

  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      paddingTop: SAFE_TOP, paddingBottom: 32,
      background:
        "radial-gradient(ellipse 70% 50% at 80% 0%, rgba(255,138,76,0.18), transparent 60%)," +
        "radial-gradient(ellipse 60% 40% at 0% 100%, rgba(94,201,216,0.10), transparent 60%)," +
        T.bg,
      color: T.text,
    }}>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "12px 0 4px" }}>
        {ONBOARD_STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 22 : 6, height: 6, borderRadius: 999,
            background: i <= step ? T.accent : "rgba(255,255,255,0.15)",
            transition: "all 240ms"
          }} />
        ))}
      </div>

      {/* Logo top-left */}
      <div style={{ position: "absolute", top: SAFE_TOP - 6, left: 22, display: "flex", alignItems: "center", gap: 8 }}>
        <Logo size={22} />
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>peta</span>
      </div>
      {step > 0 && (
        <button onClick={() => setStep(step - 1)} style={{
          position: "absolute", top: SAFE_TOP - 4, right: 18, background: "none", border: "none",
          color: T.textMid, fontSize: 14, cursor: "pointer", padding: 4, fontWeight: 500
        }}>Skip</button>
      )}

      {/* Art area */}
      <div style={{ flex: "0 0 280px", display: "grid", placeItems: "center", padding: "20px 24px 12px" }}>
        <OnboardArt kind={s.art} days={days} setDays={setDays} vibes={vibes} setVibes={setVibes} area={area} setArea={setArea} />
      </div>

      {/* Copy */}
      <div style={{ flex: 1, padding: "16px 28px 0", display: "flex", flexDirection: "column" }}>
        <h1 style={{
          fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 32, lineHeight: 1.1,
          letterSpacing: "-0.02em", margin: 0, color: T.text
        }}>{s.title}</h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: T.textMid, margin: "14px 0 0", maxWidth: 320 }}>
          {s.sub}
        </p>
        <div style={{ flex: 1 }} />
        <button onClick={next} disabled={step === 2 && vibes.length === 0} style={{
          width: "100%", padding: "16px", borderRadius: 16, border: "none",
          background: step === 2 && vibes.length === 0 ? "rgba(255,255,255,0.08)" : T.accent,
          color: step === 2 && vibes.length === 0 ? T.textLow : "#1A0E07",
          fontSize: 16, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "background 160ms",
          boxShadow: "0 8px 24px -10px rgba(255,138,76,0.55)"
        }}>
          {s.cta}
          <Icon name="arrow" size={18} stroke={step === 2 && vibes.length === 0 ? T.textLow : "#1A0E07"} w={2.4} />
        </button>
      </div>
    </div>
  );
}

function OnboardArt({ kind, days, setDays, vibes, setVibes, area, setArea }) {
  if (kind === "hero") {
    return (
      <div style={{
        position: "relative", width: 240, height: 240, borderRadius: 36, overflow: "hidden",
        background: `linear-gradient(155deg, ${T.accent} 0%, #B33B12 70%)`,
        boxShadow: "0 28px 60px -20px rgba(255,138,76,0.5)"
      }}>
        {/* Sun */}
        <div style={{ position: "absolute", top: 70, left: "50%", transform: "translateX(-50%)", width: 120, height: 120, borderRadius: 999, background: "#FFD9B8", opacity: 0.85, filter: "blur(2px)" }} />
        {/* Wave silhouette */}
        <svg viewBox="0 0 240 240" style={{ position: "absolute", inset: 0 }}>
          <path d="M0 170 Q60 150 120 165 T240 170 V240 H0 Z" fill="#1A0E07" opacity="0.6" />
          <path d="M0 195 Q60 180 120 192 T240 195 V240 H0 Z" fill="#0A0D0C" />
          <path d="M0 175 Q60 158 120 168 T240 175" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
        </svg>
        {/* Pin */}
        <div style={{ position: "absolute", top: 92, left: 154, color: "#FFFFFF", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }}>
          <Icon name="pin" size={26} fill="#FFFFFF" stroke="#FFFFFF" w={0} />
        </div>
        <div style={{ position: "absolute", bottom: 22, left: 22, fontFamily: "ui-monospace, monospace", fontSize: 10, color: "#FFD9B8", letterSpacing: "0.18em", opacity: 0.85 }}>
          08°39′S · 115°13′E
        </div>
      </div>
    );
  }
  if (kind === "days") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 280 }}>
        {[2,3,4,5,6,7].map(n => {
          var on = n === days;
          return (
            <button key={n} onClick={() => setDays(n)} style={{
              width: 70, height: 70, borderRadius: 18,
              border: `1px solid ${on ? T.accent : T.border}`,
              background: on ? T.accentDim : T.surface,
              color: T.text, cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 2,
              transition: "all 140ms"
            }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: on ? T.accent : T.text }}>{n}</span>
              <span style={{ fontSize: 10, color: T.textLow, letterSpacing: "0.08em" }}>DAYS</span>
            </button>
          );
        })}
      </div>
    );
  }
  if (kind === "vibes") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 300 }}>
        {VIBES.map(v => {
          var on = vibes.includes(v.id);
          return (
            <button key={v.id} onClick={() => setVibes(vs => on ? vs.filter(x => x !== v.id) : [...vs, v.id])} style={{
              padding: "12px 16px", borderRadius: 14,
              border: `1px solid ${on ? T.accent : T.border}`,
              background: on ? T.accentDim : T.surface,
              color: on ? T.accent : T.text, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 14, fontWeight: 500, transition: "all 140ms"
            }}>
              <span style={{ fontSize: 16 }}>{v.emoji}</span>{v.label}
            </button>
          );
        })}
      </div>
    );
  }
  if (kind === "base") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 300 }}>
        {AREAS.map(a => {
          var on = a === area;
          return (
            <button key={a} onClick={() => setArea(a)} style={{
              padding: "12px 18px", borderRadius: 14,
              border: `1px solid ${on ? T.accent : T.border}`,
              background: on ? T.accentDim : T.surface,
              color: on ? T.accent : T.text, cursor: "pointer",
              fontSize: 14, fontWeight: 500
            }}>{a}</button>
          );
        })}
      </div>
    );
  }
  return null;
}

function Logo({ size = 24, color = T.accent }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: color, display: "grid", placeItems: "center", boxShadow: `0 4px 12px -4px ${color}88` }}>
      <Icon name="pin" size={size * 0.6} stroke="#1A0E07" fill="#1A0E07" w={0} />
    </div>
  );
}

window.Onboarding = Onboarding;
window.Icon = Icon;
window.Pill = Pill;
window.Card = Card;
window.Logo = Logo;
window.PETA_T = T;
window.PETA_TODAY = TODAY_PLAN;
window.PETA_SAFE = { top: SAFE_TOP, bottom: SAFE_BOTTOM };
