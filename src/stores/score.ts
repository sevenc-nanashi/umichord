import { computed, ref } from "vue";
import { ParseError, parseScore } from "../parser";

export const scoreText = ref("");

const parseResult = computed(() => {
  try {
    return { score: parseScore(scoreText.value), error: null };
  } catch (e) {
    if (e instanceof ParseError) {
      return { score: { chords: [], punctuations: [] }, error: e };
    }
    return { score: { chords: [], punctuations: [] }, error: null };
  }
});

export const parsedScore = computed(() => parseResult.value.score);
export const parseError = computed(() => parseResult.value.error);
