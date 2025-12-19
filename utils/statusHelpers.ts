// Утилиты для работы со статусами

export const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
        'PAID': 'Оплачено',
        'OVERDUE': 'Просрочено',
        'CURRENT': 'В срок',
        'PARTIAL': 'Частично оплачено',
        'trial': 'Досудебный',
        'collection': 'Взыскание',
        'open': 'Открыт',
        'pre-trial': 'Предсудебный',
    };
    return statusMap[status] || status;
};

export const getStatusClass = (status: string): string => {
    const classMap: Record<string, string> = {
        'PAID': 'status-paid',
        'OVERDUE': 'status-overdue',
        'CURRENT': 'status-current',
        'PARTIAL': 'status-partial',
    };
    return classMap[status] || 'status-default';
};

export const getDebtWorkStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
        'CALL': 'Прозвон',
        'CLAIM': 'Претензия',
        'COURT': 'Суд',
    };
    return statusMap[status] || status;
};

export const getOverdueCategoryLabel = (category: string | undefined): string => {
    const labels: Record<string, string> = {
        'NOT_DUE': 'Срок не наступил',
        'NOTIFY': 'Оповестить',
        'CLAIM': 'Претензия',
        'COURT': 'Суд',
        'BAD_DEBT': 'Безнадёжный',
    };
    return category ? labels[category] || '—' : '—';
};

export const getOverdueCategoryClass = (category: string | undefined): string => {
    const classes: Record<string, string> = {
        'NOT_DUE': 'category-not-due',
        'NOTIFY': 'category-notify',
        'CLAIM': 'category-claim',
        'COURT': 'category-court',
        'BAD_DEBT': 'category-bad-debt',
    };
    return category ? classes[category] || '' : '';
};

export const getOverdueCategoryRecommendation = (category: string | undefined): string => {
    const recommendations: Record<string, string> = {
        'NOT_DUE': 'Срок оплаты ещё не наступил',
        'NOTIFY': 'Оповестить дебитора (звонок, e-mail)',
        'CLAIM': 'Направить претензию дебитору',
        'COURT': 'Направить заявление в суд (только после претензии!)',
        'BAD_DEBT': 'Признание безнадёжным долгом и списание (более 3 лет)',
    };
    return category ? recommendations[category] || '' : '';
};

export const getDaysUntilDueClass = (invoice: any): string => {
    const days = invoice.daysUntilDue ?? calculateDaysUntilDue(invoice.dueDate);
    if (days === undefined || days === null) return '';
    if (days > 7) return 'days-ok';
    if (days > 0) return 'days-warning';
    if (days === 0) return 'days-today';
    return 'days-overdue';
};

import { calculateDaysUntilDue } from './formatters';

export const getDaysAgeBadgeClass = (days: number): string => {
    if (days > 90) return 'days-critical';
    if (days > 60) return 'days-high';
    if (days > 30) return 'days-medium';
    return 'days-low';
};
