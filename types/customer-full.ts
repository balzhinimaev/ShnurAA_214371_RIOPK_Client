// types/customer-full.ts
// Типы для расширенных данных дебитора

import type { OverdueCategory } from './invoice';

/**
 * Оценка платежной дисциплины
 */
export type PaymentGrade = 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Влияние фактора на оценку риска
 */
export type RiskFactorImpact = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

/**
 * Счет в карточке дебитора
 */
export interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  outstandingAmount: number;
  dueDate: string;
  daysOverdue: number;
  overdueCategory: OverdueCategory;
  status: string;
}

/**
 * Статистика дебитора
 */
export interface CustomerStatistics {
  totalInvoices: number;
  totalDebt: number;
  overdueDebt: number;
  paidOnTimeCount: number;        // Количество вовремя оплаченных
  paidLateCount: number;          // Количество просроченных оплат
  averagePaymentDelay: number;    // Средняя задержка оплаты в днях
  onTimePaymentRate: number;      // Процент своевременных оплат (0-100)
}

/**
 * Фактор оценки риска
 */
export interface RiskFactor {
  factor: string;           // Название фактора
  description: string;      // Описание влияния
  impact: RiskFactorImpact;
  weight: number;           // Вклад в итоговую оценку
}

/**
 * Оценка рисковости дебитора
 */
export interface RiskAssessment {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-100
  factors: RiskFactor[];
}

/**
 * Оценка платежной дисциплины
 */
export interface PaymentRating {
  grade: PaymentGrade;
  description: string;
}

/**
 * Полные данные дебитора
 */
export interface CustomerFullResponse {
  // Базовые данные
  id: string;
  name: string;
  unp?: string;
  contactInfo?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Список задолженностей
  invoices: CustomerInvoice[];
  
  // Агрегированная статистика
  statistics: CustomerStatistics;
  
  // Обоснование уровня риска
  riskAssessment: RiskAssessment;
  
  // Общая оценка по своевременности
  paymentRating: PaymentRating;
}

/**
 * Метки оценок платежной дисциплины
 */
export const PAYMENT_GRADE_LABELS: Record<PaymentGrade, string> = {
  A: 'Отличный плательщик',
  B: 'Хороший плательщик',
  C: 'Удовлетворительно',
  D: 'Ненадёжный',
  F: 'Злостный неплательщик',
};

/**
 * CSS классы для оценок
 */
export const PAYMENT_GRADE_CLASSES: Record<PaymentGrade, string> = {
  A: 'grade-a',
  B: 'grade-b',
  C: 'grade-c',
  D: 'grade-d',
  F: 'grade-f',
};

/**
 * Метки уровней риска
 */
export const RISK_LEVEL_LABELS: Record<string, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  CRITICAL: 'Критический',
};

/**
 * CSS классы для уровней риска
 */
export const RISK_LEVEL_CLASSES: Record<string, string> = {
  LOW: 'risk-low',
  MEDIUM: 'risk-medium',
  HIGH: 'risk-high',
  CRITICAL: 'risk-critical',
};

/**
 * Метки влияния факторов
 */
export const RISK_IMPACT_LABELS: Record<RiskFactorImpact, string> = {
  POSITIVE: 'Положительный',
  NEGATIVE: 'Отрицательный',
  NEUTRAL: 'Нейтральный',
};

