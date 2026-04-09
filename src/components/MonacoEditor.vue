<script setup lang="ts">
import * as monaco from "monaco-editor";
import { onMounted, onUnmounted, useTemplateRef, watch } from "vue";
import { LANGUAGE_ID, monarchTokens, themeData } from "../lib/monacoLanguage";
import { parseError, renderError, scoreText } from "../stores/score";

// Monaco は Web Worker を必要とするが、構文ハイライトのみの用途なのでスタブを使用
(self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
  getWorker() {
    const blob = new Blob(["self.onmessage=()=>{}"], { type: "application/javascript" });
    return new Worker(URL.createObjectURL(blob));
  },
};

// 言語・テーマの登録（重複登録を避ける）
if (!monaco.languages.getLanguages().some((language) => language.id === LANGUAGE_ID)) {
  monaco.languages.register({ id: LANGUAGE_ID });
  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, monarchTokens);
}
monaco.editor.defineTheme(`${LANGUAGE_ID}-theme`, themeData);

const container = useTemplateRef("container");
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let disposables: monaco.IDisposable[] = [];
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!container.value) return;

  editor = monaco.editor.create(container.value, {
    value: scoreText.value,
    language: LANGUAGE_ID,
    theme: `${LANGUAGE_ID}-theme`,
    automaticLayout: false,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: 14,
    lineNumbers: "on",
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: "off",
    renderWhitespace: "none",
    overviewRulerLanes: 0,
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
    },
    padding: { top: 8, bottom: 8 },
  });

  disposables.push(
    editor.onDidChangeModelContent(() => {
      if (editor === null) {
        throw new Error("Editor is not initialized");
      }
      scoreText.value = editor.getValue();
    }),
  );

  const stopScoreWatch = watch(scoreText, (text) => {
    if (editor === null) {
      return;
    }
    if (editor.getValue() === text) {
      return;
    }
    editor.setValue(text);
  });
  disposables.push({ dispose: stopScoreWatch });

  const stopErrorWatch = watch(
    [parseError, renderError],
    ([currentParseError, currentRenderError]) => {
      const model = editor?.getModel();
      if (!model) return;
      const error = currentParseError ?? currentRenderError;
      if (error) {
        const lineNumber = Math.min(
          "line" in error && typeof error.line === "number" ? error.line : 1,
          model.getLineCount(),
        );
        const message = currentParseError === null ? `描画エラー: ${error.message}` : error.message;
        monaco.editor.setModelMarkers(model, LANGUAGE_ID, [
          {
            severity: monaco.MarkerSeverity.Error,
            message,
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: model.getLineMaxColumn(lineNumber),
          },
        ]);
      } else {
        monaco.editor.setModelMarkers(model, LANGUAGE_ID, []);
      }
    },
    { immediate: true },
  );
  disposables.push({ dispose: stopErrorWatch });

  resizeObserver = new ResizeObserver(() => {
    editor?.layout();
  });
  resizeObserver.observe(container.value);
});

onUnmounted(() => {
  disposables.forEach((disposable) => disposable.dispose());
  resizeObserver?.disconnect();
  editor?.dispose();
});
</script>

<template>
  <div ref="container" un-h="full" un-border="t-1 primary" />
</template>
