import { useEffect, useState, useCallback } from "react";
import { db } from "./firebase.js";
import { ref, onValue, set, push, remove, serverTimestamp } from "firebase/database";

export function useBoardList() {
  const [boardList, setBoardList] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const listRef = ref(db, "boardList");
    const unsub = onValue(listRef, (snap) => {
      setBoardList(snap.val() || {});
      setLoaded(true);
    });
    return () => unsub();
  }, []);

  const createBoard = useCallback((name) => {
    const listRef = ref(db, "boardList");
    const newRef = push(listRef);
    set(newRef, {
      name,
      createdAt: serverTimestamp(),
    });
    return newRef.key;
  }, []);

  const deleteBoard = useCallback((id) => {
    remove(ref(db, `boardList/${id}`));
    remove(ref(db, `boards/${id}`));
  }, []);

  return { boardList, loaded, createBoard, deleteBoard };
}
