<template>
  <div un-h="full" un-border="l-1 primary" un-grid="~ rows-[auto_1fr]">
    <Samples />
    <MonacoEditor />
  </div>
</template>

<script setup lang="ts">
import MonacoEditor from "./MonacoEditor.vue";
import Samples from "./Samples.vue";
</script>
