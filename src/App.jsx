import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useBoard } from "./useBoard.js";
import { useBoardList } from "./useBoardList.js";
import { downloadActivityLogAsCsv } from "./csvExport.js";
import Home from "./Home.jsx";
import StickyNote from "./StickyNote.jsx";
import LinkLayer from "./LinkLayer.jsx";
import AiAssistModal from "./AiAssistModal.jsx";

const PRESET_COLORS = ["#EF9F27", "#85B7EB", "#97C459", "#ED93B1"];

function getOrCreateUserName() {
  let name = localStorage.getItem("csb_username");
  while (!name || !name.trim()) {
    const input = window.prompt("あなたの名前を入力してください（空欄では進めません）", "");
    name = input ? input.trim() : "";
  }
  localStorage.setItem("csb_username", name);
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
    aiLog,
    addNote,
    updateNote,
    deleteNote,
    addLink,
    deleteLink,
    setNoteImageUrl,
    toggleReaction,
    commitTextEdit,
    saveAiLog,
    connectionError,
  } = useBoard(boardId, userName, userColor);

  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [linkMode, setLinkMode] = useState(false);
  const [linkFirst, setLinkFirst] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const noteRefs = useRef({});

  const presenceList = useMemo(() => Object.values(presence), [presence]);

  const matchedNoteIds = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return null;
    return new Set(
      Object.entries(notes)
        .filter(([, note]) => (note.text || "").toLowerCase().includes(term))
        .map(([id]) => id)
    );
  }, [notes, searchTerm]);

  useEffect(() => {
    if (!matchedNoteIds || matchedNoteIds.size === 0) return;
    const firstId = Array.from(matchedNoteIds)[0];
    const el = noteRefs.current[firstId];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }, [matchedNoteIds]);

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

  function handleTextCommit(id) {
    const text = notes[id]?.text || "";
    commitTextEdit(id, text);
  }

  function handleDelete(id) {
    const text = notes[id]?.text || "";
    deleteNote(id, text);
  }

  function handleSetColor(id, hex) {
    updateNote(id, { color: hex }, "色を変更");
  }

  function handleToggleReaction(id, reactions) {
    toggleReaction(id, reactions);
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
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {PRESET_COLORS.map((hex) => (
            <button
              key={hex}
              className={`color-swatch${selectedColor === hex ? " selected" : ""}`}
              style={{ background: hex }}
              aria-label={hex}
              onClick={() => setSelectedColor(hex)}
            />
          ))}
          <label className="color-swatch-custom" title="自由な色を選ぶ">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
            />
          </label>
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="🔍 付箋を検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleExportCsv}>⬇ ログをCSVで保存</button>
        <button onClick={() => setShowAiModal(true)}>✨ AIに相談</button>
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
      {showAiModal && (
        <AiAssistModal
          notes={notes}
          activityLog={activityLog}
          aiLog={aiLog}
          onSaveAiLog={saveAiLog}
          onClose={() => setShowAiModal(false)}
        />
      )}
      <div className="board-wrapper">
        <div className="board-inner">
          <LinkLayer notes={notes} links={links} onDeleteLink={deleteLink} />
          {Object.entries(notes).map(([id, note]) => (
            <StickyNote
              key={id}
              id={id}
              note={note}
              isLinkMode={linkMode}
              isLinkSelected={linkFirst === id}
              isDimmed={matchedNoteIds !== null && !matchedNoteIds.has(id)}
              isMatched={matchedNoteIds !== null && matchedNoteIds.has(id)}
              noteRef={(el) => {
                noteRefs.current[id] = el;
              }}
              userName={userName}
              onMove={handleMove}
              onMoveEnd={handleMoveEnd}
              onTextChange={handleTextChange}
              onTextCommit={handleTextCommit}
              onDelete={handleDelete}
              onClickForLink={handleClickForLink}
              onSetImageUrl={setNoteImageUrl}
              onSetColor={handleSetColor}
              onToggleReaction={handleToggleReaction}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
