<template>
    <div>
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top"> <!- Пример навбара ->
                <div class="container-fluid">
                    <NuxtLink class="navbar-brand" to="/">Debts Analyzer</NuxtLink>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                        aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                            <li class="nav-item">
                                <NuxtLink class="nav-link" active-class="active" to="/">Home</NuxtLink>
                            </li>
                            <!- Добавить другие ссылки ->
                        </ul>
                        <div class="d-flex"> <!- Используем flex утилиты Bootstrap ->
                                <template v-if="!authStore.isAuthenticated">
                                    <NuxtLink to="/login" class="btn btn-outline-light me-2">Login</NuxtLink>
                                    <NuxtLink to="/register" class="btn btn-light">Register</NuxtLink>
                                </template>
                                <template v-else>
                                    <span class="navbar-text me-3">
                                        Welcome, {{ authStore.user?.name || authStore.user?.email }}!
                                    </span>
                                    <button @click="handleLogout" class="btn btn-warning">Logout</button>
                                    <! - Используем кнопку ->
                                </template>
                        </div>
                    </div>
                </div>
        </nav>

        <main class="container mt-5 pt-4"> <!- Используем контейнер и отступы ->
                <slot /> <!-- Сюда будут вставляться страницы -->
        </main>

        <footer class="py-4 mt-5 bg-light"> <!- Пример футера ->
                <div class="container text-center">
                    <p class="text-muted">© {{ new Date().getFullYear() }} Debts Analyzer App</p>
                </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
const authStore = useAuthStore();

function handleLogout() {
    authStore.logout();
}
</script>

<style lang="scss">
// Если нужно добавить глобальные стили поверх Bootstrap, можно сделать это здесь
// или в assets/scss/main.scss ПОСЛЕ импорта Bootstrap

// Пример отступа для фиксированной нав. панели (можно и в main.scss)
body {
    padding-top: 56px; // Высота стандартного navbar
}
</style>