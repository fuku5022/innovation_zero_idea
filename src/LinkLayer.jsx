import { useState } from "react";

const NOTE_WIDTH = 160;
const NOTE_HEIGHT = 110;

export default function LinkLayer({ notes, links, onDeleteLink }) {
  const [hoveredId, setHoveredId] = useState(null);
  const safeNotes = notes || {};
  const safeLinks = links || {};

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 3000,
        height: 2000,
        pointerEvents: "none",
      }}
    >
      {Object.entries(safeLinks).map(([linkId, link]) => {
        const from = safeNotes[link.from];
        const to = safeNotes[link.to];
        if (!from || !to) return null;

        const x1 = from.x + NOTE_WIDTH / 2;
        const y1 = from.y + NOTE_HEIGHT / 2;
        const x2 = to.x + NOTE_WIDTH / 2;
        const y2 = to.y + NOTE_HEIGHT / 2;

        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const curveAmount = Math.min(dist * 0.15, 60);
        const nx = -dy / dist;
        const ny = dx / dist;
        const cx = mx + nx * curveAmount;
        const cy = my + ny * curveAmount;

        const pathD = "M " + x1 + " " + y1 + " Q " + cx + " " + cy + " " + x2 + " " + y2;
        const isHovered = hoveredId === linkId;

        return (
          <g key={linkId}>
            <path
              d={pathD}
              fill="none"
              stroke={isHovered ? "#e24b4a" : "#888780"}
              strokeWidth={isHovered ? 3 : 2}
              style={{ pointerEvents: "none" }}
            />
            <path
              d={pathD}
              fill="none"
              stroke="transparent"
              strokeWidth={16}
              style={{ pointerEvents: "stroke", cursor: "pointer" }}
              onMouseEnter={() => setHoveredId(linkId)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => {
                if (onDeleteLink) onDeleteLink(linkId);
              }}
            >
              <title>クリックで線を削除</title>
            </path>
          </g>
        );
      })}
    </svg>
  );
}
