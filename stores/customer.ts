// stores/customer.ts
import { defineStore } from "pinia";
import { useAuthStore } from "./auth";
import type { 
  DebtWorkRecord, 
  CustomerDebtWorkStats, 
  CreateDebtWorkRecordData,
  UpdateDebtWorkRecordData 
} from "~/types/customer-debt-work";
import type { 
  CustomerFullResponse,
  PaymentGrade 
} from "~/types/customer-full";

// --- Типы ---
// Тип для ответа API (один дебитор)
export interface CustomerResponse {
  id: string;
  name: string;
  unp?: string; // УНП - опциональное поле
  contactInfo?: string | null; // Допускаем null
  createdAt: string | Date;
  updatedAt: string | Date;
  // Рисковость дебитора (рассчитывается на бэкенде при получении списка)
  riskScore?: number; // Оценка рисковости (0-100)
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // Уровень риска
  // Статистика работы с задолженностями (может приходить из API при расширенном запросе)
  debtWorkStats?: CustomerDebtWorkStats;
  // Новые поля (Фаза 2)
  totalDebt?: number;      // Общий долг
  overdueDebt?: number;    // Просроченный долг
  paymentRating?: {        // Оценка платежной дисциплины
    grade: PaymentGrade;
    description: string;
  };
}

// Тип для пагинированного ответа API
interface PaginatedCustomersResponse {
  customers: CustomerResponse[];
  total: number;
  offset: number;
  limit: number;
}

// Тип для параметров запроса списка
export interface FetchCustomersParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  name?: string;
  unp?: string; // УНП для фильтрации
  contactInfo?: string;
}

// Тип для данных обновления
export interface UpdateCustomerData {
  name?: string;
  contactInfo?: string | null; // Допускаем null
}

// --- Состояние Store ---
interface CustomerState {
  customers: CustomerResponse[];
  totalCustomers: number;
  currentPage: number;
  customersPerPage: number;
  isLoading: boolean;
  error: string | null;
  filters: FetchCustomersParams;
  // Новые поля (Фаза 2)
  customerFull: CustomerFullResponse | null;
  customerFullLoading: boolean;
  customerFullError: string | null;
}

export const useCustomerStore = defineStore("customer", {
  state: (): CustomerState => ({
    customers: [],
    totalCustomers: 0,
    currentPage: 1,
    customersPerPage: 20,
    isLoading: false,
    error: null,
    filters: {},
    // Новые поля (Фаза 2)
    customerFull: null,
    customerFullLoading: false,
    customerFullError: null,
  }),

  getters: {
    // Общее количество страниц
    totalPages: (state) => {
      if (state.totalCustomers === 0 || state.customersPerPage <= 0) return 1;
      return Math.ceil(state.totalCustomers / state.customersPerPage);
    },
  },

  actions: {
    // --- Загрузка списка дебиторов ---
    async fetchCustomers(params: FetchCustomersParams = {}) {
      console.log("[CustomerStore] Fetching customers with params:", params);
      this.isLoading = true;
      this.error = null;
      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.token) {
        this.isLoading = false;
        this.error = "Не авторизован.";
        return;
      }

      // Объединяем параметры с текущими фильтрами
      const mergedParams = { ...this.filters, ...params };

      const queryParams: Record<string, string | number> = {
        limit: mergedParams.limit ?? this.customersPerPage,
        offset: mergedParams.offset ?? (this.currentPage - 1) * this.customersPerPage,
      };
      
      if (mergedParams.sortBy) queryParams.sortBy = mergedParams.sortBy;
      if (mergedParams.sortOrder) queryParams.sortOrder = mergedParams.sortOrder;
      if (mergedParams.name) queryParams.name = mergedParams.name;
      if (mergedParams.unp) queryParams.unp = mergedParams.unp;
      if (mergedParams.contactInfo) queryParams.contactInfo = mergedParams.contactInfo;

      try {
        const response = await $fetch<PaginatedCustomersResponse>(
          "/customers",
          {
            baseURL: config.public.apiBase,
            method: "GET",
            headers: { Authorization: `Bearer ${authStore.token}` },
            params: queryParams,
          }
        );
        console.log("[CustomerStore] Customers received:", response);
        this.customers = response.customers;
        this.totalCustomers = response.total;
        this.currentPage = Math.floor(response.offset / response.limit) + 1;
        this.customersPerPage = response.limit;
        this.filters = mergedParams;
      } catch (err: any) {
        console.error("[CustomerStore] Error fetching customers:", err);
        this.error =
          err.data?.message ||
          err.message ||
          "Не удалось загрузить список дебиторов.";
        this.customers = [];
        this.totalCustomers = 0;
      } finally {
        this.isLoading = false;
      }
    },

    setFilters(filters: Partial<FetchCustomersParams>) {
      this.filters = { ...this.filters, ...filters };
      this.currentPage = 1; // Сбрасываем на первую страницу при изменении фильтров
    },

    clearFilters() {
      this.filters = {};
      this.currentPage = 1;
    },

    // --- Обновление дебитора ---
    async updateCustomer(
      customerId: string,
      data: UpdateCustomerData
    ): Promise<boolean> {
      console.log(
        `[CustomerStore] Updating customer ${customerId} with data:`,
        data
      );
      this.error = null;
      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.token) {
        this.error = "Не авторизован.";
        return false;
      }

      try {
        const updatedCustomer = await $fetch<CustomerResponse>(
          `/customers/${customerId}`,
          {
            baseURL: config.public.apiBase,
            method: "PUT",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
              "Content-Type": "application/json",
            },
            body: data,
          }
        );
        console.log("[CustomerStore] Customer updated:", updatedCustomer);
        const index = this.customers.findIndex((c) => c.id === customerId);
        if (index !== -1) {
          this.customers[index] = updatedCustomer;
        }
        return true; // Успех
      } catch (err: any) {
        console.error(
          `[CustomerStore] Error updating customer ${customerId}:`,
          err
        );
        this.error =
          err.data?.message || err.message || "Не удалось обновить дебитора.";
        return false; // Неудача
      }
    },

    // --- Удаление дебитора ---
    async deleteCustomer(customerId: string): Promise<boolean> {
      console.log(`[CustomerStore] Deleting customer ${customerId}`);
      this.error = null;
      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.token) {
        this.error = "Не авторизован.";
        return false;
      }

      try {
        await $fetch(`/customers/${customerId}`, {
          baseURL: config.public.apiBase,
          method: "DELETE",
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        console.log(`[CustomerStore] Customer ${customerId} deleted.`);
        this.customers = this.customers.filter((c) => c.id !== customerId);
        this.totalCustomers--;
        // Проверка пагинации
        if (this.customers.length === 0 && this.currentPage > 1) {
          this.changePage(this.currentPage - 1);
        }
        return true; // Успех
      } catch (err: any) {
        console.error(
          `[CustomerStore] Error deleting customer ${customerId}:`,
          err
        );
        this.error =
          err.data?.message || err.message || "Не удалось удалить дебитора.";
        // TODO: Обработать ошибку 400 (нельзя удалить из-за счетов) отдельно?
        return false; // Неудача
      }
    },

    // --- Смена страницы ---
    changePage(page: number) {
      if (page < 1 || page > this.totalPages || page === this.currentPage)
        return;
      this.currentPage = page;
      this.fetchCustomers(); // Перезагружаем с новым offset
    },

    // --- Смена лимита ---
    changeLimit(limit: number) {
      if (limit <= 0 || limit === this.customersPerPage) return;
      this.customersPerPage = limit;
      this.currentPage = 1; // Сброс на первую страницу
      this.fetchCustomers();
    },

    // --- Работа с задолженностями ---
    
    /**
     * Получение истории работы с задолженностями дебитора
     */
    async fetchDebtWorkHistory(
      customerId: string,
      params?: {
        invoiceId?: string;
        limit?: number;
        offset?: number;
        sortBy?: 'actionDate' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      }
    ): Promise<{ records: DebtWorkRecord[]; stats: CustomerDebtWorkStats } | null> {
      console.log(`[CustomerStore] Fetching debt work history for customer ${customerId}`, params);
      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.token) {
        this.error = "Не авторизован.";
        return null;
      }

      try {
        const queryParams: Record<string, string | number> = {};
        if (params?.invoiceId) queryParams.invoiceId = params.invoiceId;
        if (params?.limit) queryParams.limit = params.limit;
        if (params?.offset !== undefined) queryParams.offset = params.offset;
        if (params?.sortBy) queryParams.sortBy = params.sortBy;
        if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

        const response = await $fetch<{
          records: DebtWorkRecord[];
          stats: CustomerDebtWorkStats;
        }>(`/customers/${customerId}/debt-work`, {
          baseURL: config.public.apiBase,
          method: "GET",
          headers: { Authorization: `Bearer ${authStore.token}` },
          params: queryParams,
        });

        console.log(`[CustomerStore] Debt work history received:`, response);
        return response;
      } catch (err: any) {
        console.error(`[CustomerStore] Error fetching debt work history:`, err);
        this.error =
          err.data?.message ||
          err.message ||
          "Не удалось загрузить историю работы с задолженностями.";
        return null;
      }
    },

    /**
     * Создание записи о работе с задолженностью
     */
    async createDebtWorkRecord(
      customerId: string,
      data: CreateDebtWorkRecordData
    ): Promise<DebtWorkRecord | null> {
      console.log(`[CustomerStore] Creating debt work record for customer ${customerId}`, data);
      this.error = null;
      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.token) {
        this.error = "Не авторизован.";
        return null;
      }

      try {
        // Убираем customerId из body, так как он передается в URL
        const { customerId: _, ...bodyData } = data;
        
        const response = await $fetch<DebtWorkRecord>(
          `/customers/${customerId}/debt-work`,
          {
            baseURL: config.public.apiBase,
            method: "POST",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
              "Content-Type": "application/json",
            },
            body: bodyData,
          }
        );
        console.log(`[CustomerStore] Debt work record created:`, response);
        return response;
      } catch (err: any) {
        console.error(`[CustomerStore] Error creating debt work record:`, err);
        this.error =
          err.data?.message ||
          err.message ||
          "Не удалось создать запись о работе с задолженностью.";
        return null;
      }
    },

    /**
     * Обновление записи о работе с задолженностью
     */
    async updateDebtWorkRecord(
      customerId: string,
      recordId: string,
      data: UpdateDebtWorkRecordData
    ): Promise<DebtWorkRecord | null> {
      console.log(`[CustomerStore] Updating debt work record ${recordId} for customer ${customerId}`, data);
      this.error = null;
      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.token) {
        this.error = "Не авторизован.";
        return null;
      }

      try {
        const response = await $fetch<DebtWorkRecord>(
          `/customers/${customerId}/debt-work/${recordId}`,
          {
            baseURL: config.public.apiBase,
            method: "PUT",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
              "Content-Type": "application/json",
            },
            body: data,
          }
        );
        console.log(`[CustomerStore] Debt work record updated:`, response);
        return response;
      } catch (err: any) {
        console.error(`[CustomerStore] Error updating debt work record:`, err);
        // Обработка специфичных ошибок
        const statusCode = err.statusCode || err.status;
        if (statusCode === 400) {
          this.error = "Ошибка валидации данных. Проверьте введенные значения.";
        } else if (statusCode === 403) {
          this.error = "У вас нет прав для выполнения этого действия.";
        } else if (statusCode === 404) {
          this.error = "Запись не найдена. Возможно, она была удалена.";
        } else {
          this.error =
            err.data?.message ||
            err.message ||
            "Произошла ошибка сервера. Попробуйте позже.";
        }
        return null;
      }
    },

    /**
     * Удаление записи о работе с задолженностью
     */
    async deleteDebtWorkRecord(
      customerId: string,
      recordId: string
    ): Promise<boolean> {
      console.log(`[CustomerStore] Deleting debt work record ${recordId} for customer ${customerId}`);
      this.error = null;
      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.token) {
        this.error = "Не авторизован.";
        return false;
      }

      try {
        await $fetch(
          `/customers/${customerId}/debt-work/${recordId}`,
          {
            baseURL: config.public.apiBase,
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );
        console.log(`[CustomerStore] Debt work record ${recordId} deleted successfully`);
        return true;
      } catch (err: any) {
        console.error(`[CustomerStore] Error deleting debt work record:`, err);
        // Обработка специфичных ошибок
        const statusCode = err.statusCode || err.status;
        if (statusCode === 403) {
          this.error = "У вас нет прав для выполнения этого действия.";
        } else if (statusCode === 404) {
          this.error = "Запись не найдена. Возможно, она была удалена.";
        } else {
          this.error =
            err.data?.message ||
            err.message ||
            "Произошла ошибка сервера. Попробуйте позже.";
        }
        return false;
      }
    },

    // --- Загрузка полных данных дебитора (Фаза 2) ---
    async fetchCustomerFull(customerId: string): Promise<CustomerFullResponse | null> {
      console.log(`[CustomerStore] Fetching full customer data for ${customerId}...`);
      this.customerFullLoading = true;
      this.customerFullError = null;
      this.customerFull = null;

      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.token) {
        this.customerFullLoading = false;
        this.customerFullError = "Не авторизован.";
        return null;
      }

      try {
        const response = await $fetch<CustomerFullResponse>(
          `/customers/${customerId}/full`,
          {
            baseURL: config.public.apiBase,
            method: "GET",
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        console.log("[CustomerStore] Full customer data received:", response);
        this.customerFull = response;
        return response;
      } catch (err: any) {
        console.error(`[CustomerStore] Error fetching full customer data for ${customerId}:`, err);
        this.customerFullError =
          err.data?.message ||
          err.message ||
          "Не удалось загрузить полные данные дебитора.";
        this.customerFull = null;
        return null;
      } finally {
        this.customerFullLoading = false;
      }
    },

    // Очистка полных данных дебитора
    clearCustomerFull() {
      this.customerFull = null;
      this.customerFullError = null;
    },
  },
});
