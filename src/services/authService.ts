import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface RegisterResponse {
    message: string;
}

export interface LoginResponse {
    token: string;
    user: any;
}

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const authService = {
    // -------------------------
    // REGISTER
    // -------------------------
    register: async (data: RegisterData): Promise<RegisterResponse> => {
        try {
            console.log("[AuthService] Виконання реєстрації:", {
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
            });

            const response = await api.post("/Auth/register", data);

            console.log("[AuthService] Реєстрація успішна:", response.data);

            return response.data;
        } catch (error: any) {
            console.error(
                "[AuthService] Помилка при реєстрації:",
                error.response?.data || error.message
            );
            throw error;
        }
    },

    // -------------------------
    // LOGIN
    // -------------------------
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const response = await api.post("/Auth/login", { email, password });

        // Підготувати user об’єкт
        const user = {
            email: response.data.email,
            firstName: response.data.firstName,
            lastName: response.data.lastName,
        };

        return { token: response.data.token, user };
    },

    // -------------------------
    // LOGOUT
    // -------------------------
    logout: async (): Promise<void> => {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
    },

    // -------------------------
    // TOKEN + USER STORAGE
    // -------------------------
    saveToken: async (token: string) => {
        await AsyncStorage.setItem(TOKEN_KEY, token);
    },

    saveUser: async (user: any) => {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    getToken: async (): Promise<string | null> => {
        return await AsyncStorage.getItem(TOKEN_KEY);
    },

    getCurrentUser: async (): Promise<any | null> => {
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        return storedUser ? JSON.parse(storedUser) : null;
    },
};

// ---------------------------------------
// Автоматичне додавання токена у всі запити
// ---------------------------------------
api.interceptors.request.use((config) => {
    return authService.getToken().then((token) => {
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
});

export default authService;
