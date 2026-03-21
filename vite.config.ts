import { defineConfig } from "vite-plus";
import vize from "@vizejs/vite-plugin";
import uno from "unocss/vite";

export default defineConfig({
  plugins: [uno(), vize()],
  staged: {
    "*": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
});
