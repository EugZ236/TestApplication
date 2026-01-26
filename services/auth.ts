import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

const toBase64 = (str: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return str;
  }
};

const generateMockJWT = (userId: string): string => {
  const header = toBase64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = toBase64(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    }),
  );
  const signature = "mock_signature";
  return `${header}.${payload}.${signature}`;
};

export const authService = {
  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!email || !password || !name) {
      throw new Error("All fields are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const existingUsers = await AsyncStorage.getItem("mock_users");
    const users = existingUsers ? JSON.parse(existingUsers) : [];

    if (users.some((u: any) => u.email === email)) {
      throw new Error("Email already registered");
    }

    const userId = `user_${Date.now()}`;
    const user: AuthUser = {
      id: userId,
      name,
      email,
    };

    const token = generateMockJWT(userId);

    users.push({ ...user, password });
    await AsyncStorage.setItem("mock_users", JSON.stringify(users));

    await AsyncStorage.setItem("auth_token", token);
    await AsyncStorage.setItem("auth_user", JSON.stringify(user));

    return { user, token };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const existingUsers = await AsyncStorage.getItem("mock_users");
    const users = existingUsers ? JSON.parse(existingUsers) : [];

    //     const user = users.find((u: any) => u.email === email && u.password === password);
    const response = await fetch("https://localhost:7200/api/Auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const user = await response.json();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    //     const { password: _, ...userWithoutPassword } = user;
    //     const token = generateMockJWT(user.id);
    const { token, ...userWithoutToken } = user;

    await AsyncStorage.setItem("auth_token", token);
    //     await AsyncStorage.setItem('auth_user', JSON.stringify(userWithoutPassword));
    await AsyncStorage.setItem("auth_user", JSON.stringify(userWithoutToken));

    //     return { user: userWithoutPassword, token };
    return { user: userWithoutToken, token };
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem("auth_token");
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const userJson = await AsyncStorage.getItem("auth_user");
    return userJson ? JSON.parse(userJson) : null;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_user");
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem("auth_token");
    return !!token;
  },
};
