# Улучшения валидации invoiceId

## Проблема

При отправке невалидного `invoiceId` (например, "12у12") возникала ошибка `BSONError: input must be a 24 character hex string` на бэкенде, что приводило к внутренней ошибке сервера вместо понятного сообщения об ошибке валидации.

## Решение на бэкенде

### 1. Валидация в DTO

**Файл:** `src/application/dtos/debt-work/create-debt-work-record.dto.ts`

```typescript
import { IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

export class CreateDebtWorkRecordDto {
  // ... другие поля

  @ValidateIf((o) => o.invoiceId !== undefined && o.invoiceId !== null && o.invoiceId !== '')
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'invoiceId must be a valid 24-character hexadecimal ObjectId string'
  })
  invoiceId?: string;
}
```

**Особенности:**
- `@ValidateIf()` применяет валидацию только если `invoiceId` предоставлен
- `@Matches()` проверяет формат 24-символьной hex-строки
- Понятное сообщение об ошибке для пользователя

### 2. Валидация в репозитории (дополнительная защита)

**Файл:** `src/infrastructure/repositories/mongo-debt-work-record.repository.ts` (или аналогичный)

```typescript
import { AppError } from '../../common/errors/app-error';

async create(data: CreateDebtWorkRecordDto): Promise<DebtWorkRecord> {
  // Дополнительная проверка перед созданием ObjectId
  if (data.invoiceId) {
    if (!/^[0-9a-fA-F]{24}$/.test(data.invoiceId)) {
      throw new AppError(
        400,
        `Невалидный формат invoiceId: ${data.invoiceId}. Ожидается 24-символьная hex-строка ObjectId.`
      );
    }
  }
  
  // ... создание записи
}
```

**Результат:**
- Двойная защита: валидация в DTO и в репозитории
- Понятные сообщения об ошибках
- Предотвращение внутренних ошибок сервера

## Решение на фронтенде

### Валидация в компоненте

**Файл:** `components/customers/AddDebtWorkRecordModal.vue`

Добавлена валидация формата ObjectId на фронтенде для улучшения UX:

```typescript
// Валидация формата ObjectId (24 символа hex)
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Валидация invoiceId при изменении
watch(() => formData.invoiceId, (newValue) => {
  if (!newValue || newValue.trim() === '') {
    invoiceIdError.value = null;
    return;
  }
  
  const trimmed = newValue.trim();
  if (!isValidObjectId(trimmed)) {
    invoiceIdError.value = 'ID счета должен быть валидным 24-символьным hex-идентификатором';
  } else {
    invoiceIdError.value = null;
  }
});
```

**Преимущества:**
- Мгновенная обратная связь пользователю
- Визуальная индикация ошибки (красная рамка поля)
- Предотвращение отправки невалидных данных
- Улучшенный UX

### Визуальная индикация

```vue
<input 
  type="text" 
  class="form-control" 
  :class="{ 'is-invalid': invoiceIdError }"
  v-model="formData.invoiceId"
  placeholder="ID счета (24 символа)"
/>
<div v-if="invoiceIdError" class="invalid-feedback">
  {{ invoiceIdError }}
</div>
```

## Формат ObjectId MongoDB

ObjectId MongoDB должен соответствовать следующим требованиям:
- **Длина**: ровно 24 символа
- **Формат**: шестнадцатеричные символы (0-9, a-f, A-F)
- **Регулярное выражение**: `/^[0-9a-fA-F]{24}$/`

**Примеры:**
- ✅ Валидные: `507f1f77bcf86cd799439011`, `6916c24bc37d74fc7008500b`
- ❌ Невалидные: `12у12`, `123`, `abc`, `507f1f77bcf86cd7994390111` (25 символов)

## Результат

### До исправления:
```
POST /api/v1/customers/:id/debt-work
Body: { invoiceId: "12у12", ... }

Response: 500 Internal Server Error
BSONError: input must be a 24 character hex string
```

### После исправления:

**На фронтенде:**
- Пользователь видит ошибку сразу при вводе
- Поле подсвечивается красным
- Кнопка "Сохранить" неактивна до исправления ошибки

**На бэкенде:**
```
POST /api/v1/customers/:id/debt-work
Body: { invoiceId: "12у12", ... }

Response: 400 Bad Request
{
  "statusCode": 400,
  "message": [
    "invoiceId must be a valid 24-character hexadecimal ObjectId string"
  ],
  "error": "Bad Request"
}
```

## Тестирование

### Тест валидации на фронтенде:
1. Откройте форму добавления записи о работе с задолженностью
2. Введите невалидный ID счета (например, "12у12")
3. Проверьте, что:
   - Поле подсвечивается красным
   - Отображается сообщение об ошибке
   - Кнопка "Сохранить" неактивна

### Тест валидации на бэкенде:
1. Отправьте запрос с невалидным `invoiceId`
2. Проверьте, что возвращается ошибка 400 с понятным сообщением
3. Проверьте, что не возникает внутренняя ошибка сервера

## Дополнительные улучшения

В будущем можно добавить:
- Автодополнение ID счетов при вводе
- Выбор счета из списка вместо ручного ввода
- Валидацию существования счета в базе данных

