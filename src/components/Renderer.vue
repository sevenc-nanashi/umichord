<script setup lang="ts">
import { ref, watchEffect } from "vue";
import * as renderer from "../renderer/index.ts";
import { parsedScore, renderError } from "../stores/score";

const renderedSvg = ref("");

watchEffect(() => {
  const { chords, punctuations } = parsedScore.value;
  try {
    renderedSvg.value = renderer.renderToSvg(chords, punctuations);
    renderError.value = null;
  } catch (error) {
    renderedSvg.value = "";
    if (error instanceof Error) {
      renderError.value = error;
      return;
    }
    renderError.value = new Error("Unknown render error");
  }
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
