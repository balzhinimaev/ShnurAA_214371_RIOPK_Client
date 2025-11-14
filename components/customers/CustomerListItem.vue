// components/customers/CustomerListItem.vue
<template>
   <tr>
       <td class="text-muted small font-monospace" style="max-width: 100px; overflow: hidden; text-overflow: ellipsis;" :title="customer.id">{{ customerIdShort }}</td>
       <td>{{ customer.name }}</td>
       <td class="font-monospace">{{ customer.unp || '–' }}</td>
       <td :title="customer.contactInfo || ''" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">
           {{ customer.contactInfo || '–' }}
       </td>
       <td class="text-nowrap">{{ formatDate(customer.createdAt) }}</td>
       <td class="text-end text-nowrap">
           <button class="btn btn-sm btn-outline-primary me-1" title="Редактировать" @click="$emit('edit', customer)">
               Ред.
           </button>
           <button class="btn btn-sm btn-outline-danger" title="Удалить" @click="$emit('delete', customer)">
               Удал.
           </button>
       </td>
   </tr>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// Импортируем тип клиента (можно создать отдельный файл типов)
interface Customer {
    id: string;
    name: string;
    unp?: string; // УНП вместо inn
    contactInfo?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}

const props = defineProps<{
  customer: Customer;
}>();

const emit = defineEmits(['edit', 'delete']);

const customerIdShort = computed(() => props.customer.id.substring(0, 8) + '...');

function formatDate(dateString: string | Date): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('ru-RU', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
  } catch { return 'Invalid Date'; }
}
</script>

<style scoped lang="scss">
td { font-size: 0.9rem; vertical-align: middle; }
.btn-sm { padding: 0.15rem 0.4rem; font-size: 0.8rem; }
.font-monospace { font-family: var(--bs-font-monospace); } /* Используем переменную Bootstrap */
</style>