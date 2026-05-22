import { io } from "socket.io-client";
import { getToken, publicApiUrl } from "../utils/api";
import { SOCKET_EVENTS } from "../socket/events";
import { devError, devLog, devWarn } from "../utils/devLog";
import { pushRealtimeDebug } from "../utils/realtimeDebug";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || publicApiUrl || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  path: "/socket.io",
  autoConnect: false,
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  timeout: 10000,
});

export const connectSocket = () => {
  const token = getToken();

  socket.auth = {
    token: token || undefined,
  };

  pushRealtimeDebug("socket", "Intentando conectar socket", {
    socketUrl: SOCKET_URL,
    hasToken: Boolean(token),
  });

  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as any).socket = socket;
}

socket.on("connect", () => {
  devLog("[SOCKET] Conectado:", socket.id);
  pushRealtimeDebug("socket", "Socket conectado", { socketId: socket.id });
});

socket.on("disconnect", (reason) => {
  devLog("[SOCKET] Desconectado:", reason);
  pushRealtimeDebug("socket", "Socket desconectado", { reason });
});

socket.on("connect_error", (err) => {
  devError("[SOCKET] Error conexion:", err.message);
  pushRealtimeDebug("socket", "Error de conexion", { message: err.message });
});

socket.on(SOCKET_EVENTS.SOCKET_ERROR, (payload) => {
  devWarn("[SOCKET] Error de servidor:", payload);
  pushRealtimeDebug("socket", "Error emitido por servidor", payload);
});

socket.onAny((event, ...args) => {
  devLog(`[SOCKET EVENT] ${event}`, args);
  pushRealtimeDebug("socket:event", String(event), args[0]);
});
