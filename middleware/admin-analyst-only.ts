// middleware/admin-analyst-only.ts
import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  const middlewareName = "AdminAnalystOnly"; // Для логов
  console.log(`[${middlewareName} Middleware] Running for path: ${to.path}`);

  // 1. Проверяем, аутентифицирован ли пользователь
  // Хотя authMiddleware должен был отработать раньше, дублируем проверку для надежности
  if (!authStore.isAuthenticated) {
    console.warn(
      `[${middlewareName} Middleware] Access Forbidden. User not authenticated.`
    );
    // Если не аутентифицирован, authMiddleware уже должен был перенаправить на логин,
    // но на всякий случай прерываем навигацию с ошибкой 403 (или редирект)
    return abortNavigation(
      createError({
        statusCode: 403,
        statusMessage: "Доступ запрещен: требуется аутентификация и права.",
      })
    );
    // Или редирект: return navigateTo('/login');
  }

  // 2. Проверяем наличие нужных ролей
  const userRoles = authStore.user?.roles;
  const allowedRoles = ["ADMIN", "ANALYST"];

  if (!userRoles || !userRoles.some((role) => allowedRoles.includes(role))) {
    console.warn(
      `[${middlewareName} Middleware] Access Forbidden. User roles [${
        userRoles?.join(", ") ?? "none"
      }] do not include required roles [${allowedRoles.join(", ")}]. User ID: ${
        authStore.user?.id
      }`
    );
    // Если нет нужной роли, прерываем навигацию с ошибкой 403
    return abortNavigation(
      createError({
        statusCode: 403,
        statusMessage:
          "Доступ запрещен (Требуются права Администратора или Аналитика).",
      })
    );
    // Или редирект на главную: return navigateTo('/');
  }

  // 3. Если все проверки пройдены
  console.log(
    `[${middlewareName} Middleware] Access Granted. User roles: [${userRoles.join(
      ", "
    )}]`
  );
  // Ничего не возвращаем, разрешаем переход на целевую страницу
});
