<script setup lang="ts">
import syntaxDemo from "../assets/demos/syntax.txt?raw";
import kumohitodeDemo from "../assets/demos/kumohitode.txt?raw";
import kotoDemo from "../assets/demos/koto.txt?raw";
import { scoreText } from "../stores/score";

function applyScoreText(text: string) {
  scoreText.value = text;
}

const demos = [
  {
    name: "構文デモ",
    text: syntaxDemo,
  },
  {
    name: "クモヒトデのうまる砂の上で / 海茶",
    text: kumohitodeDemo,
  },
  {
    name: "六時、言の葉の木の下で。 / 名無し。",
    text: kotoDemo,
  },
];
</script>

<template>
  <div un-p="4">
    <h2 un-text="lg">サンプル</h2>
    <ul un-list="disc inside">
      <li v-for="demo in demos" :key="demo.name">
        <button un-text="primary" @click="applyScoreText(demo.text)">{{ demo.name }}</button>
      </li>
    </ul>
  </div>
</template>
