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
