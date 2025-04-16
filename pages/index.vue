// pages/index.vue
<template>
    <div class="page-container">
        <!-- Блок приветствия (стилизован минималистично) -->
        <div v-if="authStore.isAuthenticated && authStore.user" class="user-greeting mb-4">
             <button @click="handleLogout" class="btn btn-sm btn-logout float-end">Выйти</button>
             <h1 class="user-name h5 mb-1">
                 С возвращением, {{ authStore.user.name }}!
             </h1>
             <p class="user-details text-muted small mb-0">
                 {{ authStore.user.email }}
                 <span class="mx-1">|</span>
                 Роли: <span v-for="role in authStore.user.roles" :key="role" class="badge bg-light text-dark fw-normal border me-1">{{ role }}</span>
             </p>
        </div>

        <!-- === СЕКЦИЯ ДАННЫХ ДАШБОРДА === -->
        <div class="mt-4 dashboard-section">
            <h2 class="section-title h5 mb-3">Сводка по Дебиторской Задолженности</h2>

            <!-- Индикатор загрузки -->
            <div v-if="reportStore.isLoading" class="loading-indicator text-center my-5 py-5">
                <div class="spinner-grow text-primary" role="status"> <!-- Заменил на spinner-grow -->
                    <span class="visually-hidden">Загрузка данных...</span>
                </div>
                <p class="mt-3 text-muted small">Загрузка сводки...</p>
            </div>

            <!-- Сообщение об ошибке -->
             <div v-else-if="reportStore.error" class="material-card error-card mb-4">
                <div class="d-flex align-items-center justify-content-between">
                     <span class="error-message">
                         <!-- <i class="bi bi-exclamation-circle-fill me-2"></i> --> <!-- Убрал иконку для минимализма -->
                         <strong>Ошибка:</strong> {{ reportStore.error }}
                     </span>
                    <button @click="retryFetch" class="btn btn-sm btn-outline-danger retry-button">Повторить</button>
                </div>
             </div>


            <!-- Отображение данных при успехе -->
            <div v-else-if="reportStore.dashboardSummary" class="dashboard-content">
                 <div class="row g-4 mb-4"> <!-- Увеличил отступы g-4 -->
                     <!-- Карточка: Общая ДЗ -->
                     <div class="col-md-6">
                         <div class="material-card h-100"> <!-- Добавил h-100 для одинаковой высоты -->
                             <div class="card-content">
                                 <h3 class="card-title text-muted">Общая Задолженность</h3>
                                 <p class="card-value text-primary">{{ reportStore.formattedTotalReceivables }}</p>
                             </div>
                         </div>
                     </div>
                      <!-- Карточка: Просроченная ДЗ -->
                     <div class="col-md-6">
                         <div class="material-card h-100">
                             <div class="card-content">
                                 <h3 class="card-title text-muted">Просроченная Задолженность</h3>
                                 <p class="card-value text-warning">{{ reportStore.formattedOverdueReceivables }}</p>
                             </div>
                         </div>
                     </div>
                 </div>

                 <!-- Структура старения (в виде карточки с таблицей) -->
                 <div class="material-card">
                     <div class="card-header bg-transparent border-bottom-0 pt-3 pb-0"> <!-- Убрал фон и рамку у заголовка -->
                         <h3 class="card-title text-muted mb-0">Структура по Срокам Старения</h3>
                     </div>
                     <div class="card-content pt-2"> <!-- Уменьшил верхний паддинг -->
                         <div v-if="reportStore.dashboardSummary.agingStructure && reportStore.dashboardSummary.agingStructure.length > 0">
                             <div class="table-responsive">
                                 <!-- Убрал table-striped, сделал table-borderless -->
                                 <table class="table table-hover table-sm table-borderless mb-0 data-table">
                                     <thead>
                                         <tr>
                                             <th class="text-muted fw-normal">Срок просрочки (дни)</th>
                                             <th class="text-muted fw-normal text-end">Сумма</th>
                                             <th class="text-muted fw-normal text-end">Кол-во счетов</th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         <!-- Добавил hover эффект -->
                                         <tr v-for="bucket in reportStore.dashboardSummary.agingStructure" :key="bucket.bucket" class="data-row">
                                             <td>{{ bucket.bucket }}</td>
                                             <td class="text-end">{{ bucket.amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) }}</td>
                                             <td class="text-end">{{ bucket.count }}</td>
                                         </tr>
                                     </tbody>
                                     <tfoot v-if="reportStore.dashboardSummary">
                                         <tr class="total-row">
                                             <td class="fw-bold">Итого:</td>
                                             <td class="text-end fw-bold">{{ reportStore.formattedTotalReceivables }}</td>
                                             <td class="text-end fw-bold">{{ reportStore.dashboardSummary.agingStructure.reduce((sum, b) => sum + b.count, 0) }}</td>
                                         </tr>
                                     </tfoot>
                                 </table>
                             </div>
                         </div>
                         <div v-else>
                             <p class="text-muted text-center py-3">Данные по структуре старения отсутствуют.</p>
                         </div>
                     </div>
                 </div>
            </div>

             <!-- Сообщение, если данных нет и ошибки тоже нет -->
             <div v-else class="material-card text-center py-4">
                 <p class="text-muted mb-2">Нет данных для отображения.</p>
                 <NuxtLink v-if="canUploadData" to="/upload" class="btn btn-sm btn-outline-primary">Загрузить данные</NuxtLink>
             </div>
        </div>

        <!-- Сообщение, если пользователь НЕ аутентифицирован (оставил стандартный alert) -->
        <div v-if="!authStore.isAuthenticated" class="alert alert-warning mt-5" role="alert">
           <!-- ... -->
        </div>

    </div>
</template>

<script setup lang="ts">
// ... (скрипт без изменений) ...
import { onMounted, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useReportStore } from '~/stores/report';

definePageMeta({
    middleware: ['auth']
});

const authStore = useAuthStore();
const reportStore = useReportStore();

function handleLogout() {
    authStore.logout();
}

function retryFetch() {
    reportStore.fetchDashboardSummary();
}

const canUploadData = computed(() => {
  if (!authStore.isAuthenticated || !authStore.user?.roles) {
    return false;
  }
  return authStore.user.roles.includes('ADMIN') || authStore.user.roles.includes('ANALYST');
});

onMounted(() => {
    if (authStore.isAuthenticated && !reportStore.dashboardSummary && !reportStore.error) {
        reportStore.fetchDashboardSummary();
    }
});
</script>

<style scoped lang="scss">
// Переменные для кастомизации (можно вынести в глобальные SCSS)
$material-card-bg: #fff;
$material-card-shadow: 0 2px 4px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
$material-card-hover-shadow: 0 4px 10px rgba(0, 0, 0, 0.1), 0 3px 8px rgba(0, 0, 0, 0.06);
$material-card-border-radius: 8px;
$text-muted-light: #6c757d; // Стандартный Bootstrap muted
$text-primary: #0d6efd; // Стандартный Bootstrap primary
$text-warning: #ffc107; // Стандартный Bootstrap warning
$text-danger: #dc3545; // Стандартный Bootstrap danger

.page-container {
    // Можно добавить глобальные стили для страницы, если нужно
}

.user-greeting {
    background-color: lighten($material-card-bg, 2%); // Чуть темнее фона
    padding: 1rem 1.5rem;
    border-radius: $material-card-border-radius;
    border: 1px solid #eee; // Тонкая рамка
    .user-name {
        font-weight: 500;
        color: #333;
    }
     .user-details {
        line-height: 1.4;
     }
     .btn-logout {
        color: $text-muted-light;
        border-color: transparent;
        padding: 0.2rem 0.5rem;
         &:hover {
            color: $text-danger;
            background-color: transparent;
         }
     }
}

.dashboard-section {
    .section-title {
        font-weight: 500;
        color: #444;
    }
}

.loading-indicator {
    // Стили для индикатора загрузки
}

// Основной стиль карточки "Material Design"
.material-card {
    background-color: $material-card-bg;
    border-radius: $material-card-border-radius;
    box-shadow: $material-card-shadow;
    border: none; // Убираем стандартную рамку Bootstrap
    transition: box-shadow 0.2s ease-in-out;
    overflow: hidden; // Обрезаем содержимое по рамке

    // &.h-100 { height: 100%; } // Оставим класс Bootstrap

    // Эффект при наведении (опционально)
    // &:hover {
    //     box-shadow: $material-card-hover-shadow;
    // }

    .card-header {
        // Стилизация заголовка внутри карточки
        padding: 1rem 1.25rem; // Отступы
        margin-bottom: 0;
        background-color: transparent; // Прозрачный фон
        border-bottom: 1px solid #f0f0f0; // Тонкий разделитель
    }

    .card-content {
        padding: 1.25rem; // Основные отступы
    }

    .card-title {
        font-size: 0.9rem; // Меньший размер заголовка
        font-weight: 500; // Средняя жирность
        margin-bottom: 0.5rem;
        text-transform: uppercase; // Заглавные буквы
        letter-spacing: 0.5px; // Небольшой разрядка
        color: $text-muted-light; // Приглушенный цвет
    }

    .card-value {
        font-size: 2rem; // Крупный шрифт для значения
        font-weight: 600; // Жирный
        line-height: 1.2;
        margin-bottom: 0;
        // Цвет текста задается классами Bootstrap (text-primary, text-warning)
    }

    // Стили для таблицы внутри карточки
    .data-table {
        th {
            font-size: 0.8rem; // Меньший шрифт заголовков таблицы
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
            border-top: none; // Убираем верхнюю рамку у заголовков
            border-bottom: 1px solid #eee; // Тонкий разделитель
        }
         td {
            font-size: 0.9rem;
            vertical-align: middle; // Выравнивание по центру
            padding: 0.6rem 0.4rem; // Вертикальные отступы чуть больше
         }
         tbody tr.data-row:hover { // Эффект при наведении на строку
            background-color: #f8f9fa; // Легкий фон
         }
         tfoot tr.total-row { // Строка итогов
             border-top: 2px solid #dee2e6; // Более жирная рамка сверху
             td {
                 font-size: 0.95rem; // Чуть крупнее итоги
                 padding-top: 0.75rem;
                 padding-bottom: 0.75rem;
             }
         }
    }

     // Стили для карточки ошибки
     &.error-card {
        background-color: lighten($text-danger, 38%); // Светло-красный фон
        border: 1px solid lighten($text-danger, 30%);
        color: darken($text-danger, 15%);
        padding: 1rem 1.25rem; // Отступы

        .error-message {
            font-size: 0.95rem;
        }
         .retry-button {
             padding: 0.2rem 0.6rem;
             font-size: 0.8rem;
         }
     }
}

// Стили для спиннера-загрузки
.spinner-grow {
    width: 2.5rem;
    height: 2.5rem;
}
</style>