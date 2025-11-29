// components/customers/AddDebtWorkRecordModal.vue
<template>
  <div class="modal fade show d-block" tabindex="-1" @click.self="close" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <form @submit.prevent="submitForm">
          <div class="modal-header">
            <h5 class="modal-title">Добавить запись о работе с задолженностью</h5>
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
                  <option value="COURT_CLAIM">⚖️ Заявление в суд</option>
                  <option value="COURT_DECISION">⚖️ Решение суда</option>
                  <option value="EXECUTION">⚖️ Исполнительное производство</option>
                </optgroup>
                <optgroup label="Прочее">
                  <option value="SETTLEMENT">🤝 Досудебное урегулирование</option>
                  <option value="PAYMENT_PLAN">📅 График погашения</option>
                  <option value="OTHER">📝 Прочее</option>
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
                <option value="CONTACTED">Связались с дебитором</option>
                <option value="NO_CONTACT">Не удалось связаться</option>
                <option value="PROMISED_PAY">Обещали оплатить</option>
                <option value="REFUSED">Отказались платить</option>
                <option value="PARTIAL_PAY">Частичная оплата</option>
                <option value="FULL_PAY">Полная оплата</option>
                <option value="IN_PROGRESS">В процессе</option>
                <option value="COMPLETED">Завершено</option>
                <option value="CANCELLED">Отменено</option>
              </select>
            </div>

            <!-- Счет (опционально) -->
            <div class="mb-3">
              <label for="invoiceId" class="form-label">Связанный счет (опционально):</label>
              <input 
                type="text" 
                class="form-control" 
                :class="{ 'is-invalid': invoiceIdError }"
                id="invoiceId" 
                v-model="formData.invoiceId"
                placeholder="ID счета (24 символа)"
              />
              <div v-if="invoiceIdError" class="invalid-feedback">
                {{ invoiceIdError }}
              </div>
              <div v-else class="form-text">Оставьте пустым, если действие относится ко всем задолженностям дебитора. ID должен быть валидным 24-символьным hex-идентификатором</div>
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
import { ref, reactive, computed, watch } from 'vue';
import type { CreateDebtWorkRecordData, DebtWorkActionType, DebtWorkResult } from '~/types/customer-debt-work';

const props = defineProps<{
  customerId: string;
  isLoading?: boolean;
}>();

const emit = defineEmits(['close', 'save']);

const localError = ref<string | null>(null);
const invoiceIdError = ref<string | null>(null);

const formData = reactive<Partial<CreateDebtWorkRecordData> & { invoiceId?: string; actionDate: string; nextActionDate?: string }>({
  customerId: props.customerId,
  actionType: undefined,
  actionDate: new Date().toISOString().slice(0, 16), // Текущая дата и время в формате для datetime-local
  result: undefined,
  invoiceId: undefined,
  amount: undefined,
  description: undefined,
  nextActionDate: undefined,
});

// Валидация формата ObjectId (24 символа hex)
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Валидация invoiceId при изменении
watch(() => formData.invoiceId, (newValue) => {
  if (!newValue || newValue.trim() === '') {
    invoiceIdError.value = null;
    return;
  }
  
  const trimmed = newValue.trim();
  if (!isValidObjectId(trimmed)) {
    invoiceIdError.value = 'ID счета должен быть валидным 24-символьным hex-идентификатором';
  } else {
    invoiceIdError.value = null;
  }
});

const isFormValid = computed(() => {
  return formData.actionType && formData.actionDate && formData.result && !invoiceIdError.value;
});

function close() {
  emit('close');
}

function submitForm() {
  if (!isFormValid.value) {
    if (invoiceIdError.value) {
      localError.value = invoiceIdError.value;
    } else {
      localError.value = 'Заполните все обязательные поля';
    }
    return;
  }

  localError.value = null;

  // Дополнительная проверка invoiceId перед отправкой
  const trimmedInvoiceId = formData.invoiceId?.trim();
  if (trimmedInvoiceId && !isValidObjectId(trimmedInvoiceId)) {
    localError.value = 'ID счета должен быть валидным 24-символьным hex-идентификатором';
    return;
  }

  const dataToSave: CreateDebtWorkRecordData = {
    customerId: props.customerId,
    actionType: formData.actionType as DebtWorkActionType,
    actionDate: new Date(formData.actionDate).toISOString(), // Конвертируем в ISO формат
    result: formData.result as DebtWorkResult,
    description: formData.description?.trim() || undefined,
    nextActionDate: formData.nextActionDate ? new Date(formData.nextActionDate).toISOString() : undefined,
    amount: formData.amount,
    invoiceId: trimmedInvoiceId || undefined,
  };

  emit('save', dataToSave);
}
</script>

<style scoped>
.modal { background-color: rgba(0,0,0,0.5); }
.modal-dialog { max-width: 700px; }
.form-label { font-weight: 600; margin-bottom: 0.5rem; }
.text-danger { color: #dc3545; }
</style>

