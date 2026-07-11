import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBLDNqORsdhEO3jO1IF-DmqFo7AA4gLwZg",
  authDomain: "collab-sticky-board.firebaseapp.com",
  databaseURL: "https://collab-sticky-board-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "collab-sticky-board",
  storageBucket: "collab-sticky-board.firebasestorage.app",
  messagingSenderId: "440971474452",
  appId: "1:440971474452:web:822ce066158eb4f9b39901",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
