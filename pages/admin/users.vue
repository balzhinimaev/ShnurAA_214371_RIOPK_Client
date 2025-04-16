// pages/admin/users.vue
<template>
  <div class="admin-users-page">
    <h1 class="h3 mb-4">Управление Пользователями</h1>

    <!-- Сообщение об ошибке загрузки списка -->
    <div v-if="store.error && !store.isLoading" class="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
        <span><i class="bi bi-exclamation-triangle-fill me-2"></i> {{ store.error }}</span>
        <button @click="store.fetchUsers()" class="btn btn-danger btn-sm">Повторить</button>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="store.isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка пользователей...</span>
      </div>
    </div>

    <!-- Таблица пользователей (если нет ошибки и загрузка завершена) -->
    <div v-else-if="!store.error" class="card shadow-sm">
      <div class="card-header bg-light py-3">
          <div class="d-flex justify-content-between align-items-center">
              <span class="fw-bold">Список Пользователей ({{ store.totalUsers }})</span>
              <!-- TODO: Кнопка добавления пользователя -->
              <!-- <button class="btn btn-primary btn-sm">Добавить пользователя</button> -->
          </div>
      </div>
      <div class="card-body p-0"> <!-- Убрал паддинги для таблицы -->
          <div v-if="store.users.length > 0" class="table-responsive">
              <table class="table table-hover table-striped mb-0 admin-users-table">
                  <thead>
                      <tr>
                          <th>ID</th>
                          <th>Имя</th>
                          <th>Email</th>
                          <th>Роли</th>
                          <th>Дата Создания</th>
                          <th class="text-end">Действия</th>
                      </tr>
                  </thead>
                  <tbody>
                      <!-- Используем компонент UserListItem -->
                      <UserListItem
                          v-for="user in store.users"
                          :key="user.id"
                          :user="user"
                          @edit="openEditModal"
                          @delete="confirmDeleteUser"
                      />
                      <!-- Или рендерим прямо здесь, если компонент не нужен -->
                      <!--
                      <tr v-for="user in store.users" :key="user.id">
                          <td class="text-muted small">{{ user.id }}</td>
                          <td>{{ user.name }}</td>
                          <td>{{ user.email }}</td>
                          <td>
                              <span v-for="role in user.roles" :key="role"
                                  class="badge me-1"
                                  :class="getRoleBadgeClass(role)">
                                  {{ role }}
                              </span>
                          </td>
                          <td>{{ formatDate(user.createdAt) }}</td>
                          <td class="text-end">
                              <button class="btn btn-sm btn-outline-primary me-1" title="Редактировать" @click="openEditModal(user)">
                                  <i class="bi bi-pencil-square"></i>
                              </button>
                              <button class="btn btn-sm btn-outline-danger" title="Удалить" @click="confirmDeleteUser(user)" :disabled="isCurrentUser(user.id)">
                                  <i class="bi bi-trash3"></i>
                              </button>
                          </td>
                      </tr>
                      -->
                  </tbody>
              </table>
          </div>
           <div v-else class="text-center p-4 text-muted">
                Пользователи не найдены.
           </div>
      </div>
       <!-- Пагинация -->
       <div v-if="store.totalPages > 1" class="card-footer bg-light">
            <nav aria-label="Page navigation">
                <ul class="pagination pagination-sm justify-content-center mb-0">
                    <li class="page-item" :class="{ disabled: store.currentPage === 1 }">
                        <a class="page-link" href="#" @click.prevent="store.changePage(store.currentPage - 1)">«</a>
                    </li>
                    <li v-for="page in store.totalPages" :key="page" class="page-item" :class="{ active: store.currentPage === page }">
                        <a class="page-link" href="#" @click.prevent="store.changePage(page)">{{ page }}</a>
                    </li>
                     <li class="page-item" :class="{ disabled: store.currentPage === store.totalPages }">
                        <a class="page-link" href="#" @click.prevent="store.changePage(store.currentPage + 1)">»</a>
                    </li>
                </ul>
            </nav>
       </div>
    </div>

     <!-- Модальное окно редактирования -->
     <UserEditModal
        v-if="editingUser"
        :user="editingUser"
        @close="closeEditModal"
        @save="saveUser"
     />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAdminUserStore } from '~/stores/adminUser';
import { useAuthStore } from '~/stores/auth'; // Для проверки текущего пользователя
import type { UserResponseDto } from '~/types/auth';
import type { UpdateUserDto } from '~/types/admin';

// Импортируем компоненты (если используем)
import UserListItem from '~/components/admin/UserListItem.vue';
import UserEditModal from '~/components/admin/UserEditModal.vue';

// Middleware для защиты страницы админки
definePageMeta({
  middleware: ['auth', 'admin-only'] // Предполагается, что есть middleware admin-only
  // Если middleware 'admin-only' нет, нужно создать его:
  // Он будет проверять authStore.user.roles.includes('ADMIN')
});

const store = useAdminUserStore();
const authStore = useAuthStore();

// Состояние для модального окна
const editingUser = ref<UserResponseDto | null>(null);

// Загрузка данных при монтировании
onMounted(() => {
  // Сбрасываем пагинацию на первую страницу при входе
  store.currentPage = 1;
  store.fetchUsers();
});

// --- Функции для модального окна ---
function openEditModal(user: UserResponseDto) {
    // Клонируем объект, чтобы изменения в модалке не влияли сразу на список
    editingUser.value = JSON.parse(JSON.stringify(user));
}

function closeEditModal() {
    editingUser.value = null;
}

async function saveUser(updatedData: UpdateUserDto) {
    if (!editingUser.value) return;
    const success = await store.updateUser(editingUser.value.id, updatedData);
    if (success) {
        closeEditModal(); // Закрываем модалку при успехе
        // Опционально: можно показать сообщение об успехе
    } else {
         // Ошибка отобразится через store.error
    }
}

// --- Функция удаления ---
function confirmDeleteUser(user: UserResponseDto) {
    // Получаем функцию из computed свойства через .value и вызываем ее
    if (isCurrentUser.value(user.id)) { // <-- ИЗМЕНЕНИЕ ЗДЕСЬ: добавлено .value
        alert("Вы не можете удалить свою учетную запись.");
        return;
    }
    // Логика подтверждения удаления
    if (confirm(`Вы уверены, что хотите удалить пользователя ${user.name} (${user.email})?`)) {
        store.deleteUser(user.id); // Вызываем action из store
    }
}

// --- Вспомогательные функции (если НЕ используем компонент UserListItem) ---
/*
function formatDate(dateString: string | Date): string {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('ru-RU');
    } catch {
        return 'Invalid Date';
    }
}

function getRoleBadgeClass(role: string): string {
    switch (role) {
        case 'ADMIN': return 'bg-danger text-white';
        case 'ANALYST': return 'bg-primary text-white';
        case 'MANAGER': return 'bg-success text-white';
        default: return 'bg-secondary text-white';
    }
}
*/

// Проверка, является ли пользователь текущим (для блокировки удаления себя)
const isCurrentUser = computed(() => (userId: string) => {
    return authStore.user?.id === userId;
});

</script>

<style scoped lang="scss">
.admin-users-table {
    th {
        font-weight: 500;
        font-size: 0.9rem;
        white-space: nowrap;
    }
    td {
         font-size: 0.9rem;
         vertical-align: middle;
         .badge { // Стили для бейджей ролей
             font-size: 0.75rem;
             padding: 0.3em 0.5em;
         }
    }
    .btn-sm { // Уменьшаем кнопки действий
        padding: 0.15rem 0.4rem;
        font-size: 0.8rem;
         i { font-size: 0.9rem; vertical-align: middle; } // Иконки в кнопках
    }
}
.pagination-sm { // Уменьшаем пагинацию
    font-size: 0.85rem;
}
</style>