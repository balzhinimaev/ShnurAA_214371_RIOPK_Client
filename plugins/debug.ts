// plugins/debug.ts - плагин для отладки конфигурации
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  console.log('[DEBUG] Runtime config loaded:');
  console.log('[DEBUG] apiBase:', config.public.apiBase);
  console.log('[DEBUG] NUXT_PUBLIC_API_BASE env var:', process.env.NUXT_PUBLIC_API_BASE);
});
