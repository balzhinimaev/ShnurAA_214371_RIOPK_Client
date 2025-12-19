<template>
    <article class="chart-card">
        <div class="chart-header">
            <h3 class="chart-title">Структура просрочки по срокам</h3>
            <p class="chart-subtitle">Общий объём просрочки: {{ formattedOverdueReceivables }}</p>
        </div>
        <div v-if="agingData.length" class="aging-bars">
            <div v-for="aging in agingData" :key="aging.bucket" class="aging-item" :class="{ 'aging-item-expanded': expandedAgingItems[aging.bucket] }">
                <div class="aging-item-header" @click="handleAgingItemClick(aging.bucket)">
                    <div class="aging-item-title">
                        <span class="aging-badge" :class="aging.colorClass">{{ aging.bucket }}</span>
                        <span class="aging-count">{{ aging.count }} счетов</span>
                    </div>
                    <div class="aging-item-stats">
                        <span class="aging-amount">{{ aging.formattedAmount }}</span>
                        <span class="aging-percent-badge">{{ aging.percentLabel }}</span>
                        <span class="aging-expand-icon" :class="{ 'rotated': expandedAgingItems[aging.bucket] }">▼</span>
                    </div>
                </div>
                <div class="aging-progress-bar">
                    <div
                        class="aging-progress-fill"
                        :class="aging.colorClass"
                        :style="{ width: aging.percent + '%' }"
                    ></div>
                </div>

                <!-- Раскрываемый контент с дебиторами -->
                <div v-if="expandedAgingItems[aging.bucket]" class="aging-customers-container">
                    <!-- Состояние загрузки -->
                    <div v-if="reportStore.agingCustomersLoading[aging.bucket]" class="aging-customers-loading">
                        <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                        Загружаем дебиторов...
                    </div>

                    <!-- Ошибка загрузки -->
                    <div v-else-if="reportStore.agingCustomersError[aging.bucket]" class="aging-customers-error">
                        <p class="error-text">{{ reportStore.agingCustomersError[aging.bucket] }}</p>
                        <button
                            type="button"
                            class="retry-btn"
                            @click="reportStore.fetchAgingCustomers(mapAgingBucketToApiParam(aging.bucket), aging.bucket)"
                        >
                            Повторить
                        </button>
                    </div>

                    <!-- Список дебиторов -->
                    <div v-else-if="reportStore.agingCustomers[aging.bucket]?.length" class="aging-customers-list">
                        <div v-for="customer in reportStore.agingCustomers[aging.bucket]" :key="customer.customerId" class="aging-customer-card">
                            <div class="customer-header">
                                <div class="customer-info">
                                    <h4 class="customer-name">{{ customer.customerName }}</h4>
                                    <p class="customer-details">
                                        <span v-if="customer.customerInn" class="customer-inn">УНП: {{ customer.customerInn }}</span>
                                        <span class="customer-invoices">{{ customer.invoiceCount }} счетов</span>
                                        <span class="customer-oldest-days">{{ formatOldestDebtDays(customer.oldestDebtDays) }}</span>
                                    </p>
                                </div>
                                <div class="customer-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">Общий долг</span>
                                        <span class="stat-value">{{ formatCurrency(customer.totalDebt) }}</span>
                                    </div>
                                    <div class="stat-item stat-overdue">
                                        <span class="stat-label">Просрочено</span>
                                        <span class="stat-value">{{ formatCurrency(customer.overdueDebt) }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="customer-breakdown">
                                <div class="breakdown-item" v-if="customer.agingBreakdown.current > 0">
                                    <span class="breakdown-label">Срок оплаты не наступил</span>
                                    <span class="breakdown-value">{{ formatCurrency(customer.agingBreakdown.current) }}</span>
                                </div>
                                <div class="breakdown-item" v-if="customer.agingBreakdown.days_1_30 > 0">
                                    <span class="breakdown-label">1-30 дней просрочки</span>
                                    <span class="breakdown-value">{{ formatCurrency(customer.agingBreakdown.days_1_30) }}</span>
                                </div>
                                <div class="breakdown-item" v-if="customer.agingBreakdown.days_31_60 > 0">
                                    <span class="breakdown-label">31-60 дней просрочки</span>
                                    <span class="breakdown-value">{{ formatCurrency(customer.agingBreakdown.days_31_60) }}</span>
                                </div>
                                <div class="breakdown-item" v-if="customer.agingBreakdown.days_61_90 > 0">
                                    <span class="breakdown-label">61-90 дней просрочки</span>
                                    <span class="breakdown-value">{{ formatCurrency(customer.agingBreakdown.days_61_90) }}</span>
                                </div>
                                <div class="breakdown-item" v-if="customer.agingBreakdown.days_91_plus > 0">
                                    <span class="breakdown-label">более 91 дня просрочки</span>
                                    <span class="breakdown-value">{{ formatCurrency(customer.agingBreakdown.days_91_plus) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Пустое состояние -->
                    <div v-else class="aging-customers-empty">
                        Нет дебиторов в этой категории
                    </div>
                </div>
            </div>
        </div>
        <p v-else class="empty-state">Данные по структуре просрочки отсутствуют.</p>
        <NuxtLink
            v-if="canUploadData"
            to="/upload"
            class="action-button"
        >
            📤 Перейти к обновлению данных
        </NuxtLink>
    </article>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useReportStore } from '~/stores/report';
import { formatCurrency, formatPercent } from '~/utils/formatters';
import { formatOldestDebtDays } from '~/utils/formatters';
import { formatAgingBucket, mapAgingBucketToApiParam } from '~/utils/agingHelpers';

const authStore = useAuthStore();
const reportStore = useReportStore();

const expandedAgingItems = ref<Record<string, boolean>>({});

const summary = computed(() => reportStore.dashboardSummary);
const overdueReceivables = computed(() => summary.value?.overdueReceivables ?? 0);
const formattedOverdueReceivables = computed(() => formatCurrency(overdueReceivables.value));

const agingStructure = computed(() => summary.value?.agingStructure ?? []);
const totalAgingAmount = computed(() => agingStructure.value.reduce((sum, bucket) => sum + bucket.amount, 0));

const agingColorClasses = ['green', 'yellow', 'orange', 'red', 'purple'];
const agingData = computed(() => agingStructure.value.map((bucket, index) => {
    const percent = totalAgingAmount.value > 0 ? (bucket.amount / totalAgingAmount.value) * 100 : 0;
    const width = percent > 0 ? Math.max(percent, 6) : 0;
    return {
        ...bucket,
        bucket: formatAgingBucket(bucket.bucket),
        percent,
        percentLabel: formatPercent(percent),
        formattedAmount: formatCurrency(bucket.amount),
        colorClass: agingColorClasses[index % agingColorClasses.length],
        width: `${width}%`
    };
}));

const canUploadData = computed(() => {
    if (!authStore.isAuthenticated || !authStore.user?.roles) {
        return false;
    }
    return authStore.user.roles.includes('ADMIN') || authStore.user.roles.includes('ANALYST');
});

async function handleAgingItemClick(agingBucket: string) {
    const isExpanded = expandedAgingItems.value[agingBucket];

    if (isExpanded) {
        expandedAgingItems.value[agingBucket] = false;
    } else {
        expandedAgingItems.value[agingBucket] = true;

        if (!reportStore.agingCustomers[agingBucket] && !reportStore.agingCustomersLoading[agingBucket]) {
            const apiParam = mapAgingBucketToApiParam(agingBucket);
            await reportStore.fetchAgingCustomers(apiParam, agingBucket);
        }
    }
}
</script>

<style scoped lang="scss">
.chart-card {
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

.aging-bars {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.aging-item {
    border-radius: 0.75rem;
    background: #f7fafc;
    overflow: hidden;
    transition: all 0.3s ease;
}

.aging-item-expanded {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.aging-item-header {
    padding: 1rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    transition: background 0.2s ease;
}

.aging-item-header:hover {
    background: #edf2f7;
}

.aging-item-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.aging-badge {
    padding: 0.4rem 0.8rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
}

.aging-badge.green { background: #c6f6d5; color: #22543d; }
.aging-badge.yellow { background: #feebc8; color: #c05621; }
.aging-badge.orange { background: #fed7aa; color: #c05621; }
.aging-badge.red { background: #fed7d7; color: #c53030; }
.aging-badge.purple { background: #e9d8fd; color: #553c9a; }

.aging-count {
    font-size: 0.85rem;
    color: #718096;
}

.aging-item-stats {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.aging-amount {
    font-size: 1rem;
    font-weight: 700;
    color: #2d3748;
}

.aging-percent-badge {
    padding: 0.25rem 0.6rem;
    background: #e2e8f0;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #4a5568;
}

.aging-expand-icon {
    transition: transform 0.3s ease;
    font-size: 0.75rem;
    color: #718096;
}

.aging-expand-icon.rotated {
    transform: rotate(180deg);
}

.aging-progress-bar {
    height: 8px;
    background: #e2e8f0;
    overflow: hidden;
}

.aging-progress-fill {
    height: 100%;
    transition: width 0.5s ease;
}

.aging-progress-fill.green { background: linear-gradient(90deg, #48bb78 0%, #38a169 100%); }
.aging-progress-fill.yellow { background: linear-gradient(90deg, #ed8936 0%, #dd6b20 100%); }
.aging-progress-fill.orange { background: linear-gradient(90deg, #f6ad55 0%, #ed8936 100%); }
.aging-progress-fill.red { background: linear-gradient(90deg, #f56565 0%, #c53030 100%); }
.aging-progress-fill.purple { background: linear-gradient(90deg, #9f7aea 0%, #805ad5 100%); }

.aging-customers-container {
    padding: 1rem;
    background: #fff;
    border-top: 1px solid #e2e8f0;
}

.aging-customers-loading,
.aging-customers-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    text-align: center;
    justify-content: center;
}

.aging-customers-error {
    flex-direction: column;
    gap: 0.75rem;
}

.error-text {
    color: #c53030;
    margin: 0;
}

.retry-btn {
    border: none;
    border-radius: 0.5rem;
    background: #f56565;
    color: #fff;
    font-weight: 600;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.retry-btn:hover {
    transform: translateY(-2px);
}

.aging-customers-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.aging-customer-card {
    background: #f7fafc;
    border-radius: 0.5rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
}

.customer-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
}

.customer-info {
    flex: 1;
    min-width: 200px;
}

.customer-name {
    font-size: 1rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0 0 0.5rem 0;
}

.customer-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: #718096;
    margin: 0;
}

.customer-stats {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.stat-label {
    font-size: 0.75rem;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stat-value {
    font-size: 1rem;
    font-weight: 700;
    color: #2d3748;
}

.stat-item.stat-overdue .stat-value {
    color: #c53030;
}

.customer-breakdown {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e2e8f0;
}

.breakdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
}

.breakdown-label {
    color: #718096;
}

.breakdown-value {
    font-weight: 600;
    color: #2d3748;
}

.aging-customers-empty {
    text-align: center;
    padding: 1rem;
    color: #718096;
    font-style: italic;
}

.empty-state {
    text-align: center;
    padding: 2rem;
    color: #718096;
    font-style: italic;
    margin: 0;
}

.action-button {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #667eea;
    color: #fff;
    border-radius: 0.6rem;
    text-decoration: none;
    font-weight: 600;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    text-align: center;
}

.action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}
</style>
