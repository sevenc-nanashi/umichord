<script setup lang="ts">
import { onMounted, render, useTemplateRef } from "vue";
import * as renderer from "../renderer/index.ts";

const mainCanvas = useTemplateRef("mainCanvas");
let canvasContext: CanvasRenderingContext2D | null = null;
let observer: ResizeObserver | null = null;
let queueRerenderId: number | null = null;

function queueRerender() {
  if (queueRerenderId !== null) {
    cancelAnimationFrame(queueRerenderId);
  }
  queueRerenderId = requestAnimationFrame(() => {
    if (!canvasContext) return;
    canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
    renderer.render(
      canvasContext,
      [
        {
          position: [0, 0, 1],
          length: [1, 2],
          firstTension: null,
          flat5th: false,
          omitFifth: false,
          omitThird: false,
          root: "i",
          slashBass: null,
          sus: null,
          variant: "diatonic",
          tensions: {
            "9": null,
            "11": null,
            "13": null,
          },
        },
      ],
      [
        {
          type: "key",
          row: 0,
          from: null,
          to: 0,
        },
        {
          type: "majorSection",
          row: 0,
        },
      ],
    );
  });
}

onMounted(() => {
  if (mainCanvas.value) {
    const canvas = mainCanvas.value;
    canvasContext = canvas.getContext("2d");
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
        queueRerender();
      }
    });
    observer.observe(mainCanvas.value);
  }

  queueRerender();
});
</script>

<template>
  <div un-p="4">
    <canvas ref="mainCanvas" un-w="full" un-h="full" un-bg="white" un-border="1 primary" />
  </div>
</template>
