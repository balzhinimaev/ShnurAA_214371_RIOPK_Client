// plugins/auth.ts
import { useAuthStore } from "~/stores/auth";

const AUTH_TOKEN_KEY = "auth_token"; // Используем тот же ключ

export default defineNuxtPlugin(async (nuxtApp) => {
  console.log("[Auth Plugin] Initializing...");
  const authStore = useAuthStore();
  let fetchAttempted = false;

  // --- Инициализация состояния токена из cookie / localStorage ---
  const tokenCookie = useCookie<string | null>(AUTH_TOKEN_KEY);
  let initialToken: string | null = tokenCookie.value ?? null;

  if (!initialToken && process.client) {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    console.log(
      `[Auth Plugin] Checking localStorage for key '${AUTH_TOKEN_KEY}':`,
      storedToken ? "Found" : "Not Found"
    );
    initialToken = storedToken ?? null;
    // Если нашли токен только в localStorage, синхронизируем cookie для SSR
    if (initialToken) {
      console.log(
        "[Auth Plugin] Token found in localStorage. Syncing cookie/state."
      );
      authStore.setToken(initialToken);
    }
  }

  if (initialToken && authStore.token !== initialToken) {
    console.log("[Auth Plugin] Hydrating store token from cookie.");
    authStore.setToken(initialToken);
  } else if (!initialToken && authStore.token) {
    console.warn("[Auth Plugin] No token found. Clearing store state token.");
    authStore.setToken(null);
  }

  // Проверяем токен в состоянии store ПОСЛЕ попытки гидратации
  if (authStore.token) {
    console.log(
      "[Auth Plugin] Token is present in store state. Attempting to fetch user..."
    );
    // Если пользователь УЖЕ есть в store (например, после быстрой навигации), не делаем запрос
    if (!authStore.user) {
      fetchAttempted = true;
      try {
        await authStore.fetchUser(); // fetchUser использует authStore.token
        console.log("[Auth Plugin] fetchUser completed.");
      } catch (error) {
        // Ошибка уже обработана внутри fetchUser (включая logout при 401)
        console.error(
          "[Auth Plugin] Error during initial fetchUser (handled by store)."
        );
      }
    } else {
      console.log("[Auth Plugin] User data already exists in store.");
    }
  } else {
    console.log("[Auth Plugin] No token present in store state after init.");
    // Если токена нет, убедимся, что пользователь точно null
    authStore.setUser(null);
  }

  // Предоставляем флаг для middleware
  nuxtApp.provide("authFetchAttempted", fetchAttempted);
});
