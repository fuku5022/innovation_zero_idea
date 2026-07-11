import { useState } from "react";
import { checkPassword, saveAuthRole } from "./auth.js";

export default function PasswordGate({ onAuthenticated }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit() {
    const role = checkPassword(input.trim());
    if (!role) {
      setError(true);
      return;
    }
    saveAuthRole(role);
    setError(false);
    onAuthenticated(role);
  }

  return (
    <div className="gate-wrapper">
      <div className="gate-card">
        <img src="/logo.png" alt="Katanova" className="gate-logo" />
        <p className="gate-hint">合言葉を入力してください</p>
        <input
          type="password"
          className="gate-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              handleSubmit();
            }
          }}
          placeholder="合言葉"
          autoFocus
        />
        <button className="gate-button" onClick={handleSubmit}>
          入る
        </button>
        {error && <p className="gate-error">合言葉が違います。もう一度お試しください。</p>}
      </div>
    </div>
  );
}
