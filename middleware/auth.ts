// middleware/auth.ts
import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore();
  const { $authFetchAttempted } = useNuxtApp(); // Получаем флаг из плагина

  console.log(`[Auth Middleware] Running for path: ${to.path}`);
  console.log(
    `[Auth Middleware] Current state: token=${!!authStore.token}, user=${!!authStore.user}, fetchAttempted=${$authFetchAttempted}`
  );

  // Если токен есть, а пользователя нет, И плагин ЕЩЕ НЕ пытался его загрузить
  // (это может случиться при навигации на стороне клиента)
  if (authStore.token && !authStore.user && !$authFetchAttempted) {
    console.log(
      "[Auth Middleware] Token exists, user missing, fetch not attempted by plugin. Fetching user..."
    );
    await authStore.fetchUser();
    console.log(
      `[Auth Middleware] Fetch complete. New state: user=${!!authStore.user}`
    );
  }

  // Проверяем аутентификацию ПОСЛЕ всех попыток загрузить пользователя
  // Используем геттер isAuthenticated для надежности
  if (!authStore.isAuthenticated) {
    console.log("[Auth Middleware] Not authenticated. Redirecting to login.");
    // Можно сохранить путь для редиректа после логина
    const redirectPath = to.fullPath !== "/" ? to.fullPath : undefined;
    return navigateTo(
      {
        path: "/login",
        query: redirectPath ? { redirect: redirectPath } : undefined,
      },
      { replace: true }
    );
  }

  console.log("[Auth Middleware] Authenticated. Allowing access.");
  // Если аутентифицирован, просто продолжаем навигацию (ничего не возвращаем)
});
