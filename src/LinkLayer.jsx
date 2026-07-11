const NOTE_WIDTH = 160;
const NOTE_HEIGHT = 110;

export default function LinkLayer({ notes, links }) {
  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {Object.entries(links).map(([linkId, link]) => {
        const from = notes[link.from];
        const to = notes[link.to];
        if (!from || !to) return null;
        return (
          <line
            key={linkId}
            x1={from.x + NOTE_WIDTH / 2}
            y1={from.y + NOTE_HEIGHT / 2}
            x2={to.x + NOTE_WIDTH / 2}
            y2={to.y + NOTE_HEIGHT / 2}
            stroke="#888780"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}
