<template>
    <article class="chart-card">
        <div class="chart-header">
            <h3 class="chart-title">Топ-10 должников</h3>
            <p class="chart-subtitle">Суммы указаны с учётом просроченной задолженности</p>
        </div>
        <div v-if="topDebtors.length" class="top-debtors">
            <div
                v-for="(debtor, index) in topDebtors"
                :key="debtor.customerId || `${debtor.customerName}-${index}`"
                class="debtor-card"
            >
                <div class="debtor-card-header">
                    <div class="debtor-title-section">
                        <span class="debtor-rank-badge">{{ index + 1 }}</span>
                        <div class="debtor-info-block">
                            <p class="debtor-name">{{ debtor.customerName }}</p>
                            <p class="debtor-details">{{ debtor.details }}</p>
                        </div>
                    </div>
                </div>
                <div class="debtor-stats">
                    <div class="debtor-stat-item debtor-stat-total">
                        <span class="debtor-stat-label">Общий долг</span>
                        <span class="debtor-stat-value">{{ debtor.totalDebtLabel }}</span>
                    </div>
                    <div class="debtor-stat-item debtor-stat-overdue" :class="{ 'debtor-stat-zero': debtor.overdueDebt <= 0 }">
                        <span class="debtor-stat-label">Просрочено</span>
                        <span class="debtor-stat-value">{{ debtor.overdueDebtLabel }}</span>
                    </div>
                </div>
            </div>
        </div>
        <p v-else-if="reportStore.topDebtorsLoading" class="empty-state">
            Загружаем информацию о должниках...
        </p>
        <p v-else-if="reportStore.topDebtorsError" class="empty-state">
            {{ reportStore.topDebtorsError }}
        </p>
        <p v-else class="empty-state">Информация о должниках пока недоступна.</p>
    </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useReportStore } from '~/stores/report';
import { formatCurrency, formatInvoiceCount, formatOldestDebtDays } from '~/utils/formatters';

const reportStore = useReportStore();

const topDebtors = computed(() => {
    return reportStore.topDebtors.map((debtor) => {
        const detailsParts = [
            formatInvoiceCount(debtor.invoiceCount),
            `Просрочка: ${formatOldestDebtDays(debtor.oldestDebtDays)}`,
            debtor.customerInn ? `УНП ${debtor.customerInn}` : null
        ].filter((part): part is string => Boolean(part));

        return {
            ...debtor,
            details: detailsParts.join(' · '),
            totalDebtLabel: formatCurrency(debtor.totalDebt),
            overdueDebtLabel: formatCurrency(debtor.overdueDebt)
        };
    });
});
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

.top-debtors {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.debtor-card {
    background: #f7fafc;
    border-radius: 0.75rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.debtor-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.debtor-card-header {
    margin-bottom: 0.75rem;
}

.debtor-title-section {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
}

.debtor-rank-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-weight: 700;
    font-size: 0.9rem;
    flex-shrink: 0;
}

.debtor-info-block {
    flex: 1;
}

.debtor-name {
    font-size: 1rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0 0 0.25rem 0;
}

.debtor-details {
    font-size: 0.85rem;
    color: #718096;
    margin: 0;
}

.debtor-stats {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.debtor-stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.debtor-stat-label {
    font-size: 0.75rem;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.debtor-stat-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2d3748;
}

.debtor-stat-total .debtor-stat-value {
    color: #4299e1;
}

.debtor-stat-overdue .debtor-stat-value {
    color: #f56565;
}

.debtor-stat-zero .debtor-stat-value {
    color: #718096;
}

.empty-state {
    text-align: center;
    padding: 2rem;
    color: #718096;
    font-style: italic;
    margin: 0;
}
</style>
