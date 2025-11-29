// pages/index.vue
<template>
    <ClientOnly>
        <div class="dashboard-page">
            <div class="dashboard-container">
            <header class="dashboard-header">
                <div class="header-left">
                    <h1 class="page-title">📊 Дашборд анализа дебиторской задолженности</h1>
                    <p class="page-subtitle">
                        Комплексный обзор ключевых показателей по дебиторской задолженности
                    </p>
                    <p class="page-note" style="font-size: 0.85rem; color: #718096; margin-top: 0.5rem; font-style: italic;">
                        Примечание: В программе рассматривается только часть дебиторской задолженности, связанная с расчетами с поставщиками
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
                <!-- Блок алертов и предупреждений -->
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
                                        Загружаем дебиторов...
                                    </div>

                                    <!-- Ошибка загрузки -->
                                    <div v-else-if="reportStore.agingCustomersError[aging.bucket]" class="aging-customers-error">
                                        <p class="error-text">{{ reportStore.agingCustomersError[aging.bucket] }}</p>
                                        <button type="button" class="retry-btn" @click="reportStore.fetchAgingCustomers(aging.bucket)">Повторить</button>
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

                <!-- Секция со списком счетов -->
                <section class="full-width-card invoices-section">
                    <div class="chart-header">
                        <h3 class="chart-title">📋 Детальный список счетов</h3>
                        <p class="chart-subtitle">Полная информация о всех счетах с возможностью фильтрации и сортировки</p>
                    </div>

                    <!-- Фильтры -->
                    <div class="invoices-filters">
                        <div class="filters-row">
                            <div class="filter-group">
                                <label class="filter-label">Статус</label>
                                <select 
                                    v-model="invoiceFilters.status" 
                                    @change="handleInvoiceFilterChange"
                                    class="filter-select"
                                >
                                    <option value="">Все статусы</option>
                                    <option value="PAID">Оплачено</option>
                                    <option value="OVERDUE">Просрочено</option>
                                    <option value="CURRENT">В срок</option>
                                </select>
                            </div>

                            <div class="filter-group">
                                <label class="filter-label">Статус работы с долгом</label>
                                <select 
                                    v-model="invoiceFilters.debtWorkStatus" 
                                    @change="handleInvoiceFilterChange"
                                    class="filter-select"
                                >
                                    <option value="">Все статусы</option>
                                    <option value="CALL">Прозвон</option>
                                    <option value="CLAIM">Претензия</option>
                                    <option value="COURT">Суд</option>
                                </select>
                            </div>

                            <div class="filter-group">
                                <label class="filter-label">Менеджер</label>
                                <input 
                                    v-model="invoiceFilters.manager" 
                                    @input="handleInvoiceFilterChange"
                                    type="text" 
                                    placeholder="Поиск по менеджеру"
                                    class="filter-input"
                                />
                            </div>

                            <div class="filter-group">
                                <label class="filter-label">Просрочка (дни)</label>
                                <div class="filter-range">
                                    <input 
                                        v-model.number="invoiceFilters.minDaysOverdue" 
                                        @input="handleInvoiceFilterChange"
                                        type="number" 
                                        placeholder="От"
                                        class="filter-input filter-input-small"
                                    />
                                    <span class="filter-separator">—</span>
                                    <input 
                                        v-model.number="invoiceFilters.maxDaysOverdue" 
                                        @input="handleInvoiceFilterChange"
                                        type="number" 
                                        placeholder="До"
                                        class="filter-input filter-input-small"
                                    />
                                </div>
                            </div>

                            <div class="filter-group">
                                <label class="filter-label">Мин. сумма</label>
                                <input 
                                    v-model.number="invoiceFilters.minAmount" 
                                    @input="handleInvoiceFilterChange"
                                    type="number" 
                                    placeholder="Минимальная сумма"
                                    class="filter-input"
                                />
                            </div>

                            <div class="filter-group">
                                <label class="filter-label">Сортировка</label>
                                <select 
                                    v-model="invoiceSortBy" 
                                    @change="handleInvoiceSortChange"
                                    class="filter-select"
                                >
                                    <option value="dueDate">По дате оплаты</option>
                                    <option value="totalAmount">По сумме</option>
                                    <option value="outstandingAmount">По остатку</option>
                                    <option value="invoiceNumber">По номеру</option>
                                </select>
                            </div>

                            <div class="filter-group">
                                <label class="filter-label">Направление</label>
                                <select 
                                    v-model="invoiceSortOrder" 
                                    @change="handleInvoiceSortChange"
                                    class="filter-select"
                                >
                                    <option value="desc">По убыванию</option>
                                    <option value="asc">По возрастанию</option>
                                </select>
                            </div>
                        </div>

                        <div class="filters-actions">
                            <button 
                                type="button" 
                                @click="handleClearInvoiceFilters"
                                class="filter-btn filter-btn-clear"
                            >
                                Очистить фильтры
                            </button>
                            <button 
                                type="button" 
                                @click="handleRefreshInvoices"
                                class="filter-btn filter-btn-refresh"
                                :disabled="reportStore.invoicesLoading"
                            >
                                <span v-if="reportStore.invoicesLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                {{ reportStore.invoicesLoading ? 'Загрузка...' : 'Обновить' }}
                            </button>
                        </div>
                    </div>

                    <!-- Состояние загрузки -->
                    <div v-if="reportStore.invoicesLoading" class="invoices-loading">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Загрузка...</span>
                        </div>
                        <p>Загружаем счета...</p>
                    </div>

                    <!-- Ошибка -->
                    <div v-else-if="reportStore.invoicesError" class="invoices-error">
                        <p class="error-text">{{ reportStore.invoicesError }}</p>
                        <button type="button" class="retry-btn" @click="handleRefreshInvoices">Повторить</button>
                    </div>

                    <!-- Список счетов -->
                    <div v-else-if="reportStore.invoices.length" class="invoices-list">
                        <div class="invoices-header">
                            <p class="invoices-count">
                                Найдено счетов: <strong>{{ reportStore.invoicesTotal }}</strong>
                            </p>
                        </div>

                        <div class="invoices-table-container">
                            <table class="invoices-table">
                                <thead>
                                    <tr>
                                        <th>Номер счета</th>
                                        <th>Дебитор</th>
                                        <th>Дата выставления</th>
                                        <th>Срок оплаты</th>
                                        <th>Общая сумма</th>
                                        <th>Оплачено</th>
                                        <th>Остаток</th>
                                        <th>Статус</th>
                                        <th>Менеджер</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="invoice in reportStore.invoices" :key="invoice.id" class="invoice-row">
                                        <td class="invoice-number">{{ invoice.invoiceNumber || '—' }}</td>
                                        <td>
                                            <div class="customer-cell">
                                                <div class="customer-name">{{ invoice.customer?.name || 'Не указан' }}</div>
                                                <div class="customer-unp">УНП: {{ invoice.customer?.unp || '—' }}</div>
                                            </div>
                                        </td>
                                        <td>{{ formatDate(invoice.issueDate) }}</td>
                                        <td :class="{ 'overdue-date': isOverdue(invoice.dueDate) }">
                                            {{ formatDate(invoice.dueDate) }}
                                        </td>
                                        <td class="amount-cell">{{ formatCurrency(invoice.totalAmount) }}</td>
                                        <td class="amount-cell paid">{{ formatCurrency(invoice.paidAmount) }}</td>
                                        <td class="amount-cell outstanding">{{ formatCurrency(invoice.outstandingAmount) }}</td>
                                        <td>
                                            <span class="status-badge" :class="getStatusClass(invoice.status)">
                                                {{ getStatusLabel(invoice.status) }}
                                            </span>
                                            <span v-if="invoice.debtWorkStatus" class="debt-status-badge">
                                                {{ getDebtWorkStatusLabel(invoice.debtWorkStatus) }}
                                            </span>
                                        </td>
                                        <td>{{ invoice.manager || '—' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Пагинация -->
                        <div class="invoices-pagination">
                            <button 
                                type="button"
                                @click="handleInvoicePageChange(reportStore.invoicesCurrentPage - 1)"
                                :disabled="reportStore.invoicesCurrentPage <= 1 || reportStore.invoicesLoading"
                                class="pagination-btn"
                            >
                                Назад
                            </button>
                            <span class="pagination-info">
                                Страница {{ reportStore.invoicesCurrentPage }} из {{ reportStore.invoicesTotalPages }}
                            </span>
                            <button 
                                type="button"
                                @click="handleInvoicePageChange(reportStore.invoicesCurrentPage + 1)"
                                :disabled="reportStore.invoicesCurrentPage >= reportStore.invoicesTotalPages || reportStore.invoicesLoading"
                                class="pagination-btn"
                            >
                                Вперёд
                            </button>
                        </div>
                    </div>

                    <!-- Пустое состояние -->
                    <div v-else class="invoices-empty">
                        <p>Счета не найдены. Попробуйте изменить фильтры.</p>
                    </div>
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
import { onMounted, onBeforeUnmount, computed, ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useReportStore } from '~/stores/report';

definePageMeta({
    middleware: ['auth']
});

const authStore = useAuthStore();
const reportStore = useReportStore();

// Состояние для раскрытых aging элементов (ключ - bucket, значение - boolean)
const expandedAgingItems = ref<Record<string, boolean>>({});

// Состояние для фильтров счетов
const invoiceFilters = ref({
    status: '',
    debtWorkStatus: '',
    manager: '',
    minDaysOverdue: undefined as number | undefined,
    maxDaysOverdue: undefined as number | undefined,
    minAmount: undefined as number | undefined,
});

const invoiceSortBy = ref('dueDate');
const invoiceSortOrder = ref<'asc' | 'desc'>('desc');

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
const currentReceivables = computed(() => summary.value?.currentReceivables ?? Math.max(totalReceivables.value - overdueReceivables.value, 0));

const agingStructure = computed(() => summary.value?.agingStructure ?? []);
const totalAgingAmount = computed(() => agingStructure.value.reduce((sum, bucket) => sum + bucket.amount, 0));
const totalInvoices = computed(() => summary.value?.totalInvoicesCount ?? 0);
const overdueInvoiceCount = computed(() => summary.value?.overdueInvoicesCount ?? 0);

const formattedTotalReceivables = computed(() => formatCurrency(totalReceivables.value));
const formattedOverdueReceivables = computed(() => formatCurrency(overdueReceivables.value));
const formattedCurrentReceivables = computed(() => formatCurrency(currentReceivables.value));
const overdueShare = computed(() => summary.value?.overduePercentage ?? (totalReceivables.value > 0 ? (overdueReceivables.value / totalReceivables.value) * 100 : 0));
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

// Функция для форматирования названия bucket
function formatAgingBucket(bucket: string): string {
    if (bucket === 'Current' || bucket === 'current') {
        return 'Срок оплаты не наступил';
    }
    return bucket;
}

const agingColorClasses = ['green', 'yellow', 'orange', 'red', 'purple'];
const agingData = computed(() => agingStructure.value.map((bucket, index) => {
    const percent = totalAgingAmount.value > 0 ? (bucket.amount / totalAgingAmount.value) * 100 : 0;
    const width = percent > 0 ? Math.max(percent, 6) : 0;
    return {
        ...bucket,
        bucket: formatAgingBucket(bucket.bucket), // Форматируем название bucket
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

const formatDays = (days: number) => {
    if (!Number.isFinite(days) || days <= 0) {
        return '—';
    }
    return `${days.toFixed(1)} дн.`;
};

// Health indicators - определяют состояние метрик
type HealthStatus = 'excellent' | 'good' | 'warning' | 'danger';

interface HealthIndicator {
    status: HealthStatus;
    label: string;
    icon: string;
}

const getOverdueHealthStatus = (percent: number): HealthIndicator => {
    if (percent < 10) {
        return { status: 'excellent', label: 'Отлично', icon: '🟢' };
    } else if (percent < 30) {
        return { status: 'good', label: 'Нормально', icon: '🟡' };
    } else {
        return { status: 'danger', label: 'Требует внимания', icon: '🔴' };
    }
};

const getTurnoverHealthStatus = (ratio: number): HealthIndicator => {
    if (ratio > 3) {
        return { status: 'excellent', label: 'Отлично', icon: '🟢' };
    } else if (ratio >= 1) {
        return { status: 'good', label: 'Нормально', icon: '🟡' };
    } else if (ratio > 0) {
        return { status: 'danger', label: 'Плохо', icon: '🔴' };
    } else {
        return { status: 'warning', label: 'Нет данных', icon: '⚪' };
    }
};

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

const overdueHealthIndicator = computed(() => getOverdueHealthStatus(overdueShare.value));
const turnoverHealthIndicator = computed(() => getTurnoverHealthStatus(summary.value?.turnoverRatio ?? 0));
const paymentDelayHealthIndicator = computed(() => getPaymentDelayHealthStatus(summary.value?.averagePaymentDelayDays ?? 0));

// Генерация алертов на основе данных
interface Alert {
    type: 'warning' | 'danger' | 'info';
    icon: string;
    message: string;
}

const alerts = computed(() => {
    if (!summary.value) return [];
    
    const alertsList: Alert[] = [];
    const s = summary.value;
    
    // Критическая просрочка
    if (overdueShare.value > 30) {
        alertsList.push({
            type: 'danger',
            icon: '🚨',
            message: `Критический уровень просрочки: ${overdueShareLabel.value}. Требуется немедленное внимание!`
        });
    } else if (overdueShare.value > 10) {
        alertsList.push({
            type: 'warning',
            icon: '⚠️',
            message: `Повышенный уровень просрочки: ${overdueShareLabel.value}`
        });
    }
    
    // Много просроченных счетов
    const overdueCount = overdueInvoiceCount.value;
    if (overdueCount > 20) {
        alertsList.push({
            type: 'warning',
            icon: '📋',
            message: `${overdueCount} счетов просрочено. Рекомендуется провести работу с должниками`
        });
    }
    
    // Проблемы с оборачиваемостью
    if (s.turnoverRatio > 0 && s.turnoverRatio < 1) {
        alertsList.push({
            type: 'danger',
            icon: '📊',
            message: `Низкая оборачиваемость ДЗ: ${s.turnoverRatio.toFixed(2)}. Дебиторы медленно платят`
        });
    }
    
    // Старая просрочка (91+)
    const oldestBucket = agingStructure.value.find(b => b.bucket === '91+');
    if (oldestBucket && oldestBucket.amount > 0) {
        alertsList.push({
            type: 'danger',
            icon: '🔥',
            message: `Критическая просрочка 91+ дней: ${formatCurrency(oldestBucket.amount)} (${oldestBucket.count} счетов)`
        });
    }
    
    // Высокий процент просроченных платежей
    if (s.overduePaymentsPercentage > 25) {
        alertsList.push({
            type: 'warning',
            icon: '💸',
            message: `${formatPercent(s.overduePaymentsPercentage)} платежей поступают с просрочкой`
        });
    }
    
    // Позитивные алерты
    if (overdueShare.value < 10 && s.turnoverRatio > 3) {
        alertsList.push({
            type: 'info',
            icon: '✅',
            message: 'Отличные показатели! Низкая просрочка и высокая оборачиваемость'
        });
    }
    
    return alertsList;
});

const additionalMetrics = computed(() => {
    if (!summary.value) {
        return [] as { label: string; value: string; hint?: string; healthIndicator?: HealthIndicator }[];
    }

    const s = summary.value;
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
            healthIndicator: paymentDelayHealthIndicator.value
        },
        {
            label: 'Оборачиваемость ДЗ',
            value: s.turnoverRatio > 0 ? s.turnoverRatio.toFixed(2) : '—',
            hint: s.turnoverRatio > 0 ? 'Сколько раз ДЗ превратилась в деньги за период' : undefined,
            healthIndicator: turnoverHealthIndicator.value
        },
        {
            label: 'Выручка за период',
            value: formatCurrency(s.periodRevenue),
            hint: s.periodRevenue > 0 ? 'Сумма всех счетов, созданных в текущем месяце' : undefined
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
            value: formatPercent(s.overduePaymentsPercentage),
            hint: s.overduePaymentsPercentage > 0 ? 'Доля просроченных платежей от общей суммы' : undefined
        },
        {
            label: 'Средняя ДЗ за период',
            value: formatCurrency(s.averageReceivables),
            hint: s.averageReceivables > 0 ? 'Средняя дебиторская задолженность за текущий месяц' : undefined
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
        'Срок оплаты не наступил': 'current', // Срок оплаты не наступил соответствует непросроченным счетам
        'Current': 'current', // Для обратной совместимости
        '1-30': '1_30', // Формат без "дней"
        '31-60': '31_60', // Формат без "дней"
        '61-90': '61_90', // Формат без "дней"
        '91+': '91_PLUS', // Формат без "дней"
        '1_30': '1_30',
        '31_60': '31_60',
        '61_90': '61_90',
        '91_PLUS': '91_PLUS',
        'current': 'current' // lowercase вариант
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

        // Загружаем дебиторов для этого aging bucket, если они еще не загружены
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

// Функции для работы со счетами
function formatDate(dateString: string) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function isOverdue(dueDateString: string | undefined) {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    if (isNaN(dueDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
}

function getStatusLabel(status: string) {
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
}

function getStatusClass(status: string) {
    const classMap: Record<string, string> = {
        'PAID': 'status-paid',
        'OVERDUE': 'status-overdue',
        'CURRENT': 'status-current',
        'PARTIAL': 'status-partial',
    };
    return classMap[status] || 'status-default';
}

function getDebtWorkStatusLabel(status: string) {
    const statusMap: Record<string, string> = {
        'CALL': 'Прозвон',
        'CLAIM': 'Претензия',
        'COURT': 'Суд',
    };
    return statusMap[status] || status;
}

const invoiceFilterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

function handleInvoiceFilterChange() {
    // Дебаунс для избежания множественных запросов при вводе текста
    if (invoiceFilterTimeout.value) {
        clearTimeout(invoiceFilterTimeout.value);
    }
    
    invoiceFilterTimeout.value = setTimeout(() => {
        const filters: any = {};
        if (invoiceFilters.value.status) filters.status = invoiceFilters.value.status;
        if (invoiceFilters.value.debtWorkStatus) filters.debtWorkStatus = invoiceFilters.value.debtWorkStatus;
        if (invoiceFilters.value.manager) filters.manager = invoiceFilters.value.manager;
        if (invoiceFilters.value.minDaysOverdue !== undefined && invoiceFilters.value.minDaysOverdue !== null) {
            filters.minDaysOverdue = invoiceFilters.value.minDaysOverdue;
        }
        if (invoiceFilters.value.maxDaysOverdue !== undefined && invoiceFilters.value.maxDaysOverdue !== null) {
            filters.maxDaysOverdue = invoiceFilters.value.maxDaysOverdue;
        }
        if (invoiceFilters.value.minAmount !== undefined && invoiceFilters.value.minAmount !== null) {
            filters.minAmount = invoiceFilters.value.minAmount;
        }
        
        reportStore.setInvoicesFilters(filters);
        reportStore.fetchInvoices({ offset: 0 });
    }, 500);
}

function handleInvoiceSortChange() {
    reportStore.setInvoicesFilters({
        sortBy: invoiceSortBy.value,
        sortOrder: invoiceSortOrder.value,
    });
    reportStore.fetchInvoices({ offset: 0 });
}

function handleClearInvoiceFilters() {
    invoiceFilters.value = {
        status: '',
        debtWorkStatus: '',
        manager: '',
        minDaysOverdue: undefined,
        maxDaysOverdue: undefined,
        minAmount: undefined,
    };
    invoiceSortBy.value = 'dueDate';
    invoiceSortOrder.value = 'desc';
    reportStore.clearInvoicesFilters();
    reportStore.fetchInvoices({ offset: 0 });
}

function handleRefreshInvoices() {
    reportStore.fetchInvoices();
}

function handleInvoicePageChange(page: number) {
    if (page < 1 || page > reportStore.invoicesTotalPages) return;
    const offset = (page - 1) * reportStore.invoicesPerPage;
    reportStore.fetchInvoices({ offset });
}

onMounted(() => {
    if (authStore.isAuthenticated && !summary.value && !reportStore.error) {
        reportStore.fetchDashboardSummary();
    }

    if (authStore.isAuthenticated && !reportStore.topDebtors.length && !reportStore.topDebtorsError) {
        reportStore.fetchTopDebtors();
    }

    // Загружаем счета при монтировании компонента
    if (authStore.isAuthenticated) {
        reportStore.fetchInvoices();
    }
});

onBeforeUnmount(() => {
    // Очищаем таймер при размонтировании компонента
    if (invoiceFilterTimeout.value) {
        clearTimeout(invoiceFilterTimeout.value);
    }
});
</script>

<style scoped lang="scss">
.dashboard-page {
    position: relative;
    width: 100%;
    min-height: 100%;
    padding: 2rem;
    border-radius: 0;
    background: linear-gradient(135deg, #c5c5c5 0%, #b9b9b9 100%);
    box-shadow: 0 20px 40px rgba(82, 95, 225, 0.25);
    color: #2d3748;
}

.dashboard-container {
    width: 100%;
    max-width: 100%;
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

/* Стили для раскрываемого контента дебиторов */
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

/* Стили для блока алертов */
.alerts-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.alert-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    border-left: 4px solid transparent;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    animation: slideInDown 0.4s ease-out;
}

@keyframes slideInDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.alert-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.alert-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.alert-message {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 500;
    color: #2d3748;
    flex: 1;
}

.alert-danger {
    border-left-color: #f56565;
    background: linear-gradient(135deg, rgba(254, 215, 215, 0.3) 0%, rgba(255, 255, 255, 0.95) 100%);
}

.alert-warning {
    border-left-color: #ed8936;
    background: linear-gradient(135deg, rgba(254, 235, 200, 0.3) 0%, rgba(255, 255, 255, 0.95) 100%);
}

.alert-info {
    border-left-color: #48bb78;
    background: linear-gradient(135deg, rgba(198, 246, 213, 0.3) 0%, rgba(255, 255, 255, 0.95) 100%);
}

/* Стили для health badges */
.health-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    transition: transform 0.2s ease;
}

.health-badge:hover {
    transform: scale(1.05);
}

.health-badge-small {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
    margin-top: 0.5rem;
}

.health-excellent {
    background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
    color: #22543d;
    border: 1px solid #9ae6b4;
}

.health-good {
    background: linear-gradient(135deg, #fef5e7 0%, #ffeaa7 100%);
    color: #744210;
    border: 1px solid #f6d55c;
}

.health-warning {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
    color: #2d3748;
    border: 1px solid #cbd5e0;
}

.health-danger {
    background: linear-gradient(135deg, #fed7d7 0%, #fc8181 100%);
    color: #742a2a;
    border: 1px solid #fc8181;
}

/* Стили для метрик с индикаторами */
.metric-value-with-indicator {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.metric-value-with-indicator .metric-value {
    margin: 0;
}

.small-metric-value-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.small-metric-value-container .small-metric-value {
    margin: 0;
}

/* Адаптивность для алертов */
@media (max-width: 768px) {
    .alert-card {
        padding: 0.875rem 1rem;
        gap: 0.75rem;
    }

    .alert-icon {
        font-size: 1.25rem;
    }

    .alert-message {
        font-size: 0.875rem;
    }

    .health-badge {
        font-size: 0.75rem;
        padding: 0.35rem 0.65rem;
    }
}

/* Стили для секции счетов */
.invoices-section {
    margin-top: 1.5rem;
}

.invoices-filters {
    background: #f7fafc;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e2e8f0;
}

.filters-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.filter-select,
.filter-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #cbd5e0;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    background: #fff;
    color: #2d3748;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
}

.filter-input-small {
    width: 100%;
}

.filter-range {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.filter-separator {
    color: #718096;
    font-weight: 600;
}

.filters-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
}

.filter-btn {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
}

.filter-btn-clear {
    background: #edf2f7;
    color: #4a5568;

    &:hover:not(:disabled) {
        background: #e2e8f0;
    }
}

.filter-btn-refresh {
    background: #667eea;
    color: #fff;

    &:hover:not(:disabled) {
        background: #5a67d8;
    }
}

.invoices-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #718096;

    p {
        margin-top: 1rem;
        font-size: 0.9rem;
    }
}

.invoices-error {
    padding: 2rem;
    text-align: center;
    background: #fed7d7;
    border-radius: 0.75rem;
    border: 1px solid #feb2b2;

    .error-text {
        color: #c53030;
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
    }
}

.invoices-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.invoices-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e2e8f0;
}

.invoices-count {
    margin: 0;
    font-size: 0.9rem;
    color: #4a5568;

    strong {
        color: #2d3748;
        font-weight: 700;
    }
}

.invoices-table-container {
    overflow-x: auto;
    border-radius: 0.75rem;
    border: 1px solid #e2e8f0;
}

.invoices-table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;

    thead {
        background: #f7fafc;
        border-bottom: 2px solid #e2e8f0;
    }

    th {
        padding: 1rem 0.75rem;
        text-align: left;
        font-size: 0.8rem;
        font-weight: 700;
        color: #4a5568;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        white-space: nowrap;
    }

    tbody {
        tr {
            border-bottom: 1px solid #e2e8f0;
            transition: background-color 0.2s ease;

            &:hover {
                background: #f7fafc;
            }

            &:last-child {
                border-bottom: none;
            }
        }
    }

    td {
        padding: 1rem 0.75rem;
        font-size: 0.9rem;
        color: #2d3748;
    }
}

.invoice-number {
    font-weight: 600;
    color: #667eea;
}

.customer-cell {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.customer-name {
    font-weight: 600;
    color: #2d3748;
}

.customer-unp {
    font-size: 0.8rem;
    color: #718096;
}

.overdue-date {
    color: #c53030;
    font-weight: 600;
}

.amount-cell {
    text-align: right;
    font-weight: 600;

    &.paid {
        color: #2f855a;
    }

    &.outstanding {
        color: #c53030;
    }
}

.status-badge {
    display: inline-block;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-right: 0.5rem;

    &.status-paid {
        background: #c6f6d5;
        color: #22543d;
    }

    &.status-overdue {
        background: #fed7d7;
        color: #742a2a;
    }

    &.status-current {
        background: #bee3f8;
        color: #2c5282;
    }

    &.status-partial {
        background: #fef5e7;
        color: #744210;
    }

    &.status-default {
        background: #e2e8f0;
        color: #4a5568;
    }
}

.debt-status-badge {
    display: inline-block;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: #edf2f7;
    color: #4a5568;
}

.invoices-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 0;
    border-top: 1px solid #e2e8f0;
}

.pagination-btn {
    padding: 0.6rem 1.2rem;
    border: 1px solid #cbd5e0;
    border-radius: 0.5rem;
    background: #fff;
    color: #4a5568;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background: #f7fafc;
        border-color: #a0aec0;
        transform: translateY(-1px);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}

.pagination-info {
    font-size: 0.9rem;
    color: #718096;
    font-weight: 500;
}

.invoices-empty {
    text-align: center;
    padding: 3rem;
    color: #718096;
    font-size: 0.9rem;
}

@media (max-width: 768px) {
    .filters-row {
        grid-template-columns: 1fr;
    }

    .filters-actions {
        flex-direction: column;
    }

    .invoices-table-container {
        overflow-x: scroll;
    }

    .invoices-table {
        min-width: 800px;
    }
}
</style>
