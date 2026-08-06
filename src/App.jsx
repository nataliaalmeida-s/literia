import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import AppLayout from "./components/Layout/AppLayout";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import SummaryPage from "./pages/SummaryPage";
import FavoritesPage from "./pages/FavoritesPage";
import HistoryPage from "./pages/HistoryPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";

import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route
        path="/esqueci-senha"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/redefinir-senha"
        element={<ResetPasswordPage />}
      />
      
      {/* Páginas públicas */}
      <Route element={<PublicRoute />}>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/cadastro"
          element={<RegisterPage />}
        />
      </Route>

      {/* Páginas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/resumo"
            element={<SummaryPage />}
          />

          <Route
            path="/biblioteca"
            element={<LibraryPage />}
          />

          <Route
            path="/historico"
            element={<HistoryPage />}
          />

          <Route
            path="/favoritos"
            element={<FavoritesPage />}
          />

          <Route
            path="/notificacoes"
            element={<NotificationsPage />}
          />

          <Route
            path="/configuracoes"
            element={<SettingsPage />}
          />
          <Route
            path="/perfil"
            element={<ProfilePage />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}