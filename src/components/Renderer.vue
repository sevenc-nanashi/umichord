<script setup lang="ts">
import { onMounted, render, useTemplateRef } from "vue";
import * as renderer from "../renderer/index.ts";

const mainCanvas = useTemplateRef("mainCanvas");
const container = useTemplateRef("container");
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
          length: [1, 4],
          firstTension: null,
          flat5th: false,
          omitFifth: false,
          omitThird: false,
          root: null,
          slashBass: null,
          sus: null,
          variant: "diatonic",
          tensions: {
            "9": null,
            "11": null,
            "13": null,
          },
        },
        {
          position: [0, 1, 4],
          length: [1, 4],
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
        {
          position: [0, 2, 4],
          length: [1, 4],
          root: "iib",
          variant: "diminished",
          firstTension: null,
          flat5th: false,
          omitFifth: false,
          omitThird: false,
          slashBass: null,
          sus: null,
          tensions: {
            "9": null,
            "11": null,
            "13": null,
          },
        },
        {
          position: [0, 3, 4],
          length: [1, 4],
          root: "ii",
          variant: "flipped",
          firstTension: "b6th",
          flat5th: false,
          omitFifth: false,
          omitThird: false,
          slashBass: null,
          sus: null,
          tensions: {
            "9": null,
            "11": null,
            "13": null,
          },
        },
        {
          position: [1, 0, 4],
          length: [1, 4],
          root: "iiib",
          variant: "flipped",
          firstTension: "flipped",
          flat5th: false,
          omitFifth: false,
          omitThird: false,
          slashBass: null,
          sus: null,
          tensions: {
            "9": null,
            "11": null,
            "13": null,
          },
        },
        {
          position: [1, 1, 4],
          length: [1, 4],
          root: "iii",
          variant: "diminished7",
          firstTension: null,
          flat5th: false,
          omitFifth: false,
          omitThird: false,
          slashBass: null,
          sus: null,
          tensions: {
            "9": null,
            "11": null,
            "13": null,
          },
        },
        {
          position: [1, 2, 4],
          length: [1, 4],
          root: "iv",
          variant: "augmented",
          firstTension: "diatonic",
          flat5th: false,
          omitFifth: false,
          omitThird: false,
          slashBass: null,
          sus: null,
          tensions: {
            "9": null,
            "11": null,
            "13": null,
          },
        },
        {
          position: [1, 3, 4],
          length: [1, 4],
          root: "vb",
          variant: "diminished",
          firstTension: "diatonic",
          flat5th: false,
          omitFifth: false,
          omitThird: false,
          slashBass: null,
          sus: null,
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
          type: "minorSection",
          row: 0,
        },
        {
          type: "majorSection",
          row: 1,
        },
      ],
    );
  });
}

onMounted(() => {
  if (mainCanvas.value && container.value) {
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
    observer.observe(container.value);
  }

  queueRerender();
});
</script>

<template>
  <div ref="container" un-p="4" un-h="screen">
    <canvas ref="mainCanvas" un-w="full" un-h="full" un-bg="white" un-border="1 primary" />
  </div>
</template>
