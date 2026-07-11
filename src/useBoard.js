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

export function useBoard(boardId, userName, userColor) {
  const [notes, setNotes] = useState({});
  const [links, setLinks] = useState({});
  const [presence, setPresence] = useState({});
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    const notesRef = ref(db, `boards/${boardId}/notes`);
    const linksRef = ref(db, `boards/${boardId}/links`);
    const presenceRef = ref(db, `boards/${boardId}/presence`);

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

    // 自分のプレゼンス（オンライン状態）を登録する。
    // 接続が切れたら（タブを閉じるなど）自動的に自分の情報を消してもらう。
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
        updatedAt: serverTimestamp(),
      });
      return newRef.key;
    },
    [boardId]
  );

  const updateNote = useCallback(
    (id, patch) => {
      if (!boardId) return;
      const noteRef = ref(db, `boards/${boardId}/notes/${id}`);
      update(noteRef, { ...patch, updatedAt: serverTimestamp() });
    },
    [boardId]
  );

  const deleteNote = useCallback(
    (id) => {
      if (!boardId) return;
      remove(ref(db, `boards/${boardId}/notes/${id}`));
      Object.entries(links).forEach(([linkId, link]) => {
        if (link.from === id || link.to === id) {
          remove(ref(db, `boards/${boardId}/links/${linkId}`));
        }
      });
    },
    [boardId, links]
  );

  const addLink = useCallback(
    (fromId, toId) => {
      if (!boardId) return;
      const linksRef = ref(db, `boards/${boardId}/links`);
      const newRef = push(linksRef);
      set(newRef, { from: fromId, to: toId });
    },
    [boardId]
  );

  return {
    notes,
    links,
    presence,
    addNote,
    updateNote,
    deleteNote,
    addLink,
    boardId,
    connectionError,
  };
}
