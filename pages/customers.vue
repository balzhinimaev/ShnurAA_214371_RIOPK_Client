// pages/customers.vue
<template>
  <div class="customers-page">
    <h1 class="h3 mb-4">Управление Клиентами</h1>

    <!-- Сообщение об ошибке -->
    <div v-if="store.error && !store.isLoading"
      class="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
      <span><i class="bi bi-exclamation-triangle-fill me-2"></i> {{ store.error }}</span>
      <button @click="store.fetchCustomers()" class="btn btn-danger btn-sm">Повторить</button>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="store.isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка клиентов...</span>
      </div>
    </div>

    <!-- Таблица клиентов -->
    <div v-else-if="!store.error" class="card shadow-sm">
      <div class="card-header bg-light py-3">
        <div class="d-flex justify-content-between align-items-center">
          <span class="fw-bold">Список Клиентов ({{ store.totalCustomers }})</span>
          <!-- TODO: Кнопка добавления клиента (если нужна отдельная форма) -->
          <!-- <button class="btn btn-success btn-sm">Добавить клиента</button> -->
        </div>
        <!-- TODO: Добавить фильтры -->
      </div>
      <div class="card-body p-0">
        <div v-if="store.customers.length > 0" class="table-responsive">
          <table class="table table-hover table-striped mb-0 admin-customers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>УНП</th>
                <th>Контакт</th>
                <th>Дата Создания</th>
                <th class="text-end">Действия</th>
              </tr>
            </thead>
            <tbody>
              <CustomerListItem v-for="customer in store.customers" :key="customer.id" :customer="customer"
                @edit="openEditModal" @delete="confirmDeleteCustomer" />
            </tbody>
          </table>
        </div>
        <div v-else class="text-center p-4 text-muted">
          Клиенты не найдены. Возможно, стоит загрузить данные по счетам.
        </div>
      </div>
      <!-- Пагинация -->
      <div v-if="store.totalPages > 1" class="card-footer bg-light">
        <nav aria-label="Customer list navigation">
          <ul class="pagination pagination-sm justify-content-center mb-0">
            <li class="page-item" :class="{ disabled: store.currentPage === 1 }">
              <a class="page-link" href="#" @click.prevent="store.changePage(store.currentPage - 1)">«</a>
            </li>
            <li v-for="page in store.totalPages" :key="page" class="page-item"
              :class="{ active: store.currentPage === page }">
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
    <CustomerEditModal v-if="editingCustomer" :customer="editingCustomer" @close="closeEditModal"
      @save="saveCustomer" />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCustomerStore } from '~/stores/customer';
import type { CustomerResponse as Customer } from '~/stores/customer'; // Используем тип из store
import type { UpdateCustomerData } from '~/stores/customer'; // Используем тип из store
const authStore = useAuthStore(); 
// Импортируем компоненты
import CustomerListItem from '~/components/customers/CustomerListItem.vue';
import CustomerEditModal from '~/components/customers/CustomerEditModal.vue';

// Middleware для защиты страницы
definePageMeta({
  middleware: ['auth', 'admin-analyst-only'] // Нужен middleware для проверки ролей ADMIN или ANALYST
  // Если middleware нет, создайте его (например, admin-analyst-only.ts)
});

const store = useCustomerStore();

// Состояние для модального окна
const editingCustomer = ref<Customer | null>(null);

// Загрузка данных при монтировании
onMounted(() => {
  store.currentPage = 1; // Сброс на первую страницу
  store.fetchCustomers();
});

// --- Функции для модального окна ---
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
  }
}

// --- Функция удаления ---
function confirmDeleteCustomer(customer: Customer) {
  if (!authStore.user?.roles?.includes('ADMIN')) {
    alert('У вас нет прав на удаление клиентов.');
    return;
  }
  if (confirm(`Вы уверены, что хотите удалить клиента ${customer.name} (УНП: ${customer.inn || 'N/A'})? \nПримечание: Это может быть невозможно, если у клиента есть связанные счета.`)) {
    store.deleteCustomer(customer.id);
  }
}

</script>

<style scoped lang="scss">
.admin-customers-table {
  th {
    font-weight: 500;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  td {
    font-size: 0.9rem;
    vertical-align: middle;
  }

  .btn-sm {
    padding: 0.15rem 0.4rem;
    font-size: 0.8rem;

    i {
      font-size: 0.9rem;
      vertical-align: middle;
    }
  }
}

.pagination-sm {
  font-size: 0.85rem;
}
</style>