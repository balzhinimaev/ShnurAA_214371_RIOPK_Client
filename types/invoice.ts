// types/invoice.ts
// Типы для расширенных данных по счетам

/**
 * Категория просрочки
 */
export type OverdueCategory = 
  | 'NOT_DUE'   // Срок оплаты ещё не наступил
  | 'NOTIFY'    // 1-30 дней - оповестить дебитора
  | 'CLAIM'     // 31-90 дней - направить претензию
  | 'COURT'     // 91-1095 дней - направить в суд
  | 'BAD_DEBT'; // >1095 дней (>3 лет) - безнадёжный долг

/**
 * Статус срока оплаты
 */
export type DueStatus = 'FUTURE' | 'TODAY' | 'OVERDUE';

/**
 * Оплата по счету
 */
export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
}

/**
 * Расширенный счет с полями просрочки
 */
export interface InvoiceExtended {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    unp: string;
    userId?: string;
  };
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
  daysOverdue?: number;        // Количество дней просрочки
  daysUntilDue?: number;       // Дней до срока оплаты
  dueStatus?: DueStatus;       // Статус срока
  overdueCategory?: OverdueCategory;  // Категория просрочки
  recommendation?: string;     // Рекомендация по действию
  payments?: Payment[];        // Список оплат
  lastPaymentDate?: string;    // Дата последней оплаты
}

/**
 * Сводка рекомендаций по категориям
 */
export interface CategorySummary {
  count: number;
  totalAmount: number;
}

/**
 * Приоритетное действие
 */
export interface PriorityAction {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  daysOverdue: number;
  category: OverdueCategory;
  recommendation: string;
  hasClaim: boolean;
}

/**
 * Сводка рекомендаций
 */
export interface RecommendationsSummary {
  byCategory: {
    NOT_DUE: CategorySummary;
    NOTIFY: CategorySummary;
    CLAIM: CategorySummary;
    COURT: CategorySummary;
    BAD_DEBT: CategorySummary;
  };
  priorityActions: PriorityAction[];
}

/**
 * Метки категорий просрочки на русском
 */
export const OVERDUE_CATEGORY_LABELS: Record<OverdueCategory, string> = {
  NOT_DUE: 'Срок не наступил',
  NOTIFY: 'Оповестить',
  CLAIM: 'Претензия',
  COURT: 'Суд',
  BAD_DEBT: 'Безнадёжный долг',
};

/**
 * Рекомендации по категориям просрочки
 */
export const OVERDUE_CATEGORY_RECOMMENDATIONS: Record<OverdueCategory, string> = {
  NOT_DUE: 'Срок оплаты ещё не наступил',
  NOTIFY: 'Оповестить дебитора (звонок, e-mail)',
  CLAIM: 'Направить претензию дебитору',
  COURT: 'Направить заявление в суд (только после претензии!)',
  BAD_DEBT: 'Признание безнадёжным долгом и списание',
};

/**
 * CSS классы для категорий просрочки
 */
export const OVERDUE_CATEGORY_CLASSES: Record<OverdueCategory, string> = {
  NOT_DUE: 'category-not-due',
  NOTIFY: 'category-notify',
  CLAIM: 'category-claim',
  COURT: 'category-court',
  BAD_DEBT: 'category-bad-debt',
};

