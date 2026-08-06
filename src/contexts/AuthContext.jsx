import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  apiRequest,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const checkSession = useCallback(
    async () => {
      try {
        const data = await apiRequest(
          "/api/auth/me",
        );

        setUser(data.user);
      } catch (error) {
        /*
          O erro 401 apenas significa que não existe
          uma sessão ativa.
        */
        if (error.status !== 401) {
          console.error(
            "Erro ao verificar sessão:",
            error,
          );
        }

        setUser(null);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  async function login({
    email,
    password,
  }) {
    const data = await apiRequest(
      "/api/auth/login",
      {
        method: "POST",

        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

    setUser(data.user);

    return data.user;
  }

  async function register({
    name,
    email,
    password,
  }) {
    const data = await apiRequest(
      "/api/auth/register",
      {
        method: "POST",

        body: JSON.stringify({
          name,
          email,
          password,
        }),
      },
    );

    return data.user;
  }

  async function logout() {
    try {
      await apiRequest(
        "/api/auth/logout",
        {
          method: "POST",
        },
      );
    } finally {
      /*
        Mesmo se houver problema de rede,
        removemos o usuário do estado local.
      */
      setUser(null);
    }
  }

  const updateCurrentUser = useCallback(
    (nextUser) => {
      setUser((currentUser) => {
        if (!currentUser) {
          return nextUser;
        }

        return {
          ...currentUser,
          ...nextUser,
        };
      });
    },
    [],
  );

  const clearCurrentUser = useCallback(
    () => {
      setUser(null);
    },
    [],
  );

  const deleteAccount = useCallback(
    async ({
      password,
      confirmation,
    }) => {
      await apiRequest(
        "/api/account",
        {
          method: "DELETE",

          body: JSON.stringify({
            password,
            confirmation,
          }),
        },
      );

      setUser(null);
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),

      login,
      register,
      logout,
      refreshUser: checkSession,

      updateCurrentUser,
      clearCurrentUser,
      deleteAccount,
    }),
    [
      user,
      isLoading,
      checkSession,
      updateCurrentUser,
      clearCurrentUser,
      deleteAccount,
    ],
  );

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve ser usado dentro de AuthProvider.",
    );
  }

  return context;
}