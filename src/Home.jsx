import { useState } from "react";

export default function Home({ boardList, loaded, onCreateBoard, onOpenBoard, onDeleteBoard }) {
  const [newBoardName, setNewBoardName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const boards = Object.entries(boardList).sort(
    (a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0)
  );

  function handleCreate() {
    const name = newBoardName.trim();
    if (!name) return;
    const id = onCreateBoard(name);
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

  return (
    <div className="home-wrapper">
      <div className="home-hero">
        <img src="/logo.png" alt="Katanova" className="home-logo" />
<p className="home-subtitle">Katanova — 議題ごとにボードを分けて、みんなでアイデアを整理しよう。</p>
      </div>

      <div className="home-create">
        <input
          type="text"
          placeholder="新しいボードの名前（例: デザイン案比較）"
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
        />
        <button onClick={handleCreate}>＋ 新しいボードを作る</button>
      </div>

      <div className="home-list">
        {!loaded && <p className="home-empty">読み込み中...</p>}
        {loaded && boards.length === 0 && (
          <p className="home-empty">まだボードがありません。上から作成してください。</p>
        )}
        {boards.map(([id, board]) => (
          <div key={id} className="home-board-card" onClick={() => onOpenBoard(id)}>
            <span className="home-board-name">{board.name}</span>

            {confirmDeleteId === id ? (
              <span className="home-board-confirm">
                <span className="home-board-confirm-text">削除する？</span>
                <button
                  className="home-board-confirm-yes"
                  onClick={(e) => handleConfirmDelete(e, id)}
                >
                  削除
                </button>
                <button className="home-board-confirm-no" onClick={handleCancelDelete}>
                  やめる
                </button>
              </span>
            ) : (
              <span className="home-board-actions">
                <span className="home-board-arrow">開く →</span>
                <button
                  className="home-board-delete"
                  aria-label="ボードを削除"
                  onClick={(e) => handleDeleteClick(e, id)}
                >
                  ×
                </button>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
