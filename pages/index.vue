// pages/index.vue
<template>
    <ClientOnly>
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

                                <!-- Раскрываемый контент с клиентами -->
                                <div v-if="expandedAgingItems[aging.bucket]" class="aging-customers-container">
                                    <!-- Состояние загрузки -->
                                    <div v-if="reportStore.agingCustomersLoading[aging.bucket]" class="aging-customers-loading">
                                        <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                                        Загружаем клиентов...
                                    </div>

                                    <!-- Ошибка загрузки -->
                                    <div v-else-if="reportStore.agingCustomersError[aging.bucket]" class="aging-customers-error">
                                        <p class="error-text">{{ reportStore.agingCustomersError[aging.bucket] }}</p>
                                        <button type="button" class="retry-btn" @click="reportStore.fetchAgingCustomers(aging.bucket)">Повторить</button>
                                    </div>

                                    <!-- Список клиентов -->
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
                                                    <span class="breakdown-label">Текущие</span>
                                                    <span class="breakdown-value">{{ formatCurrency(customer.agingBreakdown.current) }}</span>
                                                </div>
                                                <div class="breakdown-item" v-if="customer.agingBreakdown.days_1_30 > 0">
                                                    <span class="breakdown-label">1-30 дней</span>
                                                    <span class="breakdown-value">{{ formatCurrency(customer.agingBreakdown.days_1_30) }}</span>
                                                </div>
                                                <div class="breakdown-item" v-if="customer.agingBreakdown.days_31_60 > 0">
                                                    <span class="breakdown-label">31-60 дней</span>
                                                    <span class="breakdown-value">{{ formatCurrency(customer.agingBreakdown.days_31_60) }}</span>
                                                </div>
                                                <div class="breakdown-item" v-if="customer.agingBreakdown.days_61_90 > 0">
                                                    <span class="breakdown-label">61-90 дней</span>
                                                    <span class="breakdown-value">{{ formatCurrency(customer.agingBreakdown.days_61_90) }}</span>
                                                </div>
                                                <div class="breakdown-item" v-if="customer.agingBreakdown.days_91_plus > 0">
                                                    <span class="breakdown-label">91+ дней</span>
                                                    <span class="breakdown-value">{{ formatCurrency(customer.agingBreakdown.days_91_plus) }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Пустое состояние -->
                                    <div v-else class="aging-customers-empty">
                                        Нет клиентов в этой категории
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
        <template #fallback>
            <div class="dashboard-page">
                <div class="dashboard-container">
                    <div class="state-card loading-card">
                        <div class="loading-indicator">
                            <div class="spinner-grow text-light" role="status">
                                <span class="visually-hidden">Загрузка...</span>
                            </div>
                            <p class="loading-text">Загружаем дашборд...</p>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </ClientOnly>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useReportStore } from '~/stores/report';

definePageMeta({
    middleware: ['auth']
});

const authStore = useAuthStore();
const reportStore = useReportStore();

// Состояние для раскрытых aging элементов (ключ - bucket, значение - boolean)
const expandedAgingItems = ref<Record<string, boolean>>({});

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

const formatInvoiceCount = (count: number) => {
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

const formatOldestDebtDays = (days: number) => {
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

    if (!reportStore.topDebtorsLoading) {
        reportStore.fetchTopDebtors();
    }
}

// Функция для преобразования значений bucket в API формат
function mapAgingBucketToApiParam(bucket: string): string {
    const bucketMapping: Record<string, string> = {
        '1-30 дней': '1_30',
        '31-60 дней': '31_60',
        '61-90 дней': '61_90',
        '91+ дней': '91_PLUS',
        'Current': 'current', // Current соответствует непросроченным счетам
        '1_30': '1_30',
        '31_60': '31_60',
        '61_90': '61_90',
        '91_PLUS': '91_PLUS'
    };

    return bucketMapping[bucket] || bucket;
}

async function handleAgingItemClick(agingBucket: string) {
    const isExpanded = expandedAgingItems.value[agingBucket];

    if (isExpanded) {
        // Если элемент уже раскрыт, просто сворачиваем
        expandedAgingItems.value[agingBucket] = false;
    } else {
        // Если элемент свернут, раскрываем и загружаем данные
        expandedAgingItems.value[agingBucket] = true;

        // Загружаем клиентов для этого aging bucket, если они еще не загружены
        if (!reportStore.agingCustomers[agingBucket] && !reportStore.agingCustomersLoading[agingBucket]) {
            const apiParam = mapAgingBucketToApiParam(agingBucket);
            await reportStore.fetchAgingCustomers(apiParam, agingBucket);
        }
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

    if (authStore.isAuthenticated && !reportStore.topDebtors.length && !reportStore.topDebtorsError) {
        reportStore.fetchTopDebtors();
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
    gap: 1.2rem;
}

.aging-item {
    background: #ffffff;
    border-radius: 0.875rem;
    padding: 1.25rem;
    border: 2px solid #cbd5e0;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    cursor: pointer;

    &:hover {
        border-color: #a0aec0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        transform: translateY(-2px);
    }

    &.aging-item-expanded {
        border-color: #667eea;
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.15);
    }
}

.aging-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.85rem;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.aging-item-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.aging-badge {
    display: inline-block;
    padding: 0.4rem 0.85rem;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.85rem;
    color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &.green { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); }
    &.yellow { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); }
    &.orange { background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); }
    &.red { background: linear-gradient(135deg, #c53030 0%, #9b2c2c 100%); }
    &.purple { background: linear-gradient(135deg, #805ad5 0%, #6b46c1 100%); }
}

.aging-count {
    font-size: 0.8rem;
    color: #718096;
    font-weight: 500;
}

.aging-item-stats {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.aging-expand-icon {
    font-size: 0.8rem;
    color: #718096;
    transition: transform 0.3s ease, color 0.3s ease;
    margin-left: 0.5rem;

    &.rotated {
        transform: rotate(180deg);
        color: #667eea;
    }
}

.aging-amount {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2d3748;
}

.aging-percent-badge {
    background: #edf2f7;
    color: #4a5568;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
}

.aging-progress-bar {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
    position: relative;
}

.aging-progress-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    &.green { background: linear-gradient(90deg, #48bb78 0%, #38a169 100%); }
    &.yellow { background: linear-gradient(90deg, #ed8936 0%, #dd6b20 100%); }
    &.orange { background: linear-gradient(90deg, #f56565 0%, #e53e3e 100%); }
    &.red { background: linear-gradient(90deg, #c53030 0%, #9b2c2c 100%); }
    &.purple { background: linear-gradient(90deg, #805ad5 0%, #6b46c1 100%); }
}

.top-debtors {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    max-height: 480px;
    overflow-y: auto;
    padding-right: 0.5rem;

    /* Стилизация скроллбара - более заметный */
    &::-webkit-scrollbar {
        width: 10px;
    }

    &::-webkit-scrollbar-track {
        background: #e2e8f0;
        border-radius: 5px;
        border: 1px solid #cbd5e0;
    }

    &::-webkit-scrollbar-thumb {
        background: #a0aec0;
        border-radius: 5px;
        border: 1px solid #718096;
        transition: background 0.2s ease;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: #718096;
    }
}

.debtor-card {
    background: #ffffff;
    border-radius: 0.875rem;
    padding: 1.25rem;
    border: 2px solid #cbd5e0;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    &:hover {
        border-color: #a0aec0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        transform: translateY(-2px);
    }
}

.debtor-card-header {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.debtor-title-section {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.debtor-rank-badge {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
    flex-shrink: 0;
}

.debtor-info-block {
    flex: 1;
    min-width: 0;
}

.debtor-name {
    margin: 0 0 0.4rem 0;
    font-weight: 700;
    color: #2d3748;
    font-size: 1rem;
    line-height: 1.3;
}

.debtor-details {
    margin: 0;
    font-size: 0.8rem;
    color: #718096;
    line-height: 1.4;
}

.debtor-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

.debtor-stat-item {
    background: #f7fafc;
    padding: 0.75rem 1rem;
    border-radius: 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    border: 1px solid #e2e8f0;
}

.debtor-stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #718096;
    font-weight: 600;
}

.debtor-stat-value {
    font-size: 1rem;
    font-weight: 700;
    color: #2d3748;
}

.debtor-stat-total {
    .debtor-stat-value {
        color: #2d3748;
    }
}

.debtor-stat-overdue {
    .debtor-stat-value {
        color: #c53030;
    }
}

.debtor-stat-zero {
    .debtor-stat-value {
        color: #38a169;
    }
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

/* Стили для раскрываемого контента клиентов */
.aging-customers-container {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
    animation: slideDown 0.4s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
        max-height: 0;
    }
    to {
        opacity: 1;
        transform: translateY(0);
        max-height: 1000px;
    }
}

.aging-customers-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #718096;
    font-size: 0.9rem;
}

.aging-customers-error {
    padding: 1.5rem;
    text-align: center;
    background: #fed7d7;
    border-radius: 0.5rem;
    border: 1px solid #feb2b2;

    .error-text {
        color: #c53030;
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
    }

    .retry-btn {
        background: #e53e3e;
        color: #fff;
        border: none;
        border-radius: 0.375rem;
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;

        &:hover {
            background: #c53030;
        }
    }
}

.aging-customers-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 0.5rem;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: #cbd5e0;
        border-radius: 3px;
        transition: background 0.2s ease;

        &:hover {
            background: #a0aec0;
        }
    }
}

.aging-customer-card {
    background: #f8fafc;
    border-radius: 0.75rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;

    &:hover {
        background: #f1f5f9;
        border-color: #cbd5e0;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
}

.customer-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    gap: 1rem;
}

.customer-info {
    flex: 1;
    min-width: 0;
}

.customer-name {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 700;
    color: #2d3748;
    line-height: 1.3;
}

.customer-details {
    margin: 0;
    font-size: 0.8rem;
    color: #718096;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;

    .customer-inn {
        background: #edf2f7;
        color: #4a5568;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
    }
}

.customer-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 140px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    text-align: right;

    &.stat-overdue .stat-value {
        color: #c53030;
    }
}

.stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #718096;
    font-weight: 600;
}

.stat-value {
    font-size: 0.9rem;
    font-weight: 700;
    color: #2d3748;
}

.customer-breakdown {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e2e8f0;
}

.breakdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #ffffff;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    font-size: 0.8rem;
}

.breakdown-label {
    color: #718096;
    font-weight: 600;
}

.breakdown-value {
    color: #2d3748;
    font-weight: 700;
}

.aging-customers-empty {
    text-align: center;
    color: #a0aec0;
    font-size: 0.9rem;
    padding: 2rem;
    font-style: italic;
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
