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
  const [linkFirst, setLinkFirst] =
