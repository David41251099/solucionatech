import { getToken, publicApiBaseUrl } from "../utils/api";

const API_BASE_URL = publicApiBaseUrl;

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.error || "Error al subir archivo";
    throw new Error(message);
  }

  return data.url as string;
};
