const CLOUD_NAME = "gkhlbpiz";
const UPLOAD_PRESET = "xbw8qgkj";

// アップロード後にCloudinary側で自動リサイズ・圧縮した画像URLを作る。
// - 幅の上限を1200pxに制限（付箋用の表示には十分な解像度）
// - quality: auto で見た目を保ちつつファイルサイズを抑える
// - format: auto でブラウザに適した形式（WebPなど）に自動変換
function buildOptimizedUrl(originalUrl) {
  return originalUrl.replace(
    "/image/upload/",
    "/image/upload/w_1200,c_limit,q_auto,f_auto/"
  );
}

export async function uploadImageToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("画像のアップロードに失敗しました");
  }

  const data = await response.json();
  return buildOptimizedUrl(data.secure_url);
}
