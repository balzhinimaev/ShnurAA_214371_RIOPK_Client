// plugins/auth.ts
import { useAuthStore } from "~/stores/auth";

export default defineNuxtPlugin(async (nuxtApp) => {
  console.log("[Auth Plugin] Initializing...");
  const authStore = useAuthStore();

  // Этот флаг поможет избежать повторного вызова fetchUser из middleware
  let fetchAttempted = false;

  // Запускаем только один раз при инициализации приложения
  // Проверяем наличие токена в cookie НА СТАРТЕ
  if (authStore.token) {
    console.log(
      "[Auth Plugin] Token found in cookie. Attempting to fetch user..."
    );
    // Если пользователь УЖЕ есть в store (например, после SSR или быстрой навигации), не делаем запрос
    if (!authStore.user) {
      fetchAttempted = true;
      try {
        // Запускаем асинхронно, не блокируя инициализацию плагина
        // Важно: результат fetchUser обновит store, что увидят компоненты/middleware
        await authStore.fetchUser();
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
    console.log("[Auth Plugin] No token found in cookie on init.");
    // Если токена нет, убедимся, что пользователь точно null
    authStore.setUser(null);
  }

  // Можно добавить хелпер в nuxtApp, если нужно знать, была ли попытка загрузки
  nuxtApp.provide("authFetchAttempted", fetchAttempted);
});
