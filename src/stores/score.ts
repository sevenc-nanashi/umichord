import { computed, ref, watch } from "vue";
import { ParseError, parseScore } from "../parser";
import syntaxDemo from "../assets/demos/syntax.txt?raw";

const scoreStorageKey = "umichord:score-text";

function loadScoreText() {
  if (typeof localStorage === "undefined") {
    return syntaxDemo;
  }
  return localStorage.getItem(scoreStorageKey) ?? syntaxDemo;
}

export const scoreText = ref(loadScoreText());
export const renderError = ref<Error | null>(null);

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

watch(scoreText, (text) => {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(scoreStorageKey, text);
});
