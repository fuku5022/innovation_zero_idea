const CLOUD_NAME = "gkhlbpiz";
const UPLOAD_PRESET = "xbw8qgkj";

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
  return data.secure_url;
}
