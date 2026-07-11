import { useState, useMemo, useEffect, useCallback } from "react";
import { useBoard } from "./useBoard.js";
import { useBoardList } from "./useBoardList.js";
import { downloadActivityLogAsCsv } from "./csvExport.js";
import Home from "./Home.jsx";
import StickyNote from "./StickyNote.jsx";
import LinkLayer from "./LinkLayer.jsx";

const COLORS = ["amber", "blue", "green", "pink"];
const COLOR_HEX = {
  amber: "#EF9F27",
  blue: "#85B7EB",
  green: "#97C459",
  pink: "#ED93B1",
};

function getOrCreateUserName() {
  let name = localStorage.getItem("csb_username");
  if (!name) {
    name = window.prompt("あなたの名前を入力してください", "") || "名無しさん";
    localStorage.setItem("csb_username", name);
  }
  return name;
}

function randomColor() {
  const hues = ["#F09595", "#FAC775", "#97C459", "#85B7EB", "#AFA9EC", "#ED93B1"];
  return hues[Math.floor(Math.random() * hues.length)];
}

function getBoardIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("board");
}

export default function App() {
  const [userName] = useState(getOrCreateUserName);
  const [userColor] = useState(randomColor);
  const { boardList, loaded, createBoard, deleteBoard } = useBoardList();

  const [currentBoardId, setCurrentBoardId] = useState(getBoardIdFromUrl);

  const openBoard = useCallback((id) => {
    setCurrentBoardId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("board", id);
    window.history.pushState({}, "", url);
  }, []);

  const goHome = useCallback(() => {
    setCurrentBoardId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("board");
    window.history.pushState({}, "", url);
  }, []);

  useEffect(() => {
    function handlePopState() {
      setCurrentBoardId(getBoardIdFromUrl());
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (!currentBoardId) {
    return (
      <Home
        boardList={boardList}
        loaded={loaded}
        onCreateBoard={createBoard}
        onOpenBoard={openBoard}
        onDeleteBoard={deleteBoard}
      />
    );
  }

  return (
    <BoardView
      boardId={currentBoardId}
      boardName={boardList[currentBoardId]?.name}
      userName={userName}
      userColor={userColor}
      onGoHome={goHome}
    />
  );
}

function BoardView({ boardId, boardName, userName, userColor, onGoHome }) {
  const {
    notes,
    links,
    presence,
    activityLog,
    addNote,
    updateNote,
    deleteNote,
    addLink,
    setNoteImageUrl,
    connectionError,
  } = useBoard(boardId, userName, userColor);

  const [selectedColor, setSelectedColor] = useState("amber");
  const [linkMode, setLinkMode] = useState(false);
  const [linkFirst, setLinkFirst] = useState(null);

  const presenceList = useMemo(() => Object.values(presence), [presence]);

  function handleAddNote() {
    const x = 80 + Math.random() * 400;
    const y = 80 + Math.random() * 300;
    addNote(x, y, selectedColor);
  }

  function handleMove(id, x, y) {
    updateNote(id, { x, y });
  }

  function handleMoveEnd(id) {
    updateNote(id, {}, "付箋を移動");
  }

  function handleTextChange(id, text) {
    updateNote(id, { text });
  }

  function handleDelete(id) {
    deleteNote(id);
  }

  function handleClickForLink(id) {
    if (!linkFirst) {
      setLinkFirst(id);
    } else if (linkFirst !== id) {
      addLink(linkFirst, id);
      setLinkFirst(null);
    }
  }

  function toggleLinkMode() {
    setLinkMode((v) => !v);
    setLinkFirst(null);
  }

  function handleExportCsv() {
    downloadActivityLogAsCsv(activityLog, boardName);
  }

  return (
    <div>
      {connectionError && (
        <div className="status-banner">
          Firebaseに接続できていません。src/firebase.js に自分のFirebaseプロジェクトの設定を入力してください（README参照）。
        </div>
      )}
      <div className="toolbar">
        <button onClick={onGoHome}>← ホーム</button>
        <button onClick={handleAddNote}>＋ 付箋を追加</button>
        <button className={linkMode ? "active" : ""} onClick={toggleLinkMode}>
          ⇄ 線でつなぐ{linkMode ? "（付箋を2つクリック）" : ""}
        </button>
        <div style={{ display: "flex", gap: 4 }}>
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-swatch${selectedColor === c ? " selected" : ""}`}
              style={{ background: COLOR_HEX[c] }}
              aria-label={c}
              onClick={() => setSelectedColor(c)}
            />
          ))}
        </div>
        <button onClick={handleExportCsv}>⬇ ログをCSVで保存</button>
        <div className="presence-bar">
          <span>{boardName || boardId}</span>
          {presenceList.map((p, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span className="presence-dot" style={{ background: p.color }} />
              {p.name}
            </span>
          ))}
        </div>
      </div>
      <div className="board-wrapper">
        <div className="board-inner">
          <LinkLayer notes={notes} links={links} />
          {Object.entries(notes).map(([id, note]) => (
            <StickyNote
              key={id}
              id={id}
              note={note}
              isLinkMode={linkMode}
              isLinkSelected={linkFirst === id}
              onMove={handleMove}
              onMoveEnd={handleMoveEnd}
              onTextChange={handleTextChange}
              onDelete={handleDelete}
              onClickForLink={handleClickForLink}
              onSetImageUrl={setNoteImageUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
