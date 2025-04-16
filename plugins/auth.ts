// plugins/auth.ts
import { useAuthStore } from "~/stores/auth";

const AUTH_TOKEN_KEY = "auth_token"; // Используем тот же ключ

export default defineNuxtPlugin(async (nuxtApp) => {
  console.log("[Auth Plugin] Initializing...");
  const authStore = useAuthStore();
  let fetchAttempted = false;

  // --- Инициализация состояния токена из localStorage (ТОЛЬКО КЛИЕНТ) ---
  if (process.client) {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    console.log(
      `[Auth Plugin] Checking localStorage for key '${AUTH_TOKEN_KEY}':`,
      storedToken ? "Found" : "Not Found"
    );

    // Если в localStorage есть токен, а в store его нет (т.е. свежая загрузка клиента)
    if (storedToken && authStore.token === null) {
      console.log(
        "[Auth Plugin] Token found in localStorage. Hydrating store state."
      );
      // Напрямую устанавливаем токен в состояние store.
      // НЕ используем setToken здесь, чтобы не перезаписывать localStorage лишний раз.
      authStore.token = storedToken;
    }
    // Если в localStorage токена нет, но он почему-то есть в store (маловероятно, но для чистоты)
    else if (!storedToken && authStore.token !== null) {
      console.warn(
        "[Auth Plugin] Token mismatch (store has one, LS doesn't). Clearing store token."
      );
      authStore.token = null; // Синхронизируем состояние store с localStorage
    }
  }
  // --- Конец инициализации ---

  // Теперь остальная логика плагина работает с состоянием store,
  // которое на клиенте отражает данные из localStorage.

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
