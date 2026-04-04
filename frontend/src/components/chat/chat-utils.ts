import type { TicketMessage } from "../../types";
import { publicApiUrl } from "../../utils/api";
import { devWarn } from "../../utils/devLog";

let hasWarnedMissingApiUrl = false;

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|ogg)$/i;

const joinUrl = (base: string, path: string) => {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "/");
  return `${normalizedBase}${normalizedPath}`;
};

export const getChatFileUrl = (fileUrl?: string | null) => {
  if (!fileUrl) return null;

  const baseUrl = import.meta.env.VITE_API_URL;

  if (!baseUrl && import.meta.env.DEV && !hasWarnedMissingApiUrl) {
    hasWarnedMissingApiUrl = true;
    devWarn("VITE_API_URL no definido");
  }

  return fileUrl.startsWith("http") ? fileUrl : joinUrl(publicApiUrl, fileUrl);
};

export const getChatFileKind = (fileUrl?: string | null) => {
  if (!fileUrl) return "none";

  const cleanUrl = fileUrl.split("?")[0]?.split("#")[0] ?? fileUrl;

  if (IMAGE_EXTENSIONS.test(cleanUrl)) return "image";
  if (VIDEO_EXTENSIONS.test(cleanUrl)) return "video";
  return "file";
};

export const getMessagePreview = (message?: TicketMessage | null) => {
  if (!message) return "Sin mensajes todavia";

  const textContent = message.message?.trim() ?? "";

  if (textContent && !/^adjunto$/i.test(textContent)) {
    return textContent;
  }

  const fileKind = getChatFileKind(message.file_url);

  if (fileKind === "image") return "Imagen adjunta";
  if (fileKind === "video") return "Video adjunto";
  if (fileKind === "file") return "Archivo adjunto";

  return "Sin contenido";
};

