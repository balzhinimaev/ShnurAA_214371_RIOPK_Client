<template>
    <div class="row justify-content-center mt-5">
        <div class="col-md-8 col-lg-6 col-xl-5">
            <div class="card shadow-sm">
                <div class="card-body p-4 p-sm-5">
                    <h1 class="card-title text-center mb-4">Регистрация</h1>
                    <form @submit.prevent="handleRegister" novalidate>
                        <!-- Поле Имя -->
                        <div class="mb-3">
                            <label for="name" class="form-label">Имя</label>
                            <input type="text" class="form-control" :class="{ 'is-invalid': v$.name.$error }" id="name"
                                v-model="state.name" @blur="v$.name.$touch" required aria-describedby="nameFeedback" />
                            <div id="nameFeedback" class="invalid-feedback" v-if="v$.name.$error">
                                Пожалуйста, введите ваше имя.
                            </div>
                        </div>

                        <!-- Поле Email -->
                        <div class="mb-3">
                            <label for="email" class="form-label">Адрес электронной почты</label>
                            <input type="email" class="form-control" :class="{ 'is-invalid': v$.email.$error }"
                                id="email" v-model="state.email" @blur="v$.email.$touch" required
                                aria-describedby="emailFeedback" />
                            <div id="emailFeedback" class="invalid-feedback" v-for="error of v$.email.$errors"
                                :key="error.$uid">
                                {{ error.$message }}
                            </div>
                        </div>

                        <!-- Поле Пароль -->
                        <div class="mb-4">
                            <label for="password" class="form-label">Пароль</label>
                            <input type="password" class="form-control" :class="{ 'is-invalid': v$.password.$error }"
                                id="password" v-model="state.password" @blur="v$.password.$touch" required
                                aria-describedby="passwordFeedback" />
                            <div id="passwordFeedback" class="invalid-feedback" v-for="error of v$.password.$errors"
                                :key="error.$uid">
                                {{ error.$message }}
                            </div>
                            <div id="passwordHelpBlock" class="form-text">
                                Должен содержать не менее 6 символов.
                            </div>
                        </div>

                        <!-- Сообщение об общей ошибке API -->
                        <div v-if="apiError" class="alert alert-danger py-2 mb-3" role="alert">
                            {{ apiErrorMessage }}
                        </div>

                        <!-- Кнопка Регистрации -->
                        <div class="d-grid">
                            <button type="submit" class="btn btn-primary btn-lg" :disabled="loading || v$.$invalid">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"
                                    aria-hidden="true"></span>
                                {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
                            </button>
                        </div>
                    </form>

                    <!-- Ссылка на Логин -->
                    <div class="mt-4 text-center">
                        <small class="text-muted">Уже есть аккаунт? <NuxtLink to="/login">Войдите здесь</NuxtLink>
                            </small>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
// Импортируем Vuelidate
import { useVuelidate } from '@vuelidate/core';
import { required, email, minLength, helpers } from '@vuelidate/validators';

// Middleware для редиректа аутентифицированных пользователей
definePageMeta({
    middleware: ['guest']
});

const authStore = useAuthStore();
const loading = ref(false);
const apiError = ref<any>(null); // Для ошибок от бэкенда

// --- Vuelidate ---
const state = reactive({
    name: '',
    email: '',
    password: '',
});

const rules = {
    name: { required: helpers.withMessage('Имя обязательно для заполнения.', required) },
    email: {
        required: helpers.withMessage('Адрес электронной почты обязателен для заполнения.', required),
        email: helpers.withMessage('Пожалуйста, введите корректный адрес электронной почты.', email)
    },
    password: {
        required: helpers.withMessage('Пароль обязателен для заполнения.', required),
        minLength: helpers.withMessage('Пароль должен содержать не менее 6 символов.', minLength(6))
    },
};

// Инициализация Vuelidate
const v$ = useVuelidate(rules, state);
// --- Конец Vuelidate ---


// Вычисляемое свойство для отображения сообщений об ошибках API
const apiErrorMessage = computed(() => {
    if (!apiError.value) return '';
    // Обрабатываем специфичные ошибки регистрации (например, 409 Conflict)
    if (apiError.value?.response?.status === 409) {
        return 'Аккаунт с таким адресом электронной почты уже существует.';
    }
    // Пытаемся извлечь сообщение из стандартной ошибки или ошибки от $fetch
    return apiError.value.data?.message || apiError.value.message || 'Произошла неизвестная ошибка при регистрации.';
});


// Обработчик отправки формы
async function handleRegister() {
    // 1. Запускаем валидацию Vuelidate
    const isFormCorrect = await v$.value.$validate();
    // Если форма невалидна, выходим
    if (!isFormCorrect) return;

    // 2. Если форма валидна, отправляем запрос
    loading.value = true;
    apiError.value = null; // Сбрасываем предыдущие ошибки API
    try {
        // Передаем значения из state
        await authStore.register({
            name: state.name,
            email: state.email,
            password: state.password
        });
        // Редирект или логин происходит внутри authStore.register
        // Если используется редирект на логин, то он сработает автоматически
        // Если авто-логин, то store обновится, и middleware/layout перерисуются
    } catch (err) {
        apiError.value = err; // Сохраняем ошибку API
        console.error("Register page API error caught:", err);
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped lang="scss">
/* Можно добавить локальные стили SCSS для этой страницы, если нужно */
.card {
    border: none;
    /* Убираем стандартную рамку карточки, тень достаточна */
}
</style>