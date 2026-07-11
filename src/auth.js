// 簡易的な合言葉認証。
// 本格的なログイン機能ではなく、「内部の人」と「外部の人」でパスワードを分け、
// 見えるフォルダの範囲を変えるための、シンプルな仕組み。
//
// パスワードの値は、公開されても大きな問題にならない前提（身内・関係者向け共有）で
// コード内に直接書いている。厳密なセキュリティが必要な場合は別の仕組みを検討すること。

var INTERNAL_PASSWORD = "innozero2026";
var EXTERNAL_PASSWORD = "katanova-guest";

var STORAGE_KEY = "katanova_auth_role";

// 入力されたパスワードを判定し、"internal" / "external" / null を返す。
export function checkPassword(input) {
  if (input === INTERNAL_PASSWORD) return "internal";
  if (input === EXTERNAL_PASSWORD) return "external";
  return null;
}

// 認証済みの役割（"internal" または "external"）をブラウザに保存する。
export function saveAuthRole(role) {
  localStorage.setItem(STORAGE_KEY, role);
}

// 保存されている役割を取得する（未認証なら null）。
export function getSavedAuthRole() {
  var role = localStorage.getItem(STORAGE_KEY);
  if (role === "internal" || role === "external") return role;
  return null;
}

export function clearAuthRole() {
  localStorage.removeItem(STORAGE_KEY);
}
