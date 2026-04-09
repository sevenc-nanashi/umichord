<script setup lang="ts">
import syntaxDemo from "../assets/demos/syntax.txt?raw";
import kumohitodeDemo from "../assets/demos/kumohitode.txt?raw";
import kotoDemo from "../assets/demos/koto.txt?raw";
import { scoreText } from "../stores/score";

function applyScoreText(text: string) {
  scoreText.value = text;
}

function findDemoLinks(text: string): { label: string; url: string }[] {
  const regex = /(?<label>\S+?)： (?<url>https?:\/\/\S+)/g;
  const links = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    links.push({ label: match.groups!.label, url: match.groups!.url });
  }
  return links;
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
        <button un-text="primary" @click="applyScoreText(demo.text)">
          {{ demo.name }}
        </button>
        <template v-if="findDemoLinks(demo.text).length > 0">
          <span un-text="sm">（</span>
          <template v-for="(link, index) in findDemoLinks(demo.text)" :key="index">
            <span v-if="index > 0" un-text="sm">、</span>
            <a :href="link.url" target="_blank" un-text="sm primary">{{ link.label }}</a>
          </template>
          <span un-text="sm">）</span>
        </template>
      </li>
    </ul>
  </div>
</template>
