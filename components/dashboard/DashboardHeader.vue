<template>
    <header class="dashboard-header">
        <div class="header-left">
            <h1 class="page-title">📊 Дашборд анализа дебиторской задолженности</h1>
            <p class="page-subtitle">
                Комплексный обзор ключевых показателей по дебиторской задолженности
            </p>
            <p class="page-note" style="font-size: 0.85rem; color: #718096; margin-top: 0.5rem; font-style: italic;">
                Примечание: В программе рассматривается только часть дебиторской задолженности, связанная с расчетами с поставщиками
            </p>
            <div v-if="authStore.isAuthenticated && authStore.user" class="user-meta">
                <div class="user-meta-text">
                    <span class="user-name">👋 {{ authStore.user.name || 'Пользователь' }}</span>
                    <span class="user-email">{{ authStore.user.email }}</span>
                </div>
                <div class="role-badges" v-if="authStore.user.roles?.length">
                    <span v-for="role in authStore.user.roles" :key="role" class="role-badge">{{ role }}</span>
                </div>
            </div>
        </div>
        <div class="header-right">
            <span class="date-badge">📅 Данные на: {{ lastUpdatedLabel }}</span>
            <button
                class="update-btn"
                type="button"
                :disabled="reportStore.isLoading"
                @click="$emit('refresh')"
            >
                <span v-if="reportStore.isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                <span>{{ reportStore.isLoading ? 'Обновление...' : '🔄 Обновить' }}</span>
            </button>
            <button
                v-if="authStore.isAuthenticated"
                type="button"
                class="logout-btn"
                @click="$emit('logout')"
            >
                Выйти
            </button>
        </div>
    </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useReportStore } from '~/stores/report';

defineEmits<{
    refresh: [];
    logout: [];
}>();

const authStore = useAuthStore();
const reportStore = useReportStore();

const lastUpdatedLabel = computed(() => {
    const raw = reportStore.dashboardSummary?.lastUpdatedAt;
    if (raw) {
        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    }
    return new Date().toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
});
</script>

<style scoped lang="scss">
.dashboard-header {
    background: rgba(255, 255, 255, 0.96);
    border-radius: 1rem;
    padding: 1.75rem 2rem;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.page-title {
    font-size: 1.6rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 0.25rem;
}

.page-subtitle {
    font-size: 0.95rem;
    color: #4a5568;
    margin-bottom: 0.75rem;
}

.user-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.user-meta-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.user-name {
    font-weight: 600;
    color: #2d3748;
}

.user-email {
    font-size: 0.9rem;
    color: #4a5568;
}

.role-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
}

.role-badge {
    background: #edf2f7;
    color: #4a5568;
    border-radius: 999px;
    padding: 0.25rem 0.65rem;
    font-size: 0.75rem;
    font-weight: 600;
}

.header-right {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
}

.date-badge {
    background: #f7fafc;
    color: #4a5568;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.85rem;
}

.update-btn,
.logout-btn {
    border: none;
    border-radius: 0.6rem;
    padding: 0.55rem 1.2rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    font-size: 0.85rem;
}

.update-btn {
    background: #667eea;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
}

.update-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.update-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.logout-btn {
    background: #edf2f7;
    color: #4a5568;
}

.logout-btn:hover {
    background: #e2e8f0;
    transform: translateY(-2px);
}
</style>
