const SignalSplit = () => {
  return (
    <section className="split-section">

      {/* LEFT — TEXT */}
      <div className="split-text">
        <h2>Unified Farm Intelligence</h2>
        <p>
          ChickCoop connects poultry and livestock into one intelligence layer —
          collecting signals from animals and converging them into a single
          decision engine.
        </p> 
        <p>
          ChickCoop connects poultry and livestock into one intelligence layer — collecting signals from animals and converging them into a single
          decision engine.
          ChickCoop connects poultry and livestock into one intelligence layer — collecting signals from animals and converging them into a single
          decision engine. 
        </p>
      </div>

      {/* RIGHT — ANIMATION */}
      <div className="split-animation">
        <div className="animation-canvas">

          {/* Animals */}
          <div className="animal-layer">
            <i className="fa-solid fa-heart-pulse a1"></i>
            <i className="fa-solid fa-seedling a2"></i>
            <i className="fa-solid fa-cloud-sun a3"></i>
            <i className="fa-solid fa-eye a4"></i>
            <i className="fa-solid fa-microchip a5"></i>
          </div>

          {/* SVG */}
          <svg viewBox="0 0 600 300" className="signal-svg">
            <path d="M80 40  Q200 170 300 260" className="signal-flow" />
            <path d="M160 40 Q240 180 300 260" className="signal-flow" />
            <path d="M300 40 Q300 190 300 260" className="signal-flow" />
            <path d="M440 40 Q360 180 300 260" className="signal-flow" />
            <path d="M520 40 Q400 170 300 260" className="signal-flow" />
          </svg>

          {/* HUB */}
          <div className="hub">
            <i className="">fs</i>
          </div>

        </div>
      </div>

    </section>
  );
};

ReactDOM.createRoot(
  document.getElementById("signal-split-root")
).render(<SignalSplit />);
