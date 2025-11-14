# Enum'ы для бэкенда - Работа с задолженностями

## Полный список enum'ов, которые нужно создать на бэкенде

### 1. DebtWorkActionType (Тип действия по работе с задолженностью)

**Файл:** `src/domain/enums/debt-work-action-type.enum.ts` (или аналогичный)

```typescript
export enum DebtWorkActionType {
  CALL = 'CALL',                    // Звонок клиенту
  EMAIL = 'EMAIL',                  // Отправка email
  SMS = 'SMS',                      // Отправка SMS
  LETTER = 'LETTER',                // Отправка письма
  CLAIM = 'CLAIM',                  // Претензия
  COURT_CLAIM = 'COURT_CLAIM',      // Заявление в суд
  COURT_DECISION = 'COURT_DECISION', // Решение суда
  EXECUTION = 'EXECUTION',          // Исполнительное производство
  SETTLEMENT = 'SETTLEMENT',        // Досудебное урегулирование
  PAYMENT_PLAN = 'PAYMENT_PLAN',    // График погашения
  OTHER = 'OTHER'                   // Прочее
}
```

**Использование в DTO:**
```typescript
import { IsEnum } from 'class-validator';
import { DebtWorkActionType } from '../enums/debt-work-action-type.enum';

export class CreateDebtWorkRecordDto {
  @IsEnum(DebtWorkActionType)
  actionType: DebtWorkActionType;
  
  // ... другие поля
}
```

---

### 2. DebtWorkResult (Результат действия)

**Файл:** `src/domain/enums/debt-work-result.enum.ts` (или аналогичный)

```typescript
export enum DebtWorkResult {
  CONTACTED = 'CONTACTED',          // Связались с клиентом
  NO_CONTACT = 'NO_CONTACT',        // Не удалось связаться
  PROMISED_PAY = 'PROMISED_PAY',    // Обещали оплатить
  REFUSED = 'REFUSED',              // Отказались платить
  PARTIAL_PAY = 'PARTIAL_PAY',      // Частичная оплата
  FULL_PAY = 'FULL_PAY',            // Полная оплата
  IN_PROGRESS = 'IN_PROGRESS',      // В процессе
  COMPLETED = 'COMPLETED',          // Завершено
  CANCELLED = 'CANCELLED'           // Отменено
}
```

**Использование в DTO:**
```typescript
import { IsEnum } from 'class-validator';
import { DebtWorkResult } from '../enums/debt-work-result.enum';

export class CreateDebtWorkRecordDto {
  @IsEnum(DebtWorkResult)
  result: DebtWorkResult;
  
  // ... другие поля
}
```

---

### 3. RiskLevel (Уровень риска)

**Файл:** `src/domain/enums/risk-level.enum.ts` (или аналогичный)

```typescript
export enum RiskLevel {
  LOW = 'LOW',           // Низкий риск (0-30 баллов)
  MEDIUM = 'MEDIUM',     // Средний риск (31-60 баллов)
  HIGH = 'HIGH',         // Высокий риск (61-80 баллов)
  CRITICAL = 'CRITICAL'  // Критический риск (81-100 баллов)
}
```

**Использование в DTO:**
```typescript
import { IsEnum, IsOptional } from 'class-validator';
import { RiskLevel } from '../enums/risk-level.enum';

export class CustomerResponseDto {
  // ... другие поля
  
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;
  
  @IsOptional()
  riskScore?: number; // 0-100
}
```

---

## Пример полного DTO с валидацией

**Файл:** `src/application/dtos/debt-work/create-debt-work-record.dto.ts`

```typescript
import { IsEnum, IsString, IsDateString, IsOptional, IsNumber, Min } from 'class-validator';
import { DebtWorkActionType } from '../../../domain/enums/debt-work-action-type.enum';
import { DebtWorkResult } from '../../../domain/enums/debt-work-result.enum';

export class CreateDebtWorkRecordDto {
  @IsEnum(DebtWorkActionType, {
    message: 'actionType must be one of: CALL, EMAIL, SMS, LETTER, CLAIM, COURT_CLAIM, COURT_DECISION, EXECUTION, SETTLEMENT, PAYMENT_PLAN, OTHER'
  })
  actionType: DebtWorkActionType;

  @IsDateString({}, {
    message: 'actionDate must be a valid ISO date string'
  })
  actionDate: string;

  @IsEnum(DebtWorkResult, {
    message: 'result must be one of: CONTACTED, NO_CONTACT, PROMISED_PAY, REFUSED, PARTIAL_PAY, FULL_PAY, IN_PROGRESS, COMPLETED, CANCELLED'
  })
  result: DebtWorkResult;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString({}, {
    message: 'nextActionDate must be a valid ISO date string'
  })
  nextActionDate?: string;

  @IsOptional()
  @IsNumber({}, {
    message: 'amount must be a number'
  })
  @Min(0, {
    message: 'amount must be greater than or equal to 0'
  })
  amount?: number;

  @IsOptional()
  @IsString()
  invoiceId?: string;
}
```

---

## Пример Entity/Domain модели

**Файл:** `src/domain/entities/debt-work-record.entity.ts` (или аналогичный)

```typescript
import { DebtWorkActionType } from '../enums/debt-work-action-type.enum';
import { DebtWorkResult } from '../enums/debt-work-result.enum';

export class DebtWorkRecord {
  id: string;
  customerId: string;
  invoiceId?: string;
  actionType: DebtWorkActionType;
  actionDate: Date;
  performedBy: string;
  performedByName?: string;
  result: DebtWorkResult;
  description?: string;
  nextActionDate?: Date;
  amount?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Пример использования в Use Case

```typescript
import { DebtWorkActionType } from '../../domain/enums/debt-work-action-type.enum';
import { DebtWorkResult } from '../../domain/enums/debt-work-result.enum';

export class CreateDebtWorkRecordUseCase {
  async execute(dto: CreateDebtWorkRecordDto): Promise<DebtWorkRecord> {
    // Валидация уже выполнена через class-validator
    // Можно использовать enum'ы для проверки логики
    
    if (dto.actionType === DebtWorkActionType.CALL && dto.result === DebtWorkResult.NO_CONTACT) {
      // Логика для случая, когда звонок не удался
    }
    
    // ... создание записи
  }
}
```

---

## Важные замечания

1. **Регистр важен**: Все значения enum должны быть в верхнем регистре (UPPERCASE), как определено во фронтенде.

2. **Строковые значения**: Enum'ы должны использовать строковые значения (не числовые), чтобы соответствовать фронтенду.

3. **Валидация**: Используйте `@IsEnum()` декоратор из `class-validator` для валидации в DTO.

4. **Сообщения об ошибках**: Добавьте понятные сообщения об ошибках для лучшего UX.

5. **Опциональные поля**: `invoiceId`, `description`, `nextActionDate`, `amount` - опциональные поля, используйте `@IsOptional()`.

---

## Проверка соответствия фронтенду

Убедитесь, что значения enum'ов точно соответствуют значениям, отправляемым с фронтенда:

- **DebtWorkActionType**: `CALL`, `EMAIL`, `SMS`, `LETTER`, `CLAIM`, `COURT_CLAIM`, `COURT_DECISION`, `EXECUTION`, `SETTLEMENT`, `PAYMENT_PLAN`, `OTHER`
- **DebtWorkResult**: `CONTACTED`, `NO_CONTACT`, `PROMISED_PAY`, `REFUSED`, `PARTIAL_PAY`, `FULL_PAY`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- **RiskLevel**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

