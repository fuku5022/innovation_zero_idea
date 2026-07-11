import { useState } from "react";

var FOLDER_LABEL = {
  internal: "イノゼロ用フォルダ",
  external: "外部共有用フォルダ",
};

export default function Home(props) {
  var boardList = props.boardList;
  var loaded = props.loaded;
  var folder = props.folder;
  var onCreateBoard = props.onCreateBoard;
  var onOpenBoard = props.onOpenBoard;
  var onDeleteBoard = props.onDeleteBoard;
  var onRenameBoard = props.onRenameBoard;
  var onBackToFolders = props.onBackToFolders;

  var [newBoardName, setNewBoardName] = useState("");
  var [confirmDeleteId, setConfirmDeleteId] = useState(null);
  var [editingId, setEditingId] = useState(null);
  var [editingName, setEditingName] = useState("");

  var boards = Object.entries(boardList)
    .filter(function (entry) {
      return entry[1].folder === folder;
    })
    .sort(function (a, b) {
      return (b[1].createdAt || 0) - (a[1].createdAt || 0);
    });

  function handleCreate() {
    var name = newBoardName.trim();
    if (!name) return;
    var id = onCreateBoard(name, folder);
    setNewBoardName("");
    onOpenBoard(id);
  }

  function handleDeleteClick(e, id) {
    e.stopPropagation();
    setConfirmDeleteId(id);
  }

  function handleConfirmDelete(e, id) {
    e.stopPropagation();
    onDeleteBoard(id);
    setConfirmDeleteId(null);
  }

  function handleCancelDelete(e) {
    e.stopPropagation();
    setConfirmDeleteId(null);
  }

  function handleStartEdit(e, id, currentName) {
    e.stopPropagation();
    setEditingId(id);
    setEditingName(currentName);
  }

  function handleSaveEdit(e, id) {
    if (e) e.stopPropagation();
    var trimmed = editingName.trim();
    if (trimmed && onRenameBoard) {
      onRenameBoard(id, trimmed);
    }
    setEditingId(null);
    setEditingName("");
  }

  function handleCancelEdit(e) {
    if (e) e.stopPropagation();
    setEditingId(null);
    setEditingName("");
  }

  return (
    <div className="home-wrapper">
      <div className="home-hero">
        <img src="/logo.png" alt="Katanova" className="home-logo" />
        <p className="home-subtitle">
          {FOLDER_LABEL[folder]} — 議題ごとにボードを分けて、みんなでアイデアを整理しよう。
        </p>
      </div>

      {onBackToFolders && (
        <button className="home-back" onClick={onBackToFolders}>
          ← フォルダ選択に戻る
        </button>
      )}

      <div className="home-create">
        <input
          type="text"
          placeholder="新しいボードの名前（例: デザイン案比較）"
          value={newBoardName}
          onChange={function (e) {
            setNewBoardName(e.target.value);
          }}
          onKeyDown={function (e) {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              handleCreate();
            }
          }}
        />
        <button onClick={handleCreate}>＋ 新しいボードを作る</button>
      </div>

      <div className="home-list">
        {!loaded && <p className="home-empty">読み込み中...</p>}
        {loaded && boards.length === 0 && (
          <p className="home-empty">まだボードがありません。上から作成してください。</p>
        )}
        {boards.map(function (entry) {
          var id = entry[0];
          var board = entry[1];
          var isEditing = editingId === id;

          return (
            <div
              key={id}
              className="home-board-card"
              onClick={function () {
                if (!isEditing) onOpenBoard(id);
              }}
            >
              {isEditing ? (
                <input
                  type="text"
                  className="home-board-name-input"
                  value={editingName}
                  autoFocus
                  onClick={function (e) { e.stopPropagation(); }}
                  onChange={function (e) { setEditingName(e.target.value); }}
                  onKeyDown={function (e) {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      handleSaveEdit(e, id);
                    }
                    if (e.key === "Escape") {
                      handleCancelEdit(e);
                    }
                  }}
                />
              ) : (
                <span className="home-board-name">{board.name}</span>
              )}

              {confirmDeleteId === id ? (
                <span className="home-board-confirm">
                  <span className="home-board-confirm-text">削除する？</span>
                  <button
                    className="home-board-confirm-yes"
                    onClick={function (e) { handleConfirmDelete(e, id); }}
                  >
                    削除
                  </button>
                  <button className="home-board-confirm-no" onClick={handleCancelDelete}>
                    やめる
                  </button>
                </span>
              ) : isEditing ? (
                <span className="home-board-actions">
                  <button
                    className="home-board-save"
                    onClick={function (e) { handleSaveEdit(e, id); }}
                  >
                    保存
                  </button>
                  <button className="home-board-cancel" onClick={handleCancelEdit}>
                    やめる
                  </button>
                </span>
              ) : (
                <span className="home-board-actions">
                  <span className="home-board-arrow">開く →</span>
                  <button
                    className="home-board-edit"
                    aria-label="ボード名を編集"
                    onClick={function (e) { handleStartEdit(e, id, board.name); }}
                  >
                    ✎
                  </button>
                  <button
                    className="home-board-delete"
                    aria-label="ボードを削除"
                    onClick={function (e) { handleDeleteClick(e, id); }}
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
