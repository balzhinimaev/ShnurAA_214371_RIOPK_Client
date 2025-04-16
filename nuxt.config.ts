// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt"],
  css: [
    "bootstrap/scss/bootstrap.scss",
    "~/assets/scss/main.scss", // Use '~/' instead of '@/'
  ],
  runtimeConfig: {
    public: {
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1", // Значение по умолчанию
    },
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "~/assets/scss/_custom_variables.scss" as *;
            @use "~/assets/scss/_custom_theme.scss" as *;
          `,
        },
      },
    },
  },
});