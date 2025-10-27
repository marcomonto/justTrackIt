<template>
  <router-view />
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'

// Initialize theme immediately
const themeStore = useThemeStore()
themeStore.initTheme()
</script>
