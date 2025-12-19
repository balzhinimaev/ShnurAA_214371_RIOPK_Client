<template>
    <section v-if="alerts.length" class="alerts-section">
        <div 
            v-for="(alert, index) in alerts" 
            :key="index" 
            class="alert-card" 
            :class="'alert-' + alert.type"
        >
            <span class="alert-icon">{{ alert.icon }}</span>
            <p class="alert-message">{{ alert.message }}</p>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useReportStore } from '~/stores/report';
import { formatCurrency, formatPercent, formatApiPercent, normalizeApiPercent } from '~/utils/formatters';
import { formatAgingBucket } from '~/utils/agingHelpers';

interface Alert {
    type: 'warning' | 'danger' | 'info';
    icon: string;
    message: string;
}

const reportStore = useReportStore();

const alerts = computed((): Alert[] => {
    const summary = reportStore.dashboardSummary;
    if (!summary) return [];
    
    const alertsList: Alert[] = [];
    const s = summary;
    
    const overdueShare = (() => {
        const apiValue = s.overduePercentage;
        if (typeof apiValue === 'number') {
            return normalizeApiPercent(apiValue);
        }
        const total = s.totalReceivables ?? 0;
        const overdue = s.overdueReceivables ?? 0;
        return total > 0 ? (overdue / total) * 100 : 0;
    })();
    
    const overdueShareLabel = formatPercent(overdueShare);
    const overdueInvoiceCount = s.overdueInvoicesCount ?? 0;
    const agingStructure = s.agingStructure ?? [];
    
    // Критическая просрочка
    if (overdueShare > 30) {
        alertsList.push({
            type: 'danger',
            icon: '🚨',
            message: `Критический уровень просрочки: ${overdueShareLabel}. Требуется немедленное внимание!`
        });
    } else if (overdueShare > 10) {
        alertsList.push({
            type: 'warning',
            icon: '⚠️',
            message: `Повышенный уровень просрочки: ${overdueShareLabel}`
        });
    }
    
    // Много просроченных счетов
    if (overdueInvoiceCount > 20) {
        alertsList.push({
            type: 'warning',
            icon: '📋',
            message: `${overdueInvoiceCount} счетов просрочено. Рекомендуется провести работу с должниками`
        });
    }
    
    // Старая просрочка (91+)
    const oldestBucket = agingStructure.find(b => b.bucket === '91+' || b.bucket === '91_PLUS');
    if (oldestBucket && oldestBucket.amount > 0) {
        alertsList.push({
            type: 'danger',
            icon: '🔥',
            message: `Критическая просрочка (${formatAgingBucket('91+')}): ${formatCurrency(oldestBucket.amount)} (${oldestBucket.count} счетов)`
        });
    }
    
    // Высокий процент просроченных платежей
    if (normalizeApiPercent(s.overduePaymentsPercentage) > 25) {
        alertsList.push({
            type: 'warning',
            icon: '💸',
            message: `${formatApiPercent(s.overduePaymentsPercentage)} платежей поступают с просрочкой`
        });
    }
    
    return alertsList;
});
</script>

<style scoped lang="scss">
.alerts-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.alert-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-left: 4px solid transparent;
}

.alert-card.alert-warning {
    border-left-color: #ed8936;
    background: linear-gradient(90deg, rgba(254, 243, 199, 0.3) 0%, rgba(255, 255, 255, 0.95) 100%);
}

.alert-card.alert-danger {
    border-left-color: #f56565;
    background: linear-gradient(90deg, rgba(254, 215, 215, 0.3) 0%, rgba(255, 255, 255, 0.95) 100%);
}

.alert-card.alert-info {
    border-left-color: #4299e1;
    background: linear-gradient(90deg, rgba(219, 234, 254, 0.3) 0%, rgba(255, 255, 255, 0.95) 100%);
}

.alert-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.alert-message {
    margin: 0;
    font-size: 0.95rem;
    color: #2d3748;
    font-weight: 500;
}
</style>
