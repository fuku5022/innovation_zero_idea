import { useEffect, useState, useCallback } from "react";
import { db } from "./firebase.js";
import { ref, onValue, set, push, serverTimestamp } from "firebase/database";

// すべてのボード（議題ごとのホワイトボード）の一覧を管理するフック。
// ホーム画面で「新しいボードを作る」「既存のボードを開く」ために使う。
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

  return { boardList, loaded, createBoard };
}
