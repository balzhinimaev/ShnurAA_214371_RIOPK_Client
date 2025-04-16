// components/admin/UserListItem.vue
<template>
   <tr>
       <td class="text-muted small font-monospace" style="max-width: 100px; overflow: hidden; text-overflow: ellipsis;" :title="user.id">{{ userIdShort }}</td>
       <td>{{ user.name }}</td>
       <td>{{ user.email }}</td>
       <td>
           <span v-for="role in user.roles" :key="role"
               class="badge me-1"
               :class="getRoleBadgeClass(role)">
               {{ role }}
           </span>
       </td>
        <td class="text-nowrap">{{ formatDate(user.createdAt) }}</td>
       <td class="text-end text-nowrap">
           <button class="btn btn-sm btn-outline-primary me-1" title="Редактировать" @click="$emit('edit', user)">
                <!-- <i class="bi bi-pencil-square"></i> --> Ред. <!-- Убрал иконку -->
           </button>
           <button class="btn btn-sm btn-outline-danger" title="Удалить" @click="$emit('delete', user)" :disabled="isCurrentUser">
                <!-- <i class="bi bi-trash3"></i> --> Удал. <!-- Убрал иконку -->
           </button>
       </td>
   </tr>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import type { UserResponseDto } from '~/types/auth';

// Определяем props компонента
const props = defineProps<{
  user: UserResponseDto;
}>();

// Определяем события, которые компонент может генерировать
const emit = defineEmits(['edit', 'delete']);

const authStore = useAuthStore();

// Вычисляемое свойство для проверки, является ли пользователь текущим
const isCurrentUser = computed(() => {
  return authStore.user?.id === props.user.id;
});

// Вычисляемое свойство для короткого ID
const userIdShort = computed(() => props.user.id.substring(0, 8) + '...');

// Вспомогательная функция форматирования даты
function formatDate(dateString: string | Date): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('ru-RU', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    }); // Формат DD.MM.YYYY
  } catch {
    return 'Invalid Date';
  }
}

// Вспомогательная функция для классов бейджей
function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'ADMIN': return 'bg-danger text-white';
    case 'ANALYST': return 'bg-primary text-white';
    case 'MANAGER': return 'bg-success text-white';
    default: return 'bg-secondary text-white';
  }
}
</script>

<style scoped lang="scss">
/* Стили специфичные для строки таблицы, если нужны */
/* Стили для td, .badge, .btn-sm можно перенести из users.vue сюда, если хотите */
.badge {
     font-size: 0.75rem;
     padding: 0.3em 0.5em;
     font-weight: 500; // Сделал чуть жирнее
}
.btn-sm {
    padding: 0.15rem 0.4rem;
    font-size: 0.8rem;
}
</style>