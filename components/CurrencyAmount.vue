<template>
  <span class="currency-amount" :class="[sizeClass, { 'currency-danger': danger }]">
    <span class="currency-value">{{ formattedValue }}</span>
    <span class="currency-symbol">Бел.руб.</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  value: number | undefined | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  danger?: boolean;
}>(), {
  size: 'md',
  danger: false
});

const formattedValue = computed(() => {
  if (props.value === undefined || props.value === null || !Number.isFinite(props.value)) {
    return '—';
  }
  return props.value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
});

const sizeClass = computed(() => `size-${props.size}`);
</script>

<style scoped>
.currency-amount {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25em;
  font-variant-numeric: tabular-nums;
}

.currency-value {
  font-weight: inherit;
}

.currency-symbol {
  font-size: 0.65em;
  font-weight: 500;
  opacity: 0.75;
  white-space: nowrap;
}

/* Размеры */
.size-xs .currency-symbol {
  font-size: 0.6em;
}

.size-sm .currency-symbol {
  font-size: 0.62em;
}

.size-md .currency-symbol {
  font-size: 0.65em;
}

.size-lg .currency-symbol {
  font-size: 0.55em;
}

/* Опасность/долг */
.currency-danger {
  color: #c53030;
}
</style>
