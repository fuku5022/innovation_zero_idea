// Firebaseプロジェクトの設定
// Firebaseコンソール(https://console.firebase.google.com/)でプロジェクトを作成後、
// 「プロジェクトの設定」→「マイアプリ」→ウェブアプリを追加すると、下記の値が発行されます。
//
// このファイルは firebase.example.js としてリポジトリにコミットされています。
// 実際に使うときは、このファイルを firebase.js としてコピーし、
// 自分のFirebaseプロジェクトの値を入力してください。
// firebase.js は .gitignore に含まれているので、誤って公開されることはありません。

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
