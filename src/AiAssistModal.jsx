import { useState } from "react";
import { askGeminiAboutBoard } from "./gemini.js";

export default function AiAssistModal({ notes, onClose }) {
  const [instruction, setInstruction] = useState("要約して");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState(false);

  const notesText = Object.values(notes)
    .map((n) => n.text)
    .filter((t) => t && t.trim())
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n");

  async function handleAsk() {
    if (!instruction.trim()) return;
    setLoading(true);
    setError(false);
    setResult("");
    try {
      const text = await askGeminiAboutBoard(notesText, instruction.trim());
      setResult(text);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-modal-backdrop" onClick={onClose}>
      <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-header">
          <h2>AIに相談する</h2>
          <button className="ai-modal-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        <p className="ai-modal-hint">
          ボード上の付箋（{Object.values(notes).filter((n) => n.text?.trim()).length}件のテキスト）をもとに、AIが回答します。
        </p>

        <div className="ai-modal-input-row">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAsk();
            }}
            placeholder="例: 要約して / アイデアを3つ出して"
          />
          <button onClick={handleAsk} disabled={loading}>
            {loading ? "考え中..." : "聞く"}
          </button>
        </div>

        <div className="ai-modal-presets">
          <button onClick={() => setInstruction("要約して")}>要約して</button>
          <button onClick={() => setInstruction("アイデアを3つ提案して")}>アイデアを3つ提案して</button>
          <button onClick={() => setInstruction("課題点を整理して")}>課題点を整理して</button>
        </div>

        {error && (
          <p className="ai-modal-error">
            うまく回答が得られませんでした。もう一度お試しください。
          </p>
        )}

        {result && (
          <div className="ai-modal-result">
            {result.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
