import { useRef, useState } from "react";

const COLOR_HEX = {
  amber: "#EF9F27",
  blue: "#85B7EB",
  green: "#97C459",
  pink: "#ED93B1",
};

export default function StickyNote({
  id,
  note,
  isLinkMode,
  isLinkSelected,
  onMove,
  onTextChange,
  onDelete,
  onClickForLink,
}) {
  const dragState = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handlePointerDown(e) {
    if (isLinkMode) {
      onClickForLink(id);
      return;
    }
    // textarea内をクリックした場合はドラッグを開始しない（文字入力を優先）
    if (e.target.tagName === "TEXTAREA") return;

    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: note.x,
      origY: note.y,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    onMove(id, dragState.current.origX + dx, dragState.current.origY + dy);
  }

  function handlePointerUp() {
    dragState.current = null;
    setDragging(false);
  }

  return (
    <div
      className={`sticky-note${isLinkSelected ? " link-selected" : ""}`}
      style={{
        left: note.x,
        top: note.y,
        background: COLOR_HEX[note.color] || COLOR_HEX.amber,
        cursor: isLinkMode ? "pointer" : dragging ? "grabbing" : "grab",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <button
        className="note-delete"
        aria-label="付箋を削除"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
      >
        ×
      </button>
      <textarea
        value={note.text || ""}
        placeholder="アイデアをここに"
        onChange={(e) => onTextChange(id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}
