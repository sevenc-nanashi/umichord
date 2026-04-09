<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue";
import Logo from "~icons/svg/logo.svg";

const aboutShownStorageKey = "umichord:about-shown";
const aboutDialog = useTemplateRef("aboutDialog");

function openAboutDialog() {
  aboutDialog.value?.showModal();
}

function closeAboutDialog() {
  aboutDialog.value?.close();
}

onMounted(() => {
  if (typeof localStorage === "undefined") {
    return;
  }
  if (localStorage.getItem(aboutShownStorageKey) !== null) {
    return;
  }
  openAboutDialog();
  localStorage.setItem(aboutShownStorageKey, "1");
});
</script>
<template>
  <header un-bg="primary" un-p="2" un-flex="~ items-center justify-between gap-4">
    <Logo un-h="12" un-text="white" alt="Umi Chord" />
    <button
      un-rounded="full"
      un-bg="white/15 hover:white/25"
      un-px="4"
      un-py="2"
      un-text="sm white"
      @click="openAboutDialog"
    >
      About
    </button>

    <dialog
      ref="aboutDialog"
      un-max-w="md"
      un-w="calc(100vw_-_2rem)"
      un-rounded="xl"
      un-border="none"
      un-p="0"
      un-shadow="xl"
      un-fixed
      un-m="auto"
    >
      <article un-bg="white" un-p="6" un-grid="~ gap-4">
        <div>
          <h2 un-text="xl primary">About UmiChord</h2>
          <p un-mt="2">
            UmiChordは
            <a
              href="https://note.com/umibeno_chaya/n/n2d01f7dd73b6"
              target="_blank"
              un-text="primary hover:primary/90"
              >海茶式コード表記法</a
            >
            のジェネレーターです。
          </p>
          <h3 un-text="lg primary" un-mt="4">開発者</h3>
          <p>
            <a href="https://sevenc7c.com" target="_blank" un-text="[#48b0d5]"
              >名無し。（sevenc7c.com）</a
            >
            <span un-text="sm gray-500"> © 2026 </span>
          </p>
          <h3 un-text="lg primary" un-mt="4">注意事項</h3>
          <p>このツールは非公式です。</p>
          <p>
            このツールの出力するコード譜はあくまで参考程度にご利用ください。実際に動画などに使用する場合は、これを参考に手描きすることをおすすめします。
          </p>
          <p>サンプルのコード譜の著作権はそれぞれの作者に帰属します。</p>
          <h3 un-text="lg primary" un-mt="4">利用規約</h3>
          <p>
            このツールのソースコードはMIT Licenseで公開しています。<a
              href="https://github.com/sevenc-nanashi/umichord/blob/main/LICENSE"
              target="_blank"
              un-text="primary hover:primary/90"
              >sevenc-nanashi/umichord: LICENSE</a
            >を参照してください。<br />
            このツールによって出力された海茶式コード表記を使用した場合は、
            <a
              href="https://x.com/ocean_tea_cafe"
              target="_blank"
              un-text="primary hover:primary/90"
            >
              海茶</a
            >
            様の名前をクレジットすることを推奨します。
          </p>
          <h3 un-text="lg primary" un-mt="4">謝辞</h3>
          <p>
            このツールの開発にあたり、<a
              href="https://x.com/ocean_tea_cafe"
              target="_blank"
              un-text="primary hover:primary/90"
              >海茶</a
            >
            様にご助言をいただきました。ありがとうございました。
          </p>
        </div>
        <div un-flex="~ justify-end">
          <button
            un-rounded="full"
            un-bg="primary hover:primary/90"
            un-px="4"
            un-py="2"
            un-text="sm white"
            @click="closeAboutDialog"
          >
            Close
          </button>
        </div>
      </article>
    </dialog>
  </header>
</template>

<style scoped>
dialog::backdrop {
  background: rgb(30 41 59 / 45%);
  backdrop-filter: blur(2px);
}
</style>
