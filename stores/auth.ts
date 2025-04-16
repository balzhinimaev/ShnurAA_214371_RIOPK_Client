// stores/auth.ts
import { defineStore } from "pinia";
import type { UserResponseDto } from "~/types/auth"; // Предполагаем, что типы DTO вынесены

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: useCookie<string | null>("auth_token", {
      // Используем Cookie для хранения токена
      maxAge: 60 * 60 * 24 * 7, // Например, 7 дней
      sameSite: "lax",
    }),
    user: null as UserResponseDto | null,
    // isAuthenticated: false, // Заменим на computed getter
  }),
  getters: {
    // Вычисляемое свойство для проверки аутентификации
    isAuthenticated: (state) => !!state.token && !!state.user,
    // Можно добавить геттер для ролей, если нужно
    // userRoles: (state) => state.user?.roles || [],
  },
  actions: {
    // Устанавливаем токен (например, после логина/регистрации)
    setToken(newToken: string | null) {
      this.token = newToken; // Автоматически обновит cookie
    },

    // Устанавливаем данные пользователя (после логина или /me)
    setUser(userData: UserResponseDto | null) {
      this.user = userData;
    },

    // Выход из системы
    logout() {
      console.log("Logging out...");
      this.setToken(null);
      this.setUser(null);
      // Опционально: редирект на страницу входа
      // const router = useRouter();
      // router.push('/login');
      // В Pinia store прямой доступ к useRouter не рекомендуется, лучше делать редирект из компонента/middleware
      navigateTo("/login", { replace: true });
    },

    // (Асинхронное действие) Загрузка данных пользователя с бэкенда
    async fetchUser() {
      if (!this.token) {
        console.log("fetchUser: No token found.");
        return; // Нет токена - не можем загрузить пользователя
      }
      console.log("fetchUser: Fetching user data...");

      const config = useRuntimeConfig();
      try {
        // Используем встроенный $fetch Nuxt
        const userData = await $fetch<UserResponseDto>(`/auth/me`, {
          baseURL: config.public.apiBase,
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
        console.log("fetchUser: User data received:", userData);
        this.setUser(userData);
      } catch (error: any) {
        console.error("fetchUser: Error fetching user:", error);
        // Если ошибка (например, 401), токен невалиден, выходим из системы
        if (error.response?.status === 401) {
          console.warn("fetchUser: Token invalid or expired, logging out.");
          this.logout(); // Вызываем logout, который очистит состояние и редиректит
        } else {
          // Другая ошибка, просто очищаем пользователя, но оставляем токен (возможно, временная проблема сети)
          this.setUser(null);
        }
      }
    },

    // (Асинхронное действие) Логин
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
        this.setToken(response.accessToken);
        console.log("[AuthStore] Token SET in store/cookie:", this.token);
        this.setUser(response.user);
        console.log("[AuthStore] User SET in store:", this.user);
        // Редирект после успешного логина
        navigateTo("/", { replace: true });
      } catch (error: any) {
        console.error("Login failed:", error);
        this.setToken(null); // Сбрасываем токен при ошибке логина
        this.setUser(null);
        // Пробрасываем ошибку, чтобы компонент мог ее показать
        throw error;
      }
    },

    // (Асинхронное действие) Регистрация
    async register(userInfo: {
      name: string;
      email: string;
      password: string;
    }) {
      const config = useRuntimeConfig();
      console.log(`Attempting registration for ${userInfo.email}`);
      try {
        // Ожидаем, что регистрация вернет UserResponseDto
        const registeredUser = await $fetch<UserResponseDto>(`/auth/register`, {
          baseURL: config.public.apiBase,
          method: "POST",
          body: userInfo,
        });
        console.log("Registration successful:", registeredUser);
        // После успешной регистрации можно сразу залогинить пользователя
        // или перенаправить на страницу логина
        // Вариант 1: Редирект на логин
        // navigateTo('/login');
        // Вариант 2: Попробовать залогиниться (если API это поддерживает или мы знаем пароль)
        await this.login({
          email: userInfo.email,
          password: userInfo.password,
        });
      } catch (error: any) {
        console.error("Registration failed:", error);
        this.setToken(null); // Сбрасываем токен/пользователя на всякий случай
        this.setUser(null);
        // Пробрасываем ошибку для отображения в компоненте
        throw error;
      }
    },
  },
});

// Определяем типы DTO (можно вынести в отдельный файл, например, types/auth.ts)
// Определение должно совпадать с вашими DTO на бэкенде
declare module "~/types/auth" {
  // Используем declare module для типизации
  export interface UserResponseDto {
    id: string;
    name: string;
    email: string;
    roles: string[]; // Или более конкретный тип UserRole[]
    createdAt: string; // Или Date
    updatedAt: string; // Или Date
  }
}
