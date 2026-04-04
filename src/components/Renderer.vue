<script setup lang="ts">
import { computed } from "vue";
import * as renderer from "../renderer/index.ts";
import { parsedScore } from "../stores/score";

const renderedSvg = computed(() => {
  const { chords, punctuations } = parsedScore.value;
  return renderer.renderToSvg(chords, punctuations);
});
</script>

<template>
  <div un-p="4" un-h="[calc(100vh_-_4rem)]" un-overflow-y="auto">
    <div class="renderer-output" un-bg="white" un-border="1 primary" v-html="renderedSvg" />
  </div>
</template>

<style scoped>
.renderer-output :deep(svg) {
  display: block;
  width: auto;
  height: auto;
}
</style>
