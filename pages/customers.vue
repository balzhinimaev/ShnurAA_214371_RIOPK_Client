// pages/customers.vue
<template>
  <ClientOnly>
    <div class="customers-page">
      <div class="customers-container">
        <header class="customers-header">
          <div class="header-left">
            <h1 class="page-title">👥 Управление дебиторами</h1>
            <p class="page-subtitle">
              Полный список дебиторов с возможностью фильтрации, сортировки и редактирования
            </p>
          </div>
          <div class="header-right">
            <button
              type="button"
              class="update-btn"
              :disabled="store.isLoading"
              @click="handleRefresh"
            >
              <span v-if="store.isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
              <span>{{ store.isLoading ? 'Обновление...' : '🔄 Обновить' }}</span>
            </button>
          </div>
        </header>

        <!-- Состояние загрузки -->
        <div v-if="store.isLoading && !store.customers.length" class="state-card loading-card">
          <div class="loading-indicator">
            <div class="spinner-grow text-light" role="status">
              <span class="visually-hidden">Загрузка...</span>
            </div>
            <p class="loading-text">Загружаем список клиентов...</p>
          </div>
        </div>

        <!-- Состояние ошибки -->
        <div v-else-if="store.error && !store.customers.length" class="state-card error-card">
          <div class="error-content">
            <div>
              <h2 class="error-title">Не удалось загрузить дебиторов</h2>
              <p class="error-message">{{ store.error }}</p>
            </div>
            <button type="button" class="retry-btn" @click="handleRefresh">Повторить попытку</button>
          </div>
        </div>

        <!-- Основной контент -->
        <div v-else class="customers-content">
          <!-- Фильтры -->
          <section class="full-width-card customers-filters-section">
            <div class="chart-header">
              <h3 class="chart-title">🔍 Фильтры и поиск</h3>
              <p class="chart-subtitle">Найдите нужного дебитора по различным параметрам</p>
            </div>

            <div class="customers-filters">
              <div class="filters-row">
                <div class="filter-group">
                  <label class="filter-label">Поиск по названию</label>
                  <input 
                    v-model="customerFilters.name" 
                    @input="handleFilterChange"
                    type="text" 
                    placeholder="Введите название дебитора"
                    class="filter-input"
                  />
                </div>

                <div class="filter-group">
                  <label class="filter-label">Поиск по УНП</label>
                  <input 
                    v-model="customerFilters.unp" 
                    @input="handleFilterChange"
                    type="text" 
                    placeholder="Введите УНП"
                    class="filter-input"
                  />
                </div>

                <div class="filter-group">
                  <label class="filter-label">Поиск по контакту</label>
                  <input 
                    v-model="customerFilters.contactInfo" 
                    @input="handleFilterChange"
                    type="text" 
                    placeholder="Введите контактную информацию"
                    class="filter-input"
                  />
                </div>

                <div class="filter-group">
                  <label class="filter-label">Сортировка</label>
                  <select 
                    v-model="customerSortBy" 
                    @change="handleSortChange"
                    class="filter-select"
                  >
                    <option value="name">По названию</option>
                    <option value="unp">По УНП</option>
                    <option value="createdAt">По дате создания</option>
                    <option value="riskScore">По рисковости</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label class="filter-label">Направление</label>
                  <select 
                    v-model="customerSortOrder" 
                    @change="handleSortChange"
                    class="filter-select"
                  >
                    <option value="asc">По возрастанию</option>
                    <option value="desc">По убыванию</option>
                  </select>
                </div>
              </div>

              <div class="filters-actions">
                <button 
                  type="button" 
                  @click="handleClearFilters"
                  class="filter-btn filter-btn-clear"
                >
                  Очистить фильтры
                </button>
              </div>
            </div>
          </section>

          <!-- Список клиентов -->
          <section class="full-width-card customers-list-section">
            <div class="chart-header">
              <h3 class="chart-title">📋 Список дебиторов</h3>
              <p class="chart-subtitle">Всего найдено: <strong>{{ store.totalCustomers }}</strong></p>
            </div>

            <!-- Таблица дебиторов -->
            <div v-if="store.customers.length" class="customers-table-container">
              <table class="customers-table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>УНП</th>
                    <th>Контактная информация</th>
                    <th>Рисковость</th>
                    <th>Дата создания</th>
                    <th class="text-end">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="customer in store.customers" :key="customer.id" class="customer-row">
                    <td class="customer-name-cell">
                      <div class="customer-name">{{ customer.name || '—' }}</div>
                      <div class="customer-id">ID: {{ formatCustomerId(customer.id) }}</div>
                    </td>
                    <td class="customer-inn-cell">
                      <span class="inn-badge">{{ customer.unp || '—' }}</span>
                    </td>
                    <td class="customer-contact-cell">
                      <span :title="customer.contactInfo || ''">
                        {{ customer.contactInfo || '—' }}
                      </span>
                    </td>
                    <td class="customer-risk-cell">
                      <div v-if="getCustomerRiskLevel(customer)" class="risk-info">
                        <span 
                          class="risk-badge" 
                          :class="`risk-badge-${getCustomerRiskLevel(customer)?.toLowerCase()}`"
                          :title="getCustomerRiskTooltip(customer)"
                        >
                          {{ getCustomerRiskLabel(customer) }}
                        </span>
                        <span 
                          v-if="customer.riskScore !== undefined" 
                          class="risk-score"
                          :title="getCustomerRiskTooltip(customer)"
                        >
                          {{ customer.riskScore }}/100
                        </span>
                      </div>
                      <span v-else class="text-muted">—</span>
                    </td>
                    <td class="customer-date-cell">
                      {{ formatDate(customer.createdAt) }}
                    </td>
                    <td class="customer-actions-cell">
                      <div class="actions-buttons">
                        <button 
                          class="action-btn action-btn-edit"
                          title="Редактировать"
                          @click="openEditModal(customer)"
                        >
                          ✏️ Редактировать
                        </button>
                        <button 
                          v-if="canDelete"
                          class="action-btn action-btn-delete"
                          title="Удалить"
                          @click="confirmDeleteCustomer(customer)"
                        >
                          🗑️ Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Пустое состояние -->
            <div v-else class="customers-empty">
              <p>Дебиторы не найдены. Попробуйте изменить фильтры или загрузить данные по счетам.</p>
            </div>

            <!-- Пагинация -->
            <div v-if="store.totalPages > 1" class="customers-pagination">
              <button 
                type="button"
                @click="handlePageChange(store.currentPage - 1)"
                :disabled="store.currentPage <= 1 || store.isLoading"
                class="pagination-btn"
              >
                Назад
              </button>
              <span class="pagination-info">
                Страница {{ store.currentPage }} из {{ store.totalPages }}
              </span>
              <button 
                type="button"
                @click="handlePageChange(store.currentPage + 1)"
                :disabled="store.currentPage >= store.totalPages || store.isLoading"
                class="pagination-btn"
              >
                Вперёд
              </button>
            </div>
          </section>
        </div>

        <!-- Модальное окно редактирования -->
        <CustomerEditModal 
          v-if="editingCustomer" 
          :customer="editingCustomer" 
          @close="closeEditModal"
          @save="saveCustomer" 
        />
      </div>
    </div>

    <template #fallback>
      <div class="customers-page">
        <div class="customers-container">
          <div class="state-card loading-card">
            <div class="loading-indicator">
              <div class="spinner-grow text-light" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
              <p class="loading-text">Загружаем список дебиторов...</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useCustomerStore } from '~/stores/customer';
import { useAuthStore } from '~/stores/auth';
import type { CustomerResponse as Customer } from '~/stores/customer';
import type { UpdateCustomerData } from '~/stores/customer';
import CustomerEditModal from '~/components/customers/CustomerEditModal.vue';

definePageMeta({
  middleware: ['auth', 'admin-analyst-only']
});

const store = useCustomerStore();
const authStore = useAuthStore();

// Состояние для модального окна
const editingCustomer = ref<Customer | null>(null);

// Состояние для фильтров
const customerFilters = ref({
  name: '',
  unp: '',
  contactInfo: '',
});

const customerSortBy = ref('name');
const customerSortOrder = ref<'asc' | 'desc'>('asc');

const canDelete = computed(() => {
  return authStore.user?.roles?.includes('ADMIN') ?? false;
});

// Функции форматирования
function formatDate(dateString: string | Date) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

function formatCustomerId(id: string) {
  if (!id) return '—';
  return id.substring(0, 8) + '...';
}

// Функции для определения рисковости дебитора
function getCustomerRiskLevel(customer: Customer): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null {
  // Получаем из данных дебитора, которые приходят из API
  // riskLevel рассчитывается на бэкенде автоматически
  return customer.riskLevel || null;
}

function getCustomerRiskLabel(customer: Customer): string {
  const level = getCustomerRiskLevel(customer);
  const labels = {
    LOW: 'Низкий',
    MEDIUM: 'Средний',
    HIGH: 'Высокий',
    CRITICAL: 'Критический'
  };
  return level ? labels[level] : '—';
}

function getCustomerRiskTooltip(customer: Customer): string {
  // Формируем подсказку на основе данных рисковости из API
  const parts: string[] = [];
  
  if (customer.riskScore !== undefined) {
    parts.push(`Оценка рисковости: ${customer.riskScore}/100`);
  }
  
  if (customer.riskLevel) {
    const levelLabels = {
      LOW: 'Низкий риск',
      MEDIUM: 'Средний риск',
      HIGH: 'Высокий риск',
      CRITICAL: 'Критический риск'
    };
    parts.push(`Уровень: ${levelLabels[customer.riskLevel]}`);
  }
  
  // Если есть расширенная статистика, добавляем её
  const stats = (customer as any).debtWorkStats;
  if (stats) {
    if (stats.totalDebtEpisodes) {
      parts.push(`${stats.totalDebtEpisodes} эпизод${stats.totalDebtEpisodes > 1 ? 'ов' : ''} задолженности`);
    }
    if (stats.longestDebtDays) {
      parts.push(`макс. ${stats.longestDebtDays} дней`);
    }
    if (stats.totalLegalActions) {
      parts.push(`${stats.totalLegalActions} юридических действий`);
    }
  }
  
  return parts.length > 0 ? parts.join(' • ') : '';
}

// Дебаунс для фильтров
const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

function handleFilterChange() {
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }
  
  filterTimeout.value = setTimeout(() => {
    const filters: any = {};
    if (customerFilters.value.name) filters.name = customerFilters.value.name;
    if (customerFilters.value.unp) filters.unp = customerFilters.value.unp;
    if (customerFilters.value.contactInfo) filters.contactInfo = customerFilters.value.contactInfo;
    
    store.setFilters(filters);
    store.fetchCustomers({ offset: 0 });
  }, 500);
}

function handleSortChange() {
  store.setFilters({
    sortBy: customerSortBy.value,
    sortOrder: customerSortOrder.value,
  });
  store.fetchCustomers({ offset: 0 });
}

function handleClearFilters() {
  customerFilters.value = {
    name: '',
    unp: '',
    contactInfo: '',
  };
  customerSortBy.value = 'name';
  customerSortOrder.value = 'asc';
  store.clearFilters();
  store.fetchCustomers({ offset: 0 });
}

function handleRefresh() {
  store.fetchCustomers();
}

function handlePageChange(page: number) {
  if (page < 1 || page > store.totalPages) return;
  const offset = (page - 1) * store.customersPerPage;
  store.fetchCustomers({ offset });
}

// Функции для модального окна
function openEditModal(customer: Customer) {
  editingCustomer.value = JSON.parse(JSON.stringify(customer));
}

function closeEditModal() {
  editingCustomer.value = null;
}

async function saveCustomer(updatedData: UpdateCustomerData) {
  if (!editingCustomer.value) return;
  const success = await store.updateCustomer(editingCustomer.value.id, updatedData);
  if (success) {
    closeEditModal();
    // Обновляем список после сохранения
    store.fetchCustomers();
  }
}

// Функция удаления
function confirmDeleteCustomer(customer: Customer) {
  if (!canDelete.value) {
    alert('У вас нет прав на удаление дебиторов.');
    return;
  }
  if (confirm(`Вы уверены, что хотите удалить дебитора "${customer.name}" (УНП: ${customer.unp || 'N/A'})?\n\nПримечание: Это может быть невозможно, если у дебитора есть связанные счета.`)) {
    store.deleteCustomer(customer.id).then(() => {
      store.fetchCustomers();
    });
  }
}

onMounted(() => {
  store.currentPage = 1;
  store.fetchCustomers();
});

onBeforeUnmount(() => {
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }
});
</script>

<style scoped lang="scss">
.customers-page {
  position: relative;
  width: 100%;
  min-height: 100%;
  padding: 2rem;
  border-radius: 0;
  background: linear-gradient(135deg, #c5c5c5 0%, #b9b9b9 100%);
  box-shadow: 0 20px 40px rgba(82, 95, 225, 0.25);
  color: #2d3748;
}

.customers-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.customers-header {
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
  margin: 0;
}

.header-right {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.update-btn {
  border: none;
  border-radius: 0.6rem;
  padding: 0.55rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-size: 0.85rem;
  background: #667eea;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
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

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(245, 101, 101, 0.4);
  }
}

.customers-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.customers-filters {
  background: #f7fafc;
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.filter-btn-clear {
  background: #edf2f7;
  color: #4a5568;

  &:hover {
    background: #e2e8f0;
  }
}

.customers-table-container {
  overflow-x: auto;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.customers-table {
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

    &.text-end {
      text-align: right;
    }
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
    vertical-align: middle;
  }
}

.customer-name-cell {
  .customer-name {
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.25rem;
  }

  .customer-id {
    font-size: 0.75rem;
    color: #718096;
    font-family: monospace;
  }
}

.customer-inn-cell {
  .inn-badge {
    display: inline-block;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    background: #edf2f7;
    color: #4a5568;
    font-family: monospace;
    font-weight: 600;
    font-size: 0.85rem;
  }
}

.customer-contact-cell {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-date-cell {
  white-space: nowrap;
}

.customer-risk-cell {
  white-space: nowrap;
}

.risk-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
}

.risk-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &.risk-badge-low {
    background: #d1fae5;
    color: #065f46;
  }

  &.risk-badge-medium {
    background: #fef3c7;
    color: #92400e;
  }

  &.risk-badge-high {
    background: #fee2e2;
    color: #991b1b;
  }

  &.risk-badge-critical {
    background: #7f1d1d;
    color: #fff;
  }
}

.risk-score {
  font-size: 0.75rem;
  color: #718096;
  font-weight: 500;
  cursor: help;
}

.customer-actions-cell {
  text-align: right;
}

.actions-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
}

.action-btn-edit {
  background: #667eea;
  color: #fff;

  &:hover {
    background: #5a67d8;
  }
}

.action-btn-delete {
  background: #f56565;
  color: #fff;

  &:hover {
    background: #e53e3e;
  }
}

.customers-empty {
  text-align: center;
  padding: 3rem;
  color: #718096;
  font-size: 0.9rem;
}

.customers-pagination {
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

@media (max-width: 768px) {
  .customers-page {
    padding: 1rem;
  }

  .customers-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.5rem;
  }

  .filters-row {
    grid-template-columns: 1fr;
  }

  .filters-actions {
    flex-direction: column;
  }

  .customers-table-container {
    overflow-x: scroll;
  }

  .customers-table {
    min-width: 800px;
  }

  .actions-buttons {
    flex-direction: column;
  }
}
</style>
