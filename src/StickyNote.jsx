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
  onMoveEnd,
  onTextChange,
  onDelete,
  onClickForLink,
  onUploadImage,
  onRemoveImage,
}) {
  const dragState = useRef(null);
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handlePointerDown(e) {
    if (isLinkMode) {
      onClickForLink(id);
      return;
    }
    if (["TEXTAREA", "BUTTON", "IMG"].includes(e.target.tagName)) return;

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
    const wasDragging = dragState.current !== null;
    dragState.current = null;
    setDragging(false);
    if (wasDragging && onMoveEnd) {
      onMoveEnd(id);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage(id, file);
    }
    e.target.value = "";
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

      {note.imageUrl && (
        <div className="note-image-wrapper">
          <img src={note.imageUrl} alt="" className="note-image" />
          <button
            className="note-image-remove"
            aria-label="画像を削除"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveImage(id);
            }}
          >
            ×
          </button>
        </div>
      )}

      <textarea
        value={note.text || ""}
        placeholder="アイデアをここに"
        onChange={(e) => onTextChange(id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
      />

      {!note.imageUrl && (
        <button
          className="note-image-add"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          ＋画像
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}
