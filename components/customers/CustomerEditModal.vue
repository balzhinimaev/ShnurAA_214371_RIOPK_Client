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
              @add-record="showAddRecordModal = true"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import CustomerDebtWorkHistory from './CustomerDebtWorkHistory.vue';
import AddDebtWorkRecordModal from './AddDebtWorkRecordModal.vue';
import { useCustomerStore } from '~/stores/customer';
import type { CreateDebtWorkRecordData, DebtWorkRecord, CustomerDebtWorkStats } from '~/types/customer-debt-work';

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
const activeTab = ref<'info' | 'debt-work'>('info');
const editableCustomer = reactive<UpdateCustomerData>({
    name: '',
    contactInfo: ''
});
const originalCustomer = ref<Customer | null>(null);
const localError = ref<string | null>(null);
const showAddRecordModal = ref(false);
const isSavingDebtWork = ref(false);
const isLoadingDebtWork = ref(false);

// Данные о работе с задолженностями
const debtWorkRecords = ref<DebtWorkRecord[]>([]);
const debtWorkStats = ref<CustomerDebtWorkStats | undefined>(undefined);

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
</style>