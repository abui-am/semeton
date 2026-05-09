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
