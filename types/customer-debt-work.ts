// types/customer-debt-work.ts
// Типы для учета работы с задолженностями клиентов

/**
 * Тип действия по работе с задолженностью
 */
export type DebtWorkActionType = 
  | 'CALL'           // Звонок клиенту
  | 'EMAIL'          // Отправка email
  | 'SMS'            // Отправка SMS
  | 'LETTER'         // Отправка письма
  | 'CLAIM'          // Претензия
  | 'COURT_CLAIM'    // Заявление в суд
  | 'COURT_DECISION' // Решение суда
  | 'EXECUTION'      // Исполнительное производство
  | 'SETTLEMENT'      // Досудебное урегулирование
  | 'PAYMENT_PLAN'   // График погашения
  | 'OTHER';         // Прочее

/**
 * Результат действия
 */
export type DebtWorkResult = 
  | 'CONTACTED'      // Связались с клиентом
  | 'NO_CONTACT'     // Не удалось связаться
  | 'PROMISED_PAY'   // Обещали оплатить
  | 'REFUSED'        // Отказались платить
  | 'PARTIAL_PAY'    // Частичная оплата
  | 'FULL_PAY'       // Полная оплата
  | 'IN_PROGRESS'    // В процессе
  | 'COMPLETED'      // Завершено
  | 'CANCELLED';     // Отменено

/**
 * Запись о работе с задолженностью
 */
export interface DebtWorkRecord {
  id: string;
  customerId: string;
  invoiceId?: string; // Опционально - если действие связано с конкретным счетом
  actionType: DebtWorkActionType;
  actionDate: string | Date;
  performedBy: string; // ID пользователя, который выполнил действие
  performedByName?: string; // Имя пользователя для отображения
  result: DebtWorkResult;
  description?: string; // Описание действия/результата
  nextActionDate?: string | Date; // Дата следующего запланированного действия
  amount?: number; // Сумма задолженности на момент действия
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Статистика работы с задолженностями клиента
 */
export interface CustomerDebtWorkStats {
  customerId: string;
  totalDebtWorkRecords: number;
  totalCalls: number;
  totalLegalActions: number; // Претензии + судебные действия
  lastContactDate?: string | Date;
  lastLegalActionDate?: string | Date;
  totalDebtEpisodes: number; // Сколько раз клиент попадал в должники
  averageDebtResolutionDays?: number; // Среднее время погашения задолженности
  longestDebtDays?: number; // Самая долгая задолженность в днях
  riskScore?: number; // Оценка рисковости (0-100)
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Расширенная информация о клиенте с учетом работы с задолженностями
 */
export interface CustomerWithDebtWork {
  // Базовые поля клиента
  id: string;
  name: string;
  unp?: string;
  contactInfo?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // Статистика и история работы с задолженностями
  debtWorkStats?: CustomerDebtWorkStats;
  recentDebtWorkRecords?: DebtWorkRecord[]; // Последние N записей
}

/**
 * Данные для создания новой записи о работе с задолженностью
 */
export interface CreateDebtWorkRecordData {
  customerId: string;
  invoiceId?: string;
  actionType: DebtWorkActionType;
  actionDate: string | Date;
  result: DebtWorkResult;
  description?: string;
  nextActionDate?: string | Date;
  amount?: number;
}

/**
 * Данные для обновления записи о работе с задолженностью
 */
export interface UpdateDebtWorkRecordData {
  actionType?: DebtWorkActionType;
  actionDate?: string | Date;
  result?: DebtWorkResult;
  description?: string;
  nextActionDate?: string | Date;
  amount?: number;
}

