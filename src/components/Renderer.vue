<script setup lang="ts">
import { computed, onMounted, useTemplateRef, watch } from "vue";
import * as renderer from "../renderer/index.ts";
import { parsedScore } from "../stores/score";

const mainCanvas = useTemplateRef("mainCanvas");
const container = useTemplateRef("container");
let canvasContext: CanvasRenderingContext2D | null = null;
let queueRerenderId: number | null = null;

function queueRerender() {
  if (queueRerenderId !== null) {
    cancelAnimationFrame(queueRerenderId);
  }
  queueRerenderId = requestAnimationFrame(() => {
    if (!canvasContext) return;
    console.log("Rendering...");
    canvasContext.canvas.height = renderer.rowHeight * rows.value;
    canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
    const { chords, punctuations } = parsedScore.value;
    if (chords.length > 0 || punctuations.length > 0) {
      renderer.render(canvasContext, chords, punctuations);
      return;
    }
    console.warn("No chords or punctuations to render. Displaying demo data.");

    // // パース結果が空の場合はデモデータを表示
    // renderer.render(canvasContext);
  });
}

const rows = computed(() => {
  const { chords, punctuations } = parsedScore.value;
  return renderer.countRows(chords, punctuations);
});
onMounted(() => {
  if (!mainCanvas.value) return;
  canvasContext = mainCanvas.value.getContext("2d");
  if (!canvasContext) {
    console.error("Failed to get canvas context");
    return;
  }
  queueRerender();
});

watch(parsedScore, () => queueRerender(), {
  immediate: true,
  deep: true,
});
</script>

<template>
  <div ref="container" un-p="4" un-h="[calc(100vh_-_4rem)]" un-overflow-y="auto">
    <canvas
      ref="mainCanvas"
      :width="renderer.width"
      :height="renderer.rowHeight * rows"
      un-w="full"
      un-bg="white"
      un-border="1 primary"
    />
  </div>
</template>
