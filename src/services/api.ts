import axios from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

let isHandlingUnauthorized = false;

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error("Помилка отримання токена для запиту:", e);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url ?? "");
    const isAuthRequest = /\/api\/Auth\/(login|register)/i.test(requestUrl);

    if (status === 401 && !isAuthRequest && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;

      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      } catch (storageError) {
        console.error("Помилка очищення авторизації:", storageError);
      }

      try {
        router.replace("/login");
      } catch (navigationError) {
        console.error("Помилка редіректу на логін:", navigationError);
      }

      setTimeout(() => {
        isHandlingUnauthorized = false;
      }, 500);
    }

    return Promise.reject(error);
  },
);

export default api;
