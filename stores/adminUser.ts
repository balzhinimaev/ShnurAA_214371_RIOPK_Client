// stores/adminUser.ts
import { defineStore } from "pinia";
import { useAuthStore } from "./auth"; // Для токена
import type { UserResponseDto } from "~/types/auth"; // Используем существующий тип
import type { UpdateUserDto } from "~/types/admin"; // Нужно будет создать этот тип

// --- Типы ---
// Определяем интерфейс для пагинированного ответа API
interface PaginatedUsersResponse {
  users: UserResponseDto[];
  total: number;
  offset: number;
  limit: number;
}

// Определяем интерфейс для параметров запроса списка
interface FetchUsersParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// --- Состояние Store ---
interface AdminUserState {
  users: UserResponseDto[];
  totalUsers: number;
  currentPage: number;
  usersPerPage: number;
  isLoading: boolean;
  error: string | null;
  // Состояние для редактирования (опционально, можно управлять в компоненте)
  // userToEdit: UserResponseDto | null;
  // isEditModalOpen: boolean;
}

export const useAdminUserStore = defineStore("adminUser", {
  state: (): AdminUserState => ({
    users: [],
    totalUsers: 0,
    currentPage: 1,
    usersPerPage: 10, // Значение по умолчанию
    isLoading: false,
    error: null,
  }),

  getters: {
    // Вычисляем общее количество страниц
    totalPages: (state) => {
      if (state.totalUsers === 0 || state.usersPerPage <= 0) return 1;
      return Math.ceil(state.totalUsers / state.usersPerPage);
    },
    // Геттер для данных текущего пользователя (если нужно будет не дать удалить себя)
    // currentUserId: () => useAuthStore().user?.id,
  },

  actions: {
    // --- Загрузка списка пользователей ---
    async fetchUsers(params: FetchUsersParams = {}) {
      console.log("[AdminUserStore] Fetching users with params:", params);
      this.isLoading = true;
      this.error = null;

      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.token) {
        this.isLoading = false;
        this.error = "Не авторизован.";
        return;
      }

      // Формируем параметры запроса, включая пагинацию
      const queryParams: Record<string, string | number> = {
        limit: params.limit ?? this.usersPerPage,
        offset: params.offset ?? (this.currentPage - 1) * this.usersPerPage,
      };
      if (params.sortBy) queryParams.sortBy = params.sortBy;
      if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

      try {
        const response = await $fetch<PaginatedUsersResponse>("/users", {
          baseURL: config.public.apiBase,
          method: "GET",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
          params: queryParams, // Используем params для GET запроса
        });

        console.log("[AdminUserStore] Users received:", response);
        this.users = response.users;
        this.totalUsers = response.total;
        // Обновляем текущую страницу на основе offset и limit (опционально)
        this.currentPage = Math.floor(response.offset / response.limit) + 1;
        this.usersPerPage = response.limit;
      } catch (err: any) {
        console.error("[AdminUserStore] Error fetching users:", err);
        this.error =
          err.data?.message ||
          err.message ||
          "Не удалось загрузить список пользователей.";
        this.users = []; // Очищаем список при ошибке
        this.totalUsers = 0;
      } finally {
        this.isLoading = false;
      }
    },

    // --- Обновление пользователя ---
    async updateUser(userId: string, data: UpdateUserDto): Promise<boolean> {
      console.log(`[AdminUserStore] Updating user ${userId} with data:`, data);
      // Можно добавить состояние загрузки для конкретной операции
      this.error = null; // Сбрасываем общую ошибку
      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.token) {
        this.error = "Не авторизован.";
        return false;
      }

      try {
        const updatedUser = await $fetch<UserResponseDto>(`/users/${userId}`, {
          baseURL: config.public.apiBase,
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            "Content-Type": "application/json",
          },
          body: data,
        });

        console.log("[AdminUserStore] User updated:", updatedUser);
        // Обновляем пользователя в локальном списке
        const index = this.users.findIndex((u) => u.id === userId);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        return true; // Возвращаем успех
      } catch (err: any) {
        console.error(`[AdminUserStore] Error updating user ${userId}:`, err);
        this.error =
          err.data?.message ||
          err.message ||
          "Не удалось обновить пользователя.";
        return false; // Возвращаем неудачу
      }
    },

    // --- Удаление пользователя ---
    async deleteUser(userId: string): Promise<boolean> {
      // Проверка, чтобы админ не удалил себя
      const authStore = useAuthStore();
      if (authStore.user?.id === userId) {
        this.error = "Нельзя удалить свою учетную запись.";
        console.warn("[AdminUserStore] Attempted to delete self.");
        return false;
      }

      console.log(`[AdminUserStore] Deleting user ${userId}`);
      this.error = null;
      const config = useRuntimeConfig();

      if (!authStore.token) {
        this.error = "Не авторизован.";
        return false;
      }

      try {
        // DELETE запросы обычно не возвращают тело, используем fetch напрямую или ожидаем пустой ответ
        await $fetch(`/users/${userId}`, {
          baseURL: config.public.apiBase,
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
          // Ожидаем статус 204 No Content, $fetch может выдать ошибку если будет тело
          // responseType: 'json' // Убрать или проверить, как $fetch обработает 204
        });

        console.log(`[AdminUserStore] User ${userId} deleted successfully.`);
        // Удаляем пользователя из локального списка
        this.users = this.users.filter((u) => u.id !== userId);
        this.totalUsers--; // Уменьшаем общее количество
        // Проверка, не опустела ли текущая страница (если да, перейти на предыдущую)
        if (this.users.length === 0 && this.currentPage > 1) {
          this.changePage(this.currentPage - 1);
        }
        return true;
      } catch (err: any) {
        console.error(`[AdminUserStore] Error deleting user ${userId}:`, err);
        this.error =
          err.data?.message ||
          err.message ||
          "Не удалось удалить пользователя.";
        // Ошибка 400 из-за попытки удалить себя должна обработаться здесь
        if (
          err.response?.status === 400 &&
          err.data?.message?.includes("Нельзя удалить")
        ) {
          // Ошибка уже установлена
        }
        return false;
      }
    },

    // --- Вспомогательное действие для смены страницы ---
    changePage(page: number) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) {
        return; // Некорректная страница или не меняем
      }
      this.currentPage = page;
      // Перезагружаем данные для новой страницы
      this.fetchUsers();
    },
    // --- Вспомогательное действие для изменения лимита (если нужно) ---
    changeLimit(limit: number) {
      if (limit <= 0 || limit === this.usersPerPage) return;
      this.usersPerPage = limit;
      this.currentPage = 1; // Сбрасываем на первую страницу при смене лимита
      this.fetchUsers();
    },
  },
});
