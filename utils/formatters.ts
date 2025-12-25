// Утилиты для форматирования данных

// Форматирование числа без символа валюты (для компонента CurrencyAmount)
export const formatNumber = (value: number): string => {
    if (!Number.isFinite(value)) {
        return '—';
    }
    return value.toLocaleString('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};

// Форматирование с символом валюты (для tooltip'ов, title и т.д.)
export const formatCurrency = (value: number): string => {
    if (!Number.isFinite(value)) {
        return '—';
    }
    return value.toLocaleString('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }) + ' Бел.руб.';
};

export const formatPercent = (value: number): string => {
    if (!Number.isFinite(value)) {
        return '—';
    }
    return `${value.toFixed(1)}%`;
};

// Проценты, приходящие с API, иногда бывают в диапазоне 0..1 (доля), а UI ожидает 0..100.
export const normalizeApiPercent = (value: number): number => {
    if (!Number.isFinite(value)) {
        return Number.NaN;
    }
    if (value > 0 && value <= 1) {
        return value * 100;
    }
    return value;
};

export const formatApiPercent = (value: number): string => formatPercent(normalizeApiPercent(value));

export const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export const formatDays = (days: number): string => {
    if (!Number.isFinite(days) || days <= 0) {
        return '—';
    }
    return `${days.toFixed(1)} дн.`;
};

export const formatInvoiceCount = (count: number): string => {
    if (!Number.isFinite(count) || count <= 0) {
        return 'Нет счетов';
    }

    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastDigit === 1 && lastTwoDigits !== 11) {
        return `${count} счёт`;
    }

    if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
        return `${count} счёта`;
    }

    return `${count} счетов`;
};

export const formatOldestDebtDays = (days: number): string => {
    if (!Number.isFinite(days) || days <= 0) {
        return 'Без просрочки';
    }

    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;

    if (lastDigit === 1 && lastTwoDigits !== 11) {
        return `${days} день`;
    }

    if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
        return `${days} дня`;
    }

    return `${days} дней`;
};

export const formatPeriodLabel = (period: string): string => {
    if (!period) return '—';
    const [year, month] = period.split('-');
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNames[monthIndex] || month} ${year}`;
};

export const formatCompactCurrency = (value: number): string => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)} млн`;
    } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)} тыс`;
    }
    return value.toFixed(0);
};

export const formatDaysUntilDue = (invoice: any): string => {
    // Используем поле daysUntilDue если есть, иначе вычисляем
    if (invoice.daysUntilDue !== undefined) {
        const days = invoice.daysUntilDue;
        if (days > 0) return `${days} дн. до срока`;
        if (days === 0) return 'Сегодня';
        return `${Math.abs(days)} дн. просрочки`;
    }
    
    // Fallback: вычисляем на клиенте
    if (!invoice.dueDate) return '—';
    const dueDate = new Date(invoice.dueDate);
    if (isNaN(dueDate.getTime())) return '—';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `${diffDays} дн. до срока`;
    if (diffDays === 0) return 'Сегодня';
    return `${Math.abs(diffDays)} дн. просрочки`;
};

export const calculateDaysUntilDue = (dueDate: string | undefined): number | undefined => {
    if (!dueDate) return undefined;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const isOverdue = (dueDateString: string | undefined): boolean => {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    if (isNaN(dueDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
};
