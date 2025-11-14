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

interface TopDebtor {
  customerId: string;
  customerName: string;
  customerInn: string;
  invoiceCount: number;
  oldestDebtDays: number;
  totalDebt: number;
  overdueDebt: number;
}

interface AgingCustomer {
  invoiceCount: number;
  overdueInvoiceCount: number;
  oldestDebtDays: number;
  agingBucket: string;
  customerId: string;
  customerName: string;
  customerInn: string;
  totalDebt: number;
  overdueDebt: number;
  currentDebt: number;
  agingBreakdown: {
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    days_91_plus: number;
  };
}

interface AgingCustomersResponse {
  customers: AgingCustomer[];
  total: number;
  limit: number;
  offset: number;
  summary: {
    totalOverdueAmount: number;
    totalCustomers: number;
    averageDaysOverdue: number;
  };
}

export interface InvoiceCustomer {
  id: string;
  name: string;
  unp: string;
  userId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: InvoiceCustomer;
  issueDate: string;
  dueDate: string;
  serviceStartDate?: string;
  serviceEndDate?: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentTermDays?: number;
  actualPaymentDate?: string;
  status: string;
  debtWorkStatus?: string;
  serviceType?: string;
  manager?: string;
  contractNumber?: string;
  notes?: string;
  lastContactDate?: string;
  contactResult?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedInvoicesResponse {
  invoices: Invoice[];
  total: number;
  limit: number;
  offset: number;
}

export interface FetchInvoicesParams {
  limit?: number;
  offset?: number;
  customerId?: string;
  status?: string;
  debtWorkStatus?: string;
  minDaysOverdue?: number;
  maxDaysOverdue?: number;
  minAmount?: number;
  manager?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface DashboardSummary {
  totalReceivables: number;
  overdueReceivables: number;
  overduePercentage: number;
  currentReceivables: number;
  averagePaymentDelayDays: number;
  totalInvoicesCount: number;
  overdueInvoicesCount: number;
  agingStructure: AgingBucket[];
  averageReceivables: number;
  turnoverRatio: number;
  periodRevenue: number;
  averagePaymentDays: number;
  onTimePaymentsAmount: number;
  overduePaymentsPercentage: number;
  topDebtors?: TopDebtor[];
  lastUpdatedAt?: string;
}

// --- Тип состояния Store ---
interface ReportState {
  dashboardSummary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  topDebtors: TopDebtor[];
  topDebtorsLoading: boolean;
  topDebtorsError: string | null;
  agingCustomers: Record<string, AgingCustomer[]>;
  agingCustomersLoading: Record<string, boolean>;
  agingCustomersError: Record<string, string | null>;
  invoices: Invoice[];
  invoicesTotal: number;
  invoicesCurrentPage: number;
  invoicesPerPage: number;
  invoicesLoading: boolean;
  invoicesError: string | null;
  invoicesFilters: FetchInvoicesParams;
}

export const useReportStore = defineStore("report", {
  state: (): ReportState => ({
    dashboardSummary: null,
    isLoading: false,
    error: null,
    topDebtors: [],
    topDebtorsLoading: false,
    topDebtorsError: null,
    agingCustomers: {},
    agingCustomersLoading: {},
    agingCustomersError: {},
    invoices: [],
    invoicesTotal: 0,
    invoicesCurrentPage: 1,
    invoicesPerPage: 20,
    invoicesLoading: false,
    invoicesError: null,
    invoicesFilters: {},
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
    invoicesTotalPages: (state) => {
      if (state.invoicesTotal === 0 || state.invoicesPerPage <= 0) return 1;
      return Math.ceil(state.invoicesTotal / state.invoicesPerPage);
    },
  },

  actions: {
    // Асинхронное действие для загрузки клиентов по aging bucket
    async fetchAgingCustomers(agingBucket: string, displayBucket?: string) {
      const apiBucket = agingBucket; // agingBucket теперь уже преобразованный для API
      const storeKey = displayBucket || apiBucket; // Ключ для хранения в store

      console.log(`[ReportStore] Fetching aging customers for bucket: ${apiBucket} (display: ${storeKey})`);
      this.agingCustomersLoading[storeKey] = true;
      this.agingCustomersError[storeKey] = null;

      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.isAuthenticated || !authStore.token) {
        this.agingCustomersLoading[storeKey] = false;
        this.agingCustomersError[storeKey] = "Пользователь не аутентифицирован.";
        console.error("[ReportStore] Cannot load aging customers: user not authenticated.");
        return;
      }

      try {
        const response = await $fetch<AgingCustomersResponse>(
          `/reports/customers-overdue?agingBucket=${apiBucket}`,
          {
            baseURL: config.public.apiBase,
            method: "GET",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        console.log(`[ReportStore] Aging customers for ${apiBucket} received:`, response);
        this.agingCustomers[storeKey] = response.customers;
      } catch (err: any) {
        console.error(`[ReportStore] Error fetching aging customers for ${apiBucket}:`, err);
        if (err.response?.status === 403) {
          this.agingCustomersError[storeKey] =
            "Доступ запрещен: у вас нет прав для просмотра списка клиентов.";
        } else {
          this.agingCustomersError[storeKey] =
            err.data?.message ||
            err.message ||
            "Не удалось загрузить список клиентов.";
        }
        this.agingCustomers[storeKey] = [];
      } finally {
        this.agingCustomersLoading[storeKey] = false;
      }
    },

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

    async fetchTopDebtors() {
      console.log("[ReportStore] Fetching top debtors...");
      this.topDebtorsLoading = true;
      this.topDebtorsError = null;

      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.isAuthenticated || !authStore.token) {
        this.topDebtorsLoading = false;
        this.topDebtorsError = "Пользователь не аутентифицирован.";
        console.error("[ReportStore] Cannot load top debtors: user not authenticated.");
        this.topDebtors = [];
        return;
      }

      try {
        const debtors = await $fetch<TopDebtor[]>(`/reports/top-debtors`, {
          baseURL: config.public.apiBase,
          method: "GET",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        console.log("[ReportStore] Top debtors received:", debtors);
        this.topDebtors = Array.isArray(debtors) ? debtors : [];
      } catch (err: any) {
        console.error("[ReportStore] Error fetching top debtors:", err);
        if (err.response?.status === 403) {
          this.topDebtorsError =
            "Доступ запрещен: у вас нет прав для просмотра списка должников.";
        } else {
          this.topDebtorsError =
            err.data?.message ||
            err.message ||
            "Не удалось загрузить список должников.";
        }
        this.topDebtors = [];
      } finally {
        this.topDebtorsLoading = false;
      }
    },

    async fetchInvoices(params: FetchInvoicesParams = {}) {
      console.log("[ReportStore] Fetching invoices with params:", params);
      this.invoicesLoading = true;
      this.invoicesError = null;

      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.isAuthenticated || !authStore.token) {
        this.invoicesLoading = false;
        this.invoicesError = "Пользователь не аутентифицирован.";
        console.error("[ReportStore] Cannot load invoices: user not authenticated.");
        this.invoices = [];
        this.invoicesTotal = 0;
        return;
      }

      // Объединяем параметры с текущими фильтрами
      const mergedParams = { ...this.invoicesFilters, ...params };
      
      // Формируем query параметры
      const queryParams: Record<string, string | number> = {
        limit: mergedParams.limit ?? this.invoicesPerPage,
        offset: mergedParams.offset ?? (this.invoicesCurrentPage - 1) * this.invoicesPerPage,
      };

      if (mergedParams.customerId) queryParams.customerId = mergedParams.customerId;
      if (mergedParams.status) queryParams.status = mergedParams.status;
      if (mergedParams.debtWorkStatus) queryParams.debtWorkStatus = mergedParams.debtWorkStatus;
      if (mergedParams.minDaysOverdue !== undefined) queryParams.minDaysOverdue = mergedParams.minDaysOverdue;
      if (mergedParams.maxDaysOverdue !== undefined) queryParams.maxDaysOverdue = mergedParams.maxDaysOverdue;
      if (mergedParams.minAmount !== undefined) queryParams.minAmount = mergedParams.minAmount;
      if (mergedParams.manager) queryParams.manager = mergedParams.manager;
      if (mergedParams.sortBy) queryParams.sortBy = mergedParams.sortBy;
      if (mergedParams.sortOrder) queryParams.sortOrder = mergedParams.sortOrder;

      try {
        const response = await $fetch<PaginatedInvoicesResponse>(
          `/reports/invoices`,
          {
            baseURL: config.public.apiBase,
            method: "GET",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
            params: queryParams,
          }
        );

        console.log("[ReportStore] Invoices received:", response);
        this.invoices = response.invoices;
        this.invoicesTotal = response.total;
        this.invoicesCurrentPage = Math.floor(response.offset / response.limit) + 1;
        this.invoicesPerPage = response.limit;
        this.invoicesFilters = mergedParams;
      } catch (err: any) {
        console.error("[ReportStore] Error fetching invoices:", err);
        if (err.response?.status === 403) {
          this.invoicesError =
            "Доступ запрещен: у вас нет прав для просмотра списка счетов.";
        } else {
          this.invoicesError =
            err.data?.message ||
            err.message ||
            "Не удалось загрузить список счетов.";
        }
        this.invoices = [];
        this.invoicesTotal = 0;
      } finally {
        this.invoicesLoading = false;
      }
    },

    setInvoicesFilters(filters: Partial<FetchInvoicesParams>) {
      this.invoicesFilters = { ...this.invoicesFilters, ...filters };
      this.invoicesCurrentPage = 1; // Сбрасываем на первую страницу при изменении фильтров
    },

    clearInvoicesFilters() {
      this.invoicesFilters = {};
      this.invoicesCurrentPage = 1;
    },
  },
});
