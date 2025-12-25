// stores/report.ts
import { defineStore } from "pinia";
import { useAuthStore } from "./auth"; // Для получения токена
import type { 
  OverdueCategory, 
  DueStatus, 
  Payment,
  RecommendationsSummary 
} from "~/types/invoice";
import type {
  ReceivablesDynamicsResponse,
  ReceivablesDynamicsParams,
  ReceivablesStructureResponse,
  ReceivablesStructureParams,
  DebtConcentrationResponse,
  DebtConcentrationParams,
  SummaryReportResponse,
} from "~/types/reports-phase3";

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
  
  // Новые поля (Фаза 2)
  daysOverdue?: number;              // Количество дней просрочки
  daysUntilDue?: number;             // Дней до срока оплаты
  dueStatus?: DueStatus;             // Статус срока
  overdueCategory?: OverdueCategory; // Категория просрочки
  recommendation?: string;           // Рекомендация по действию
  payments?: Payment[];              // Список оплат
  lastPaymentDate?: string;          // Дата последней оплаты
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
  // Новое поле (Фаза 2)
  recommendationsSummary?: {
    NOT_DUE: { count: number; totalAmount: number };
    NOTIFY: { count: number; totalAmount: number };
    CLAIM: { count: number; totalAmount: number };
    COURT: { count: number; totalAmount: number };
    BAD_DEBT: { count: number; totalAmount: number };
  };
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
  // Новые поля (Фаза 2)
  recommendations: RecommendationsSummary | null;
  recommendationsLoading: boolean;
  recommendationsError: string | null;
  // Новые поля (Фаза 3)
  receivablesDynamics: ReceivablesDynamicsResponse | null;
  receivablesDynamicsLoading: boolean;
  receivablesDynamicsError: string | null;
  receivablesStructure: ReceivablesStructureResponse | null;
  receivablesStructureLoading: boolean;
  receivablesStructureError: string | null;
  debtConcentration: DebtConcentrationResponse | null;
  debtConcentrationLoading: boolean;
  debtConcentrationError: string | null;
  summaryReport: SummaryReportResponse | null;
  summaryReportLoading: boolean;
  summaryReportError: string | null;
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
    // Новые поля (Фаза 2)
    recommendations: null,
    recommendationsLoading: false,
    recommendationsError: null,
    // Новые поля (Фаза 3)
    receivablesDynamics: null,
    receivablesDynamicsLoading: false,
    receivablesDynamicsError: null,
    receivablesStructure: null,
    receivablesStructureLoading: false,
    receivablesStructureError: null,
    debtConcentration: null,
    debtConcentrationLoading: false,
    debtConcentrationError: null,
    summaryReport: null,
    summaryReportLoading: false,
    summaryReportError: null,
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
    // Пример геттера: общая сумма в читаемом формате (для tooltip'ов и экспорта)
    formattedTotalReceivables: (state) => {
      if (
        state.dashboardSummary?.totalReceivables === undefined ||
        state.dashboardSummary?.totalReceivables === null
      )
        return "N/A";
      return state.dashboardSummary.totalReceivables.toLocaleString("ru-RU", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }) + " Бр";
    },
    formattedOverdueReceivables: (state) => {
      if (
        state.dashboardSummary?.overdueReceivables === undefined ||
        state.dashboardSummary?.overdueReceivables === null
      )
        return "N/A";
      return state.dashboardSummary.overdueReceivables.toLocaleString("ru-RU", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }) + " Бр";
    },
    invoicesTotalPages: (state) => {
      if (state.invoicesTotal === 0 || state.invoicesPerPage <= 0) return 1;
      return Math.ceil(state.invoicesTotal / state.invoicesPerPage);
    },
  },

  actions: {
    // Асинхронное действие для загрузки дебиторов по aging bucket
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
            "Доступ запрещен: у вас нет прав для просмотра списка дебиторов.";
        } else {
          this.agingCustomersError[storeKey] =
            err.data?.message ||
            err.message ||
            "Не удалось загрузить список дебиторов.";
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

    // --- Загрузка рекомендаций (Фаза 2) ---
    async fetchRecommendations() {
      console.log("[ReportStore] Fetching recommendations...");
      this.recommendationsLoading = true;
      this.recommendationsError = null;

      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.isAuthenticated || !authStore.token) {
        this.recommendationsLoading = false;
        this.recommendationsError = "Пользователь не аутентифицирован.";
        console.error("[ReportStore] Cannot load recommendations: user not authenticated.");
        this.recommendations = null;
        return;
      }

      try {
        const response = await $fetch<RecommendationsSummary>(
          `/reports/recommendations`,
          {
            baseURL: config.public.apiBase,
            method: "GET",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        console.log("[ReportStore] Recommendations received:", response);
        this.recommendations = response;
      } catch (err: any) {
        console.error("[ReportStore] Error fetching recommendations:", err);
        if (err.response?.status === 403) {
          this.recommendationsError =
            "Доступ запрещен: у вас нет прав для просмотра рекомендаций.";
        } else {
          this.recommendationsError =
            err.data?.message ||
            err.message ||
            "Не удалось загрузить рекомендации.";
        }
        this.recommendations = null;
      } finally {
        this.recommendationsLoading = false;
      }
    },

    // --- Загрузка детальной информации о счете (Фаза 2) ---
    async fetchInvoiceDetails(invoiceId: string): Promise<Invoice | null> {
      console.log(`[ReportStore] Fetching invoice details for ${invoiceId}...`);

      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.isAuthenticated || !authStore.token) {
        console.error("[ReportStore] Cannot load invoice details: user not authenticated.");
        return null;
      }

      try {
        const response = await $fetch<Invoice>(
          `/reports/invoices/${invoiceId}`,
          {
            baseURL: config.public.apiBase,
            method: "GET",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        console.log("[ReportStore] Invoice details received:", response);
        return response;
      } catch (err: any) {
        console.error(`[ReportStore] Error fetching invoice details for ${invoiceId}:`, err);
        return null;
      }
    },

    // ===============================================
    // === Новые методы Фазы 3 ===
    // ===============================================

    // --- Загрузка динамики ДЗ ---
    async fetchReceivablesDynamics(params: ReceivablesDynamicsParams = {}) {
      console.log("[ReportStore] Fetching receivables dynamics...", params);
      this.receivablesDynamicsLoading = true;
      this.receivablesDynamicsError = null;

      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.isAuthenticated || !authStore.token) {
        this.receivablesDynamicsLoading = false;
        this.receivablesDynamicsError = "Пользователь не аутентифицирован.";
        console.error("[ReportStore] Cannot load receivables dynamics: user not authenticated.");
        this.receivablesDynamics = null;
        return;
      }

      try {
        const queryParams: Record<string, string> = {};
        if (params.startDate) queryParams.startDate = params.startDate;
        if (params.endDate) queryParams.endDate = params.endDate;

        const response = await $fetch<ReceivablesDynamicsResponse>(
          `/reports/receivables-dynamics`,
          {
            baseURL: config.public.apiBase,
            method: "GET",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
            params: queryParams,
          }
        );

        console.log("[ReportStore] Receivables dynamics received:", response);
        this.receivablesDynamics = response;
      } catch (err: any) {
        console.error("[ReportStore] Error fetching receivables dynamics:", err);
        if (err.response?.status === 403) {
          this.receivablesDynamicsError =
            "Доступ запрещен: у вас нет прав для просмотра динамики ДЗ.";
        } else {
          this.receivablesDynamicsError =
            err.data?.message ||
            err.message ||
            "Не удалось загрузить динамику ДЗ.";
        }
        this.receivablesDynamics = null;
      } finally {
        this.receivablesDynamicsLoading = false;
      }
    },

    // --- Загрузка структуры ДЗ ---
    async fetchReceivablesStructure(params: ReceivablesStructureParams = {}) {
      console.log("[ReportStore] Fetching receivables structure...", params);
      this.receivablesStructureLoading = true;
      this.receivablesStructureError = null;

      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.isAuthenticated || !authStore.token) {
        this.receivablesStructureLoading = false;
        this.receivablesStructureError = "Пользователь не аутентифицирован.";
        console.error("[ReportStore] Cannot load receivables structure: user not authenticated.");
        this.receivablesStructure = null;
        return;
      }

      try {
        const queryParams: Record<string, string> = {};
        if (params.asOfDate) queryParams.asOfDate = params.asOfDate;

        const response = await $fetch<ReceivablesStructureResponse>(
          `/reports/receivables-structure`,
          {
            baseURL: config.public.apiBase,
            method: "GET",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
            params: queryParams,
          }
        );

        console.log("[ReportStore] Receivables structure received:", response);
        this.receivablesStructure = response;
      } catch (err: any) {
        console.error("[ReportStore] Error fetching receivables structure:", err);
        if (err.response?.status === 403) {
          this.receivablesStructureError =
            "Доступ запрещен: у вас нет прав для просмотра структуры ДЗ.";
        } else {
          this.receivablesStructureError =
            err.data?.message ||
            err.message ||
            "Не удалось загрузить структуру ДЗ.";
        }
        this.receivablesStructure = null;
      } finally {
        this.receivablesStructureLoading = false;
      }
    },

    // --- Загрузка анализа концентрации задолженности ---
    async fetchDebtConcentration(params: DebtConcentrationParams = {}) {
      console.log("[ReportStore] Fetching debt concentration...", params);
      this.debtConcentrationLoading = true;
      this.debtConcentrationError = null;

      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.isAuthenticated || !authStore.token) {
        this.debtConcentrationLoading = false;
        this.debtConcentrationError = "Пользователь не аутентифицирован.";
        console.error("[ReportStore] Cannot load debt concentration: user not authenticated.");
        this.debtConcentration = null;
        return;
      }

      try {
        const queryParams: Record<string, string | number> = {};
        if (params.asOfDate) queryParams.asOfDate = params.asOfDate;
        if (params.minPercentage !== undefined) queryParams.minPercentage = params.minPercentage;
        if (params.limit !== undefined) queryParams.limit = params.limit;

        const response = await $fetch<DebtConcentrationResponse>(
          `/reports/debt-concentration`,
          {
            baseURL: config.public.apiBase,
            method: "GET",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
            params: queryParams,
          }
        );

        console.log("[ReportStore] Debt concentration received:", response);
        this.debtConcentration = response;
      } catch (err: any) {
        console.error("[ReportStore] Error fetching debt concentration:", err);
        if (err.response?.status === 403) {
          this.debtConcentrationError =
            "Доступ запрещен: у вас нет прав для просмотра анализа концентрации.";
        } else {
          this.debtConcentrationError =
            err.data?.message ||
            err.message ||
            "Не удалось загрузить анализ концентрации задолженности.";
        }
        this.debtConcentration = null;
      } finally {
        this.debtConcentrationLoading = false;
      }
    },

    // --- Загрузка сводного отчёта ---
    async fetchSummaryReport() {
      console.log("[ReportStore] Fetching summary report...");
      this.summaryReportLoading = true;
      this.summaryReportError = null;

      const authStore = useAuthStore();
      const config = useRuntimeConfig();

      if (!authStore.isAuthenticated || !authStore.token) {
        this.summaryReportLoading = false;
        this.summaryReportError = "Пользователь не аутентифицирован.";
        console.error("[ReportStore] Cannot load summary report: user not authenticated.");
        this.summaryReport = null;
        return;
      }

      try {
        const response = await $fetch<SummaryReportResponse>(
          `/reports/summary`,
          {
            baseURL: config.public.apiBase,
            method: "GET",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        console.log("[ReportStore] Summary report received:", response);
        this.summaryReport = response;
      } catch (err: any) {
        console.error("[ReportStore] Error fetching summary report:", err);
        if (err.response?.status === 403) {
          this.summaryReportError =
            "Доступ запрещен: у вас нет прав для просмотра сводного отчёта.";
        } else {
          this.summaryReportError =
            err.data?.message ||
            err.message ||
            "Не удалось загрузить сводный отчёт.";
        }
        this.summaryReport = null;
      } finally {
        this.summaryReportLoading = false;
      }
    },

    // --- Загрузка всех данных Фазы 3 параллельно ---
    async fetchAllPhase3Data() {
      console.log("[ReportStore] Fetching all Phase 3 data...");
      await Promise.all([
        this.fetchReceivablesDynamics(),
        this.fetchReceivablesStructure(),
        this.fetchDebtConcentration(),
      ]);
    },
  },
});
