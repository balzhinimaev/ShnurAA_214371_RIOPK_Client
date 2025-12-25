// components/customers/CustomerEditModal.vue
<template>
  <div class="modal fade show d-block" tabindex="-1" @click.self="close" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Карточка дебитора: {{ originalCustomer?.name }}</h5>
          <button type="button" class="btn-close" @click="close" aria-label="Close"></button>
        </div>
        
        <!-- Вкладки -->
        <ul class="nav nav-tabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'info' }"
              @click="activeTab = 'info'"
              type="button"
            >
              📝 Основная информация
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'invoices' }"
              @click="handleTabChange('invoices')"
              type="button"
            >
              📄 Задолженности
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'risk' }"
              @click="handleTabChange('risk')"
              type="button"
            >
              ⚠️ Оценка риска
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'debt-work' }"
              @click="activeTab = 'debt-work'"
              type="button"
            >
              📋 Работа с задолженностями
            </button>
          </li>
        </ul>

        <div class="modal-body">
          <div v-if="localError" class="alert alert-danger small py-2">{{ localError }}</div>

          <!-- Вкладка: Основная информация -->
          <div v-show="activeTab === 'info'" class="tab-content">
            <form @submit.prevent="submitForm">
              <!-- Поле Название -->
              <div class="mb-3">
                <label for="editCustomerName" class="form-label">Название:</label>
                <input type="text" class="form-control" id="editCustomerName" v-model="editableCustomer.name" required minlength="2">
              </div>

              <!-- Поле УНП (только для чтения) -->
              <div class="mb-3">
                <label for="editCustomerUnp" class="form-label">УНП:</label>
                <input type="text" class="form-control" id="editCustomerUnp" :value="originalCustomer?.unp || ''" readonly disabled>
                <div class="form-text">УНП изменить нельзя.</div>
              </div>

              <!-- Поле Контактная информация -->
              <div class="mb-3">
                <label for="editCustomerContact" class="form-label">Контактная информация:</label>
                <input type="text" class="form-control" id="editCustomerContact" v-model="editableCustomer.contactInfo">
                <div class="form-text">Оставьте пустым для очистки.</div>
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="close">Отмена</button>
                <button type="submit" class="btn btn-primary" :disabled="!isFormValid">Сохранить изменения</button>
              </div>
            </form>
          </div>

          <!-- Вкладка: Задолженности (Фаза 2) -->
          <div v-show="activeTab === 'invoices'" class="tab-content">
            <div v-if="isLoadingFullData" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
              <p class="mt-2 text-muted">Загрузка списка задолженностей...</p>
            </div>
            <div v-else-if="customerFullData">
              <!-- Статистика -->
              <div class="statistics-grid mb-4">
                <div class="stat-card">
                  <div class="stat-label">Всего счетов</div>
                  <div class="stat-value">{{ customerFullData.statistics.totalInvoices }}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Общий долг</div>
                  <div class="stat-value"><CurrencyAmount :value="customerFullData.statistics.totalDebt" size="md" /></div>
                </div>
                <div class="stat-card stat-danger">
                  <div class="stat-label">Просроченный долг</div>
                  <div class="stat-value"><CurrencyAmount :value="customerFullData.statistics.overdueDebt" size="md" danger /></div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Оплачено вовремя</div>
                  <div class="stat-value">{{ customerFullData.statistics.paidOnTimeCount }} из {{ customerFullData.statistics.paidOnTimeCount + customerFullData.statistics.paidLateCount }}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Своевременность оплат</div>
                  <div class="stat-value">{{ customerFullData.statistics.onTimePaymentRate.toFixed(1) }}%</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Средняя задержка</div>
                  <div class="stat-value">{{ customerFullData.statistics.averagePaymentDelay.toFixed(1) }} дн.</div>
                </div>
              </div>

              <!-- Список счетов -->
              <h6 class="mb-3">📄 Список задолженностей</h6>
              <div class="invoices-list-container" v-if="customerFullData.invoices?.length">
                <table class="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>Номер счета</th>
                      <th>Сумма</th>
                      <th>Остаток</th>
                      <th>Срок оплаты</th>
                      <th>Просрочка</th>
                      <th>Категория</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="inv in customerFullData.invoices" :key="inv.id">
                      <td class="fw-semibold">{{ inv.invoiceNumber }}</td>
                      <td><CurrencyAmount :value="inv.totalAmount" size="sm" /></td>
                      <td class="text-danger fw-semibold"><CurrencyAmount :value="inv.outstandingAmount" size="sm" danger /></td>
                      <td>{{ formatDate(inv.dueDate) }}</td>
                      <td :class="getDaysOverdueClass(inv.daysOverdue)">
                        {{ formatDaysOverdue(inv.daysOverdue) }}
                      </td>
                      <td>
                        <span class="category-badge" :class="getCategoryClass(inv.overdueCategory)">
                          {{ getCategoryLabel(inv.overdueCategory) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-center text-muted py-3">
                Нет активных задолженностей
              </div>
            </div>
            <div v-else class="text-center text-muted py-4">
              <p>Не удалось загрузить данные о задолженностях</p>
              <button class="btn btn-outline-primary btn-sm" @click="loadFullCustomerData">Повторить</button>
            </div>
          </div>

          <!-- Вкладка: Оценка риска (Фаза 2) -->
          <div v-show="activeTab === 'risk'" class="tab-content">
            <div v-if="isLoadingFullData" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
              <p class="mt-2 text-muted">Загрузка оценки риска...</p>
            </div>
            <div v-else-if="customerFullData">
              <!-- Общая оценка -->
              <div class="risk-overview mb-4">
                <div class="risk-score-card" :class="getRiskLevelClass(customerFullData.riskAssessment.level)">
                  <div class="risk-score-header">
                    <span class="risk-level-badge">{{ getRiskLevelLabel(customerFullData.riskAssessment.level) }}</span>
                    <span class="risk-score-value">{{ customerFullData.riskAssessment.score }}/100</span>
                  </div>
                  <div class="risk-score-bar">
                    <div class="risk-score-fill" :style="{ width: customerFullData.riskAssessment.score + '%' }"></div>
                  </div>
                </div>

                <!-- Оценка платежной дисциплины -->
                <div class="payment-rating-card" :class="'grade-' + customerFullData.paymentRating.grade.toLowerCase()">
                  <div class="payment-grade">{{ customerFullData.paymentRating.grade }}</div>
                  <div class="payment-description">{{ customerFullData.paymentRating.description }}</div>
                </div>
              </div>

              <!-- Факторы риска -->
              <h6 class="mb-3">⚖️ Факторы оценки риска</h6>
              <div class="risk-factors-list" v-if="customerFullData.riskAssessment.factors?.length">
                <div 
                  v-for="(factor, index) in customerFullData.riskAssessment.factors" 
                  :key="index"
                  class="risk-factor-item"
                  :class="'impact-' + factor.impact.toLowerCase()"
                >
                  <div class="factor-header">
                    <span class="factor-icon">{{ getImpactIcon(factor.impact) }}</span>
                    <span class="factor-name">{{ factor.factor }}</span>
                    <span class="factor-weight">{{ factor.weight > 0 ? '+' : '' }}{{ factor.weight }}</span>
                  </div>
                  <div class="factor-description">{{ factor.description }}</div>
                </div>
              </div>
              <div v-else class="text-center text-muted py-3">
                Нет данных о факторах риска
              </div>
            </div>
            <div v-else class="text-center text-muted py-4">
              <p>Не удалось загрузить оценку риска</p>
              <button class="btn btn-outline-primary btn-sm" @click="loadFullCustomerData">Повторить</button>
            </div>
          </div>

          <!-- Вкладка: Работа с задолженностями -->
          <div v-show="activeTab === 'debt-work'" class="tab-content">
            <div v-if="isLoadingDebtWork" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
              <p class="mt-2 text-muted">Загрузка истории работы с задолженностями...</p>
            </div>
            <CustomerDebtWorkHistory
              v-else
              :records="debtWorkRecords"
              :stats="debtWorkStats"
              :can-add-record="true"
              :can-edit-record="true"
              @add-record="showAddRecordModal = true"
              @edit-record="handleEditRecord"
              @delete-record="handleDeleteRecordRequest"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно для добавления записи о работе с задолженностью -->
    <AddDebtWorkRecordModal
      v-if="showAddRecordModal && originalCustomer"
      :customer-id="originalCustomer.id"
      :is-loading="isSavingDebtWork"
      @close="showAddRecordModal = false"
      @save="handleAddDebtWorkRecord"
    />

    <!-- Модальное окно для редактирования записи о работе с задолженностью -->
    <EditDebtWorkRecordModal
      v-if="showEditRecordModal && editingRecord"
      :record="editingRecord"
      :is-loading="isSavingDebtWork"
      @close="showEditRecordModal = false; editingRecord = null"
      @save="handleSaveEditedRecord"
    />

    <!-- Диалог подтверждения удаления -->
    <div 
      v-if="showDeleteConfirmDialog" 
      class="modal fade show d-block" 
      tabindex="-1" 
      @click.self="cancelDeleteRecord"
      style="background-color: rgba(0,0,0,0.5);"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title text-danger">⚠️ Подтверждение удаления</h5>
            <button type="button" class="btn-close" @click="cancelDeleteRecord" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p class="mb-2">Вы уверены, что хотите удалить эту запись?</p>
            <p class="text-muted small mb-0">Это действие нельзя отменить.</p>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-secondary" @click="cancelDeleteRecord" :disabled="isDeletingDebtWork">
              Отмена
            </button>
            <button type="button" class="btn btn-danger" @click="confirmDeleteRecord" :disabled="isDeletingDebtWork">
              <span v-if="isDeletingDebtWork" class="spinner-border spinner-border-sm me-2"></span>
              {{ isDeletingDebtWork ? 'Удаление...' : 'Удалить' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import CustomerDebtWorkHistory from './CustomerDebtWorkHistory.vue';
import AddDebtWorkRecordModal from './AddDebtWorkRecordModal.vue';
import EditDebtWorkRecordModal from './EditDebtWorkRecordModal.vue';
import { useCustomerStore } from '~/stores/customer';
import type { CreateDebtWorkRecordData, DebtWorkRecord, CustomerDebtWorkStats, UpdateDebtWorkRecordData } from '~/types/customer-debt-work';
import type { CustomerFullResponse, RiskFactorImpact } from '~/types/customer-full';
import type { OverdueCategory } from '~/types/invoice';
import CurrencyAmount from '~/components/CurrencyAmount.vue';

// Типы (можно вынести)
interface Customer {
    id: string;
    name: string;
    unp?: string; // УНП вместо inn
    contactInfo?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}
interface UpdateCustomerData {
    name?: string;
    contactInfo?: string | null;
}

const props = defineProps<{
  customer: Customer | null;
}>();

const emit = defineEmits(['close', 'save', 'add-debt-work-record']);

const customerStore = useCustomerStore();
const activeTab = ref<'info' | 'invoices' | 'risk' | 'debt-work'>('info');
const editableCustomer = reactive<UpdateCustomerData>({
    name: '',
    contactInfo: ''
});
const originalCustomer = ref<Customer | null>(null);
const localError = ref<string | null>(null);
const showAddRecordModal = ref(false);
const showEditRecordModal = ref(false);
const showDeleteConfirmDialog = ref(false);
const editingRecord = ref<DebtWorkRecord | null>(null);
const deletingRecord = ref<DebtWorkRecord | null>(null);
const isSavingDebtWork = ref(false);
const isDeletingDebtWork = ref(false);
const isLoadingDebtWork = ref(false);

// Данные о работе с задолженностями
const debtWorkRecords = ref<DebtWorkRecord[]>([]);
const debtWorkStats = ref<CustomerDebtWorkStats | undefined>(undefined);

// Новые данные (Фаза 2)
const customerFullData = ref<CustomerFullResponse | null>(null);
const isLoadingFullData = ref(false);
const fullDataLoaded = ref(false);

watch(() => props.customer, (newCustomer) => {
  if (newCustomer) {
    originalCustomer.value = newCustomer;
    editableCustomer.name = newCustomer.name;
    // Устанавливаем пустую строку, если contactInfo null или undefined
    editableCustomer.contactInfo = newCustomer.contactInfo ?? '';
    localError.value = null;
    
    // Загружаем данные о работе с задолженностями
    if (newCustomer.id) {
      loadDebtWorkData(newCustomer.id);
    }
  }
}, { immediate: true });

// Валидация
const isFormValid = computed(() => {
    return editableCustomer.name && editableCustomer.name.length >= 2;
});

function close() { 
  activeTab.value = 'info';
  emit('close'); 
}

function submitForm() {
  if (!isFormValid.value) {
      localError.value = "Название дебитора должно быть не менее 2 символов.";
      return;
  }
  localError.value = null;

  const dataToSave: UpdateCustomerData = {};
  if (originalCustomer.value?.name !== editableCustomer.name) {
      dataToSave.name = editableCustomer.name;
  }
   // Обрабатываем contactInfo: передаем null, если строка пустая, иначе строку
  const newContactInfo = editableCustomer.contactInfo?.trim() || null;
  if (originalCustomer.value?.contactInfo !== newContactInfo) {
        dataToSave.contactInfo = newContactInfo;
  }

   if (Object.keys(dataToSave).length === 0) {
        close();
        return;
   }

  emit('save', dataToSave);
}

async function loadDebtWorkData(customerId: string) {
  isLoadingDebtWork.value = true;
  try {
    const response = await customerStore.fetchDebtWorkHistory(customerId, {
      limit: 50, // Загружаем последние 50 записей
      sortBy: 'actionDate',
      sortOrder: 'desc'
    });
    
    if (response) {
      debtWorkRecords.value = response.records;
      debtWorkStats.value = response.stats;
    } else {
      debtWorkRecords.value = [];
      debtWorkStats.value = undefined;
    }
  } catch (error: any) {
    console.error('Error loading debt work data:', error);
    localError.value = error.message || 'Не удалось загрузить историю работы с задолженностями';
    debtWorkRecords.value = [];
    debtWorkStats.value = undefined;
  } finally {
    isLoadingDebtWork.value = false;
  }
}

async function handleAddDebtWorkRecord(data: CreateDebtWorkRecordData) {
  isSavingDebtWork.value = true;
  localError.value = null;
  
  try {
    const createdRecord = await customerStore.createDebtWorkRecord(data.customerId, data);
    
    if (createdRecord) {
      emit('add-debt-work-record', data);
      showAddRecordModal.value = false;
      
      // Перезагружаем данные
      if (originalCustomer.value?.id) {
        await loadDebtWorkData(originalCustomer.value.id);
      }
    } else {
      localError.value = customerStore.error || 'Не удалось сохранить запись';
    }
  } catch (error: any) {
    console.error('Error creating debt work record:', error);
    localError.value = error.message || customerStore.error || 'Не удалось сохранить запись';
  } finally {
    isSavingDebtWork.value = false;
  }
}

// Обработчик открытия модального окна редактирования
function handleEditRecord(record: DebtWorkRecord) {
  editingRecord.value = record;
  showEditRecordModal.value = true;
}

// Обработчик сохранения отредактированной записи
async function handleSaveEditedRecord(payload: { recordId: string; data: UpdateDebtWorkRecordData }) {
  if (!originalCustomer.value?.id) return;
  
  isSavingDebtWork.value = true;
  localError.value = null;
  
  try {
    const updatedRecord = await customerStore.updateDebtWorkRecord(
      originalCustomer.value.id,
      payload.recordId,
      payload.data
    );
    
    if (updatedRecord) {
      showEditRecordModal.value = false;
      editingRecord.value = null;
      
      // Перезагружаем данные
      await loadDebtWorkData(originalCustomer.value.id);
    } else {
      localError.value = customerStore.error || 'Не удалось обновить запись';
    }
  } catch (error: any) {
    console.error('Error updating debt work record:', error);
    localError.value = error.message || customerStore.error || 'Не удалось обновить запись';
  } finally {
    isSavingDebtWork.value = false;
  }
}

// Обработчик запроса на удаление записи (показывает диалог подтверждения)
function handleDeleteRecordRequest(record: DebtWorkRecord) {
  deletingRecord.value = record;
  showDeleteConfirmDialog.value = true;
}

// Подтверждение удаления записи
async function confirmDeleteRecord() {
  if (!originalCustomer.value?.id || !deletingRecord.value) return;
  
  isDeletingDebtWork.value = true;
  localError.value = null;
  
  try {
    const success = await customerStore.deleteDebtWorkRecord(
      originalCustomer.value.id,
      deletingRecord.value.id
    );
    
    if (success) {
      showDeleteConfirmDialog.value = false;
      deletingRecord.value = null;
      
      // Перезагружаем данные
      await loadDebtWorkData(originalCustomer.value.id);
    } else {
      localError.value = customerStore.error || 'Не удалось удалить запись';
    }
  } catch (error: any) {
    console.error('Error deleting debt work record:', error);
    localError.value = error.message || customerStore.error || 'Не удалось удалить запись';
  } finally {
    isDeletingDebtWork.value = false;
  }
}

// Отмена удаления
function cancelDeleteRecord() {
  showDeleteConfirmDialog.value = false;
  deletingRecord.value = null;
}

// === Новые функции для Фазы 2 ===

function handleTabChange(tab: 'invoices' | 'risk') {
  activeTab.value = tab;
  if (!fullDataLoaded.value && originalCustomer.value?.id) {
    loadFullCustomerData();
  }
}

async function loadFullCustomerData() {
  if (!originalCustomer.value?.id) return;
  
  isLoadingFullData.value = true;
  try {
    const data = await customerStore.fetchCustomerFull(originalCustomer.value.id);
    if (data) {
      customerFullData.value = data;
      fullDataLoaded.value = true;
    }
  } catch (error: any) {
    console.error('Error loading full customer data:', error);
    localError.value = error.message || 'Не удалось загрузить полные данные дебитора';
  } finally {
    isLoadingFullData.value = false;
  }
}

// Форматирование валюты - удалена локальная функция, используем компонент CurrencyAmount

// Форматирование даты
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Форматирование дней просрочки
function formatDaysOverdue(days: number): string {
  if (days <= 0) return 'Не просрочен';
  return `${days} дн.`;
}

// CSS класс для дней просрочки
function getDaysOverdueClass(days: number): string {
  if (days <= 0) return 'text-success';
  if (days <= 30) return 'text-warning';
  return 'text-danger fw-bold';
}

// Метка категории просрочки
function getCategoryLabel(category: OverdueCategory | undefined): string {
  const labels: Record<string, string> = {
    'NOT_DUE': 'Не просрочен',
    'NOTIFY': 'Оповестить',
    'CLAIM': 'Претензия',
    'COURT': 'Суд',
    'BAD_DEBT': 'Безнадёжный',
  };
  return category ? labels[category] || '—' : '—';
}

// CSS класс категории
function getCategoryClass(category: OverdueCategory | undefined): string {
  const classes: Record<string, string> = {
    'NOT_DUE': 'cat-not-due',
    'NOTIFY': 'cat-notify',
    'CLAIM': 'cat-claim',
    'COURT': 'cat-court',
    'BAD_DEBT': 'cat-bad-debt',
  };
  return category ? classes[category] || '' : '';
}

// Метка уровня риска
function getRiskLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    'LOW': 'Низкий риск',
    'MEDIUM': 'Средний риск',
    'HIGH': 'Высокий риск',
    'CRITICAL': 'Критический риск',
  };
  return labels[level] || level;
}

// CSS класс уровня риска
function getRiskLevelClass(level: string): string {
  const classes: Record<string, string> = {
    'LOW': 'risk-low',
    'MEDIUM': 'risk-medium',
    'HIGH': 'risk-high',
    'CRITICAL': 'risk-critical',
  };
  return classes[level] || '';
}

// Иконка влияния фактора
function getImpactIcon(impact: RiskFactorImpact): string {
  const icons: Record<string, string> = {
    'POSITIVE': '✅',
    'NEGATIVE': '❌',
    'NEUTRAL': '➖',
  };
  return icons[impact] || '•';
}
</script>

<style scoped>
.modal { background-color: rgba(0,0,0,0.5); }
.modal-dialog { max-width: 1200px; }
.modal-xl { max-width: 1200px; }

.nav-tabs {
  border-bottom: 2px solid #dee2e6;
  padding: 0 1rem;
  margin-bottom: 0;
}

.nav-link {
  border: none;
  border-bottom: 3px solid transparent;
  color: #6c757d;
  padding: 0.75rem 1rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    border-bottom-color: #dee2e6;
    color: #495057;
  }

  &.active {
    color: #667eea;
    border-bottom-color: #667eea;
    background: transparent;
  }
}

.tab-content {
  padding: 1.5rem 0;
  min-height: 300px;
}

/* === Новые стили для Фазы 2 === */

/* Статистика */
.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  border: 1px solid #e9ecef;
}

.stat-card.stat-danger {
  background: #fff5f5;
  border-color: #fed7d7;
}

.stat-label {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3748;
}

.stat-card.stat-danger .stat-value {
  color: #c53030;
}

/* Таблица счетов */
.invoices-list-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
}

/* Категории просрочки */
.category-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.cat-not-due { background: #d1fae5; color: #065f46; }
.cat-notify { background: #fef3c7; color: #92400e; }
.cat-claim { background: #fed7aa; color: #9a3412; }
.cat-court { background: #fecaca; color: #991b1b; }
.cat-bad-debt { background: #581c87; color: #fff; }

/* Оценка риска */
.risk-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .risk-overview {
    grid-template-columns: 1fr;
  }
}

.risk-score-card {
  background: #f8f9fa;
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 2px solid #e9ecef;
}

.risk-score-card.risk-low { border-color: #38a169; background: #f0fff4; }
.risk-score-card.risk-medium { border-color: #dd6b20; background: #fffaf0; }
.risk-score-card.risk-high { border-color: #e53e3e; background: #fff5f5; }
.risk-score-card.risk-critical { border-color: #9b2c2c; background: #fff5f5; }

.risk-score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.risk-level-badge {
  font-weight: 700;
  font-size: 1rem;
}

.risk-score-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #2d3748;
}

.risk-score-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.risk-score-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.risk-low .risk-score-fill { background: linear-gradient(90deg, #38a169, #48bb78); }
.risk-medium .risk-score-fill { background: linear-gradient(90deg, #dd6b20, #ed8936); }
.risk-high .risk-score-fill { background: linear-gradient(90deg, #e53e3e, #f56565); }
.risk-critical .risk-score-fill { background: linear-gradient(90deg, #9b2c2c, #c53030); }

/* Оценка платежной дисциплины */
.payment-rating-card {
  background: #f8f9fa;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  border: 2px solid #e9ecef;
}

.payment-grade {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.payment-description {
  font-size: 0.9rem;
  color: #4a5568;
}

.grade-a { border-color: #38a169; }
.grade-a .payment-grade { color: #38a169; }

.grade-b { border-color: #68d391; }
.grade-b .payment-grade { color: #68d391; }

.grade-c { border-color: #ecc94b; }
.grade-c .payment-grade { color: #d69e2e; }

.grade-d { border-color: #ed8936; }
.grade-d .payment-grade { color: #dd6b20; }

.grade-f { border-color: #e53e3e; }
.grade-f .payment-grade { color: #c53030; }

/* Факторы риска */
.risk-factors-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.risk-factor-item {
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  border-left: 4px solid #e9ecef;
}

.risk-factor-item.impact-positive { border-left-color: #38a169; background: #f0fff4; }
.risk-factor-item.impact-negative { border-left-color: #e53e3e; background: #fff5f5; }
.risk-factor-item.impact-neutral { border-left-color: #a0aec0; }

.factor-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.factor-icon {
  font-size: 1rem;
}

.factor-name {
  font-weight: 600;
  color: #2d3748;
  flex: 1;
}

.factor-weight {
  font-weight: 700;
  font-size: 0.85rem;
}

.impact-positive .factor-weight { color: #38a169; }
.impact-negative .factor-weight { color: #e53e3e; }
.impact-neutral .factor-weight { color: #718096; }

.factor-description {
  font-size: 0.85rem;
  color: #718096;
}
</style>