<template>
    <NuxtPage />
</template>

<script setup lang="ts">

definePageMeta({
    middleware: ['auth'],
    layout: 'admin'
})

</script>

<style scoped>

</style>