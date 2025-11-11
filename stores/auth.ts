// stores/auth.ts
import { defineStore } from "pinia";
import type { UserResponseDto } from "~/types/auth";

// Ключ для localStorage
const AUTH_TOKEN_KEY = "auth_token";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    // Инициализируем token как null.
    // Он будет заполнен из localStorage в плагине на стороне клиента.
    token: null as string | null,
    user: null as UserResponseDto | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    // userRoles: (state) => state.user?.roles || [], // Можно добавить
  },
  actions: {
    // Action для установки токена в state и localStorage
    setToken(newToken: string | null) {
      // 1. Обновляем состояние Pinia
      this.token = newToken;

      // 1а. Синхронизируем cookie (доступно и на сервере, и на клиенте)
      const tokenCookie = useCookie<string | null>(AUTH_TOKEN_KEY, {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      tokenCookie.value = newToken;

      // 2. Обновляем localStorage (ТОЛЬКО на клиенте)
      if (process.client) {
        if (newToken) {
          localStorage.setItem(AUTH_TOKEN_KEY, newToken);
          console.log(
            `[AuthStore] Token SET in localStorage (${AUTH_TOKEN_KEY})`
          );
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          console.log(
            `[AuthStore] Token REMOVED from localStorage (${AUTH_TOKEN_KEY})`
          );
        }
      }
    },

    // Устанавливаем данные пользователя (после логина или /me)
    setUser(userData: UserResponseDto | null) {
      this.user = userData;
    },

    // Выход из системы
    logout() {
      console.log("Logging out...");
      // setToken(null) обработает и state, и localStorage
      this.setToken(null);
      this.setUser(null);
      navigateTo("/login", { replace: true });
    },

    // Загрузка данных пользователя с бэкенда
    async fetchUser() {
      // Проверяем токен из СОСТОЯНИЯ store
      if (!this.token) {
        console.log("fetchUser: No token found in store state.");
        return;
      }
      console.log("fetchUser: Fetching user data (token exists in state)...");

      const config = useRuntimeConfig();
      try {
        const userData = await $fetch<UserResponseDto>(`/auth/me`, {
          baseURL: config.public.apiBase,
          headers: {
            // Используем токен из СОСТОЯНИЯ store
            Authorization: `Bearer ${this.token}`,
          },
        });
        console.log("fetchUser: User data received:", userData);
        this.setUser(userData);
      } catch (error: any) {
        console.error("fetchUser: Error fetching user:", error);
        if (error.response?.status === 401) {
          console.warn("fetchUser: Token invalid or expired, logging out.");
          this.logout(); // Вызываем logout, который очистит состояние и localStorage
        } else {
          // Другая ошибка, просто очищаем пользователя
          this.setUser(null);
        }
      }
    },

    // Логин
    async login(credentials: { email: string; password: string }) {
      const config = useRuntimeConfig();
      console.log(`Attempting login for ${credentials.email}`);
      try {
        const response = await $fetch<{
          accessToken: string;
          user: UserResponseDto;
        }>(`/auth/login`, {
          baseURL: config.public.apiBase,
          method: "POST",
          body: credentials,
        });
        console.log(
          "[AuthStore] Login successful response received:",
          response
        );
        // Используем action setToken, он обновит state и localStorage
        this.setToken(response.accessToken);
        this.setUser(response.user);
        console.log("[AuthStore] User SET in store:", this.user);
        navigateTo("/", { replace: true });
      } catch (error: any) {
        console.error("Login failed:", error);
        this.setToken(null); // Сбрасываем токен в state и localStorage при ошибке
        this.setUser(null);
        throw error;
      }
    },

    // Регистрация
    async register(userInfo: {
      name: string;
      email: string;
      password: string;
    }) {
      const config = useRuntimeConfig();
      console.log(`Attempting registration for ${userInfo.email}`);
      try {
        const registeredUser = await $fetch<UserResponseDto>(`/auth/register`, {
          baseURL: config.public.apiBase,
          method: "POST",
          body: userInfo,
        });
        console.log("Registration successful:", registeredUser);
        // Попробуем залогиниться после успешной регистрации
        await this.login({
          email: userInfo.email,
          password: userInfo.password,
        });
      } catch (error: any) {
        console.error("Registration failed:", error);
        this.setToken(null); // Сбрасываем токен в state и localStorage
        this.setUser(null);
        throw error;
      }
    },
  },
});

// Определение DTO остается таким же
declare module "~/types/auth" {
  export interface UserResponseDto {
    id: string;
    name: string;
    email: string;
    roles: string[];
    createdAt: string;
    updatedAt: string;
  }
}
