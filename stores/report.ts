// stores/report.ts
import { defineStore } from "pinia";
import { useAuthStore } from "./auth"; // Для получения токена

// --- Типы данных для отчета ---
// Повторяем структуру DTO с бэкенда
interface AgingBucket {
  bucket: string;
  amount: number;
  count: number;
}

interface DashboardSummary {
  totalReceivables: number;
  overdueReceivables: number;
  agingStructure: AgingBucket[];
}

// --- Тип состояния Store ---
interface ReportState {
  dashboardSummary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
}

export const useReportStore = defineStore("report", {
  state: (): ReportState => ({
    dashboardSummary: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    // Пример геттера: получить данные для графика старения
    agingChartData: (state) => {
      if (!state.dashboardSummary?.agingStructure) return null;
      // Преобразуем данные в формат, удобный для библиотеки графиков
      const labels = state.dashboardSummary.agingStructure.map((b) => b.bucket);
      const data = state.dashboardSummary.agingStructure.map((b) => b.amount);
      return { labels, datasets: [{ label: "Amount by Aging Bucket", data }] };
    },
    // Пример геттера: общая сумма в читаемом формате
    formattedTotalReceivables: (state) => {
      if (
        state.dashboardSummary?.totalReceivables === undefined ||
        state.dashboardSummary?.totalReceivables === null
      )
        return "N/A";
      return state.dashboardSummary.totalReceivables.toLocaleString("ru-RU", {
        style: "currency",
        currency: "RUB",
      }); // Пример для рублей
    },
    formattedOverdueReceivables: (state) => {
      if (
        state.dashboardSummary?.overdueReceivables === undefined ||
        state.dashboardSummary?.overdueReceivables === null
      )
        return "N/A";
      return state.dashboardSummary.overdueReceivables.toLocaleString("ru-RU", {
        style: "currency",
        currency: "RUB",
      });
    },
  },

  actions: {
    // Асинхронное действие для загрузки сводки дашборда
    async fetchDashboardSummary() {
      console.log("[ReportStore] Fetching dashboard summary...");
      this.isLoading = true;
      this.error = null;
      this.dashboardSummary = null; // Сбрасываем предыдущие данные

      const authStore = useAuthStore(); // Получаем доступ к auth store
      const config = useRuntimeConfig();

      // Проверяем, аутентифицирован ли пользователь
      if (!authStore.isAuthenticated || !authStore.token) {
        this.isLoading = false;
        this.error = "Пользователь не аутентифицирован.";
        console.error("[ReportStore] User not authenticated.");
        // Можно перенаправить на логин, если это еще не сделано middleware
        // navigateTo('/login');
        return;
      }

      try {
        // Выполняем GET запрос к API
        const summaryData = await $fetch<DashboardSummary>(
          `/reports/dashboard/summary`,
          {
            baseURL: config.public.apiBase,
            method: "GET",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        console.log("[ReportStore] Dashboard summary received:", summaryData);
        this.dashboardSummary = summaryData;
      } catch (err: any) {
        console.error("[ReportStore] Error fetching dashboard summary:", err);
        // Обрабатываем ошибки API (включая 403 Forbidden)
        if (err.response?.status === 403) {
          this.error =
            "Доступ запрещен: у вас нет прав для просмотра этого отчета.";
        } else {
          this.error =
            err.data?.message ||
            err.message ||
            "Не удалось загрузить данные для дашборда.";
        }
        this.dashboardSummary = null; // Убедимся, что данных нет при ошибке
      } finally {
        this.isLoading = false;
      }
    },
  },
});
