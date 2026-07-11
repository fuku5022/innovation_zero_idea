// 活動ログ（activityLog）をCSV形式の文字列に変換し、ダウンロードさせる。
export function downloadActivityLogAsCsv(activityLog, boardName) {
  const rows = Object.values(activityLog).sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
  );

  const header = ["日時", "ユーザー", "操作", "詳細"];
  const lines = [header.join(",")];

  rows.forEach((row) => {
    const time = row.clientTime ? new Date(row.clientTime).toLocaleString("ja-JP") : "";
    const cells = [time, row.userName || "", row.action || "", row.detail || ""].map(
      escapeCsvCell
    );
    lines.push(cells.join(","));
  });

  // Excelで文字化けしないよう、先頭にBOMを付ける
  const csvContent = "\uFEFF" + lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  const safeName = (boardName || "board").replace(/[\\/:*?"<>|]/g, "_");
  link.download = `${safeName}_活動ログ.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
