// components/admin/UserEditModal.vue
<template>
  <div class="modal fade show d-block" tabindex="-1" @click.self="close" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <form @submit.prevent="submitForm">
          <div class="modal-header">
            <h5 class="modal-title">Редактировать Пользователя: {{ originalUser?.name }}</h5>
            <button type="button" class="btn-close" @click="close" aria-label="Close"></button>
          </div>
          <div class="modal-body">
             <!-- Сообщение об ошибке внутри модалки -->
             <div v-if="localError" class="alert alert-danger small py-2">{{ localError }}</div>

            <!-- Поле Имя -->
            <div class="mb-3">
              <label for="editUserName" class="form-label">Имя:</label>
              <input type="text" class="form-control" id="editUserName" v-model="editableUser.name" required minlength="2">
            </div>

             <!-- Поле Email (только для чтения) -->
             <div class="mb-3">
              <label for="editUserEmail" class="form-label">Email:</label>
              <input type="email" class="form-control" id="editUserEmail" :value="originalUser?.email" readonly disabled>
               <div class="form-text">Email изменить нельзя.</div>
            </div>

            <!-- Поле Роли -->
            <div class="mb-3">
              <label class="form-label d-block">Роли:</label>
              <!-- Чекбоксы для выбора ролей -->
              <div v-for="role in availableRoles" :key="role" class="form-check form-check-inline">
                 <input
                    class="form-check-input"
                    type="checkbox"
                    :id="'role_' + role"
                    :value="role"
                    v-model="editableUser.roles"
                 >
                 <label class="form-check-label" :for="'role_' + role">{{ role }}</label>
              </div>
               <div v-if="rolesError" class="text-danger small mt-1">{{ rolesError }}</div>
               <div v-else class="form-text">Выберите хотя бы одну роль.</div>
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
import type { UserResponseDto } from '~/types/auth';
import type { UpdateUserDto } from '~/types/admin';

// Определяем props
const props = defineProps<{
  user: UserResponseDto | null; // Принимаем исходного пользователя
}>();

// Определяем события
const emit = defineEmits(['close', 'save']);

// Локальное состояние для редактирования
const editableUser = reactive<UpdateUserDto>({
    name: '',
    roles: []
});
const originalUser = ref<UserResponseDto | null>(null); // Для email
const localError = ref<string | null>(null); // Локальные ошибки формы

// Доступные роли (можно получать из API или определить статично)
const availableRoles: string[] = ['ADMIN', 'ANALYST', 'MANAGER'];

// Инициализация данных при открытии модалки
watch(() => props.user, (newUser) => {
  if (newUser) {
    originalUser.value = newUser; // Сохраняем оригинал для email
    // Клонируем данные для редактирования
    editableUser.name = newUser.name;
    editableUser.roles = [...newUser.roles]; // Копируем массив ролей
    localError.value = null; // Сбрасываем ошибки
  }
}, { immediate: true });


// Валидация формы на клиенте
const rolesError = computed(() => {
    return editableUser.roles && editableUser.roles.length > 0 ? null : 'Необходимо выбрать хотя бы одну роль.';
});

const isFormValid = computed(() => {
    return editableUser.name && editableUser.name.length >= 2 && !rolesError.value;
});


// Обработчик закрытия
function close() {
  emit('close');
}

// Обработчик сохранения
function submitForm() {
  if (!isFormValid.value) {
      localError.value = "Пожалуйста, исправьте ошибки в форме.";
      return;
  }
  localError.value = null;
  // Создаем объект только с измененными данными (если нужно)
  // или просто передаем весь editableUser
  const dataToSave: UpdateUserDto = {};
  if (originalUser.value?.name !== editableUser.name) {
      dataToSave.name = editableUser.name;
  }
   // Сравниваем массивы ролей (сортируем для надежности)
   const originalRolesSorted = [...(originalUser.value?.roles || [])].sort();
   const currentRolesSorted = [...(editableUser.roles || [])].sort();
   if (JSON.stringify(originalRolesSorted) !== JSON.stringify(currentRolesSorted)) {
        dataToSave.roles = editableUser.roles;
   }

   // Если ничего не изменилось, просто закрываем
   if (Object.keys(dataToSave).length === 0) {
        console.log("No changes detected.");
        close();
        return;
   }

  console.log("Submitting changes:", dataToSave);
  emit('save', dataToSave);
}
</script>

<style scoped>
/* Стили для модального окна */
.modal {
  /* Уже настроено в шаблоне */
}
.modal-dialog {
    max-width: 500px; /* Или другая ширина */
}
/* Можно добавить стили для полей формы, если нужно */
</style>