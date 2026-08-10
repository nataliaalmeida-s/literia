import {
  Bell,
  BookOpen,
  Heart,
  History,
  Home,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import "./Sidebar.css";
import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../../contexts/AuthContext";

import {
  useEffect,
  useState,
} from "react";

import {
  apiRequest,
} from "../../services/api";

import {
  NOTIFICATIONS_REFRESH_EVENT,
} from "../../utils/notificationEvents";

const navigation = [
  {
    label: "Início",
    icon: Home,
    to: "/",
  },
  {
    label: "Gerar resumo",
    icon: Sparkles,
    to: "/resumo",
  },
  {
    label: "Minha biblioteca",
    icon: BookOpen,
    to: "/biblioteca",
  },
  {
    label: "Histórico",
    icon: History,
    to: "/historico",
  },
  {
    label: "Favoritos",
    icon: Heart,
    to: "/favoritos",
  },
  {
    label: "Notificações",
    icon: Bell,
    to: "/notificacoes",
  },
];

export default function Sidebar({
  collapsed,
  onToggle,
}) {
  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false);

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0);

  useEffect(() => {
    let componentIsMounted = true;

    async function updateUnreadCount() {
      try {
        const data = await apiRequest(
          "/api/notifications/unread-count",
        );

        if (componentIsMounted) {
          setUnreadNotifications(
            Number(data?.count) || 0,
          );
        }
      } catch (requestError) {
        if (componentIsMounted) {
          setUnreadNotifications(0);
        }

        if (
          requestError?.status !== 401
        ) {
          console.error(
            "Erro ao carregar contador de notificações:",
            requestError,
          );
        }
      }
    }

    updateUnreadCount();

    window.addEventListener(
      NOTIFICATIONS_REFRESH_EVENT,
      updateUnreadCount,
    );

    window.addEventListener(
      "focus",
      updateUnreadCount,
    );

    return () => {
      componentIsMounted = false;

      window.removeEventListener(
        NOTIFICATIONS_REFRESH_EVENT,
        updateUnreadCount,
      );

      window.removeEventListener(
        "focus",
        updateUnreadCount,
      );
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();

      navigate("/login", {
        replace: true,
      });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <aside
      className={`sidebar ${collapsed ? "is-collapsed" : ""
        } ${mobileMenuOpen
          ? "is-mobile-open"
          : ""
        }`}
    >
      <div className="sidebar-top">
        <div className="logo">
          <span className="logo-icon">
            <BookOpen size={22} />
          </span>

          <span className="logo-text">
            LiterIA
          </span>
        </div>

        <button
          type="button"
          className="sidebar-toggle sidebar-toggle-desktop"
          onClick={onToggle}
          aria-label={
            collapsed
              ? "Expandir menu lateral"
              : "Recolher menu lateral"
          }
          title={
            collapsed
              ? "Expandir menu"
              : "Recolher menu"
          }
        >
          {collapsed ? (
            <PanelLeftOpen size={19} />
          ) : (
            <PanelLeftClose size={19} />
          )}
        </button>

        <button
          type="button"
          className="sidebar-toggle sidebar-toggle-mobile"
          onClick={() =>
            setMobileMenuOpen(
              (currentState) =>
                !currentState,
            )
          }
          aria-label={
            mobileMenuOpen
              ? "Fechar menu"
              : "Abrir menu"
          }
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>
      </div>

      <NavLink
        to="/perfil"
        className={({ isActive }) =>
          `profile ${isActive ? "active" : ""
          }`
        }
        aria-label="Abrir meu perfil"
      >
        <div className="avatar">
          <UserRound size={24} />
        </div>

        <div className="profile-text">
          <strong>
            Olá, {user?.name || "leitora"}
          </strong>

          <span>Meu perfil</span>
        </div>
      </NavLink>

      <nav className="sidebar-navigation">
        {navigation.map(({ label, icon: Icon, to }) =>
          to ? (
            <NavLink
              key={label}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={1.8} />

              <span className="nav-label">
                {label}
              </span>

              {label === "Notificações" &&
                unreadNotifications > 0 && (
                  <span
                    className="nav-notification-badge"
                    aria-label={`${unreadNotifications} notificações não lidas`}
                  >
                    {unreadNotifications > 99
                      ? "99+"
                      : unreadNotifications}
                  </span>
                )}
            </NavLink>
          ) : (
            <button
              key={label}
              type="button"
              className="nav-item"
            >
              <Icon size={19} strokeWidth={1.8} />

              <span className="nav-label">
                {label}
              </span>

              {label === "Notificações" &&
                unreadNotifications > 0 && (
                  <span
                    className="nav-notification-badge"
                    aria-label={`${unreadNotifications} notificações não lidas`}
                  >
                    {unreadNotifications > 99
                      ? "99+"
                      : unreadNotifications}
                  </span>
                )}
            </button>
          ),
        )}
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/configuracoes"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
          title={
            collapsed
              ? "Configurações"
              : undefined
          }
          aria-label="Configurações"
        >
          <Settings
            size={19}
            strokeWidth={1.8}
          />

          <span className="nav-label">
            Configurações
          </span>
        </NavLink>

        <button
          type="button"
          className="nav-item logout"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={collapsed ? "Sair" : undefined}
          aria-label="Sair"
        >
          <LogOut
            size={19}
            strokeWidth={1.8}
          />

          <span className="nav-label">
            {isLoggingOut
              ? "Saindo..."
              : "Sair"}
          </span>
        </button>
      </div>
    </aside>
  );
}