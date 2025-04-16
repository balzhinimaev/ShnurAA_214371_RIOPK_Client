// middleware/admin-only.ts
import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  console.log("[AdminOnly Middleware] Running..."); // Добавьте лог

  // Проверяем, аутентифицирован ли пользователь И имеет ли он роль ADMIN
  if (!authStore.isAuthenticated || !authStore.user?.roles?.includes("ADMIN")) {
    console.warn(
      "[AdminOnly Middleware] Access Forbidden. User is not ADMIN or not authenticated."
    );
    // Перенаправляем на главную страницу или показываем страницу ошибки 403
    // return navigateTo('/'); // Вариант 1: Редирект на главную
    return abortNavigation(
      // Вариант 2: Прервать навигацию и показать ошибку
      createError({
        statusCode: 403,
        statusMessage: "Доступ запрещен (Admin Only)",
      })
    );
  }

  console.log("[AdminOnly Middleware] Access Granted."); // Лог успеха
  // Если пользователь админ, ничего не делаем (пропускаем дальше)
});
