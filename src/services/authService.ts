import * as SecureStore from "expo-secure-store"; // Замінили AsyncStorage
import api from "./api";

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
}

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const authService = {
  // -------------------------
  // REGISTER
  // -------------------------
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post("/Auth/register", data);

      const authData: AuthResponse = response.data;
      return authData;
    } catch (error: any) {
      console.error(
        "[AuthService] Помилка реєстрації:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // -------------------------
  // LOGIN
  // -------------------------
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post("/Auth/login", { email, password });
      return response.data;
    } catch (error: any) {
      console.error(
        "[AuthService] Помилка логіну:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // -------------------------
  // LOGOUT
  // -------------------------
  logout: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  // -------------------------
  // STORAGE (Secure)
  // -------------------------
  saveToken: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  saveUser: async (user: any) => {
    const userData = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
  },

  getToken: async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  getCurrentUser: async (): Promise<any | null> => {
    const storedUser = await SecureStore.getItemAsync(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  },
};

export default authService;
