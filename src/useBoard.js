import { useEffect, useState, useCallback } from "react";
import { db } from "./firebase.js";
import {
  ref,
  onValue,
  set,
  push,
  remove,
  update,
  onDisconnect,
  serverTimestamp,
} from "firebase/database";

function logActivity(boardId, userName, action, detail = "") {
  const logRef = push(ref(db, `boards/${boardId}/activityLog`));
  set(logRef, {
    userName,
    action,
    detail,
    timestamp: serverTimestamp(),
    clientTime: new Date().toISOString(),
  });
}

export function useBoard(boardId, userName, userColor) {
  const [notes, setNotes] = useState({});
  const [links, setLinks] = useState({});
  const [presence, setPresence] = useState({});
  const [activityLog, setActivityLog] = useState({});
  const [aiLog, setAiLog] = useState({});
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    const notesRef = ref(db, `boards/${boardId}/notes`);
    const linksRef = ref(db, `boards/${boardId}/links`);
    const presenceRef = ref(db, `boards/${boardId}/presence`);
    const logRef = ref(db, `boards/${boardId}/activityLog`);
    const aiLogRef = ref(db, `boards/${boardId}/aiLog`);

    const onError = () => setConnectionError(true);

    const unsubNotes = onValue(
      notesRef,
      (snap) => setNotes(snap.val() || {}),
      onError
    );
    const unsubLinks = onValue(
      linksRef,
      (snap) => setLinks(snap.val() || {}),
      onError
    );
    const unsubPresence = onValue(
      presenceRef,
      (snap) => setPresence(snap.val() || {}),
      onError
    );
    const unsubLog = onValue(
      logRef,
      (snap) => setActivityLog(snap.val() || {}),
      onError
    );
    const unsubAiLog = onValue(
      aiLogRef,
      (snap) => setAiLog(snap.val() || {}),
      onError
    );

    const myPresenceRef = push(presenceRef);
    set(myPresenceRef, {
      name: userName,
      color: userColor,
      joinedAt: serverTimestamp(),
    });
    onDisconnect(myPresenceRef).remove();

    return () => {
      unsubNotes();
      unsubLinks();
      unsubPresence();
      unsubLog();
      unsubAiLog();
      remove(myPresenceRef);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const addNote = useCallback(
    (x, y, color) => {
      if (!boardId) return;
      const notesRef = ref(db, `boards/${boardId}/notes`);
      const newRef = push(notesRef);
      set(newRef, {
        x,
        y,
        text: "",
        color,
        imageUrl: null,
        updatedAt: serverTimestamp(),
      });
      logActivity(boardId, userName, "付箋を作成");
      return newRef.key;
    },
    [boardId, userName]
  );

  const updateNote = useCallback(
    (id, patch, logLabel, logDetail = "") => {
      if (!boardId) return;
      const noteRef = ref(db, `boards/${boardId}/notes/${id}`);
      update(noteRef, { ...patch, updatedAt: serverTimestamp() });
      if (logLabel) {
        logActivity(boardId, userName, logLabel, logDetail);
      }
    },
    [boardId, userName]
  );

  const commitTextEdit = useCallback(
    (id, text) => {
      if (!boardId) return;
      logActivity(boardId, userName, "テキストを編集", text || "");
    },
    [boardId, userName]
  );

  const deleteNote = useCallback(
    (id, noteText = "") => {
      if (!boardId) return;
      remove(ref(db, `boards/${boardId}/notes/${id}`));
      Object.entries(links).forEach(([linkId, link]) => {
        if (link.from === id || link.to === id) {
          remove(ref(db, `boards/${boardId}/links/${linkId}`));
        }
      });
      logActivity(boardId, userName, "付箋を削除", noteText);
    },
    [boardId, links, userName]
  );

  const addLink = useCallback(
    (fromId, toId) => {
      if (!boardId) return;
      const linksRef = ref(db, `boards/${boardId}/links`);
      const newRef = push(linksRef);
      set(newRef, { from: fromId, to: toId });
      logActivity(boardId, userName, "線でつないだ");
    },
    [boardId, userName]
  );

  const setNoteImageUrl = useCallback(
    (id, url) => {
      if (!boardId) return;
      const noteRef = ref(db, `boards/${boardId}/notes/${id}`);
      update(noteRef, { imageUrl: url || null, updatedAt: serverTimestamp() });
      logActivity(boardId, userName, url ? "画像を追加" : "画像を削除", url ? "" : "");
    },
    [boardId, userName]
  );

  const toggleReaction = useCallback(
    (id, currentReactions) => {
      if (!boardId) return;
      const reactions = { ...(currentReactions || {}) };
      const already = reactions[userName];
      if (already) {
        delete reactions[userName];
      } else {
        reactions[userName] = true;
      }
      const noteRef = ref(db, `boards/${boardId}/notes/${id}`);
      update(noteRef, { reactions, updatedAt: serverTimestamp() });
      logActivity(boardId, userName, already ? "リアクションを外した" : "👍を付けた");
    },
    [boardId, userName]
  );

  const saveAiLog = useCallback(
    (instruction, resultText) => {
      if (!boardId) return;
      const logRef = push(ref(db, `boards/${boardId}/aiLog`));
      set(logRef, {
        userName,
        instruction,
        result: resultText,
        timestamp: serverTimestamp(),
        clientTime: new Date().toISOString(),
      });
      logActivity(boardId, userName, "AIに相談", instruction);
    },
    [boardId, userName]
  );

  return {
    notes,
    links,
    presence,
    activityLog,
    aiLog,
    addNote,
    updateNote,
    deleteNote,
    addLink,
    setNoteImageUrl,
    toggleReaction,
    commitTextEdit,
    saveAiLog,
    boardId,
    connectionError,
  };
}
