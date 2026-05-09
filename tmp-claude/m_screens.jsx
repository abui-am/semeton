// Today, Chat, Map screens + bottom nav shell
var { useState, useEffect, useRef } = React;
var T = window.PETA_T;
var SAFE = window.PETA_SAFE;
var TODAY = window.PETA_TODAY;
var Icon = window.Icon, Pill = window.Pill, Card = window.Card, Logo = window.Logo;

// ─── TODAY (itinerary-first home) ─────────────────────
var MOODS = [
  { id: "calm",       label: "Calm",        emoji: "🌿", color: "#3DDC97", line: "Slow morning. I'll keep things gentle — rice fields, a long breakfast, and a spa hold.", tip: "Less moving, more being." },
  { id: "curious",    label: "Curious",     emoji: "✨", color: "#FF8A4C", line: "Good. I'll mix in a temple ritual and a market most tourists never find.", tip: "I'll add 1–2 hidden stops." },
  { id: "adventurous",label: "Adventurous", emoji: "🔥", color: "#E97777", line: "Locked in. Swapping the café for a sunrise volcano hike and a cliff jump near Nusa.", tip: "Expect sweat. Bring water." },
  { id: "social",     label: "Social",      emoji: "🥥", color: "#5EC9D8", line: "Beach-club energy. I'll route you through La Brisa, then a bonfire dinner with the Canggu crowd.", tip: "Dinner runs late." },
  { id: "recharge",   label: "Recharge",    emoji: "🛌", color: "#E8C28A", line: "Day off. I'll cancel the temple, hold a sound bath at 3, and order in from Locavore.", tip: "Nothing booked before 11." },
];

function MoodMeter({ moodId, setMoodId }) {
  var mood = MOODS.find(m => m.id === moodId) || MOODS[1];
  return (
    <div style={{ padding: "0 18px 14px" }}>
      <div style={{
        background: `linear-gradient(135deg, ${mood.color}1A, ${mood.color}05 60%, transparent), ${T.surface}`,
        border: `1px solid ${mood.color}33`, borderRadius: 22, padding: "14px 14px 12px",
        transition: "all 280ms"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: T.textLow, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Mood</span>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: mood.color, boxShadow: `0 0 8px ${mood.color}` }} />
            <span style={{ fontSize: 12.5, color: mood.color, fontWeight: 600 }}>{mood.label}</span>
          </div>
          <span style={{ fontSize: 11, color: T.textLow, fontStyle: "italic" }}>{mood.tip}</span>
        </div>
        {/* Mood bar */}
        <div style={{
          position: "relative", display: "flex", padding: 4, borderRadius: 16,
          background: "rgba(0,0,0,0.3)", border: `1px solid ${T.border}`
        }}>
          {MOODS.map(m => {
            var on = m.id === moodId;
            return (
              <button key={m.id} onClick={() => setMoodId(m.id)} style={{
                flex: 1, padding: "10px 0", border: "none", borderRadius: 12, cursor: "pointer",
                background: on ? `${m.color}26` : "transparent",
                boxShadow: on ? `inset 0 0 0 1px ${m.color}55` : "none",
                color: on ? m.color : T.textMid,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                transition: "all 200ms"
              }}>
                <span style={{ fontSize: 18, lineHeight: 1, filter: on ? "none" : "grayscale(0.45) opacity(0.75)" }}>{m.emoji}</span>
                <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.04em" }}>{m.label}</span>
              </button>
            );
          })}
        </div>
        {/* AI line */}
        <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 12, paddingTop: 11, borderTop: `1px solid ${T.border}` }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: `${mood.color}26`, display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}>
            <Icon name="sparkle" size={11} stroke={mood.color} w={2.2}/>
          </div>
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.45, fontStyle: "italic" }}>"{mood.line}"</div>
        </div>
      </div>
    </div>
  );
}

window.MOODS = MOODS;

function TodayScreen({ trip, onOpenStop, onAskChat, mood, setMood }) {
  var [collapsedTip, setCollapsedTip] = useState({});
  var moodObj = MOODS.find(m => m.id === mood) || MOODS[1];
  return (
    <div style={{ paddingTop: SAFE.top, paddingBottom: SAFE.bottom + 12, background: T.bg, minHeight: "100%" }}>
      {/* Greeting */}
      <div style={{ padding: "14px 22px 10px" }}>
        <div style={{ fontSize: 12, color: T.textLow, letterSpacing: "0.1em", textTransform: "uppercase" }}>Saturday · Day 2 of {trip.days}</div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", margin: "6px 0 0", color: T.text, lineHeight: 1.1 }}>
          Selamat pagi.<br/><span style={{ color: T.textMid }}>Feeling <span style={{ color: moodObj.color }}>{moodObj.label.toLowerCase()}</span> today?</span>
        </h1>
      </div>

      {/* Mood meter */}
      <MoodMeter moodId={mood} setMoodId={setMood} />

      {/* Context strip */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "6px 22px 14px", scrollbarWidth: "none" }}>
        <Pill bg={T.surface} border={T.border} color={T.text} style={{ padding: "8px 12px" }}>
          <Icon name="sun" size={14} stroke={T.sand} w={2}/> 28° clear
        </Pill>
        <Pill bg={T.surface} border={T.border} color={T.text} style={{ padding: "8px 12px" }}>
          <Icon name="rain" size={14} stroke={T.teal} w={2}/> rain ~16:00
        </Pill>
        <Pill bg={T.surface} border={T.border} color={T.text} style={{ padding: "8px 12px" }}>
          <Icon name="car" size={14} stroke={T.emerald} w={2}/> light traffic
        </Pill>
        <Pill bg={T.surface} border={T.border} color={T.text} style={{ padding: "8px 12px" }}>
          <Icon name="leaf" size={14} stroke={T.emerald} w={2}/> ceremony in Tampaksiring
        </Pill>
      </div>

      {/* AI nudge */}
      <div style={{ padding: "0 22px 16px" }}>
        <Card style={{ padding: 14, background: "linear-gradient(135deg, rgba(255,138,76,0.12), rgba(255,138,76,0.04))", borderColor: "rgba(255,138,76,0.25)" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: T.accentDim, display: "grid", placeItems: "center", flexShrink: 0, border: `1px solid rgba(255,138,76,0.3)` }}>
              <Icon name="sparkle" size={16} stroke={T.accent} w={2}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.5, fontWeight: 500 }}>
                Rain's coming around 4pm. Want me to flip Tukad Cepung with Wapa Spa? You'd stay dry.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={accentBtn}>Swap them</button>
                <button style={ghostBtn}>Keep as is</button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's plan */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 22px 10px" }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, margin: 0, color: T.text, letterSpacing: "-0.01em" }}>Today's plan</h2>
        <button style={{ background: "none", border: "none", color: T.textMid, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          Edit <Icon name="chevR" size={14} stroke={T.textMid} w={2}/>
        </button>
      </div>

      <div style={{ padding: "0 22px" }}>
        {TODAY.map((stop, i) => (
          <Stop key={stop.id} stop={stop} i={i} isLast={i === TODAY.length - 1} onClick={() => onOpenStop(stop)} tipOpen={collapsedTip[stop.id]} setTipOpen={(v) => setCollapsedTip(c => ({...c, [stop.id]: v}))} />
        ))}
      </div>

      {/* Ask anything */}
      <div style={{ padding: "20px 22px 0" }}>
        <button onClick={onAskChat} style={{
          width: "100%", padding: "14px 16px", borderRadius: 16,
          background: T.surface, border: `1px solid ${T.border}`, color: T.textMid,
          display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontSize: 14
        }}>
          <Icon name="sparkle" size={18} stroke={T.accent} w={2}/>
          <span style={{ flex: 1, textAlign: "left" }}>Ask: "Move dinner earlier"…</span>
          <Icon name="mic" size={18} stroke={T.textMid} w={2}/>
        </button>
      </div>
    </div>
  );
}

function Stop({ stop, i, isLast, onClick, tipOpen, setTipOpen }) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      {/* Time rail */}
      <div style={{ width: 46, flexShrink: 0, paddingTop: 14, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: T.textMid, fontWeight: 600 }}>{stop.time}</div>
        <div style={{ width: 12, height: 12, borderRadius: 999, background: stop.color, marginTop: 6, boxShadow: `0 0 0 4px ${stop.color}22` }} />
        {!isLast && <div style={{ width: 1.5, flex: 1, background: "rgba(255,255,255,0.08)", marginTop: 6, marginBottom: 6 }} />}
      </div>
      {/* Card */}
      <div style={{ flex: 1, paddingBottom: 14 }}>
        <Card onClick={onClick} style={{ padding: 14, cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, color: T.textLow, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
                {stop.area} · {stop.category}
              </div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: T.text, marginTop: 2, letterSpacing: "-0.005em", lineHeight: 1.25 }}>
                {stop.title}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8, fontSize: 12, color: T.textMid }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Icon name="clock" size={12} stroke={T.textMid} w={2}/> {stop.duration}
                </span>
                {stop.weather && <span>· {stop.weather}</span>}
              </div>
            </div>
            <Icon name="chevR" size={16} stroke={T.textLow} w={2}/>
          </div>
          {/* Local tip toggle */}
          <button onClick={(e) => { e.stopPropagation(); setTipOpen(!tipOpen); }} style={{
            marginTop: 12, padding: "9px 12px", borderRadius: 11,
            background: tipOpen ? T.accentDim : "rgba(255,255,255,0.04)",
            border: `1px solid ${tipOpen ? "rgba(255,138,76,0.3)" : T.border}`,
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            width: "100%", textAlign: "left"
          }}>
            <Icon name="sparkle" size={14} stroke={T.accent} w={2}/>
            <span style={{ fontSize: 12, color: T.accent, fontWeight: 600, letterSpacing: "0.04em" }}>LOCAL TIP</span>
            <span style={{ flex: 1, fontSize: 13, color: T.textMid, fontStyle: "italic", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: tipOpen ? "normal" : "nowrap", lineHeight: 1.45 }}>
              {tipOpen ? `"${stop.tip}"` : stop.tip}
            </span>
          </button>
        </Card>
        {!isLast && stop.travelMin > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 4px 0", color: T.textLow, fontSize: 11.5 }}>
            <Icon name="bike" size={13} stroke={T.textLow} w={2}/>
            {stop.travelMin} min · scooter
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CHAT ─────────────────────────────────────────────
var SUGGESTIONS_INITIAL = [
  "Move dinner earlier — flight tomorrow",
  "Find a café with good Wi-Fi nearby",
  "It's raining. Replan today indoors",
  "What can I do in 4 hours before my flight?",
];

function ChatScreen({ onOpenStop }) {
  var [messages, setMessages] = useState([
    { role: "ai", kind: "text", text: "Hey. I have your day in Ubud lined up. Want to tweak anything, or should I leave it alone?" },
  ]);
  var [input, setInput] = useState("");
  var [typing, setTyping] = useState(false);
  var scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  var send = (text) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: "user", kind: "text", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, aiReply(text)]);
    }, 1100);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: T.bg, position: "relative" }}>
      {/* Header */}
      <div style={{ paddingTop: SAFE.top - 8, paddingBottom: 12, paddingLeft: 22, paddingRight: 22, borderBottom: `1px solid ${T.border}`, background: "rgba(10,13,12,0.85)", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: T.accentDim, border: `1px solid rgba(255,138,76,0.3)`, display: "grid", placeItems: "center" }}>
            <Icon name="sparkle" size={16} stroke={T.accent} w={2.2}/>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: "'Fraunces', serif" }}>peta</div>
            <div style={{ fontSize: 11.5, color: T.emerald, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: T.emerald }} /> online · in Bali now
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px 12px" }}>
        {messages.map((m, i) => <Message key={i} m={m} onOpenStop={onOpenStop} />)}
        {typing && <Typing />}
        {messages.length === 1 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 11, color: T.textLow, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, paddingLeft: 4 }}>Try asking</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SUGGESTIONS_INITIAL.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  padding: "12px 14px", borderRadius: 14, textAlign: "left",
                  background: T.surface, border: `1px solid ${T.border}`, color: T.text,
                  fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 10
                }}>
                  <Icon name="sparkle" size={14} stroke={T.accent} w={2}/>
                  <span style={{ flex: 1 }}>{s}</span>
                  <Icon name="arrow" size={14} stroke={T.textLow} w={2}/>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div style={{ padding: `10px 14px ${SAFE.bottom + 4}px`, background: "linear-gradient(180deg, transparent, rgba(10,13,12,0.95) 30%)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 24, padding: "6px 6px 6px 16px"
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send(input)}
            placeholder="Ask anything about Bali…"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: T.text, fontSize: 14.5, fontFamily: "inherit", padding: "10px 0"
            }}
          />
          <button style={iconBtn}><Icon name="mic" size={18} stroke={T.textMid} w={2}/></button>
          <button onClick={() => send(input)} disabled={!input.trim()} style={{
            ...iconBtn, background: input.trim() ? T.accent : "rgba(255,255,255,0.06)",
            color: input.trim() ? "#1A0E07" : T.textLow
          }}>
            <Icon name="arrow" size={18} stroke={input.trim() ? "#1A0E07" : T.textLow} w={2.4}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function Message({ m, onOpenStop }) {
  if (m.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <div style={{
          maxWidth: "78%", padding: "10px 14px", borderRadius: "18px 18px 6px 18px",
          background: T.accent, color: "#1A0E07", fontSize: 14.5, lineHeight: 1.45, fontWeight: 500
        }}>{m.text}</div>
      </div>
    );
  }
  if (m.kind === "card") {
    return (
      <div style={{ marginBottom: 14 }}>
        {m.text && <div style={aiBubble}>{m.text}</div>}
        <div style={{ marginTop: 8, marginLeft: 4 }}>
          <Card style={{ padding: 14, cursor: "pointer" }} onClick={() => onOpenStop && onOpenStop(m.stop)}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: `linear-gradient(135deg, ${m.stop.color}, ${m.stop.color}55)`, flexShrink: 0, display: "grid", placeItems: "center" }}>
                <Icon name="pin" size={22} stroke="#FFFFFF" w={0} fill="#FFFFFF"/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: T.textLow, letterSpacing: "0.06em", textTransform: "uppercase" }}>{m.stop.area} · {m.stop.category}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: T.text, marginTop: 2 }}>{m.stop.title}</div>
                <div style={{ fontSize: 12.5, color: T.textMid, marginTop: 4, lineHeight: 1.45, fontStyle: "italic" }}>"{m.stop.tip}"</div>
              </div>
            </div>
          </Card>
          {m.followups && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {m.followups.map(f => <Pill key={f} bg={T.surface} border={T.border} color={T.text} style={{ padding: "7px 11px", fontSize: 12.5 }}>{f}</Pill>)}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={aiBubble}>{m.text}</div>
      {m.followups && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, marginLeft: 4 }}>
          {m.followups.map(f => <Pill key={f} bg={T.surface} border={T.border} color={T.text} style={{ padding: "7px 11px", fontSize: 12.5 }}>{f}</Pill>)}
        </div>
      )}
    </div>
  );
}

function Typing() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "18px 18px 18px 6px", width: "fit-content", marginBottom: 12 }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: 999, background: T.textMid,
          animation: `pulse 1.2s ease-in-out ${i*0.15}s infinite`
        }} />
      ))}
    </div>
  );
}

var aiBubble = {
  padding: "10px 14px", borderRadius: "18px 18px 18px 6px",
  background: T.surface, border: `1px solid ${T.border}`, color: T.text,
  fontSize: 14.5, lineHeight: 1.5, maxWidth: "85%", display: "inline-block"
};

function aiReply(userText) {
  var t = userText.toLowerCase();
  if (t.includes("rain") || t.includes("indoors")) {
    return { role: "ai", kind: "card", text: "Pulling you out of the rain. Swapping the waterfall for this:", stop: { id: "spa", area: "Sidemen", category: "Wellness", title: "Wapa di Ume Spa", color: T.teal, tip: "Book the 90-min Balinese, not the signature. Same hands, half the upsell." }, followups: ["Show on map", "Move to tomorrow instead"] };
  }
  if (t.includes("wifi") || t.includes("café") || t.includes("cafe") || t.includes("work")) {
    return { role: "ai", kind: "card", text: "Closest fast Wi-Fi from where you are now:", stop: { id: "wifi", area: "Ubud · Penestanan", category: "Café · 200 Mbps", title: "The Onion Collective", color: T.emerald, tip: "Sit upstairs by the window. Power outlets at every other seat. Skip the smoothie bowls — 65k for what should be 35k." }, followups: ["Directions", "More options"] };
  }
  if (t.includes("4 hour") || t.includes("flight") || t.includes("before")) {
    return { role: "ai", kind: "text", text: "From Seminyak with 4 hours? Pampered: La Lucciola for an early lunch (book a table by the sand), then Potato Head's day-bar — they hold luggage. Skip Tanah Lot — the traffic alone eats 2 hours.", followups: ["Build that as a plan", "Cheaper version"] };
  }
  if (t.includes("dinner")) {
    return { role: "ai", kind: "text", text: "Moved Naughty Nuri's from 19:00 to 17:30. Earlier seating, no wait. Want me to push everything else back too, or keep tomorrow morning the same?", followups: ["Keep morning", "Push everything"] };
  }
  return { role: "ai", kind: "text", text: "Got it. Looking at your day now — give me a sec.", followups: ["Show on map", "Edit by hand"] };
}

// ─── MAP ─────────────────────────────────────────────
function MapScreen({ onOpenStop }) {
  var [activeId, setActiveId] = useState("s3");
  var [filter, setFilter] = useState("today");
  return (
    <div style={{ position: "relative", height: "100%", background: "#06090A", overflow: "hidden" }}>
      <DarkMapBg activeId={activeId} setActiveId={setActiveId} />

      {/* Top controls */}
      <div style={{ position: "absolute", top: SAFE.top - 8, left: 0, right: 0, padding: "0 16px", display: "flex", gap: 8, zIndex: 4 }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
          background: "rgba(19,23,26,0.85)", backdropFilter: "blur(20px)",
          border: `1px solid ${T.border}`, borderRadius: 999, color: T.textMid, fontSize: 14
        }}>
          <Icon name="filter" size={16} stroke={T.textMid} w={2}/>
          Search Bali
        </div>
        <button style={{ ...glassBtn }}>
          <Icon name="layer" size={18} stroke={T.text} w={2}/>
        </button>
      </div>

      {/* Filter chips */}
      <div style={{ position: "absolute", top: SAFE.top + 38, left: 0, right: 0, padding: "0 16px", display: "flex", gap: 8, overflowX: "auto", zIndex: 4, scrollbarWidth: "none" }}>
        {[["today","Today's plan"],["food","Food"],["temple","Temples"],["beach","Beaches"],["cafe","Cafés"]].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "8px 14px", borderRadius: 999,
            background: filter === k ? T.accent : "rgba(19,23,26,0.85)",
            border: `1px solid ${filter === k ? T.accent : T.border}`,
            color: filter === k ? "#1A0E07" : T.text,
            fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
            backdropFilter: "blur(20px)"
          }}>{l}</button>
        ))}
      </div>

      {/* Bottom sheet */}
      <MapSheet activeId={activeId} setActiveId={setActiveId} onOpenStop={onOpenStop} />
    </div>
  );
}

function DarkMapBg({ activeId, setActiveId }) {
  // Stylized dark map: grid + roads + areas + pins (no API key)
  var pins = TODAY.map((s, i) => ({ ...s, idx: i + 1 }));
  // Map fixed positions on the bg (pre-projected to the 402x874 frame)
  var pos = {
    s1: { x: 145, y: 360 }, s2: { x: 175, y: 405 }, s3: { x: 230, y: 320 }, s4: { x: 280, y: 250 }
  };
  return (
    <svg viewBox="0 0 402 874" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="mapGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#0E1417" />
          <stop offset="100%" stopColor="#06090A" />
        </radialGradient>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </pattern>
        <filter id="pinShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.5" /></filter>
      </defs>
      <rect width="402" height="874" fill="url(#mapGlow)" />
      <rect width="402" height="874" fill="url(#grid)" />

      {/* Land mass — abstract Bali shape */}
      <g transform="translate(40, 180)">
        <path d="M 0 180 C -10 80, 60 30, 140 35 C 220 25, 300 60, 320 140 C 335 200, 300 250, 240 260 C 220 262, 200 258, 180 270 C 170 285, 175 310, 160 320 C 140 330, 110 322, 100 298 C 95 280, 75 275, 50 270 C 20 260, 5 230, 0 180 Z"
          fill="rgba(35,45,52,0.7)" stroke="rgba(94,201,216,0.18)" strokeWidth="1.2" />
        {/* Inner ridge */}
        <path d="M 60 130 C 130 100, 220 100, 280 150" stroke="rgba(94,201,216,0.08)" strokeWidth="1" fill="none" strokeDasharray="2 6"/>
      </g>

      {/* Glowing route between today's stops */}
      <path d={`M ${pos.s1.x} ${pos.s1.y} Q ${pos.s2.x-10} ${pos.s2.y+10} ${pos.s2.x} ${pos.s2.y} T ${pos.s3.x} ${pos.s3.y} T ${pos.s4.x} ${pos.s4.y}`}
        stroke={T.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="1 6" opacity="0.85"
        style={{ filter: "drop-shadow(0 0 6px rgba(255,138,76,0.6))" }}/>

      {/* Area labels */}
      <g fontFamily="ui-monospace, monospace" fontSize="10" fill="rgba(242,240,236,0.32)" letterSpacing="0.18em">
        <text x="120" y="380">UBUD</text>
        <text x="265" y="225">TAMPAKSIRING</text>
        <text x="290" y="190">MT. BATUR</text>
        <text x="80" y="510">CANGGU</text>
        <text x="175" y="595">SEMINYAK</text>
        <text x="225" y="650">DENPASAR</text>
        <text x="305" y="375">SIDEMEN</text>
      </g>

      {/* Pins */}
      {pins.map(p => {
        var { x, y } = pos[p.id];
        var active = activeId === p.id;
        return (
          <g key={p.id} transform={`translate(${x}, ${y})`} style={{ cursor: "pointer" }} onClick={() => setActiveId(p.id)}>
            {active && <circle r="22" fill={p.color} opacity="0.18">
              <animate attributeName="r" values="14;26;14" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite"/>
            </circle>}
            <g filter="url(#pinShadow)">
              <circle r={active ? 18 : 14} fill={p.color} stroke="#0A0D0C" strokeWidth="2.5"/>
              <text textAnchor="middle" y={active ? 5 : 4} fontFamily="Inter, sans-serif" fontSize={active ? 13 : 11} fontWeight="700" fill="#0A0D0C">{p.idx}</text>
            </g>
          </g>
        );
      })}

      {/* User location dot */}
      <g transform="translate(160, 430)">
        <circle r="14" fill="#5CC8FF" opacity="0.18">
          <animate attributeName="r" values="10;18;10" dur="2.4s" repeatCount="indefinite"/>
        </circle>
        <circle r="6" fill="#5CC8FF" stroke="#0A0D0C" strokeWidth="2"/>
      </g>
    </svg>
  );
}

function MapSheet({ activeId, setActiveId, onOpenStop }) {
  var stop = TODAY.find(s => s.id === activeId) || TODAY[0];
  return (
    <div style={{
      position: "absolute", left: 12, right: 12, bottom: SAFE.bottom + 6,
      background: "rgba(19,23,26,0.92)", backdropFilter: "blur(24px)",
      border: `1px solid ${T.border}`, borderRadius: 22, padding: 14, zIndex: 5,
      boxShadow: "0 20px 50px -10px rgba(0,0,0,0.5)"
    }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <div style={{ width: 38, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.18)" }} />
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", marginBottom: 10 }}>
        {TODAY.map(s => (
          <button key={s.id} onClick={() => setActiveId(s.id)} style={{
            padding: "6px 11px", borderRadius: 999, whiteSpace: "nowrap",
            background: activeId === s.id ? T.accentDim : "rgba(255,255,255,0.04)",
            border: `1px solid ${activeId === s.id ? "rgba(255,138,76,0.35)" : T.border}`,
            color: activeId === s.id ? T.accent : T.textMid, fontSize: 12, fontWeight: 500, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: s.color }}/>
            {s.time} {s.title.split(" ").slice(0, 2).join(" ")}
          </button>
        ))}
      </div>
      <div onClick={() => onOpenStop(stop)} style={{ cursor: "pointer" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, background: `linear-gradient(135deg, ${stop.color}, ${stop.color}55)`, flexShrink: 0, display: "grid", placeItems: "center" }}>
            <Icon name="pin" size={24} stroke="#FFFFFF" fill="#FFFFFF" w={0}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: T.textLow, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {stop.area} · {stop.category}
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: T.text, marginTop: 2, lineHeight: 1.2 }}>{stop.title}</div>
            <div style={{ fontSize: 12, color: T.textMid, marginTop: 4 }}>{stop.time}–{stop.end} · {stop.duration}</div>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: T.accentDim, border: `1px solid rgba(255,138,76,0.25)` }}>
          <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 3 }}>💡 LOCAL TIP</div>
          <div style={{ fontSize: 13, color: T.text, fontStyle: "italic", lineHeight: 1.45 }}>"{stop.tip}"</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={{ ...accentBtn, flex: 1 }}>Directions</button>
          <button style={{ ...ghostBtn, flex: 1 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail drawer (shared across screens) ──────────
function StopDrawer({ stop, onClose }) {
  var open = !!stop;
  var [last, setLast] = useState(stop);
  useEffect(() => { if (stop) setLast(stop); }, [stop]);
  var s = stop || last;
  return (
    <>
      <div onClick={onClose} style={{
        position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
        opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transition: "opacity 240ms", zIndex: 100
      }}/>
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        height: "78%", background: T.bg, borderRadius: "28px 28px 0 0",
        border: `1px solid ${T.border}`, borderBottom: "none",
        transform: open ? "translateY(0)" : "translateY(105%)",
        transition: "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)",
        zIndex: 101, overflow: "hidden", display: "flex", flexDirection: "column"
      }}>
        {s && <DrawerContent s={s} onClose={onClose} />}
      </div>
    </>
  );
}
function DrawerContent({ s, onClose }) {
  return (
    <>
      <div style={{ height: 200, background: `linear-gradient(155deg, ${s.color}, ${s.color}33), ${T.surface}`, position: "relative", flexShrink: 0 }}>
        <svg style={{ position: "absolute", inset: 0, opacity: 0.18 }} width="100%" height="100%">
          <defs>
            <pattern id={`stripe-${s.id}`} patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(35)">
              <line x1="0" y1="0" x2="0" y2="20" stroke="#FFF" strokeWidth="8"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#stripe-${s.id})`}/>
        </svg>
        <div style={{ position: "absolute", top: 14, right: 14 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)", color: "#FFF", cursor: "pointer" }}>
            <Icon name="close" size={16} stroke="#FFF" w={2.4}/>
          </button>
        </div>
        <div style={{ position: "absolute", bottom: 14, left: 14, color: "rgba(255,255,255,0.85)", fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.1em" }}>
          {s.area && s.area.toUpperCase()} · {s.time || ""}
        </div>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <div style={{ width: 38, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.4)" }} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 100px" }}>
        <div style={{ fontSize: 11, color: T.textLow, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{s.category}</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: T.text, margin: "6px 0 14px", letterSpacing: "-0.01em", lineHeight: 1.15 }}>{s.title}</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Pill bg={T.surface} border={T.border} color={T.text}><Icon name="clock" size={12} stroke={T.textMid} w={2}/> {s.duration || "—"}</Pill>
          {s.weather && <Pill bg={T.surface} border={T.border} color={T.text}><Icon name="sun" size={12} stroke={T.sand} w={2}/> {s.weather}</Pill>}
          <Pill bg={T.surface} border={T.border} color={T.text}><Icon name="walk" size={12} stroke={T.emerald} w={2}/> easy</Pill>
        </div>
        <div style={{ padding: 16, background: T.accentDim, border: `1px solid rgba(255,138,76,0.3)`, borderRadius: 16, marginBottom: 16, position: "relative" }}>
          <div style={{ position: "absolute", top: -10, left: 14, padding: "3px 10px", background: T.accent, color: "#1A0E07", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>
            💡 LOCAL TIP
          </div>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: T.text, lineHeight: 1.5, fontStyle: "italic", margin: "8px 0 0", fontWeight: 500 }}>
            "{s.tip}"
          </p>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: T.textLow, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Best time</div>
          <div style={{ fontSize: 15, color: T.text }}>{s.time || "—"}{s.end ? ` to ${s.end}` : ""}. {s.weather ? `Currently ${s.weather}.` : ""}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.textLow, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>What to expect</div>
          <p style={{ fontSize: 14.5, color: T.textMid, lineHeight: 1.55, margin: 0 }}>
            Locals come here on weekday mornings. Dress modestly — sarong required. Phones inside the inner courtyard only after the offering, please.
          </p>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 14px 24px", background: "linear-gradient(180deg, transparent, rgba(10,13,12,0.95) 30%)", display: "flex", gap: 8 }}>
        <button style={{ ...accentBtn, flex: 1, padding: "14px 16px", fontSize: 15 }}>Get directions</button>
        <button style={{ ...iconBtn, width: 48, height: 48, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}` }}>
          <Icon name="bookmark" size={18} stroke={T.text} w={2}/>
        </button>
      </div>
    </>
  );
}

// ─── Bottom nav ──────────────────────────────────────
function BottomNav({ tab, setTab }) {
  var items = [
    { id: "today", label: "Today", icon: "home" },
    { id: "chat",  label: "Chat",  icon: "chat" },
    { id: "map",   label: "Map",   icon: "map" },
    { id: "saved", label: "Saved", icon: "bookmark" },
  ];
  return (
    <div style={{
      position: "absolute", left: 12, right: 12, bottom: 12,
      background: "rgba(19,23,26,0.85)", backdropFilter: "blur(24px) saturate(180%)",
      border: `1px solid ${T.border}`, borderRadius: 24,
      display: "flex", padding: 6, zIndex: 90,
      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
    }}>
      {items.map(it => {
        var on = tab === it.id;
        return (
          <button key={it.id} onClick={() => setTab(it.id)} style={{
            flex: 1, padding: "10px 0", borderRadius: 18, border: "none",
            background: on ? T.accentDim : "transparent",
            color: on ? T.accent : T.textMid, cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            transition: "all 160ms"
          }}>
            <Icon name={it.icon} size={20} stroke={on ? T.accent : T.textMid} w={1.9}/>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.02em" }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Saved (lightweight 5th screen) ─────────────────
function SavedScreen() {
  var groups = [
    { title: "Trip · Bali · Jan 26", count: 18, gradient: `linear-gradient(135deg, ${T.accent}, #B33B12)` },
    { title: "Warungs locals love", count: 24, gradient: `linear-gradient(135deg, ${T.emerald}, #1F8A5B)` },
    { title: "Sunset spots", count: 9, gradient: `linear-gradient(135deg, ${T.sand}, #B5894C)` },
    { title: "Rainy day plans", count: 6, gradient: `linear-gradient(135deg, ${T.teal}, #2D7A8A)` },
  ];
  return (
    <div style={{ paddingTop: SAFE.top, paddingBottom: SAFE.bottom + 12, background: T.bg }}>
      <div style={{ padding: "16px 22px 8px" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, margin: 0, color: T.text, letterSpacing: "-0.02em" }}>Saved</h1>
        <p style={{ color: T.textMid, fontSize: 14, margin: "4px 0 0" }}>57 places · 4 collections</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "12px 22px" }}>
        {groups.map(g => (
          <div key={g.title} style={{
            aspectRatio: "1 / 1", borderRadius: 18, background: g.gradient, padding: 14,
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            color: "#FFFFFF", boxShadow: "0 14px 30px -14px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden"
          }}>
            <Icon name="bookmark" size={20} fill="#FFFFFF" stroke="#FFFFFF" w={0}/>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{g.title}</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>{g.count} places</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────
var accentBtn = {
  padding: "10px 14px", borderRadius: 12, border: "none",
  background: T.accent, color: "#1A0E07", fontWeight: 600, fontSize: 13,
  cursor: "pointer"
};
var ghostBtn = {
  padding: "10px 14px", borderRadius: 12,
  background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
  color: T.text, fontWeight: 500, fontSize: 13, cursor: "pointer"
};
var iconBtn = {
  width: 38, height: 38, borderRadius: 999, border: "none",
  background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", cursor: "pointer"
};
var glassBtn = {
  width: 44, height: 44, borderRadius: 999,
  background: "rgba(19,23,26,0.85)", backdropFilter: "blur(20px)",
  border: `1px solid ${T.border}`, display: "grid", placeItems: "center", cursor: "pointer"
};

window.TodayScreen = TodayScreen;
window.ChatScreen = ChatScreen;
window.MapScreen = MapScreen;
window.SavedScreen = SavedScreen;
window.StopDrawer = StopDrawer;
window.BottomNav = BottomNav;
