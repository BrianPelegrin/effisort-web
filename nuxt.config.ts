// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
 compatibilityDate: "2025-07-15",
 devtools: { enabled: true },

 routeRules:{
   '/admin/**': { ssr: false },
   '/': { ssr: false },
 },

 runtimeConfig:{
   apiBase: import.meta.env.NUXT_API_BASE
 },

 app: {
   baseURL: '/',
   head: {
     title: "Effisort",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "description", content: "Sistema de facturación electrónica con 3 planes, rápido, intuitivo y escalable." },
      { name: "robots", content: "index,follow" }
    ],
     link: [
       {
         rel: "stylesheet",
         href: "/assets/css/bootstrap.min.css",
       },
       {
         rel: "stylesheet",
         href: "/assets/css/plugins.min.css",
       },
       {
         rel: "stylesheet",
         href: "/assets/css/kaiadmin.min.css",
       },
       {
         rel: "stylesheet",
         href: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css",
       },
     ],
   },
 },

 modules: ["@pinia/nuxt"],
});
/*
 <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
  <link rel="stylesheet" href="/assets/css/plugins.min.css" />
  <link rel="stylesheet" href="/assets/css/kaiadmin.min.css" />

*/