<script setup lang="ts">
import { ref, watchEffect } from "vue";
import * as renderer from "../renderer/index.ts";
import { parseError, parsedScore, renderError } from "../stores/score";

const renderedSvg = ref("");
const hasRenderError = ref(false);
const lastSuccessfulSvg = ref("");

watchEffect(() => {
  if (parseError.value !== null) {
    renderedSvg.value = lastSuccessfulSvg.value;
    hasRenderError.value = true;
    return;
  }

  const { chords, punctuations } = parsedScore.value;
  try {
    const svg = renderer.renderToSvg(chords, punctuations);
    renderedSvg.value = svg;
    lastSuccessfulSvg.value = svg;
    hasRenderError.value = false;
    renderError.value = null;
  } catch (error) {
    renderedSvg.value = lastSuccessfulSvg.value;
    hasRenderError.value = true;
    if (error instanceof Error) {
      renderError.value = error;
      return;
    }
    renderError.value = new Error("Unknown render error");
  }
});
</script>

<template>
  <div un-p="4" un-h="full" un-overflow-y="auto">
    <div
      class="renderer-output"
      :class="{ 'renderer-output-error': hasRenderError }"
      un-bg="white"
      un-border="1 primary"
      v-html="renderedSvg"
    />
  </div>
</template>

<style scoped>
.renderer-output-error {
  opacity: 0.45;
}

.renderer-output :deep(svg) {
  display: block;
  width: auto;
  height: auto;
  margin: 0 auto;
}
</style>
