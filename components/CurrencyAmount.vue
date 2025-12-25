<template>
  <span class="currency-amount" :class="[sizeClass, { 'currency-danger': danger }]">
    <span class="currency-value">{{ formattedValue }}</span>
    <img 
      v-if="!imageError"
      src="/znak.png" 
      alt="Бел.руб." 
      class="currency-icon"
      :class="sizeClass"
      @error="imageError = true"
    />
    <span v-else class="currency-text">Бел.руб.</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{
  value: number | undefined | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  danger?: boolean;
}>(), {
  size: 'md',
  danger: false
});

const imageError = ref(false);

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
  align-items: center;
  gap: 0.2em;
  font-variant-numeric: tabular-nums;
}

.currency-value {
  font-weight: inherit;
}

.currency-icon {
  display: inline-block;
  vertical-align: middle;
  object-fit: contain;
  opacity: 0.85;
  flex-shrink: 0;
}

.currency-text {
  font-size: 0.75em;
  opacity: 0.7;
  font-weight: 500;
}

/* Размеры */
.currency-icon.size-xs {
  width: 0.7em;
  height: 0.7em;
}

.currency-icon.size-sm {
  width: 0.85em;
  height: 0.85em;
}

.currency-icon.size-md {
  width: 1em;
  height: 1em;
}

.currency-icon.size-lg {
  width: 1.2em;
  height: 1.2em;
}

/* Опасность/долг */
.currency-danger {
  color: #c53030;
}

.currency-danger .currency-icon {
  filter: brightness(0) saturate(100%) invert(22%) sepia(93%) saturate(2066%) hue-rotate(351deg) brightness(89%) contrast(93%);
}
</style>
