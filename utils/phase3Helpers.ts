// Утилиты для Фазы 3

import type { DynamicsTrend } from '~/types/reports-phase3';

export const getTrendClass = (trend: DynamicsTrend): string => {
    switch (trend) {
        case 'increasing': return 'trend-up';
        case 'decreasing': return 'trend-down';
        case 'stable': return 'trend-stable';
        default: return '';
    }
};

export const getBarHeight = (value: number, chartData: { totalDebtData: number[], overdueDebtData: number[] }): string => {
    const maxValue = Math.max(...chartData.totalDebtData, ...chartData.overdueDebtData);
    if (maxValue <= 0) return '0%';
    const percentage = (value / maxValue) * 100;
    return `${Math.max(percentage, 2)}%`;
};

export const getYAxisTicks = (chartData: { totalDebtData: number[], overdueDebtData: number[] }): number[] => {
    const maxValue = Math.max(...chartData.totalDebtData, ...chartData.overdueDebtData);
    if (maxValue <= 0) return [0];
    
    // Создаем 5 засечек
    const step = maxValue / 4;
    return [0, step, step * 2, step * 3, maxValue].reverse();
};

export const getChangeClass = (current: number, previous: number): string => {
    if (previous === 0) return 'change-neutral';
    const change = ((current - previous) / previous) * 100;
    if (change > 5) return 'change-up';
    if (change < -5) return 'change-down';
    return 'change-neutral';
};

export const getChangeLabel = (current: number, previous: number): string => {
    if (previous === 0) return '—';
    const change = ((current - previous) / previous) * 100;
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
};

export const getConcentrationRiskClass = (percentage: number): string => {
    if (percentage > 70) return 'risk-critical';
    if (percentage > 50) return 'risk-high';
    if (percentage > 30) return 'risk-medium';
    return 'risk-low';
};
