import { useEffect, useState, useCallback } from "react";
import { db } from "./firebase.js";
import { ref, onValue, set, push, remove, update, serverTimestamp } from "firebase/database";

// すべてのボード（議題ごとのホワイトボード）の一覧を管理するフック。
// ホーム画面で「新しいボードを作る」「既存のボードを開く」「削除する」「名前を変える」ために使う。
// 各ボードには folder フィールド（"internal" または "external"）を持たせて、
// 見せる範囲を分けられるようにしている。
// 既存の古いデータ（folderフィールドが無いもの）は、互換性のため internal 扱いにする。
export function useBoardList() {
  const [boardList, setBoardList] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const listRef = ref(db, "boardList");
    const unsub = onValue(listRef, (snap) => {
      const raw = snap.val() || {};
      const normalized = {};
      Object.keys(raw).forEach(function (id) {
        var board = raw[id];
        normalized[id] = {
          name: board.name,
          createdAt: board.createdAt,
          folder: board.folder || "internal",
        };
      });
      setBoardList(normalized);
      setLoaded(true);
    });
    return () => unsub();
  }, []);

  const createBoard = useCallback((name, folder) => {
    const listRef = ref(db, "boardList");
    const newRef = push(listRef);
    set(newRef, {
      name,
      folder: folder || "internal",
      createdAt: serverTimestamp(),
    });
    return newRef.key;
  }, []);

  // ボード一覧から名前を削除し、そのボードが持つ付箋・線・ログなどのデータも
  // まとめて削除する（データを残さずきれいに消す）。
  const deleteBoard = useCallback((id) => {
    remove(ref(db, "boardList/" + id));
    remove(ref(db, "boards/" + id));
  }, []);

  // ボードの名前だけを変更する。
  const renameBoard = useCallback((id, newName) => {
    update(ref(db, "boardList/" + id), { name: newName });
  }, []);

  return { boardList, loaded, createBoard, deleteBoard, renameBoard };
}
