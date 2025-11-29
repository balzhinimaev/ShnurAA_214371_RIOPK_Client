// components/customers/EditDebtWorkRecordModal.vue
<template>
  <div class="modal fade show d-block" tabindex="-1" @click.self="close" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <form @submit.prevent="submitForm">
          <div class="modal-header">
            <h5 class="modal-title">Редактирование записи о работе с задолженностью</h5>
            <button type="button" class="btn-close" @click="close" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="localError" class="alert alert-danger small py-2">{{ localError }}</div>

            <!-- Тип действия -->
            <div class="mb-3">
              <label for="actionType" class="form-label">Тип действия: <span class="text-danger">*</span></label>
              <select 
                id="actionType" 
                class="form-select" 
                v-model="formData.actionType" 
                required
              >
                <option value="">Выберите тип действия</option>
                <optgroup label="Коммуникация">
                  <option value="CALL">📞 Звонок</option>
                  <option value="EMAIL">📧 Email</option>
                  <option value="SMS">💬 SMS</option>
                  <option value="LETTER">✉️ Письмо</option>
                </optgroup>
                <optgroup label="Юридические действия">
                  <option value="CLAIM">⚖️ Претензия</option>
                  <option value="COURT_CLAIM">⚖️ Исковое заявление</option>
                  <option value="COURT_DECISION">⚖️ Решение суда</option>
                  <option value="EXECUTION">⚖️ Исполнительное производство</option>
                </optgroup>
                <optgroup label="Прочее">
                  <option value="SETTLEMENT">🤝 Соглашение</option>
                  <option value="PAYMENT_PLAN">📅 График платежей</option>
                  <option value="OTHER">📝 Другое</option>
                </optgroup>
              </select>
            </div>

            <!-- Дата действия -->
            <div class="mb-3">
              <label for="actionDate" class="form-label">Дата действия: <span class="text-danger">*</span></label>
              <input 
                type="datetime-local" 
                class="form-control" 
                id="actionDate" 
                v-model="formData.actionDate" 
                required
              />
            </div>

            <!-- Результат -->
            <div class="mb-3">
              <label for="result" class="form-label">Результат: <span class="text-danger">*</span></label>
              <select 
                id="result" 
                class="form-select" 
                v-model="formData.result" 
                required
              >
                <option value="">Выберите результат</option>
                <option value="CONTACTED">Связались</option>
                <option value="NO_CONTACT">Нет связи</option>
                <option value="PROMISED_PAY">Обещали оплатить</option>
                <option value="REFUSED">Отказ</option>
                <option value="PARTIAL_PAY">Частичная оплата</option>
                <option value="FULL_PAY">Полная оплата</option>
                <option value="IN_PROGRESS">В работе</option>
                <option value="COMPLETED">Завершено</option>
                <option value="CANCELLED">Отменено</option>
              </select>
            </div>

            <!-- Описание -->
            <div class="mb-3">
              <label for="description" class="form-label">Описание:</label>
              <textarea 
                class="form-control" 
                id="description" 
                v-model="formData.description"
                rows="4"
                placeholder="Подробное описание действия и результата..."
              ></textarea>
            </div>

            <!-- Дата следующего действия -->
            <div class="mb-3">
              <label for="nextActionDate" class="form-label">Дата следующего запланированного действия:</label>
              <input 
                type="datetime-local" 
                class="form-control" 
                id="nextActionDate" 
                v-model="formData.nextActionDate"
              />
              <div class="form-text">Укажите, если запланировано следующее действие</div>
            </div>

            <!-- Сумма задолженности -->
            <div class="mb-3">
              <label for="amount" class="form-label">Сумма задолженности (опционально):</label>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                class="form-control" 
                id="amount" 
                v-model.number="formData.amount"
                placeholder="0.00"
              />
            </div>

            <!-- Информация о записи -->
            <div class="record-info mt-4">
              <small class="text-muted">
                <strong>ID записи:</strong> {{ record.id }}<br>
                <strong>Создана:</strong> {{ formatDateTime(record.createdAt) }}<br>
                <strong>Изменена:</strong> {{ formatDateTime(record.updatedAt) }}
              </small>
            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="close">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="!isFormValid || isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              {{ isLoading ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import type { DebtWorkRecord, UpdateDebtWorkRecordData, DebtWorkActionType, DebtWorkResult } from '~/types/customer-debt-work';

const props = defineProps<{
  record: DebtWorkRecord;
  isLoading?: boolean;
}>();

const emit = defineEmits(['close', 'save']);

const localError = ref<string | null>(null);

const formData = reactive<{
  actionType: DebtWorkActionType | '';
  actionDate: string;
  result: DebtWorkResult | '';
  description?: string;
  nextActionDate?: string;
  amount?: number;
}>({
  actionType: '',
  actionDate: '',
  result: '',
  description: undefined,
  nextActionDate: undefined,
  amount: undefined,
});

// Инициализация формы значениями из записи
onMounted(() => {
  formData.actionType = props.record.actionType;
  formData.actionDate = formatDateTimeLocal(props.record.actionDate);
  formData.result = props.record.result;
  formData.description = props.record.description || undefined;
  formData.nextActionDate = props.record.nextActionDate ? formatDateTimeLocal(props.record.nextActionDate) : undefined;
  formData.amount = props.record.amount;
});

// Форматирование даты для input datetime-local
function formatDateTimeLocal(date: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  // Форматируем в YYYY-MM-DDTHH:MM
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Форматирование даты для отображения
function formatDateTime(date: string | Date): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const isFormValid = computed(() => {
  return formData.actionType && formData.actionDate && formData.result;
});

function close() {
  emit('close');
}

function submitForm() {
  if (!isFormValid.value) {
    localError.value = 'Заполните все обязательные поля';
    return;
  }

  localError.value = null;

  const dataToSave: UpdateDebtWorkRecordData = {};

  // Добавляем только измененные поля
  if (formData.actionType !== props.record.actionType) {
    dataToSave.actionType = formData.actionType as DebtWorkActionType;
  }
  
  const newActionDate = new Date(formData.actionDate).toISOString();
  const originalActionDate = new Date(props.record.actionDate).toISOString();
  if (newActionDate !== originalActionDate) {
    dataToSave.actionDate = newActionDate;
  }
  
  if (formData.result !== props.record.result) {
    dataToSave.result = formData.result as DebtWorkResult;
  }
  
  const newDescription = formData.description?.trim() || undefined;
  if (newDescription !== (props.record.description || undefined)) {
    dataToSave.description = newDescription;
  }
  
  if (formData.nextActionDate) {
    const newNextActionDate = new Date(formData.nextActionDate).toISOString();
    const originalNextActionDate = props.record.nextActionDate ? new Date(props.record.nextActionDate).toISOString() : undefined;
    if (newNextActionDate !== originalNextActionDate) {
      dataToSave.nextActionDate = newNextActionDate;
    }
  } else if (props.record.nextActionDate) {
    // Если дата была, а теперь нет — передаем undefined для очистки
    dataToSave.nextActionDate = undefined;
  }
  
  if (formData.amount !== props.record.amount) {
    dataToSave.amount = formData.amount;
  }

  // Если нет изменений — просто закрываем
  if (Object.keys(dataToSave).length === 0) {
    close();
    return;
  }

  emit('save', {
    recordId: props.record.id,
    data: dataToSave
  });
}
</script>

<style scoped>
.modal { background-color: rgba(0,0,0,0.5); }
.modal-dialog { max-width: 700px; }
.form-label { font-weight: 600; margin-bottom: 0.5rem; }
.text-danger { color: #dc3545; }
.record-info {
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
}
</style>

