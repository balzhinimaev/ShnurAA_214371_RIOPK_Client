# Сводка интеграции с API работы с задолженностями

## Выполненные изменения

### 1. Store (`stores/customer.ts`)
✅ Добавлены методы для работы с API:
- `fetchDebtWorkHistory(customerId, params?)` — получение истории и статистики
- `createDebtWorkRecord(customerId, data)` — создание новой записи

✅ Расширен тип `CustomerResponse` для поддержки статистики рисковости

### 2. Компоненты

#### `CustomerEditModal.vue`
✅ Интегрирована загрузка данных из API при открытии вкладки "Работа с задолженностями"
✅ Добавлен индикатор загрузки
✅ Обработка ошибок при загрузке и сохранении данных

#### `AddDebtWorkRecordModal.vue`
✅ Конвертация дат в ISO формат перед отправкой
✅ Правильная структура данных (без customerId в body)

#### `CustomerDebtWorkHistory.vue`
✅ Отображение загруженных данных из API
✅ Показ статистики рисковости с цветовой индикацией

### 3. Страница клиентов (`pages/customers.vue`)
✅ Добавлена колонка "Рисковость" в таблицу
✅ Отображение уровня риска с цветовой индикацией
✅ Отображение оценки рисковости (0-100 баллов)
✅ Подсказки при наведении с детальной информацией
✅ Сортировка по рисковости в фильтрах
✅ Рисковость автоматически рассчитывается на бэкенде и приходит в ответе API

## API Endpoints

### GET `/api/v1/customers/:customerId/debt-work`
**Использование:**
```typescript
const response = await customerStore.fetchDebtWorkHistory(customerId, {
  limit: 50,
  sortBy: 'actionDate',
  sortOrder: 'desc'
});
```

**Ответ:**
```typescript
{
  records: DebtWorkRecord[];
  stats: CustomerDebtWorkStats;
}
```

### POST `/api/v1/customers/:customerId/debt-work`
**Использование:**
```typescript
const record = await customerStore.createDebtWorkRecord(customerId, {
  actionType: 'CALL',
  actionDate: new Date().toISOString(),
  result: 'CONTACTED',
  description: 'Клиент обещал оплатить',
  // ... другие поля
});
```

## Формат данных

### Даты
Все даты отправляются в ISO формате: `"2024-01-15T10:00:00Z"`

### Структура ответа списка клиентов
```typescript
{
  customers: CustomerResponse[];
  total: number;
  offset: number;
  limit: number;
}

// CustomerResponse включает:
{
  id: string;
  name: string;
  unp?: string;
  contactInfo?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  riskScore?: number;        // Оценка рисковости (0-100)
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // Уровень риска
}
```

### Структура запроса создания записи
```typescript
{
  actionType: DebtWorkActionType;
  actionDate: string; // ISO format
  result: DebtWorkResult;
  description?: string;
  nextActionDate?: string; // ISO format
  amount?: number;
  invoiceId?: string;
  // customerId НЕ включается в body (передается в URL)
}
```

## Обработка ошибок

Все методы store возвращают `null` при ошибке и устанавливают `this.error` с описанием ошибки.

Компоненты отображают ошибки пользователю через `localError`.

## Тестирование

Для тестирования интеграции:

1. Откройте страницу клиентов (`/customers`)
2. Нажмите "Редактировать" на любом клиенте
3. Перейдите на вкладку "Работа с задолженностями"
4. Проверьте загрузку истории (если есть данные)
5. Нажмите "Добавить запись"
6. Заполните форму и сохраните
7. Проверьте, что запись появилась в истории

## Примечания

- Статистика рисковости загружается отдельно для каждого клиента при открытии карточки
- В будущем можно оптимизировать, загружая статистику вместе со списком клиентов
- Все даты конвертируются в ISO формат автоматически
- `customerId` не должен быть в body запроса, так как передается в URL

