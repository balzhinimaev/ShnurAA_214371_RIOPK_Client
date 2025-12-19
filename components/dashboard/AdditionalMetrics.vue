<template>
    <section class="full-width-card">
        <div class="chart-header">
            <h3 class="chart-title">Дополнительные показатели эффективности</h3>
            <p class="chart-subtitle">Сводные метрики, рассчитанные по текущим данным</p>
        </div>
        <div v-if="additionalMetrics.length" class="additional-metrics">
            <div v-for="metric in additionalMetrics" :key="metric.label" class="small-metric">
                <p class="small-metric-label">{{ metric.label }}</p>
                <div class="small-metric-value-container">
                    <p class="small-metric-value">{{ metric.value }}</p>
                    <span 
                        v-if="metric.healthIndicator" 
                        class="health-badge health-badge-small" 
                        :class="'health-' + metric.healthIndicator.status"
                    >
                        {{ metric.healthIndicator.icon }} {{ metric.healthIndicator.label }}
                    </span>
                </div>
                <p v-if="metric.hint" class="small-metric-hint">{{ metric.hint }}</p>
            </div>
        </div>
        <p v-else class="empty-state">Недостаточно данных для расчёта дополнительных метрик.</p>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useReportStore } from '~/stores/report';
import { formatCurrency, formatPercent, formatDays, formatApiPercent, normalizeApiPercent } from '~/utils/formatters';
import { formatAgingBucket } from '~/utils/agingHelpers';

type HealthStatus = 'excellent' | 'good' | 'warning' | 'danger';

interface HealthIndicator {
    status: HealthStatus;
    label: string;
    icon: string;
}

const reportStore = useReportStore();

const summary = computed(() => reportStore.dashboardSummary);

const totalReceivables = computed(() => summary.value?.totalReceivables ?? 0);
const totalInvoices = computed(() => summary.value?.totalInvoicesCount ?? 0);
const agingStructure = computed(() => summary.value?.agingStructure ?? []);
const totalAgingAmount = computed(() => agingStructure.value.reduce((sum, bucket) => sum + bucket.amount, 0));

const averageInvoiceAmount = computed(() => totalInvoices.value > 0 ? totalReceivables.value / totalInvoices.value : Number.NaN);

const largestBucket = computed(() => {
    if (!agingStructure.value.length) {
        return null;
    }
    return agingStructure.value.reduce((max, bucket) => (bucket.amount > max.amount ? bucket : max));
});

const largestBucketShare = computed(() => (totalAgingAmount.value > 0 && largestBucket.value)
    ? (largestBucket.value.amount / totalAgingAmount.value) * 100
    : Number.NaN);

const getPaymentDelayHealthStatus = (days: number): HealthIndicator => {
    if (days <= 5) {
        return { status: 'excellent', label: 'Отлично', icon: '🟢' };
    } else if (days <= 15) {
        return { status: 'good', label: 'Нормально', icon: '🟡' };
    } else if (days > 0) {
        return { status: 'danger', label: 'Плохо', icon: '🔴' };
    } else {
        return { status: 'excellent', label: 'Нет просрочек', icon: '🟢' };
    }
};

const additionalMetrics = computed(() => {
    if (!summary.value) {
        return [] as { label: string; value: string; hint?: string; healthIndicator?: HealthIndicator }[];
    }

    const s = summary.value;
    const paymentDelayHealthIndicator = getPaymentDelayHealthStatus(s.averagePaymentDelayDays ?? 0);
    
    const metrics = [
        {
            label: 'Количество счетов',
            value: totalInvoices.value > 0 ? totalInvoices.value.toString() : '—',
            hint: totalInvoices.value > 0 ? 'Общее количество неоплаченных счетов' : undefined
        },
        {
            label: 'Средняя сумма счёта',
            value: formatCurrency(averageInvoiceAmount.value),
            hint: totalInvoices.value > 0 ? 'Общая сумма задолженности / количество счетов' : undefined
        },
        {
            label: 'Средний срок задержки оплаты',
            value: formatDays(s.averagePaymentDelayDays),
            hint: s.averagePaymentDelayDays > 0 ? 'Средний срок задержки для просроченных счетов' : undefined,
            healthIndicator: paymentDelayHealthIndicator
        },
        {
            label: 'Средний срок оплаты',
            value: formatDays(s.averagePaymentDays),
            hint: s.averagePaymentDays > 0 ? 'Среднее время от выставления счета до оплаты' : undefined
        },
        {
            label: 'Своевременные платежи',
            value: formatCurrency(s.onTimePaymentsAmount),
            hint: s.onTimePaymentsAmount > 0 ? 'Сумма платежей, произведенных в срок' : undefined
        },
        {
            label: 'Процент просроченных платежей',
            value: formatApiPercent(s.overduePaymentsPercentage),
            hint: s.overduePaymentsPercentage > 0 ? 'Доля просроченных платежей от общей суммы' : undefined
        },
        {
            label: 'Средняя ДЗ за период',
            value: formatCurrency(s.averageReceivables),
            hint: s.averageReceivables > 0 ? 'Средняя дебиторская задолженность за текущий месяц' : undefined
        },
        {
            label: 'Крупнейший сегмент просрочки',
            value: largestBucket.value ? formatAgingBucket(largestBucket.value.bucket) : '—',
            hint: largestBucket.value ? `Сумма: ${formatCurrency(largestBucket.value.amount)}` : undefined
        },
        {
            label: 'Доля крупнейшего сегмента',
            value: formatPercent(largestBucketShare.value),
            hint: largestBucket.value ? 'Часть от общего объёма просроченной задолженности' : undefined
        }
    ];

    return metrics;
});
</script>

<style scoped lang="scss">
.full-width-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 1rem;
    padding: 1.75rem;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.chart-header {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 0.75rem;
}

.chart-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0;
}

.chart-subtitle {
    font-size: 0.85rem;
    color: #718096;
    margin: 0;
}

.additional-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.small-metric {
    background: #f7fafc;
    border-radius: 0.75rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.small-metric-label {
    font-size: 0.75rem;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    margin: 0;
}

.small-metric-value-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.small-metric-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0;
}

.health-badge-small {
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    white-space: nowrap;
}

.health-badge-small.health-excellent {
    background: #c6f6d5;
    color: #22543d;
}

.health-badge-small.health-good {
    background: #feebc8;
    color: #c05621;
}

.health-badge-small.health-warning {
    background: #fed7d7;
    color: #c53030;
}

.health-badge-small.health-danger {
    background: #fed7d7;
    color: #c53030;
}

.small-metric-hint {
    font-size: 0.75rem;
    color: #718096;
    font-style: italic;
    margin: 0;
}

.empty-state {
    text-align: center;
    padding: 2rem;
    color: #718096;
    font-style: italic;
    margin: 0;
}
</style>
