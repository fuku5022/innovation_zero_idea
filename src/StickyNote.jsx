import { useRef, useState, useEffect, useCallback } from "react";
import { uploadImageToCloudinary } from "./cloudinary.js";

const PRESET_COLORS = ["#EF9F27", "#85B7EB", "#97C459", "#ED93B1"];

const LEGACY_COLOR_HEX = {
  amber: "#EF9F27",
  blue: "#85B7EB",
  green: "#97C459",
  pink: "#ED93B1",
};

function resolveColor(color) {
  if (!color) return LEGACY_COLOR_HEX.amber;
  if (color.startsWith("#")) return color;
  return LEGACY_COLOR_HEX[color] || LEGACY_COLOR_HEX.amber;
}

export default function StickyNote({
  id,
  note,
  isLinkMode,
  isLinkSelected,
  isDimmed,
  isMatched,
  noteRef,
  onMove,
  onMoveEnd,
  onTextChange,
  onTextCommit,
  onDelete,
  onClickForLink,
  onSetImageUrl,
  onSetColor,
  onToggleReaction,
  userName,
}) {
  const dragState = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const textAtFocusRef = useRef(note.text || "");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [note.text, note.imageUrl, autoResize]);

  function handlePointerDown(e) {
    if (isLinkMode) {
      onClickForLink(id);
      return;
    }
    if (["TEXTAREA", "BUTTON", "IMG", "INPUT"].includes(e.target.tagName)) return;

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

  function handleTextFocus() {
    textAtFocusRef.current = note.text || "";
  }

  function handleTextBlur() {
    if (textAtFocusRef.current !== (note.text || "") && onTextCommit) {
      onTextCommit(id);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(false);
    try {
      const url = await uploadImageToCloudinary(file);
      onSetImageUrl(id, url);
    } catch (err) {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  }

  function handlePickColor(hex) {
    onSetColor(id, hex);
    setShowColorPicker(false);
  }

  const currentHex = resolveColor(note.color);
  const reactions = note.reactions || {};
  const reactionCount = Object.keys(reactions).length;
  const iReacted = !!reactions[userName];

  return (
    <div
      ref={noteRef}
      className={`sticky-note${isLinkSelected ? " link-selected" : ""}${isDimmed ? " dimmed" : ""}${isMatched ? " matched" : ""}`}
      style={{
        left: note.x,
        top: note.y,
        background: currentHex,
        cursor: isLinkMode ? "pointer" : dragging ? "grabbing" : "grab",
        scrollMarginTop: 200,
        scrollMarginLeft: 400,
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

      <button
        className="note-color-toggle"
