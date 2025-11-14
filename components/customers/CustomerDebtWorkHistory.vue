// components/customers/CustomerDebtWorkHistory.vue
<template>
  <div class="debt-work-history">
    <div class="debt-work-header">
      <h4 class="debt-work-title">📋 История работы с задолженностями</h4>
      <button 
        v-if="canAddRecord"
        type="button" 
        class="btn-add-record"
        @click="$emit('add-record')"
      >
        ➕ Добавить запись
      </button>
    </div>

    <!-- Статистика рисковости -->
    <div v-if="stats" class="risk-indicators">
      <div class="risk-card" :class="`risk-${stats.riskLevel?.toLowerCase() || 'low'}`">
        <div class="risk-header">
          <span class="risk-label">Уровень риска:</span>
          <span class="risk-badge" :class="`risk-badge-${stats.riskLevel?.toLowerCase() || 'low'}`">
            {{ getRiskLevelLabel(stats.riskLevel) }}
          </span>
        </div>
        <div v-if="stats.riskScore !== undefined" class="risk-score">
          Оценка рисковости: <strong>{{ stats.riskScore }}/100</strong>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ stats.totalDebtEpisodes }}</div>
          <div class="stat-label">Эпизодов задолженности</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.totalCalls }}</div>
          <div class="stat-label">Звонков</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.totalLegalActions }}</div>
          <div class="stat-label">Юридических действий</div>
        </div>
        <div v-if="stats.longestDebtDays" class="stat-item">
          <div class="stat-value">{{ stats.longestDebtDays }}</div>
          <div class="stat-label">Макс. дней задолженности</div>
        </div>
      </div>
    </div>

    <!-- История записей -->
    <div v-if="records && records.length > 0" class="debt-work-records">
      <div 
        v-for="record in records" 
        :key="record.id" 
        class="debt-work-record"
        :class="`record-${record.actionType.toLowerCase()}`"
      >
        <div class="record-header">
          <div class="record-type-badge" :class="`badge-${record.actionType.toLowerCase()}`">
            {{ getActionTypeLabel(record.actionType) }}
          </div>
          <div class="record-date">
            {{ formatDate(record.actionDate) }}
          </div>
        </div>
        
        <div class="record-body">
          <div class="record-result">
            <span class="result-label">Результат:</span>
            <span class="result-badge" :class="`result-${record.result.toLowerCase()}`">
              {{ getResultLabel(record.result) }}
            </span>
          </div>
          
          <div v-if="record.performedByName" class="record-performer">
            Выполнил: <strong>{{ record.performedByName }}</strong>
          </div>
          
          <div v-if="record.description" class="record-description">
            {{ record.description }}
          </div>
          
          <div v-if="record.amount" class="record-amount">
            Сумма задолженности: <strong>{{ formatCurrency(record.amount) }}</strong>
          </div>
          
          <div v-if="record.nextActionDate" class="record-next-action">
            Следующее действие: <strong>{{ formatDate(record.nextActionDate) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Пустое состояние -->
    <div v-else class="debt-work-empty">
      <p>История работы с задолженностями отсутствует.</p>
      <button 
        v-if="canAddRecord"
        type="button" 
        class="btn-add-first-record"
        @click="$emit('add-record')"
      >
        ➕ Добавить первую запись
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DebtWorkRecord, CustomerDebtWorkStats, DebtWorkActionType, DebtWorkResult } from '~/types/customer-debt-work';

const props = defineProps<{
  records?: DebtWorkRecord[];
  stats?: CustomerDebtWorkStats;
  canAddRecord?: boolean;
}>();

const emit = defineEmits(['add-record']);

function formatDate(date: string | Date): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 2
  }).format(amount);
}

function getActionTypeLabel(type: DebtWorkActionType): string {
  const labels: Record<DebtWorkActionType, string> = {
    CALL: '📞 Звонок',
    EMAIL: '📧 Email',
    SMS: '💬 SMS',
    LETTER: '✉️ Письмо',
    CLAIM: '⚖️ Претензия',
    COURT_CLAIM: '⚖️ Заявление в суд',
    COURT_DECISION: '⚖️ Решение суда',
    EXECUTION: '⚖️ Исполнительное производство',
    SETTLEMENT: '🤝 Досудебное урегулирование',
    PAYMENT_PLAN: '📅 График погашения',
    OTHER: '📝 Прочее'
  };
  return labels[type] || type;
}

function getResultLabel(result: DebtWorkResult): string {
  const labels: Record<DebtWorkResult, string> = {
    CONTACTED: 'Связались',
    NO_CONTACT: 'Не связались',
    PROMISED_PAY: 'Обещали оплатить',
    REFUSED: 'Отказались',
    PARTIAL_PAY: 'Частичная оплата',
    FULL_PAY: 'Полная оплата',
    IN_PROGRESS: 'В процессе',
    COMPLETED: 'Завершено',
    CANCELLED: 'Отменено'
  };
  return labels[result] || result;
}

function getRiskLevelLabel(level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string {
  const labels = {
    LOW: 'Низкий',
    MEDIUM: 'Средний',
    HIGH: 'Высокий',
    CRITICAL: 'Критический'
  };
  return level ? labels[level] : 'Не определен';
}
</script>

<style scoped lang="scss">
.debt-work-history {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.debt-work-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.debt-work-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.btn-add-record {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: #667eea;
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #5a67d8;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
  }
}

.risk-indicators {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.risk-card {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 2px solid;

  &.risk-low {
    background: #f0fdf4;
    border-color: #86efac;
  }

  &.risk-medium {
    background: #fffbeb;
    border-color: #fde047;
  }

  &.risk-high {
    background: #fef2f2;
    border-color: #fca5a5;
  }

  &.risk-critical {
    background: #7f1d1d;
    border-color: #dc2626;
    color: #fff;
  }
}

.risk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.risk-label {
  font-weight: 600;
  font-size: 0.9rem;
}

.risk-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.85rem;

  &.risk-badge-low {
    background: #86efac;
    color: #166534;
  }

  &.risk-badge-medium {
    background: #fde047;
    color: #854d0e;
  }

  &.risk-badge-high {
    background: #fca5a5;
    color: #991b1b;
  }

  &.risk-badge-critical {
    background: #dc2626;
    color: #fff;
  }
}

.risk-score {
  font-size: 0.85rem;
  color: #4a5568;
}

.risk-critical .risk-score {
  color: #fff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.debt-work-records {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.debt-work-record {
  padding: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  border-left: 4px solid #cbd5e0;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  &.record-call {
    border-left-color: #3b82f6;
  }

  &.record-claim,
  &.record-court_claim,
  &.record-court_decision,
  &.record-execution {
    border-left-color: #ef4444;
  }

  &.record-email,
  &.record-sms,
  &.record-letter {
    border-left-color: #10b981;
  }
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.record-type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
  background: #edf2f7;
  color: #4a5568;
}

.record-date {
  font-size: 0.85rem;
  color: #718096;
}

.record-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.record-result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-label {
  font-size: 0.85rem;
  color: #718096;
}

.result-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;

  &.result-contacted,
  &.result-promised_pay,
  &.result-partial_pay,
  &.result-full_pay {
    background: #d1fae5;
    color: #065f46;
  }

  &.result-no_contact,
  &.result-refused {
    background: #fee2e2;
    color: #991b1b;
  }

  &.result-in_progress {
    background: #dbeafe;
    color: #1e40af;
  }

  &.result-completed {
    background: #dcfce7;
    color: #166534;
  }
}

.record-performer,
.record-description,
.record-amount,
.record-next-action {
  font-size: 0.9rem;
  color: #4a5568;
}

.record-description {
  padding: 0.75rem;
  background: #f7fafc;
  border-radius: 0.5rem;
  margin-top: 0.5rem;
}

.debt-work-empty {
  text-align: center;
  padding: 3rem;
  color: #718096;
}

.btn-add-first-record {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  background: #667eea;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #5a67d8;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
  }
}
</style>

