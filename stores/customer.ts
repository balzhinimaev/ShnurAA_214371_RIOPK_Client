// stores/customer.ts
import { defineStore } from "pinia";
import { useAuthStore } from "./auth";

// --- Типы ---
// Тип для ответа API (один клиент)
export interface CustomerResponse {
  id: string;
  name: string;
  inn?: string;
  contactInfo?: string | null; // Допускаем null
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Тип для пагинированного ответа API
interface PaginatedCustomersResponse {
  customers: CustomerResponse[];
  total: number;
  offset: number;
  limit: number;
}

// Тип для параметров запроса списка
interface FetchCustomersParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // TODO: Добавить фильтры, если нужно
  // filter?: { name?: string; inn?: string };
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
}

export const useCustomerStore = defineStore("customer", {
  state: (): CustomerState => ({
    customers: [],
    totalCustomers: 0,
    currentPage: 1,
    customersPerPage: 10,
    isLoading: false,
    error: null,
  }),

  getters: {
    // Общее количество страниц
    totalPages: (state) => {
      if (state.totalCustomers === 0 || state.customersPerPage <= 0) return 1;
      return Math.ceil(state.totalCustomers / state.customersPerPage);
    },
  },

  actions: {
    // --- Загрузка списка клиентов ---
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

      const queryParams: Record<string, string | number> = {
        limit: params.limit ?? this.customersPerPage,
        offset: params.offset ?? (this.currentPage - 1) * this.customersPerPage,
      };
      if (params.sortBy) queryParams.sortBy = params.sortBy;
      if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
      // TODO: Добавить параметры фильтра

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
      } catch (err: any) {
        console.error("[CustomerStore] Error fetching customers:", err);
        this.error =
          err.data?.message ||
          err.message ||
          "Не удалось загрузить список клиентов.";
        this.customers = [];
        this.totalCustomers = 0;
      } finally {
        this.isLoading = false;
      }
    },

    // --- Обновление клиента ---
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
          err.data?.message || err.message || "Не удалось обновить клиента.";
        return false; // Неудача
      }
    },

    // --- Удаление клиента ---
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
          err.data?.message || err.message || "Не удалось удалить клиента.";
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
  },
});
