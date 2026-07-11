// Gemini APIキーは、Vercelの環境変数 VITE_GEMINI_API_KEY から読み込む。
// コードに直接書かないことで、GitHub上に秘密情報が残らないようにしている。
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-2.0-flash";

export async function askGeminiAboutBoard(notesText, instruction) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini APIキーが設定されていません。VercelのEnvironment Variablesに VITE_GEMINI_API_KEY を設定してください。"
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `以下は、あるチームがオンラインホワイトボードに書き出した付箋の内容です。

--- 付箋の内容 ---
${notesText || "（付箋はまだありません）"}
--- ここまで ---

チームからの依頼: 「${instruction}」

上記の依頼に沿って、日本語で分かりやすく回答してください。`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error("AIへの問い合わせに失敗しました");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("AIから返答が得られませんでした");
  }
  return text;
}
