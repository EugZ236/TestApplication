import authService, { AuthResponse } from "@/src/services/authService";
import React, { createContext, ReactNode, useEffect, useState } from "react";

interface AuthContextType {
  user: any | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    deviceToken: string,
  ) => Promise<void>;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  error: string | null;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = await authService.getToken();
        const storedUser = await authService.getCurrentUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (err) {
        console.error("Помилка при перевірці авторизації:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);
  const handleAuthSuccess = async (data: AuthResponse) => {
    const { token: newToken, ...userData } = data;
    setToken(newToken);
    setUser(userData);
    await authService.saveToken(newToken);
    await authService.saveUser(userData);
  };

  // --------------------
  // РЕЄСТРАЦІЯ
  // --------------------
  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    deviceToken: string,
  ) => {
    try {
      setError(null);

      const data = await authService.register({
        firstName,
        lastName,
        email,
        password,
        deviceToken,
      });

      await handleAuthSuccess(data);
    } catch (err: any) {
      const errorMessage = err.response?.data || "Registration failed";
      setError(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage),
      );
      throw err;
    }
  };

  // --------------------
  // ЛОГІН
  // --------------------
  const login = async (email: string, password: string) => {
    try {
      setError(null);

      const data = await authService.login(email, password);
      await handleAuthSuccess(data);
    } catch (err: any) {
      const errorMessage = err.response?.data || "Login failed";
      setError(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage),
      );
      throw err;
    }
  };

  // --------------------
  // ЛОГАУТ
  // --------------------
  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        register,
        login,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
