// utils/apiFetch.ts
import { $fetch, type FetchOptions, FetchError } from "ofetch";
import { useAuthStore } from "~/stores/auth";
import { useRuntimeConfig } from "#app"; // <--- ПРОБЛЕМА ЗДЕСЬ (при вызове снаружи)
import { useRouter } from "#app"; // <--- И ЗДЕСЬ (при вызове снаружи)

export const apiFetch = $fetch.create({
  // 1. Устанавливаем базовый URL API из runtimeConfig
  // !!! ВЫЗОВ useRuntimeConfig() ЗДЕСЬ ПРОИСХОДИТ СНАРУЖИ КОНТЕКСТА !!!
  baseURL: useRuntimeConfig().public.apiBase,

  // 2. Перехватчик запросов (сама функция определяется снаружи, но вызывается позже)
  async onRequest({ request, options }) {
    // Вызов useAuthStore() ВНУТРИ onRequest - обычно безопасен, т.к. onRequest вызывается из контекста
    const authStore = useAuthStore();
    // ...
  },

  // 3. Перехватчик ошибок (сама функция определяется снаружи, но вызывается позже)
  async onResponseError({ request, response, options }) {
    // !!! Вызов useRouter() и useAuthStore() ВНУТРИ onResponseError - обычно безопасен !!!
    // НО! Если onResponseError вызывается на серверной стороне в неправильном контексте, тоже может быть проблема.
    if (response.status === 401) {
      // ...
      const authStore = useAuthStore(); // Вызывается при ошибке
      const router = useRouter(); // Вызывается при ошибке
      // ...
    }
  },
});

export default apiFetch;
