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
  // カスタムカラー選択中のプレビュー用の色。
  // ここに値がある間は、入力中の色をこちらで優先表示し、
  // まだ保存（onSetColor）はしない。選び終えたタイミングで初めて保存する。
  const [previewHex, setPreviewHex] = useState(null);

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
    // 座標が0未満（ボードの左・上からはみ出す＝見えなくなる場所）に
    // ならないようにする。マイナスに行くと戻せなくなるため。
    const nextX = Math.max(0, dragState.current.origX + dx);
    const nextY = Math.max(0, dragState.current.origY + dy);
    onMove(id, nextX, nextY);
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
    // 入力を始めた時と終えた時で内容が変わっていたら、ログに1件だけ記録する
    // （1文字ごとに記録すると大量になりすぎるため）
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

  // プリセットの色ボタンはクリック＝選択が確定するので、そのまま即保存でよい
  function handlePickColor(hex) {
    onSetColor(id, hex);
    setShowColorPicker(false);
  }

  // カラーピッカーをドラッグしている最中：見た目だけ更新し、まだ保存しない
  function handleCustomColorInput(hex) {
    setPreviewHex(hex);
  }

  // カラーピッカーから指を離した／選び終えたタイミングで、初めて保存する
  function handleCustomColorCommit(hex) {
    setPreviewHex(null);
    onSetColor(id, hex);
    setShowColorPicker(false);
  }

  const currentHex = previewHex || resolveColor(note.color);
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
        aria-label="色を変更"
        onClick={(e) => {
          e.stopPropagation();
          setShowColorPicker((v) => !v);
        }}
      >
        <span className="note-color-toggle-dot" />
      </button>

      {showColorPicker && (
        <div className="note-color-picker" onPointerDown={(e) => e.stopPropagation()}>
          <div className="note-color-presets">
            {PRESET_COLORS.map((hex) => (
              <button
                key={hex}
                className="note-color-preset-btn"
                style={{ background: hex }}
                onClick={() => handlePickColor(hex)}
              />
            ))}
          </div>
          <label className="note-color-custom">
            自由な色
            <input
              type="color"
              value={currentHex}
              // ドラッグ中はプレビューだけ更新（保存しない＝ちらつき・誤確定を防ぐ）
              onChange={(e) => handleCustomColorInput(e.target.value)}
              // ピッカーを閉じた／選び終えたタイミングで確定保存
              onBlur={(e) => handleCustomColorCommit(e.target.value)}
            />
          </label>
        </div>
      )}

      {note.imageUrl && (
        <div className="note-image-wrapper">
          <img src={note.imageUrl} alt="" className="note-image" />
          <button
            className="note-image-remove"
            aria-label="画像を削除"
            onClick={(e) => {
              e.stopPropagation();
              onSetImageUrl(id, null);
            }}
          >
            ×
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={note.text || ""}
        placeholder="アイデアをここに"
        onChange={(e) => {
          onTextChange(id, e.target.value);
          autoResize();
        }}
        onFocus={handleTextFocus}
        onBlur={handleTextBlur}
        onPointerDown={(e) => e.stopPropagation()}
        rows={1}
      />

      <div className="note-footer">
        <button
          className={`note-reaction${iReacted ? " reacted" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleReaction(id, reactions);
          }}
        >
          👍 {reactionCount > 0 ? reactionCount : ""}
        </button>

        {!note.imageUrl && (
          <button
            className="note-image-add"
            disabled={uploading}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            {uploading ? "アップロード中..." : "＋画像"}
          </button>
        )}
      </div>
      {uploadError && <p className="note-image-error">失敗しました。もう一度お試しください</p>}
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
