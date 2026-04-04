import { createBrowserRouter, Navigate } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Guides } from "../pages/Guides";
import { ClientDashboard } from "../pages/ClientDashboard";
import { TechDashboard } from "../pages/TechDashboard";
import { TicketList } from "../pages/TicketList";
import { TicketDetail } from "../pages/TicketDetail";
import { TicketChatPage } from "../pages/TicketChatPage";
import { CreateTicket } from "../pages/CreateTicket";
import { BackendDocs } from "../pages/BackendDocs";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/guides",
    element: <Guides />,
  },
  {
    path: "/client",
    element: <Navigate to="/client/dashboard" replace />,
  },
  {
    path: "/technician",
    element: <Navigate to="/technician/dashboard" replace />,
  },
  {
    path: "/client/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["client"]}>
        <ClientDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/technician/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["technician"]}>
        <TechDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets",
    element: (
      <ProtectedRoute>
        <TicketList />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/:id",
    element: (
      <ProtectedRoute>
        <TicketDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/:id/chat",
    element: (
      <ProtectedRoute>
        <TicketChatPage />
      </ProtectedRoute>
    ),
  },
  // Rutas adicionales
  {
    path: "/client/create-ticket",
    element: (
      <ProtectedRoute allowedRoles={['client']}>
        <CreateTicket />
      </ProtectedRoute>
    ),
  },
  {
    path: "/backend-docs",
    element: <BackendDocs />,
  },
]);
