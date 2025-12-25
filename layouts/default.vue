// layouts/default.vue
<template>
    <div class="d-flex flex-column min-vh-100"> <!-- Обертка для прижатия футера -->
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow-sm">
            <div class="container-fluid">
                <NuxtLink class="navbar-brand d-flex align-items-center" to="/">
                     Анализ дебиторской задолженности
                </NuxtLink>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar"
                    aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="mainNavbar">
                    <!-- Левая часть меню -->
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item">
                            <NuxtLink class="nav-link" active-class="active" exact-active-class="active" to="/">
                                Главная
                            </NuxtLink>
                        </li>

                        <!-- Оборачиваем динамические пункты в ClientOnly -->
                        <ClientOnly fallback-tag="span">
                             <!-- Меню Отчеты -->
                             <li class="nav-item dropdown" v-if="authStore.isAuthenticated">
                                <a class="nav-link dropdown-toggle" href="#" id="reportsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                   Отчеты
                                </a>
                                <ul class="dropdown-menu" aria-labelledby="reportsDropdown">
                                    <li>
                                        <NuxtLink class="dropdown-item" active-class="active" to="/">Сводка</NuxtLink>
                                    </li>
                                </ul>
                            </li>

                             <!-- === ИЗМЕНЕНИЕ: Добавляем пункт Дебиторы === -->
                             <li class="nav-item" v-if="canManageCustomers">
                                <NuxtLink class="nav-link" active-class="active" to="/customers">
                                    Дебиторы
                                </NuxtLink>
                            </li>
                             <!-- === КОНЕЦ ИЗМЕНЕНИЯ === -->

                            <!-- Меню Загрузка -->
                            <li class="nav-item" v-if="canUploadData">
                                <NuxtLink class="nav-link" active-class="active" to="/upload">
                                    Загрузка данных
                                </NuxtLink>
                            </li>

                             <!-- Меню Администрирование -->
                             <li class="nav-item dropdown" v-if="isAdmin">
                                <a class="nav-link dropdown-toggle" href="#" id="adminDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    Администрирование
                                </a>
                                <ul class="dropdown-menu" aria-labelledby="adminDropdown">
                                    <li>
                                         <NuxtLink class="dropdown-item" active-class="active" to="/admin/users">
                                             Управление пользователями
                                         </NuxtLink>
                                    </li>
                                </ul>
                            </li>

                             <!-- Заглушка для SSR -->
                             <template #fallback>
                                 <li class="nav-item placeholder-glow" aria-hidden="true" style="width: 80px;"><span class="placeholder nav-link w-75"></span></li>
                                 <li class="nav-item placeholder-glow" aria-hidden="true" style="width: 120px;"><span class="placeholder nav-link w-75"></span></li>
                                 <li class="nav-item placeholder-glow" aria-hidden="true" style="width: 150px;"><span class="placeholder nav-link w-75"></span></li>
                             </template>
                        </ClientOnly>
                    </ul>

                    <!-- Правая часть меню - Пользователь/Вход -->
                    <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
                        <ClientOnly fallback-tag="span">
                            <template v-if="!authStore.isAuthenticated">
                                <li class="nav-item">
                                    <NuxtLink to="/login" class="nav-link">Войти</NuxtLink>
                                </li>
                                <li class="nav-item">
                                    <NuxtLink to="/register" class="btn btn-light btn-sm my-1 ms-lg-2">Регистрация</NuxtLink>
                                </li>
                            </template>
                            <template v-else>
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        {{ authStore.user?.name || authStore.user?.email }}
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                                        <li>
                                            <button @click="handleLogout" class="dropdown-item text-danger d-flex align-items-center">
                                                Выйти
                                            </button>
                                        </li>
                                    </ul>
                                </li>
                            </template>
                             <template #fallback>
                                 <li class="nav-item placeholder-glow" aria-hidden="true" style="width: 80px;"><span class="placeholder nav-link w-100"></span></li>
                                 <li class="nav-item placeholder-glow ms-lg-2" aria-hidden="true" style="width: 100px;"><span class="placeholder btn btn-light btn-sm disabled w-100"></span></li>
                             </template>
                        </ClientOnly>
                    </ul>
                </div>
            </div>
        </nav>

        <main class="flex-grow-1">
            <slot />
        </main>

        <footer class="py-3 mt-auto bg-light border-top">
            <div class="container text-center">
                <p class="text-muted small mb-0">© {{ new Date().getFullYear() }} Анализ дебиторской задолженности</p>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '~/stores/auth';

// Динамический импорт Bootstrap JS ТОЛЬКО на клиенте
if (process.client) {
    try {
         import('bootstrap/js/dist/dropdown');
         import('bootstrap/js/dist/collapse');
    } catch (e) {
        console.error("Failed to load Bootstrap JS modules:", e);
    }
}

const authStore = useAuthStore();

function handleLogout() {
    authStore.logout();
}

// Вычисляемое свойство для проверки прав на управление клиентами
const canManageCustomers = computed(() => {
  if (!authStore.isAuthenticated || !authStore.user?.roles) return false;
  // Разрешаем ADMIN и ANALYST управлять клиентами
  return authStore.user.roles.includes('ADMIN') || authStore.user.roles.includes('ANALYST');
});

// Вычисляемое свойство для проверки прав на загрузку данных
const canUploadData = computed(() => {
  if (!authStore.isAuthenticated || !authStore.user?.roles) return false;
  return authStore.user.roles.includes('ADMIN') || authStore.user.roles.includes('ANALYST');
});

// Вычисляемое свойство для проверки роли ADMIN
const isAdmin = computed(() => {
  if (!authStore.isAuthenticated || !authStore.user?.roles) return false;
  return authStore.user.roles.includes('ADMIN');
});

</script>

<style lang="scss">
// Отступ для контента из-за фиксированной нав. панели
body {
    padding-top: 56px; /* Или фактическая высота вашего navbar */
}
// Стили для прижатия футера
.min-vh-100 { min-height: 100vh; }
.d-flex { display: flex !important; }
.flex-column { flex-direction: column !important; }
.flex-grow-1 { flex-grow: 1 !important; }
.mt-auto { margin-top: auto !important; }

// Стилизация dropdown
.dropdown-menu {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    margin-top: 0.25rem !important;
    border: none;
}
button.dropdown-item {
    cursor: pointer;
}
.dropdown-item.btn, button.dropdown-item {
    text-decoration: none;
    &:focus, &:hover {
        text-decoration: none;
    }
}

// Стили для плейсхолдеров ClientOnly
.placeholder-glow .placeholder {
    background-color: rgba(255, 255, 255, 0.15);
}
</style>