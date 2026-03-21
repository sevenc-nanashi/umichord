<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue";
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
          fifthShift: null,
          omitFifth: false,
          omitThird: false,
          root: null,
          slashBass: null,
          sus: null,
          variant: "diatonic",
          tensions: [],
        },
        {
          position: [0, 1, 4],
          length: [1, 4],
          firstTension: null,
          fifthShift: null,
          omitFifth: false,
          omitThird: false,
          root: "i",
          slashBass: "i",
          variant: "diatonic",
          tensions: [],
        },
        {
          position: [0, 2, 4],
          length: [1, 4],
          root: "iib",
          variant: "diminished",
          firstTension: null,
          fifthShift: null,
          omitFifth: false,
          omitThird: false,
          slashBass: "iib",
          tensions: [],
        },
        {
          position: [0, 3, 4],
          length: [1, 4],
          root: "ii",
          variant: "flipped",
          firstTension: "b6th",
          fifthShift: null,
          omitFifth: false,
          omitThird: false,
          slashBass: "ii",
          tensions: [],
        },
        {
          position: [1, 0, 4],
          length: [1, 4],
          root: "iiib",
          variant: "flipped",
          firstTension: "flipped",
          fifthShift: null,
          omitFifth: false,
          omitThird: false,
          slashBass: "iiib",
          tensions: [],
        },
        {
          position: [1, 1, 4],
          length: [1, 4],
          root: "iii",
          variant: "diminished7",
          firstTension: null,
          fifthShift: null,
          omitFifth: false,
          omitThird: false,
          slashBass: "iii",
          tensions: [],
        },
        {
          position: [1, 2, 4],
          length: [1, 4],
          root: "iv",
          variant: "augmented",
          firstTension: "diatonic",
          fifthShift: null,
          omitFifth: false,
          omitThird: false,
          slashBass: "iv",
          tensions: [],
        },
        {
          position: [1, 3, 4],
          length: [1, 4],
          root: "vb",
          variant: "sus4",
          firstTension: "diatonic",
          fifthShift: null,
          omitFifth: false,
          omitThird: false,
          slashBass: "vb",
          tensions: [],
        },
        {
          position: [2, 0, 4],
          length: [1, 4],
          root: "v",
          variant: "flipped",
          firstTension: "diatonic",
          fifthShift: null,
          omitFifth: false,
          omitThird: false,
          slashBass: "v",
          tensions: [],
        },
        {
          position: [2, 1, 4],
          length: [1, 4],
          root: "vib",
          variant: "flipped",
          firstTension: "flipped",
          fifthShift: null,
          omitFifth: false,
          omitThird: false,
          slashBass: "vib",
          tensions: [],
        },
        {
          position: [2, 2, 4],
          length: [1, 4],
          root: "vi",
          variant: "flipped",
          firstTension: "diatonic",
          fifthShift: null,
          omitFifth: false,
          omitThird: false,
          slashBass: "vi",
          tensions: [],
        },
        {
          position: [2, 3, 4],
          length: [1, 4],
          root: "viib",
          variant: "flipped",
          firstTension: "diatonic",
          fifthShift: null,
          omitFifth: false,
          omitThird: false,
          slashBass: "viib",
          tensions: [],
        },
        {
          position: [3, 0, 4],
          length: [1, 4],
          root: "vii",
          variant: "diatonic",
          firstTension: "diatonic",
          fifthShift: null,
          omitFifth: false,
          omitThird: false,
          slashBass: "vii",
          tensions: [],
        },
        {
          position: [4, 0, 4],
          length: [1, 4],
          root: "iv",
          variant: "diatonic",
          firstTension: "diatonic",
          fifthShift: null,
          omitThird: true,
          omitFifth: true,
          slashBass: null,
          tensions: [],
        },
        {
          position: [4, 1, 4],
          length: [1, 4],
          root: "iii",
          variant: "sus4",
          firstTension: "b6th",
          fifthShift: null,
          omitThird: false,
          omitFifth: false,
          slashBass: "iib",
          tensions: [],
        },
        {
          position: [4, 2, 4],
          length: [1, 4],
          root: "vi",
          variant: "diatonic",
          firstTension: null,
          fifthShift: "flat",
          omitThird: false,
          omitFifth: false,
          slashBass: "i",
          tensions: ["sharp", "natural", "sharp"],
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
          type: "bar",
          row: 0,
          length: [2, 4],
          tempo: 120,
          timeSignature: [4, 4],
        },
        {
          type: "minorSection",
          row: 0,
        },
        {
          type: "key",
          row: 1,
          from: 1,
          to: 0,
        },
        {
          type: "majorSection",
          row: 1,
        },
        {
          type: "gradualTempoChange",
          position: [1, 0, 4],
          length: [2, 4],
          direction: "up",
        },
        {
          type: "gradualTempoChange",
          position: [1, 2, 4],
          length: [2, 4],
          direction: "down",
        },
        {
          type: "songChange",
          row: 2,
        },
        {
          type: "gradualSongChange",
          row: 3,
        },
        {
          type: "verseEnd",
          row: 4,
        },
        {
          type: "songEnd",
          row: 5,
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
