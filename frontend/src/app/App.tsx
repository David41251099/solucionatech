import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "../context/AuthContext";
import { ChatProvider } from "../context/ChatContext";
import { TicketChat } from "../components/chat/TicketChat";
import { Toaster } from "../components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <RouterProvider router={router} />
        <TicketChat mode="floating" />
        <Toaster />
      </ChatProvider>
    </AuthProvider>
  );
}
