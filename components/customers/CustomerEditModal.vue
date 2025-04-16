// components/customers/CustomerEditModal.vue
<template>
  <div class="modal fade show d-block" tabindex="-1" @click.self="close" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <form @submit.prevent="submitForm">
          <div class="modal-header">
            <h5 class="modal-title">Редактировать Клиента: {{ originalCustomer?.name }}</h5>
            <button type="button" class="btn-close" @click="close" aria-label="Close"></button>
          </div>
          <div class="modal-body">
             <div v-if="localError" class="alert alert-danger small py-2">{{ localError }}</div>

            <!-- Поле Название -->
            <div class="mb-3">
              <label for="editCustomerName" class="form-label">Название:</label>
              <input type="text" class="form-control" id="editCustomerName" v-model="editableCustomer.name" required minlength="2">
            </div>

             <!-- Поле ИНН (только для чтения) -->
             <div class="mb-3">
              <label for="editCustomerInn" class="form-label">ИНН:</label>
              <input type="text" class="form-control" id="editCustomerInn" :value="originalCustomer?.inn || ''" readonly disabled>
              <div class="form-text">ИНН изменить нельзя.</div>
            </div>

            <!-- Поле Контактная информация -->
            <div class="mb-3">
              <label for="editCustomerContact" class="form-label">Контактная информация:</label>
              <input type="text" class="form-control" id="editCustomerContact" v-model="editableCustomer.contactInfo">
               <div class="form-text">Оставьте пустым для очистки.</div>
            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="close">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="!isFormValid">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';

// Типы (можно вынести)
interface Customer {
    id: string;
    name: string;
    inn?: string;
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

const emit = defineEmits(['close', 'save']);

const editableCustomer = reactive<UpdateCustomerData>({
    name: '',
    contactInfo: ''
});
const originalCustomer = ref<Customer | null>(null);
const localError = ref<string | null>(null);

watch(() => props.customer, (newCustomer) => {
  if (newCustomer) {
    originalCustomer.value = newCustomer;
    editableCustomer.name = newCustomer.name;
    // Устанавливаем пустую строку, если contactInfo null или undefined
    editableCustomer.contactInfo = newCustomer.contactInfo ?? '';
    localError.value = null;
  }
}, { immediate: true });

// Валидация
const isFormValid = computed(() => {
    return editableCustomer.name && editableCustomer.name.length >= 2;
});

function close() { emit('close'); }

function submitForm() {
  if (!isFormValid.value) {
      localError.value = "Название клиента должно быть не менее 2 символов.";
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
</script>

<style scoped>
.modal { background-color: rgba(0,0,0,0.5); }
.modal-dialog { max-width: 500px; }
</style>