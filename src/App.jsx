import { useState, useMemo, useEffect, useCallback } from "react";
import { useBoard } from "./useBoard.js";
import { useBoardList } from "./useBoardList.js";
import Home from "./Home.jsx";
import StickyNote from "./StickyNote.jsx";
import LinkLayer from "./LinkLayer.jsx";

const COLORS = ["amber", "blue", "green", "pink"];
const COLOR_HEX = {
  amber: "#EF9F27",
  blue: "#85B7EB",
  green: "#97C459",
  pink: "#ED93B1",
};

function getOrCreateUserName() {
  let name = localStorage.getItem("csb_username");
  if (!name) {
    name = window.prompt("あなたの名前を入力してください", "") || "名無しさん";
    localStorage.setItem("csb_username", name);
  }
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
  const { boardList, loaded, createBoard } =
