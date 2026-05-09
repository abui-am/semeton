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
