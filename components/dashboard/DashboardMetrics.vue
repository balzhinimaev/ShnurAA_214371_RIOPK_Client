<template>
    <section class="metrics-grid">
        <article class="metric-card total">
            <div class="metric-header">
                <span class="metric-label">Общая задолженность</span>
                <span class="metric-icon">💰</span>
            </div>
            <p class="metric-value">{{ formattedTotalReceivables }}</p>
            <p class="metric-change neutral">Всего выставленных счетов: {{ totalInvoices }}</p>
        </article>

        <article class="metric-card overdue">
            <div class="metric-header">
                <span class="metric-label">Просроченная задолженность</span>
                <span class="metric-icon">⚠️</span>
            </div>
            <p class="metric-value">{{ formattedOverdueReceivables }}</p>
            <p class="metric-change up">Доля от общей суммы: {{ overdueShareLabel }}</p>
        </article>

        <article class="metric-card percent">
            <div class="metric-header">
                <span class="metric-label">Процент просрочки</span>
                <span class="metric-icon">📈</span>
            </div>
            <div class="metric-value-with-indicator">
                <p class="metric-value">{{ overdueShareLabel }}</p>
                <span 
                    class="health-badge" 
                    :class="'health-' + overdueHealthIndicator.status"
                >
                    {{ overdueHealthIndicator.icon }} {{ overdueHealthIndicator.label }}
                </span>
            </div>
            <p class="metric-change neutral">Просрочено счетов: {{ overdueInvoiceCountLabel }}</p>
        </article>

        <article class="metric-card current">
            <div class="metric-header">
                <span class="metric-label">Непросроченная задолженность</span>
                <span class="metric-icon">✅</span>
            </div>
            <p class="metric-value">{{ formattedCurrentReceivables }}</p>
            <p class="metric-change down">Доля своевременных оплат: {{ currentShareLabel }}</p>
        </article>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useReportStore } from '~/stores/report';
import { formatCurrency, formatPercent, normalizeApiPercent } from '~/utils/formatters';

type HealthStatus = 'excellent' | 'good' | 'warning' | 'danger';

interface HealthIndicator {
    status: HealthStatus;
    label: string;
    icon: string;
}

const reportStore = useReportStore();

const summary = computed(() => reportStore.dashboardSummary);

const totalReceivables = computed(() => summary.value?.totalReceivables ?? 0);
const overdueReceivables = computed(() => summary.value?.overdueReceivables ?? 0);
const currentReceivables = computed(() => summary.value?.currentReceivables ?? Math.max(totalReceivables.value - overdueReceivables.value, 0));
const totalInvoices = computed(() => summary.value?.totalInvoicesCount ?? 0);
const overdueInvoiceCount = computed(() => summary.value?.overdueInvoicesCount ?? 0);

const formattedTotalReceivables = computed(() => formatCurrency(totalReceivables.value));
const formattedOverdueReceivables = computed(() => formatCurrency(overdueReceivables.value));
const formattedCurrentReceivables = computed(() => formatCurrency(currentReceivables.value));

const overdueShare = computed(() => {
    const apiValue = summary.value?.overduePercentage;
    if (typeof apiValue === 'number') {
        return normalizeApiPercent(apiValue);
    }
    return totalReceivables.value > 0 ? (overdueReceivables.value / totalReceivables.value) * 100 : 0;
});

const overdueShareLabel = computed(() => formatPercent(overdueShare.value));
const currentShare = computed(() => totalReceivables.value > 0 ? (currentReceivables.value / totalReceivables.value) * 100 : 0);
const currentShareLabel = computed(() => formatPercent(currentShare.value));

const overdueInvoiceCountLabel = computed(() => {
    const count = overdueInvoiceCount.value;
    if (!Number.isFinite(count) || count <= 0) {
        return '0 счетов';
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
});

const getOverdueHealthStatus = (percent: number): HealthIndicator => {
    if (percent < 10) {
        return { status: 'excellent', label: 'Отлично', icon: '🟢' };
    } else if (percent < 30) {
        return { status: 'good', label: 'Нормально', icon: '🟡' };
    } else {
        return { status: 'danger', label: 'Требует внимания', icon: '🔴' };
    }
};

const overdueHealthIndicator = computed(() => getOverdueHealthStatus(overdueShare.value));
</script>

<style scoped lang="scss">
.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.25rem;
}

.metric-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 1rem;
    padding: 1.75rem;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
    border-left: 6px solid transparent;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.16);
}

.metric-card.total { border-left-color: #4299e1; }
.metric-card.overdue { border-left-color: #f56565; }
.metric-card.percent { border-left-color: #ed8936; }
.metric-card.current { border-left-color: #48bb78; }

.metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.metric-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    color: #718096;
}

.metric-icon {
    font-size: 1.8rem;
}

.metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0;
}

.metric-value-with-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.health-badge {
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
}

.health-badge.health-excellent {
    background: #c6f6d5;
    color: #22543d;
}

.health-badge.health-good {
    background: #feebc8;
    color: #c05621;
}

.health-badge.health-warning {
    background: #fed7d7;
    color: #c53030;
}

.health-badge.health-danger {
    background: #fed7d7;
    color: #c53030;
}

.metric-change {
    font-size: 0.9rem;
    font-weight: 600;
    margin: 0;
}

.metric-change.up { color: #c53030; }
.metric-change.down { color: #2f855a; }
.metric-change.neutral { color: #4a5568; }
</style>
