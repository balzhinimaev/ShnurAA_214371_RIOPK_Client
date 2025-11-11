// pages/index.vue
<template>
    <div class="dashboard-page">
        <div class="dashboard-container">
            <header class="dashboard-header">
                <div class="header-left">
                    <h1 class="page-title">📊 Дашборд анализа дебиторской задолженности</h1>
                    <p class="page-subtitle">
                        Комплексный обзор ключевых показателей по клиентской задолженности
                    </p>
                    <div v-if="authStore.isAuthenticated && authStore.user" class="user-meta">
                        <div class="user-meta-text">
                            <span class="user-name">👋 {{ authStore.user.name || 'Пользователь' }}</span>
                            <span class="user-email">{{ authStore.user.email }}</span>
                        </div>
                        <div class="role-badges" v-if="authStore.user.roles?.length">
                            <span v-for="role in authStore.user.roles" :key="role" class="role-badge">{{ role }}</span>
                        </div>
                    </div>
                </div>
                <div class="header-right">
                    <span class="date-badge">📅 Данные на: {{ lastUpdatedLabel }}</span>
                    <button
                        class="update-btn"
                        type="button"
                        :disabled="reportStore.isLoading"
                        @click="handleRefresh"
                    >
                        <span v-if="reportStore.isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                        <span>{{ reportStore.isLoading ? 'Обновление...' : '🔄 Обновить' }}</span>
                    </button>
                    <button
                        v-if="authStore.isAuthenticated"
                        type="button"
                        class="logout-btn"
                        @click="handleLogout"
                    >
                        Выйти
                    </button>
                </div>
            </header>

            <div v-if="reportStore.isLoading" class="state-card loading-card">
                <div class="loading-indicator">
                    <div class="spinner-grow text-light" role="status">
                        <span class="visually-hidden">Загрузка...</span>
                    </div>
                    <p class="loading-text">Загружаем обновлённую аналитику...</p>
                </div>
            </div>

            <div v-else-if="reportStore.error" class="state-card error-card">
                <div class="error-content">
                    <div>
                        <h2 class="error-title">Не удалось загрузить дашборд</h2>
                        <p class="error-message">{{ reportStore.error }}</p>
                    </div>
                    <button type="button" class="retry-btn" @click="handleRefresh">Повторить попытку</button>
                </div>
            </div>

            <div v-else-if="summary" class="dashboard-content">
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
                        <p class="metric-value">{{ overdueShareLabel }}</p>
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

                <section class="charts-grid">
                    <article class="chart-card">
                        <div class="chart-header">
                            <h3 class="chart-title">Структура просрочки по срокам</h3>
                            <p class="chart-subtitle">Общий объём просрочки: {{ formattedOverdueReceivables }}</p>
                        </div>
                        <div v-if="agingData.length" class="aging-bars">
                            <div v-for="aging in agingData" :key="aging.bucket" class="aging-bar">
                                <div class="aging-label">{{ aging.bucket }}</div>
                                <div class="aging-progress">
                                    <div
                                        class="aging-fill"
                                        :class="aging.colorClass"
                                        :style="{ width: aging.width }"
                                    >
                                        <span>{{ aging.formattedAmount }}</span>
                                    </div>
                                </div>
                                <span class="aging-percent">{{ aging.percentLabel }}</span>
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

                    <article class="chart-card">
                        <div class="chart-header">
                            <h3 class="chart-title">Топ-10 должников</h3>
                            <p class="chart-subtitle">Суммы указаны с учётом просроченной задолженности</p>
                        </div>
                        <div v-if="topDebtors.length" class="top-debtors">
                            <div
                                v-for="(debtor, index) in topDebtors"
                                :key="`${debtor.name}-${index}`"
                                class="debtor-item"
                            >
                                <div class="debtor-info">
                                    <span class="debtor-rank">{{ index + 1 }}</span>
                                    <div>
                                        <p class="debtor-name">{{ debtor.name }}</p>
                                        <p class="debtor-subtitle">Просрочено: {{ debtor.amountLabel }}</p>
                                    </div>
                                </div>
                                <span class="debtor-amount">{{ debtor.amountLabel }}</span>
                            </div>
                        </div>
                        <p v-else class="empty-state">Информация о должниках пока недоступна.</p>
                    </article>
                </section>

                <section class="full-width-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Дополнительные показатели эффективности</h3>
                        <p class="chart-subtitle">Сводные метрики, рассчитанные по текущим данным</p>
                    </div>
                    <div v-if="additionalMetrics.length" class="additional-metrics">
                        <div v-for="metric in additionalMetrics" :key="metric.label" class="small-metric">
                            <p class="small-metric-label">{{ metric.label }}</p>
                            <p class="small-metric-value">{{ metric.value }}</p>
                            <p v-if="metric.hint" class="small-metric-hint">{{ metric.hint }}</p>
                        </div>
                    </div>
                    <p v-else class="empty-state">Недостаточно данных для расчёта дополнительных метрик.</p>
                </section>
            </div>

            <div v-else class="state-card info-card">
                <p class="info-message">Нет данных для отображения. Загрузите свежие данные, чтобы увидеть аналитику.</p>
                <NuxtLink v-if="canUploadData" to="/upload" class="retry-btn">Перейти к загрузке</NuxtLink>
            </div>

            <div v-if="!authStore.isAuthenticated" class="alert alert-warning mt-4" role="alert">
                Для доступа к дашборду необходимо авторизоваться.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useReportStore } from '~/stores/report';

definePageMeta({
    middleware: ['auth']
});

const authStore = useAuthStore();
const reportStore = useReportStore();

const summary = computed(() => reportStore.dashboardSummary);

const formatCurrency = (value: number) => {
    if (!Number.isFinite(value)) {
        return '—';
    }
    return value.toLocaleString('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};

const formatPercent = (value: number) => {
    if (!Number.isFinite(value)) {
        return '—';
    }
    return `${value.toFixed(1)}%`;
};

const totalReceivables = computed(() => summary.value?.totalReceivables ?? 0);
const overdueReceivables = computed(() => summary.value?.overdueReceivables ?? 0);
const currentReceivables = computed(() => Math.max(totalReceivables.value - overdueReceivables.value, 0));

const agingStructure = computed(() => summary.value?.agingStructure ?? []);
const totalAgingAmount = computed(() => agingStructure.value.reduce((sum, bucket) => sum + bucket.amount, 0));
const totalInvoices = computed(() => agingStructure.value.reduce((sum, bucket) => sum + bucket.count, 0));
const overdueInvoiceCount = computed(() => totalInvoices.value);

const formattedTotalReceivables = computed(() => formatCurrency(totalReceivables.value));
const formattedOverdueReceivables = computed(() => formatCurrency(overdueReceivables.value));
const formattedCurrentReceivables = computed(() => formatCurrency(currentReceivables.value));
const overdueShare = computed(() => totalReceivables.value > 0 ? (overdueReceivables.value / totalReceivables.value) * 100 : 0);
const overdueShareLabel = computed(() => formatPercent(overdueShare.value));
const currentShare = computed(() => totalReceivables.value > 0 ? (currentReceivables.value / totalReceivables.value) * 100 : 0);
const currentShareLabel = computed(() => formatPercent(currentShare.value));
const overdueInvoiceCountLabel = computed(() => overdueInvoiceCount.value > 0 ? `${overdueInvoiceCount.value} счетов` : '—');

const agingColorClasses = ['green', 'yellow', 'orange', 'red', 'purple'];
const agingData = computed(() => agingStructure.value.map((bucket, index) => {
    const percent = totalAgingAmount.value > 0 ? (bucket.amount / totalAgingAmount.value) * 100 : 0;
    const width = percent > 0 ? Math.max(percent, 6) : 0;
    return {
        ...bucket,
        percent,
        percentLabel: formatPercent(percent),
        formattedAmount: formatCurrency(bucket.amount),
        colorClass: agingColorClasses[index % agingColorClasses.length],
        width: `${width}%`
    };
}));

const largestBucket = computed(() => {
    if (!agingStructure.value.length) {
        return null;
    }
    return agingStructure.value.reduce((max, bucket) => (bucket.amount > max.amount ? bucket : max));
});

const averageInvoiceAmount = computed(() => totalInvoices.value > 0 ? totalReceivables.value / totalInvoices.value : Number.NaN);
const largestBucketShare = computed(() => (totalAgingAmount.value > 0 && largestBucket.value)
    ? (largestBucket.value.amount / totalAgingAmount.value) * 100
    : Number.NaN);

const additionalMetrics = computed(() => {
    if (!summary.value) {
        return [] as { label: string; value: string; hint?: string }[];
    }

    const metrics = [
        {
            label: 'Количество счетов',
            value: totalInvoices.value > 0 ? totalInvoices.value.toString() : '—',
            hint: totalInvoices.value > 0 ? 'Сумма всех записей в структуре старения' : undefined
        },
        {
            label: 'Средняя сумма счёта',
            value: formatCurrency(averageInvoiceAmount.value),
            hint: totalInvoices.value > 0 ? 'Общая сумма задолженности / количество счетов' : undefined
        },
        {
            label: 'Крупнейший сегмент просрочки',
            value: largestBucket.value ? largestBucket.value.bucket : '—',
            hint: largestBucket.value ? `Сумма: ${formatCurrency(largestBucket.value.amount)}` : undefined
        },
        {
            label: 'Доля крупнейшего сегмента',
            value: formatPercent(largestBucketShare.value),
            hint: largestBucket.value ? 'Часть от общего объёма просроченной задолженности' : undefined
        },
        {
            label: 'Доля своевременных оплат',
            value: currentShareLabel.value,
            hint: currentReceivables.value > 0 ? `Сумма: ${formattedCurrentReceivables.value}` : undefined
        }
    ];

    return metrics;
});

const topDebtors = computed(() => {
    const debtors = summary.value?.topDebtors ?? [];
    return debtors.map((debtor) => ({
        ...debtor,
        amountLabel: formatCurrency(debtor.amount)
    }));
});

const lastUpdatedLabel = computed(() => {
    const raw = summary.value?.lastUpdatedAt;
    if (raw) {
        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    }
    return new Date().toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
});

function handleLogout() {
    authStore.logout();
}

function handleRefresh() {
    if (!reportStore.isLoading) {
        reportStore.fetchDashboardSummary();
    }
}

const canUploadData = computed(() => {
    if (!authStore.isAuthenticated || !authStore.user?.roles) {
        return false;
    }
    return authStore.user.roles.includes('ADMIN') || authStore.user.roles.includes('ANALYST');
});

onMounted(() => {
    if (authStore.isAuthenticated && !summary.value && !reportStore.error) {
        reportStore.fetchDashboardSummary();
    }
});
</script>

<style scoped lang="scss">
.dashboard-page {
    position: relative;
    padding: 2rem;
    border-radius: 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 20px 40px rgba(82, 95, 225, 0.25);
    color: #2d3748;
}

.dashboard-container {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.dashboard-header {
    background: rgba(255, 255, 255, 0.96);
    border-radius: 1rem;
    padding: 1.75rem 2rem;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.page-title {
    font-size: 1.6rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 0.25rem;
}

.page-subtitle {
    font-size: 0.95rem;
    color: #4a5568;
    margin-bottom: 0.75rem;
}

.user-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.user-meta-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.user-name {
    font-weight: 600;
    color: #2d3748;
}

.user-email {
    font-size: 0.9rem;
    color: #4a5568;
}

.role-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
}

.role-badge {
    background: #edf2f7;
    color: #4a5568;
    border-radius: 999px;
    padding: 0.25rem 0.65rem;
    font-size: 0.75rem;
    font-weight: 600;
}

.header-right {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
}

.date-badge {
    background: #f7fafc;
    color: #4a5568;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.85rem;
}

.update-btn,
.logout-btn {
    border: none;
    border-radius: 0.6rem;
    padding: 0.55rem 1.2rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    font-size: 0.85rem;
}

.update-btn {
    background: #667eea;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
}

.update-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.update-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.logout-btn {
    background: #edf2f7;
    color: #4a5568;
}

.logout-btn:hover {
    background: #e2e8f0;
    transform: translateY(-2px);
}

.state-card {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 1rem;
    padding: 2.5rem 2rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    align-items: center;
    text-align: center;
}

.loading-card {
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
}

.loading-text {
    margin-top: 1rem;
    color: #f7fafc;
    font-size: 0.95rem;
}

.error-card {
    align-items: stretch;
}

.error-content {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.error-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #c53030;
    margin-bottom: 0.5rem;
}

.error-message {
    color: #742a2a;
    margin: 0;
}

.retry-btn {
    border: none;
    border-radius: 0.6rem;
    background: #f56565;
    color: #fff;
    font-weight: 600;
    padding: 0.6rem 1.2rem;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.retry-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(245, 101, 101, 0.4);
}

.dashboard-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

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

.metric-change {
    font-size: 0.9rem;
    font-weight: 600;
    margin: 0;
}

.metric-change.up { color: #c53030; }
.metric-change.down { color: #2f855a; }
.metric-change.neutral { color: #4a5568; }

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.25rem;
}

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

.aging-bar {
    display: grid;
    grid-template-columns: 120px 1fr 80px;
    align-items: center;
    gap: 0.75rem;
}

.aging-label {
    font-weight: 600;
    color: #4a5568;
    font-size: 0.9rem;
}

.aging-progress {
    background: #edf2f7;
    border-radius: 0.75rem;
    height: 40px;
    overflow: hidden;
    display: flex;
    align-items: center;
}

.aging-fill {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 1rem;
    color: #fff;
    font-weight: 600;
    font-size: 0.9rem;
    transition: width 0.4s ease;
    min-width: 0;
    white-space: nowrap;
}

.aging-percent {
    font-size: 0.85rem;
    font-weight: 600;
    color: #4a5568;
    text-align: right;
}

.aging-fill.green { background: #48bb78; }
.aging-fill.yellow { background: #ed8936; }
.aging-fill.orange { background: #f56565; }
.aging-fill.red { background: #c53030; }
.aging-fill.purple { background: #805ad5; }

.top-debtors {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.debtor-item {
    background: #f7fafc;
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: transform 0.2s ease, background 0.2s ease;
}

.debtor-item:hover {
    background: #edf2f7;
    transform: translateX(4px);
}

.debtor-info {
    display: flex;
    align-items: center;
    gap: 0.9rem;
}

.debtor-rank {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #667eea;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
}

.debtor-name {
    margin: 0;
    font-weight: 600;
    color: #2d3748;
}

.debtor-subtitle {
    margin: 0;
    font-size: 0.8rem;
    color: #718096;
}

.debtor-amount {
    font-weight: 700;
    color: #c53030;
}

.full-width-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 1rem;
    padding: 1.75rem;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.additional-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
}

.small-metric {
    background: #f7fafc;
    border-radius: 0.8rem;
    padding: 1.25rem 1rem;
    text-align: center;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.small-metric-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #718096;
    margin-bottom: 0.4rem;
}

.small-metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0;
}

.small-metric-hint {
    margin-top: 0.35rem;
    font-size: 0.75rem;
    color: #718096;
}

.action-button {
    margin-top: auto;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0.75rem 1.2rem;
    border-radius: 0.75rem;
    background: #48bb78;
    color: #fff;
    font-weight: 600;
    text-decoration: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(72, 187, 120, 0.35);
    color: #fff;
}

.empty-state {
    text-align: center;
    color: #718096;
    font-size: 0.9rem;
    margin: 0;
}

.info-card {
    background: rgba(255, 255, 255, 0.85);
    color: #2d3748;
}

.info-message {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
}

@media (max-width: 992px) {
    .dashboard-page {
        padding: 1.5rem;
    }

    .dashboard-header {
        padding: 1.5rem;
    }

    .metric-value {
        font-size: 1.75rem;
    }

    .aging-bar {
        grid-template-columns: 100px 1fr 70px;
    }
}

@media (max-width: 768px) {
    .dashboard-page {
        padding: 1rem;
    }

    .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .metrics-grid {
        grid-template-columns: 1fr;
    }

    .charts-grid {
        grid-template-columns: 1fr;
    }

    .aging-bar {
        grid-template-columns: 1fr;
    }

    .aging-percent {
        text-align: left;
    }
}
</style>
