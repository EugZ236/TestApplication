import * as SecureStore from "expo-secure-store"; // Замінили AsyncStorage
import api from "./api";

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  deviceToken: string;
}

export interface AuthResponse {
  token: string;
  id?: string | number;
  email: string;
  firstName: string;
  lastName: string;
}

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

function decodeBase64(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(base64);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64").toString("binary");
  }

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let str = "";
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < base64.length; i += 1) {
    const value = chars.indexOf(base64[i]);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      str += String.fromCharCode((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }

  return str;
}

function parseJwtPayload(token: string): any | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = decodeBase64(parts[1]);
    const decoded = decodeURIComponent(
      payload
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join(""),
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getUserIdFromToken(token: string): string | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  return (
    payload.sub ??
    payload.nameid ??
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ] ??
    null
  );
}

const authService = {
  // -------------------------
  // REGISTER
  // -------------------------
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post("/api/Auth/register", data);

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
      const response = await api.post("/api/Auth/login", { email, password });
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

  saveUser: async (user: any, token?: string) => {
    const userData: any = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    if (user.id != null) {
      userData.id = user.id;
    } else if (token) {
      const tokenUserId = getUserIdFromToken(token);
      if (tokenUserId) {
        userData.id = tokenUserId;
      }
    }
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
  },

  getToken: async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  getCurrentUser: async (): Promise<any | null> => {
    const storedUserValue = await SecureStore.getItemAsync(USER_KEY);
    if (!storedUserValue) return null;
    const storedUser = JSON.parse(storedUserValue);
    if (storedUser.id != null) {
      return storedUser;
    }
    const token = await authService.getToken();
    if (token) {
      const tokenUserId = getUserIdFromToken(token);
      if (tokenUserId) {
        const userWithId = { ...storedUser, id: tokenUserId };
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userWithId));
        return userWithId;
      }
    }
    return storedUser;
  },
};

export default authService;
