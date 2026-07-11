import { useState } from "react";

export default function Home({ boardList, loaded, onCreateBoard, onOpenBoard }) {
  const [newBoardName, setNewBoardName] = useState("");

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

  return (
    <div className="home-wrapper">
      <h1>Collab Sticky Board</h1>
      <p className="home-subtitle">議題ごとにボードを分けて使えます。</p>

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
          <button
            key={id}
            className="home-board-card"
            onClick={() => onOpenBoard(id)}
          >
            <span className="home-board-name">{board.name}</span>
            <span className="home-board-arrow">開く →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
