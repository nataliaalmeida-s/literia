import {
  Navigate,
  Outlet,
} from "react-router";

import {
  useAuth,
} from "../contexts/AuthContext";

export default function PublicRoute() {
  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-route-loading">
        <span />
        <strong>
          Verificando sua sessão...
        </strong>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
}