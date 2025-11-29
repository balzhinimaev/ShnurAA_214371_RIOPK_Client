// types/reports-phase3.ts
// Типы для API эндпоинтов Фазы 3 - Аналитические инструменты и отчётность

// =====================================
// Динамика ДЗ (GET /reports/receivables-dynamics)
// =====================================

/**
 * Элемент динамики ДЗ по периоду
 */
export interface DynamicsItem {
  period: string;       // Формат "YYYY-MM", например "2025-01"
  totalDebt: number;    // Общая сумма ДЗ на конец периода
  overdueDebt: number;  // Просроченная ДЗ на конец периода
}

/**
 * Тренд изменения ДЗ
 */
export type DynamicsTrend = 'increasing' | 'decreasing' | 'stable';

/**
 * Сводка по динамике ДЗ
 */
export interface DynamicsSummary {
  startPeriod: string;  // Начальный период
  endPeriod: string;    // Конечный период
  trend: DynamicsTrend; // Тренд изменения
}

/**
 * Ответ API динамики ДЗ
 */
export interface ReceivablesDynamicsResponse {
  dynamics: DynamicsItem[];
  summary: DynamicsSummary;
}

/**
 * Параметры запроса динамики ДЗ
 */
export interface ReceivablesDynamicsParams {
  startDate?: string;  // ISO date-time, начало периода
  endDate?: string;    // ISO date-time, конец периода (по умолчанию текущая дата)
}

// =====================================
// Структура ДЗ (GET /reports/receivables-structure)
// =====================================

/**
 * Элемент структуры по сроку просрочки
 */
export interface StructureAgingBucketItem {
  bucket: string;       // "Current", "1-30", "31-60", "61-90", "91+"
  amount: number;       // Сумма в этой категории
  count: number;        // Количество счетов
  percentage: number;   // Процент от общей суммы
}

/**
 * Элемент структуры по типу услуги
 */
export interface StructureServiceTypeItem {
  serviceType: string;  // Тип услуги
  amount: number;       // Сумма
  count: number;        // Количество счетов
  percentage: number;   // Процент от общей суммы
}

/**
 * Элемент структуры по менеджеру
 */
export interface StructureManagerItem {
  manager: string;      // ФИО менеджера
  amount: number;       // Сумма
  count: number;        // Количество счетов
  percentage: number;   // Процент от общей суммы
}

/**
 * Ответ API структуры ДЗ
 */
export interface ReceivablesStructureResponse {
  byAgingBucket: StructureAgingBucketItem[];
  byServiceType: StructureServiceTypeItem[];
  byManager: StructureManagerItem[];
}

/**
 * Параметры запроса структуры ДЗ
 */
export interface ReceivablesStructureParams {
  asOfDate?: string;  // ISO date-time, дата расчёта (по умолчанию текущая дата)
}

// =====================================
// Анализ концентрации задолженности (GET /reports/debt-concentration)
// =====================================

/**
 * Информация о должнике в анализе концентрации
 */
export interface ConcentrationCustomer {
  customerId: string;
  customerName: string;
  customerUnp: string;
  totalDebt: number;           // Общий долг
  overdueDebt: number;         // Просроченный долг
  invoiceCount: number;        // Количество счетов
  oldestDebtDays: number;      // Возраст самого старого долга в днях
  percentageOfTotal: number;   // Доля в общей сумме ДЗ
  percentageOfOverdue: number; // Доля в просроченной ДЗ
}

/**
 * Сводка по концентрации задолженности
 */
export interface ConcentrationSummary {
  totalCustomers: number;      // Общее количество должников
  totalDebt: number;           // Общая сумма ДЗ
  totalOverdueDebt: number;    // Общая сумма просроченной ДЗ
  asOfDate: string;            // Дата расчёта
  maxConcentration: number;    // Максимальная доля одного должника
  top5Concentration: number;   // Концентрация топ-5 должников
  top10Concentration: number;  // Концентрация топ-10 должников
}

/**
 * Ответ API анализа концентрации задолженности
 */
export interface DebtConcentrationResponse {
  customers: ConcentrationCustomer[];
  summary: ConcentrationSummary;
}

/**
 * Параметры запроса анализа концентрации
 */
export interface DebtConcentrationParams {
  asOfDate?: string;      // ISO date-time, дата расчёта
  minPercentage?: number; // Минимальный процент для фильтрации
  limit?: number;         // Ограничение количества контрагентов
}

// =====================================
// Сводный отчёт (GET /reports/summary)
// =====================================

/**
 * Сводка дашборда (из существующего API)
 */
export interface SummaryDashboard {
  totalReceivables: number;
  overdueReceivables: number;
  overduePercentage: number;
  currentReceivables: number;
  averagePaymentDelayDays: number;
  totalInvoicesCount: number;
  overdueInvoicesCount: number;
  agingStructure: Array<{
    bucket: string;
    amount: number;
    count: number;
  }>;
  turnoverRatio: number;
  averagePaymentDays: number;
  recommendationsSummary?: {
    NOT_DUE: { count: number; totalAmount: number };
    NOTIFY: { count: number; totalAmount: number };
    CLAIM: { count: number; totalAmount: number };
    COURT: { count: number; totalAmount: number };
    BAD_DEBT: { count: number; totalAmount: number };
  };
}

/**
 * Ответ API сводного отчёта
 */
export interface SummaryReportResponse {
  summary: SummaryDashboard;
  dynamics: ReceivablesDynamicsResponse;
  structure: ReceivablesStructureResponse;
  generatedAt: string;
}

// =====================================
// Вспомогательные типы для UI
// =====================================

/**
 * Данные для графика динамики
 */
export interface DynamicsChartData {
  labels: string[];           // Метки периодов
  totalDebtData: number[];    // Данные общей ДЗ
  overdueDebtData: number[];  // Данные просроченной ДЗ
}

/**
 * Данные для круговой диаграммы структуры
 */
export interface StructurePieChartData {
  labels: string[];
  data: number[];
  percentages: number[];
  colors: string[];
}

/**
 * Метки трендов на русском
 */
export const TREND_LABELS: Record<DynamicsTrend, string> = {
  increasing: 'Рост',
  decreasing: 'Снижение',
  stable: 'Стабильно',
};

/**
 * Иконки трендов
 */
export const TREND_ICONS: Record<DynamicsTrend, string> = {
  increasing: '📈',
  decreasing: '📉',
  stable: '➡️',
};

/**
 * Цвета для графиков
 */
export const CHART_COLORS = {
  totalDebt: '#4299e1',      // Синий
  overdueDebt: '#f56565',    // Красный
  currentDebt: '#48bb78',    // Зелёный
  agingBuckets: [
    '#48bb78', // Current - зелёный
    '#ed8936', // 1-30 - оранжевый
    '#f56565', // 31-60 - красный
    '#c53030', // 61-90 - тёмно-красный
    '#805ad5', // 91+ - фиолетовый
  ],
  serviceTypes: [
    '#667eea', // Фиолетовый
    '#48bb78', // Зелёный
    '#ed8936', // Оранжевый
    '#f56565', // Красный
    '#38b2ac', // Бирюзовый
    '#9f7aea', // Лавандовый
  ],
  managers: [
    '#4299e1', // Синий
    '#48bb78', // Зелёный
    '#ed8936', // Оранжевый
    '#f56565', // Красный
    '#9f7aea', // Лавандовый
    '#38b2ac', // Бирюзовый
  ],
};

