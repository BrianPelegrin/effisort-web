<template>
  <div class="landing-page">
    <LandingNavbar />

    <main>
      <slot />
    </main>

    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
useHead({
  script: [
    // Bootstrap interactions for the landing navigation and accordion
    { src: "/assets/js/core/popper.min.js", tagPosition: "bodyClose" },
    { src: "/assets/js/core/bootstrap.min.js", tagPosition: "bodyClose" },
  ]
})
</script>

<style>
.landing-page {
  min-height: 100vh;
  color: #071d41;
  background: #f4f8fd;
}

.landing-page main {
  min-height: calc(100vh - 72px);
}
</style>
