import { computed, ref } from "vue";
import { parseScore } from "../parser";

export const scoreText = ref("");

export const parsedScore = computed(() => {
  try {
    return parseScore(scoreText.value);
  } catch {
    return { chords: [], punctuations: [] };
  }
});
