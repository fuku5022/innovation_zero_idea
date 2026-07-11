import { useEffect, useState, useCallback } from "react";
import { db, storage } from "./firebase.js";
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
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

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
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    const notesRef = ref(db, `boards/${boardId}/notes`);
    const linksRef = ref(db, `boards/${boardId}/links`);
    const presenceRef = ref(db, `boards/${boardId}/presence`);
    const logRef = ref(db, `boards/${boardId}/activityLog`);

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
    (id, patch, logLabel) => {
      if (!boardId) return;
      const noteRef = ref(db, `boards/${boardId}/notes/${id}`);
      update(noteRef, { ...patch, updatedAt: serverTimestamp() });
      if (logLabel) {
        logActivity(boardId, userName, logLabel);
      }
    },
    [boardId, userName]
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
      logActivity(boardId, userName, "付箋を削除");
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

  const uploadNoteImage = useCallback(
    async (id, file) => {
      if (!boardId || !file) return;
      const path = `boards/${boardId}/notes/${id}/${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      const noteRef = ref(db, `boards/${boardId}/notes/${id}`);
      update(noteRef, { imageUrl: url, updatedAt: serverTimestamp() });
      logActivity(boardId, userName, "画像を追加", file.name);
    },
    [boardId, userName]
  );

  const removeNoteImage = useCallback(
    (id) => {
      if (!boardId) return;
      const noteRef = ref(db, `boards/${boardId}/notes/${id}`);
      update(noteRef, { imageUrl: null, updatedAt: serverTimestamp() });
      logActivity(boardId, userName, "画像を削除");
    },
    [boardId, userName]
  );

  return {
    notes,
    links,
    presence,
    activityLog,
    addNote,
    updateNote,
    deleteNote,
    addLink,
    uploadNoteImage,
    removeNoteImage,
    boardId,
    connectionError,
  };
}
