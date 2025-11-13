// https://nuxt.com/docs/api/configuration/nuxt-config
const apiBase =
  process.env.NUXT_PUBLIC_API_BASE ||
  process.env.API_URL ||
  process.env.API_BASE_URL ||
  "http://localhost:3001/api/v1";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  devServer: {
    port: 3002,
  },
  modules: ["@pinia/nuxt"],
  css: [
    "bootstrap/scss/bootstrap.scss",
    "~/assets/scss/main.scss", // Use '~/' instead of '@/'
  ],
  runtimeConfig: {
    public: {
      apiBase,
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
  }
});