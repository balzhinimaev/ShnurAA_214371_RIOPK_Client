<template>
    <div class="row justify-content-center mt-5">
        <div class="col-md-6 col-lg-4">
            <div class="card shadow-sm">
                <div class="card-body p-4 p-sm-5">
                    <h1 class="card-title text-center mb-4">Login</h1>
                    <!-- Убедись, что обработчик submit привязан -->
                    <form @submit.prevent="handleLogin" novalidate>
                        <div class="mb-3">
                            <label for="email" class="form-label">Email address</label>
                            <input type="email" class="form-control" id="email" v-model="credentials.email" required
                                aria-describedby="emailHelp" />
                            <!-- Можно добавить показ ошибок валидации, если используешь Vuelidate -->
                            <!-- <div v-if="v$.email.$error" class="invalid-feedback">...</div> -->
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">Password</label>
                            <input type="password" class="form-control" id="password" v-model="credentials.password"
                                required />
                            <!-- Можно добавить показ ошибок валидации, если используешь Vuelidate -->
                            <!-- <div v-if="v$.password.$error" class="invalid-feedback">...</div> -->
                        </div>

                        <!-- Отображение ошибок от API -->
                        <div v-if="error" class="alert alert-danger py-2 mb-3" role="alert">
                            {{ errorMessage }}
                        </div>

                        <!-- Кнопка отправки формы -->
                        <div class="d-grid">
                            <!-- Убедись, что тип кнопки submit -->
                            <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"
                                    aria-hidden="true"></span>
                                {{ loading ? 'Logging in...' : 'Login' }}
                            </button>
                        </div>
                    </form>

                    <!-- Ссылка на регистрацию -->
                    <div class="mt-4 text-center">
                        <small class="text-muted">No account? <NuxtLink to="/register">Register here</NuxtLink></small>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useAuthStore } from '~/stores/auth'; // Импорт стора
// Если используешь Vuelidate, раскомментируй:
// import { useVuelidate } from '@vuelidate/core'
// import { required, email } from '@vuelidate/validators'

// Middleware для редиректа аутентифицированных пользователей
definePageMeta({
    middleware: ['guest']
});

const authStore = useAuthStore(); // Получаем экземпляр стора

// Реактивное состояние для данных формы
const credentials = reactive({
    email: '',
    password: '',
});

const loading = ref(false); // Флаг состояния загрузки
const error = ref<any>(null); // Для хранения ошибок от API

// --- Vuelidate (если используется) ---
// const rules = {
//   email: { required, email },
//   password: { required },
// }
// const v$ = useVuelidate(rules, credentials);
// --- Конец Vuelidate ---

// Вычисляемое свойство для отображения текста ошибки API
const errorMessage = computed(() => {
    if (!error.value) return '';
    // Пытаемся извлечь сообщение из стандартной ошибки или ошибки от $fetch
    // Ошибка $fetch часто содержит { data: { message: '...' } }
    return error.value?.data?.message || error.value?.message || 'Login failed. Please check your credentials.';
});

// Асинхронная функция для обработки отправки формы
async function handleLogin() {
    console.log('Login form submitted'); // <--- ОТЛАДКА 1: Сработало ли событие?
    error.value = null; // Сбрасываем предыдущие ошибки

    // --- Vuelidate (если используется) ---
    // const isFormValid = await v$.value.$validate();
    // console.log('Vuelidate result:', isFormValid);
    // if (!isFormValid) {
    //   console.log('Validation failed');
    //   return; // Прерываем, если форма не валидна
    // }
    // --- Конец Vuelidate ---

    loading.value = true; // Включаем индикатор загрузки
    console.log('Credentials being sent:', JSON.parse(JSON.stringify(credentials))); // <--- ОТЛАДКА 2: Какие данные отправляем?

    try {
        console.log('Calling authStore.login action...'); // <--- ОТЛАДКА 3: Вызываем ли action?
        // Вызываем action логина из стора Pinia
        await authStore.login(credentials);
        console.log('authStore.login action finished successfully.'); // <--- ОТЛАДКА 4: Успешно ли завершился action?
        // Редирект должен произойти внутри authStore.login при успехе
    } catch (err: any) {
        console.error("Login page error caught in handleLogin:", err); // <--- ОТЛАДКА 5: Ловим ошибку здесь?
        // Попробуем извлечь статус ошибки, если он есть
        const status = err?.response?.status || err?.request?.status || err?.status;
        console.error("Error status code:", status);
        console.error("Error data:", err?.data);
        error.value = err; // Сохраняем ошибку для отображения пользователю
    } finally {
        loading.value = false; // Выключаем индикатор загрузки в любом случае
        console.log('handleLogin finally block executed.'); // <--- ОТЛАДКА 6: Дошли до конца?
    }
}
</script>

<style scoped lang="scss">
/* Локальные стили для этой страницы, если нужны */
.card {
    border: none;
    /* Убираем стандартную рамку карточки */
}

button:disabled {
    cursor: not-allowed;
}
</style>