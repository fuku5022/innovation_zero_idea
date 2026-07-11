import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useBoard } from "./useBoard.js";
import { useBoardList } from "./useBoardList.js";
import { downloadActivityLogAsCsv } from "./csvExport.js";
import { getSavedAuthRole, clearAuthRole } from "./auth.js";
import PasswordGate from "./PasswordGate.jsx";
import FolderSelect from "./FolderSelect.jsx";
import Home from "./Home.jsx";
import StickyNote from "./StickyNote.jsx";
import LinkLayer from "./LinkLayer.jsx";
import AiAssistModal from "./AiAssistModal.jsx";

var PRESET_COLORS = ["#EF9F27", "#85B7EB", "#97C459", "#ED93B1"];

function getOrCreateUserName() {
  var name = localStorage.getItem("csb_username");
  while (!name || !name.trim()) {
    var input = window.prompt("あなたの名前を入力してください（空欄では進めません）", "");
    name = input ? input.trim() : "";
  }
  localStorage.setItem("csb_username", name);
  return name;
}

function randomColor() {
  var hues = ["#F09595", "#FAC775", "#97C459", "#85B7EB", "#AFA9EC", "#ED93B1"];
  return hues[Math.floor(Math.random() * hues.length)];
}

function getBoardIdFromUrl() {
  var params = new URLSearchParams(window.location.search);
  return params.get("board");
}

export default function App() {
  var [authRole, setAuthRole] = useState(getSavedAuthRole);
  var [userName] = useState(getOrCreateUserName);
  var [userColor] = useState(randomColor);
  var boardListState = useBoardList();
  var boardList = boardListState.boardList;
  var loaded = boardListState.loaded;
  var createBoard = boardListState.createBoard;
  var deleteBoard = boardListState.deleteBoard;
  var renameBoard = boardListState.renameBoard;

  var [currentBoardId, setCurrentBoardId] = useState(getBoardIdFromUrl);
  var [currentFolder, setCurrentFolder] = useState(null);
  var [boardCheckReady, setBoardCheckReady] = useState(false);

  var openBoard = useCallback(function (id) {
    setCurrentBoardId(id);
    var url = new URL(window.location.href);
    url.searchParams.set("board", id);
    window.history.pushState({}, "", url);
  }, []);

  var goHome = useCallback(function () {
    setCurrentBoardId(null);
    var url = new URL(window.location.href);
    url.searchParams.delete("board");
    window.history.pushState({}, "", url);
  }, []);

  useEffect(function () {
    function handlePopState() {
      setCurrentBoardId(getBoardIdFromUrl());
    }
    window.addEventListener("popstate", handlePopState);
    return function () {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(function () {
    setBoardCheckReady(false);
    if (!currentBoardId) return;
    // boardListの反映に多少のタイムラグがあるため、少し待ってから判定する。
    var timer = setTimeout(function () {
      setBoardCheckReady(true);
    }, 400);
    return function () {
      clearTimeout(timer);
    };
  }, [currentBoardId]);

  var handleLogout = useCallback(function () {
    clearAuthRole();
    setAuthRole(null);
    setCurrentFolder(null);
    goHome();
  }, [goHome]);

  // まだ合言葉を入力していなければ、ゲート画面を表示する。
  if (!authRole) {
    return (
      <PasswordGate
        onAuthenticated={function (role) {
          setAuthRole(role);
        }}
      />
    );
  }

  // フォルダをまだ選んでいなければ、フォルダ選択画面を表示する。
  if (!currentFolder) {
    return (
      <FolderSelect
        role={authRole}
        onSelectFolder={function (folder) {
          setCurrentFolder(folder);
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (!currentBoardId) {
    return (
      <Home
        boardList={boardList}
        loaded={loaded}
        folder={currentFolder}
        onCreateBoard={createBoard}
        onOpenBoard={openBoard}
        onDeleteBoard={deleteBoard}
        onRenameBoard={renameBoard}
        onBackToFolders={function () {
          setCurrentFolder(null);
        }}
        onLogout={handleLogout}
      />
    );
  }

  // 直接URLでボードを開こうとした場合、そのボードが今の役割から
  // 見えるフォルダに属しているかを確認する。属していなければホームへ戻す。
  var targetBoard = boardList[currentBoardId];
  if (loaded && boardCheckReady && targetBoard) {
    var boardFolder = targetBoard.folder || "internal";
    var isAllowed = authRole === "internal" || boardFolder === "external";
    if (!isAllowed) {
      return (
        <div className="gate-wrapper">
          <div className="gate-card">
            <img src="/logo.png" alt="Katanova" className="gate-logo" />
            <p className="gate-hint">このボードを見る権限がありません。</p>
            <button
              className="gate-button"
              onClick={function () {
                goHome();
                setCurrentFolder(null);
              }}
            >
              ホームに戻る
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <BoardView
      boardId={currentBoardId}
      boardName={boardList[currentBoardId] ? boardList[currentBoardId].name : ""}
      userName={userName}
      userColor={userColor}
      onGoHome={goHome}
    />
  );
}

function BoardView(props) {
  var boardId = props.boardId;
  var boardName = props.boardName;
  var userName = props.userName;
  var userColor = props.userColor;
  var onGoHome = props.onGoHome;

  var board = useBoard(boardId, userName, userColor);
  var notes = board.notes;
  var links = board.links;
  var presence = board.presence;
  var activityLog = board.activityLog;
  var aiLog = board.aiLog;
  var addNote = board.addNote;
  var updateNote = board.updateNote;
  var deleteNote = board.deleteNote;
  var addLink = board.addLink;
  var deleteLink = board.deleteLink;
  var setNoteImageUrl = board.setNoteImageUrl;
  var toggleReaction = board.toggleReaction;
  var commitTextEdit = board.commitTextEdit;
  var saveAiLog = board.saveAiLog;
  var connectionError = board.connectionError;

  var [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  var [linkMode, setLinkMode] = useState(false);
  var [linkFirst, setLinkFirst] = useState(null);
  var [showAiModal, setShowAiModal] = useState(false);
  var [searchTerm, setSearchTerm] = useState("");
  var noteRefs = useRef({});

  var presenceList = useMemo(function () {
    return Object.values(presence);
  }, [presence]);

  var matchedNoteIds = useMemo(function () {
    var term = searchTerm.trim().toLowerCase();
    if (!term) return null;
    return new Set(
      Object.entries(notes)
        .filter(function (entry) {
          return (entry[1].text || "").toLowerCase().includes(term);
        })
        .map(function (entry) {
          return entry[0];
        })
    );
  }, [notes, searchTerm]);

  useEffect(function () {
    if (!matchedNoteIds || matchedNoteIds.size === 0) return;
    var firstId = Array.from(matchedNoteIds)[0];
    var el = noteRefs.current[firstId];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }, [matchedNoteIds]);

  function handleAddNote() {
    var x = 80 + Math.random() * 400;
    var y = 80 + Math.random() * 300;
    addNote(x, y, selectedColor);
  }

  function handleMove(id, x, y) {
    updateNote(id, { x: x, y: y });
  }

  function handleMoveEnd(id) {
    updateNote(id, {}, "付箋を移動");
  }

  function handleTextChange(id, text) {
    updateNote(id, { text: text });
  }

  function handleTextCommit(id) {
    var text = notes[id] ? notes[id].text || "" : "";
    commitTextEdit(id, text);
  }

  function handleDelete(id) {
    var text = notes[id] ? notes[id].text || "" : "";
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
    setLinkMode(function (v) { return !v; });
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
          {PRESET_COLORS.map(function (hex) {
            return (
              <button
                key={hex}
                className={"color-swatch" + (selectedColor === hex ? " selected" : "")}
                style={{ background: hex }}
                aria-label={hex}
                onClick={function () { setSelectedColor(hex); }}
              />
            );
          })}
          <label className="color-swatch-custom" title="自由な色を選ぶ">
            <input
              type="color"
              value={selectedColor}
              onChange={function (e) { setSelectedColor(e.target.value); }}
            />
          </label>
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="🔍 付箋を検索"
          value={searchTerm}
          onChange={function (e) { setSearchTerm(e.target.value); }}
        />
        <button onClick={handleExportCsv}>⬇ ログをCSVで保存</button>
        <button onClick={function () { setShowAiModal(true); }}>✨ AIに相談</button>
        <div className="presence-bar">
          <span>{boardName || boardId}</span>
          {presenceList.map(function (p, i) {
            return (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="presence-dot" style={{ background: p.color }} />
                {p.name}
              </span>
            );
          })}
        </div>
      </div>
      {showAiModal && (
        <AiAssistModal
          notes={notes}
          activityLog={activityLog}
          aiLog={aiLog}
          onSaveAiLog={saveAiLog}
          onClose={function () { setShowAiModal(false); }}
        />
      )}
      <div className="board-wrapper">
        <div className="board-inner">
          <LinkLayer notes={notes} links={links} onDeleteLink={deleteLink} />
          {Object.entries(notes).map(function (entry) {
            var id = entry[0];
            var note = entry[1];
            return (
              <StickyNote
                key={id}
                id={id}
                note={note}
                isLinkMode={linkMode}
                isLinkSelected={linkFirst === id}
                isDimmed={matchedNoteIds !== null && !matchedNoteIds.has(id)}
                isMatched={matchedNoteIds !== null && matchedNoteIds.has(id)}
                noteRef={function (el) {
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
