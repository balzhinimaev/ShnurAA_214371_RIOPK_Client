// pages/upload.vue
<template>
    <div class="upload-container">
        <h1 class="mb-3">Загрузка счетов из 1С</h1>
        <p class="lead mb-4">
            Выберите <strong>CSV файл</strong> в формате 1С, содержащий данные по счетам, для загрузки в систему.
        </p>

        <div class="alert alert-info" role="alert">
            <h4 class="alert-heading">Требования к CSV файлу</h4>
            <p>Убедитесь, что ваш CSV файл соответствует следующим критериям:</p>
            <ul>
                <li>Должен быть корректным файлом с расширением <strong>.csv</strong>.</li>
                <li>Кодировка файла: <strong>UTF-8</strong>.</li>
                <li>Максимальный размер файла: <strong>10 МБ</strong>.</li>
                <li>
                    <strong>Обязательные заголовки</strong> (чувствительны к регистру):
                    <code>Дата_начала_услуги</code>, <code>Дата_окончания_услуги</code>, <code>Номер_акта</code>, 
                    <code>Контрагент</code>, <code>ИНН</code>, <code>Сумма_к_оплате</code>, <code>Дата_планируемой_оплаты</code>.
                </li>
                <li>
                    <strong>Опциональные заголовки</strong>: 
                    <code>Договор</code>, <code>Тип_услуги</code>, <code>Срок_оплаты_дней</code>, 
                    <code>Сумма_оплачено</code>, <code>Дата_фактической_оплаты</code>, 
                    <code>Остаток_задолженности</code>, <code>Менеджер</code>, <code>Примечание</code>.
                </li>
                <li>Даты должны быть в формате <code>dd.MM.yyyy</code> (например, <code>15.01.2024</code>).</li>
                <li>Суммы могут использовать точку или запятую как разделитель дробной части.</li>
            </ul>
            <div class="mt-3">
                <strong>Поддерживаемые типы услуг</strong> (для поля <code>Тип_услуги</code>):
                <ul class="mb-0 mt-1">
                    <li><code>Сопровождение ПКТ</code> → PKT_SUPPORT</li>
                    <li><code>Установка ККТ</code> → KKT_INSTALLATION</li>
                    <li><code>Обслуживание ККТ</code> → KKT_SERVICE</li>
                    <li><code>Обслуживание торг. автоматов</code> → VENDING_SERVICE</li>
                    <li><code>Установка торг. автомата</code> → VENDING_INSTALLATION</li>
                    <li>Любое другое значение → OTHER</li>
                </ul>
                <small class="text-muted">Маппинг нечувствителен к регистру.</small>
            </div>
        </div>

        <!-- Сообщения об успехе/ошибке -->
        <div v-if="uploadFeedback.message" :class="['alert', uploadFeedback.type === 'success' ? 'alert-success' : 'alert-danger', 'mt-4']" role="alert">
            <strong>{{ uploadFeedback.type === 'success' ? 'Успешно!' : 'Ошибка:' }}</strong> {{ uploadFeedback.message }}
            <!-- Показ деталей/статистики при успехе -->
            <div v-if="uploadFeedback.type === 'success' && uploadFeedback.details" class="mt-3">
                <h6 class="mb-2">Статистика обработки:</h6>
                <ul class="mb-2" v-if="uploadFeedback.details">
                    <li v-if="uploadFeedback.details.totalRows !== undefined">
                        <strong>Всего строк в файле:</strong> {{ uploadFeedback.details.totalRows }}
                    </li>
                    <li v-if="uploadFeedback.details.processedRows !== undefined">
                        <strong>Обработано строк:</strong> {{ uploadFeedback.details.processedRows }}
                    </li>
                    <li v-if="uploadFeedback.details.createdCustomers !== undefined">
                        <strong>Создано клиентов:</strong> {{ uploadFeedback.details.createdCustomers }}
                    </li>
                    <li v-if="uploadFeedback.details.createdInvoices !== undefined">
                        <strong>Создано счетов:</strong> {{ uploadFeedback.details.createdInvoices }}
                    </li>
                    <li v-if="uploadFeedback.details.updatedInvoices !== undefined">
                        <strong>Обновлено счетов:</strong> {{ uploadFeedback.details.updatedInvoices }}
                    </li>
                    <li v-if="uploadFeedback.details.skippedRows !== undefined">
                        <strong>Пропущено строк:</strong> {{ uploadFeedback.details.skippedRows }}
                    </li>
                </ul>
                <div v-if="uploadFeedback.details.errors && uploadFeedback.details.errors.length > 0" class="mt-2">
                    <h6 class="mb-2 text-warning">Ошибки при обработке:</h6>
                    <ul class="small mb-0">
                        <li v-for="(error, index) in uploadFeedback.details.errors" :key="index">{{ error }}</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Форма загрузки -->
        <form @submit.prevent="handleFileUpload" class="mt-4 card card-body shadow-sm">
            <fieldset :disabled="isUploading">
                <legend class="h5 mb-3">Выбор и загрузка файла</legend>
                <div class="mb-3">
                    <label for="invoiceFile" class="form-label">Поле выбора CSV файла:</label>
                    <input
                        class="form-control"
                        :class="{ 'is-invalid': fileError }"
                        type="file"
                        id="invoiceFile"
                        ref="fileInputRef"
                        @change="handleFileSelection"
                        accept=".csv"
                        required
                        aria-describedby="fileHelp fileErrorFeedback"
                    />
                    <div id="fileHelp" class="form-text">Разрешены только файлы с расширением .csv.</div>
                    <div id="fileErrorFeedback" class="invalid-feedback" v-if="fileError">
                        {{ fileError }}
                    </div>
                </div>

                <!-- Информация о выбранном файле -->
                <div v-if="selectedFile" class="mb-3 text-muted small">
                    Выбран файл: <strong>{{ selectedFile.name }}</strong> ({{ formatBytes(selectedFile.size) }})
                </div>

                <!-- Кнопка отправки -->
                <button type="submit" class="btn btn-primary" :disabled="!selectedFile || isUploading || !!fileError">
                    <span v-if="isUploading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    {{ isUploading ? 'Загрузка...' : 'Загрузить счета из 1С' }}
                </button>
            </fieldset>
        </form>

         <!-- Индикатор прогресса (визуальный) -->
        <div v-if="isUploading" class="progress mt-3" style="height: 5px;">
            <div
                class="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style="width: 100%"
                aria-valuenow="100"
                aria-valuemin="0"
                aria-valuemax="100"
            ></div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuthStore } from '~/stores/auth';
import type { Ref } from 'vue';

// Определяем тип для деталей ответа API
interface UploadResponseDetails {
    totalRows?: number;
    processedRows?: number;
    createdCustomers?: number;
    createdInvoices?: number;
    updatedInvoices?: number;
    skippedRows?: number;
    errors?: string[];
}

// Определяем тип для объекта обратной связи
interface UploadFeedback {
    type: 'success' | 'error' | null;
    message: string | null;
    details?: UploadResponseDetails | null; // Для доп. информации при успехе (статистика)
}

// --- Middleware и Store ---
definePageMeta({
    middleware: ['auth', 'admin-analyst-only'] // Доступ только для авторизованных с ролью ADMIN или ANALYST
});

const authStore = useAuthStore();
const config = useRuntimeConfig();

// --- Refs для состояния компонента ---
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);
const fileInputRef: Ref<HTMLInputElement | null> = ref(null);
const fileError = ref<string | null>(null); // Ошибка валидации файла на клиенте

// Реактивный объект для сообщений пользователю
const uploadFeedback = reactive<UploadFeedback>({
    type: null,
    message: null,
    details: null,
});

// --- Функции ---

/**
 * Сбрасывает состояние обратной связи и ошибки файла.
 */
function resetFeedbackAndErrors() {
    uploadFeedback.type = null;
    uploadFeedback.message = null;
    uploadFeedback.details = null;
    fileError.value = null;
}

/**
 * Обрабатывает выбор файла пользователем.
 * @param event - Событие изменения input[type=file]
 */
function handleFileSelection(event: Event) {
    resetFeedbackAndErrors(); // Сбрасываем ошибки/сообщения при новом выборе
    const target = event.target as HTMLInputElement;

    if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const maxSizeBytes = 10 * 1024 * 1024; // 10 МБ
        
        // Проверка типа файла на клиенте
        if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
            fileError.value = 'Неверный тип файла. Пожалуйста, выберите CSV файл.';
            selectedFile.value = null;
             // Очищаем значение input, чтобы можно было выбрать тот же файл снова после ошибки
             if (fileInputRef.value) {
                fileInputRef.value.value = '';
            }
        } else if (file.size > maxSizeBytes) {
            fileError.value = `Размер файла превышает максимально допустимый (10 МБ). Размер файла: ${formatBytes(file.size)}.`;
            selectedFile.value = null;
            if (fileInputRef.value) {
                fileInputRef.value.value = '';
            }
        } else {
            selectedFile.value = file;
            fileError.value = null;
            console.log('Выбран файл:', file.name, `(${formatBytes(file.size)})`);
        }
    } else {
        selectedFile.value = null;
    }
}

/**
 * Обрабатывает отправку формы для загрузки файла.
 */
async function handleFileUpload() {
    // Проверки перед отправкой
    if (!selectedFile.value) {
        uploadFeedback.type = 'error';
        uploadFeedback.message = 'Файл не выбран. Пожалуйста, сначала выберите CSV файл.';
        return;
    }
    if (fileError.value) {
         uploadFeedback.type = 'error';
         uploadFeedback.message = 'Пожалуйста, исправьте ошибку выбора файла перед загрузкой.';
         return;
    }
    if (!authStore.token) {
         uploadFeedback.type = 'error';
         uploadFeedback.message = 'Ошибка аутентификации. Пожалуйста, войдите в систему снова.';
         // Возможно, стоит вызвать authStore.logout() здесь
         return;
    }

    isUploading.value = true;
    resetFeedbackAndErrors(); // Сброс перед новой попыткой

    const formData = new FormData();
    formData.append('file', selectedFile.value, selectedFile.value.name); // 'file' - имя поля из API

    console.log(`Загрузка файла счетов из 1С: ${selectedFile.value.name}...`);

    try {
        // Выполняем запрос к API для загрузки счетов из 1С
        const response = await $fetch<{
            message: string;
            totalRows?: number;
            processedRows?: number;
            createdCustomers?: number;
            createdInvoices?: number;
            updatedInvoices?: number;
            skippedRows?: number;
            errors?: string[];
        }>(`/data-uploads/1c-invoices`, {
            baseURL: config.public.apiBase,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authStore.token}`,
            },
            body: formData,
        });

        console.log('Ответ при успешной загрузке:', response);

        // Обработка успешного ответа (200 OK)
        uploadFeedback.type = 'success';
        // Предполагаем, что API возвращает русскоязычное сообщение
        uploadFeedback.message = response.message || 'Файл успешно обработан!';

        // Извлекаем доп. детали, если они есть, исключая само сообщение
        if (response && typeof response === 'object') {
            const { message, ...details } = response;
            if (Object.keys(details).length > 0) {
                uploadFeedback.details = details as UploadResponseDetails;
            }
        }

        // Очистка после успеха
        selectedFile.value = null;
        if (fileInputRef.value) {
            fileInputRef.value.value = ''; // Сбрасываем поле ввода файла
        }

    } catch (error: any) {
        console.error('Ошибка загрузки:', error);
        uploadFeedback.type = 'error';

        // Извлекаем сообщение об ошибке из ответа API (400, 401, 500)
        // Предполагаем, что API возвращает русскоязычное сообщение
        if (error.data && error.data.message) {
            uploadFeedback.message = error.data.message;
        } else if (error.message) {
            // Пытаемся перевести стандартные ошибки сети
            if (error.message.includes('Failed to fetch')) {
                 uploadFeedback.message = 'Не удалось подключиться к серверу. Проверьте сетевое соединение или обратитесь к администратору.';
            } else {
                 uploadFeedback.message = error.message;
            }
        } else {
            uploadFeedback.message = 'Произошла непредвиденная ошибка во время загрузки.';
        }
        // Не сбрасываем selectedFile при ошибке, чтобы пользователь мог попробовать снова

    } finally {
        isUploading.value = false;
    }
}

/**
 * Вспомогательная функция для форматирования размера файла.
 * @param bytes - Размер в байтах
 * @param decimals - Количество знаков после запятой
 * @returns Форматированная строка размера файла (e.g., "1.23 МБ")
 */
function formatBytes(bytes: number, decimals = 2): string {
    if (!+bytes) return '0 Байт'; // Обработка 0 и нечисловых входов

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    // Используем русские обозначения
    const sizes = ['Байт', 'КБ', 'МБ', 'ГБ', 'ТБ', 'ПБ', 'ЭБ', 'ЗБ', 'ИБ'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Заменяем точку на запятую для русского формата
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm)).toString().replace('.', ',')} ${sizes[i]}`;
}
</script>

<style scoped lang="scss">
.upload-container {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0 1rem;
}

fieldset:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

code {
  background-color: #e9ecef;
  padding: 0.2em 0.4em;
  margin: 0 0.1em;
  border-radius: 3px;
  font-size: 85%;
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

pre.small {
  max-height: 200px;
  overflow-y: auto;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.progress {
    height: 5px;
    background-color: #e9ecef;
}
</style>