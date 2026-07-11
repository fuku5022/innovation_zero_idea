// Gemini APIを使って、ボード上の付箋の内容を要約・提案してもらうユーティリティ。
//
// 使う前に、Google AI Studio (https://aistudio.google.com/apikey) で取得した
// APIキーを下に入力してください。

// Gemini APIキーは、Vercelの環境変数 VITE_GEMINI_API_KEY から読み込む。
// コードに直接書かないことで、GitHub上に秘密情報が残らないようにしている。
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-3.1-flash-lite";

export async function askGeminiAboutBoard(notesText, instruction) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini APIキーが設定されていません。VercelのEnvironment Variablesに VITE_GEMINI_API_KEY を設定してください。"
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `以下は、あるチームがオンラインホワイトボードで行った議論の記録です。
「付箋の内容」は現在ボードに残っている付箋のテキストで、誰が書いたかの情報はありません。
「発言者ごとの編集履歴」は、誰が・どんな文章を書いたかが「名前: 内容」の形式で記録されたものです。

--- 付箋の内容 ---
${notesText || "（付箋はまだありません）"}
--- ここまで ---

チームからの依頼: 「${instruction}」

回答のルール:
- 依頼の中に特定の人物名が含まれている場合は、「発言者ごとの編集履歴」からその人物の発言だけを抽出し、その人物の発言のみをもとに回答してください。他の人の発言や、チーム全体の話を混ぜないでください。
- 該当する人物の発言が記録の中に見つからない場合は、その旨を正直に伝えてください。
- 人物名の指定がない場合は、付箋全体の内容をもとに回答してください。
- 「関連する技術」「近い事例」「参考になりそうなもの」のように、ボードの外の情報を求められている場合は、付箋の内容に書かれていないことでも、あなたが知っている実在の技術・プロダクト・研究・事例などを積極的に挙げて構いません。付箋の中身だけに答えを限定しないでください。
- 堅苦しい定型文や過度に事務的な言い回しは避け、チームメイトに話しかけるような、自然で親しみやすい日本語で回答してください。
- 依頼の意図を汲み取り、書かれていないことでも文脈から自然に補って構いません。杓子定規に依頼文の表現だけをなぞらないでください。`;

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
