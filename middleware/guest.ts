// middleware/guest.ts
import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore();
  const { $authFetchAttempted } = useNuxtApp();

  console.log(`[Guest Middleware] Running for path: ${to.path}`);
  console.log(
    `[Guest Middleware] Current state: token=${!!authStore.token}, user=${!!authStore.user}, fetchAttempted=${$authFetchAttempted}`
  );

  // Если токен есть, а пользователя нет, и плагин еще не пытался
  if (authStore.token && !authStore.user && !$authFetchAttempted) {
    console.log(
      "[Guest Middleware] Token exists, user missing, fetch not attempted. Fetching user..."
    );
    await authStore.fetchUser();
    console.log(
      `[Guest Middleware] Fetch complete. New state: user=${!!authStore.user}`
    );
  }

  // Если ПОСЛЕ попытки загрузки пользователь аутентифицирован,
  // перенаправляем с гостевых страниц на главную
  if (authStore.isAuthenticated) {
    console.log(
      "[Guest Middleware] Authenticated. Redirecting from guest page to /."
    );
    return navigateTo("/", { replace: true });
  }

  console.log(
    "[Guest Middleware] Not authenticated. Allowing access to guest page."
  );
});
