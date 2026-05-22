import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { TicketChat } from "../components/chat/TicketChat";
import { Toaster } from "../components/ui/sonner";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <TicketChat mode="floating" />
      <Toaster />
    </>
  );
}
