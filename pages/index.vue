<template>
    <div>
        <!-- Индикатор загрузки, пока не ясно, есть ли пользователь (есть токен, но нет данных) -->
        <div v-if="isLoadingUserData" class="text-center mt-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading user data...</span>
            </div>
            <p class="mt-2">Verifying session...</p>
        </div>

        <!-- Контент для аутентифицированного пользователя -->
        <div v-else-if="authStore.isAuthenticated && authStore.user" class="mb-4 p-4 bg-light rounded">
            <h1 class="display-5">Welcome back, {{ authStore.user.name }}!</h1>
            <p class="lead">You are logged in as: {{ authStore.user.email }}</p>
            <p>Your roles: <span v-for="(role, index) in authStore.user.roles" :key="role"
                    class="badge bg-secondary me-1">{{ role }}</span></p>
            <hr class="my-4">
            <p>This is your protected dashboard area.</p>
            <button @click="handleLogout" class="btn btn-danger">Logout</button>

            <!-- Место для основного контента дашборда -->
            <div class="mt-5">
                <h2>Dashboard Content</h2>
                <p>Here you would display the analysis of accounts receivable, charts, tables, etc.</p>
                <div class="card">
                    <div class="card-header">Sample Data Section</div>
                    <div class="card-body">
                        <p>Placeholder for BI data.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Сообщение, если НЕ аутентифицирован (теоретически сюда не попадем из-за middleware) -->
        <div v-else class="alert alert-warning" role="alert">
            <p class="mb-1">You need to be logged in to view this page.</p>
            <NuxtLink to="/login" class="alert-link">Login here</NuxtLink>
        </div>

    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'; // Импортируем computed
import { useAuthStore } from '~/stores/auth';

// Защищаем эту страницу
definePageMeta({
    middleware: ['auth']
});

const authStore = useAuthStore();

// Вычисляемое свойство для определения состояния загрузки данных пользователя
const isLoadingUserData = computed(() => {
    // Загрузка идет, если есть токен, но еще нет объекта пользователя
    return !!authStore.token && !authStore.user;
});

// Убираем onMounted, так как плагин и middleware теперь обрабатывают fetchUser

function handleLogout() {
    authStore.logout();
}
</script>

<style scoped lang="scss">
/* Локальные стили */
.display-5 {
    font-weight: 300;
}
</style>